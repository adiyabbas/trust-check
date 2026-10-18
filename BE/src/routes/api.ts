import { Router } from 'express';
import { analyzeMessage } from '../analyze';
import { config, llmEnabled } from '../config';
import { store } from '../db';
import { SAMPLES } from '../samples';

export const api = Router();

api.get('/health', (_req, res) => {
  res.json({
    ok: true,
    llm: { provider: config.llm.provider, model: config.llm.model || null, enabled: llmEnabled() },
    safeBrowsing: Boolean(config.safeBrowsingKey),
    history: store.kind,
  });
});

api.get('/samples', (req, res) => {
  const mode = req.query.mode === 'ai' ? 'ai' : req.query.mode === 'scam' ? 'scam' : undefined;
  res.json(mode ? SAMPLES.filter((s) => s.mode === mode) : SAMPLES);
});

api.post('/analyze', async (req, res) => {
  const body = req.body as { message?: unknown; save?: unknown; mode?: unknown };
  const mode = body?.mode === 'ai' ? 'ai' : 'scam';
  const message = typeof body?.message === 'string' ? body.message : '';
  if (message.trim().length < 10) {
    res.status(400).json({ error: 'Please paste a message of at least 10 characters.' });
    return;
  }
  if (message.length > 8000) {
    res.status(400).json({ error: 'Message too long (max 8000 characters).' });
    return;
  }
  try {
    const result = await analyzeMessage(message, { mode });
    if (body?.save !== false) store.insert(result);
    res.json(result);
  } catch (err) {
    console.error('[analyze]', err);
    res.status(500).json({ error: 'Analysis failed. Check the server logs.' });
  }
});

api.get('/history', (req, res) => {
  const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
  const mode = req.query.mode === 'ai' ? 'ai' : req.query.mode === 'scam' ? 'scam' : undefined;
  res.json(store.list(limit, mode));
});

api.get('/history/:id', (req, res) => {
  const item = store.get(req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(item);
});

api.delete('/history', (_req, res) => {
  store.clear();
  res.json({ ok: true });
});
