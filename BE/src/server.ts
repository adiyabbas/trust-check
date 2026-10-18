import cors from 'cors';
import express from 'express';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config, llmEnabled } from './config';
import { api } from './routes/api';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use('/api', api);

// In production, serve the built frontend from ../dist
const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, '..', '..', 'dist');
if (config.isProd && existsSync(dist)) {
  app.use(express.static(dist));
  app.get('/{*splat}', (_req, res) => res.sendFile(join(dist, 'index.html')));
}

app.listen(config.port, () => {
  console.log(`TrustCheck API listening on http://localhost:${config.port}`);
  if (llmEnabled()) {
    console.log(`LLM: ${config.llm.provider} / ${config.llm.model}`);
  } else {
    console.log('LLM: disabled (rules-only mode). Add a key to .env to enable AI explanations.');
  }
});
