import { analyzeMessage } from '../../BE/src/analyze';
import { config, llmEnabled } from '../../BE/src/config';
import { store } from '../../BE/src/db';
import { SAMPLES } from '../../BE/src/samples';

// Netlify Function version of BE/src/routes/api.ts (Express does not run on Netlify).
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export default async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/(\.netlify\/functions\/)?api/, '') || '/';
  const modeParam = url.searchParams.get('mode');
  const mode = modeParam === 'ai' ? 'ai' : modeParam === 'scam' ? 'scam' : undefined;

  if (req.method === 'GET' && path === '/health') {
    return json({
      ok: true,
      llm: { provider: config.llm.provider, model: config.llm.model || null, enabled: llmEnabled() },
      safeBrowsing: Boolean(config.safeBrowsingKey),
      history: store.kind,
    });
  }

  if (req.method === 'GET' && path === '/samples') {
    return json(mode ? SAMPLES.filter((s) => s.mode === mode) : SAMPLES);
  }

  if (req.method === 'POST' && path === '/analyze') {
    const body = (await req.json().catch(() => ({}))) as { message?: unknown; save?: unknown; mode?: unknown };
    const m = body?.mode === 'ai' ? 'ai' : 'scam';
    const message = typeof body?.message === 'string' ? body.message : '';
    if (message.trim().length < 10) return json({ error: 'Please paste a message of at least 10 characters.' }, 400);
    if (message.length > 8000) return json({ error: 'Message too long (max 8000 characters).' }, 400);
    try {
      const result = await analyzeMessage(message, { mode: m });
      if (body?.save !== false) store.insert(result);
      return json(result);
    } catch (err) {
      console.error('[analyze]', err);
      return json({ error: 'Analysis failed. Check the function logs.' }, 500);
    }
  }

  if (req.method === 'GET' && path === '/history') {
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') ?? 20)));
    return json(store.list(limit, mode));
  }

  if (req.method === 'GET' && path.startsWith('/history/')) {
    const item = store.get(path.slice('/history/'.length));
    return item ? json(item) : json({ error: 'Not found' }, 404);
  }

  if (req.method === 'DELETE' && path === '/history') {
    store.clear();
    return json({ ok: true });
  }

  return json({ error: 'Not found' }, 404);
};
