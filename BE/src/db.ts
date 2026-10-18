import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AnalysisMode, AnalysisResult, HistoryItem } from '../../shared/types';

/**
 * History store. Uses Node's built-in SQLite (node:sqlite, Node >= 22.5).
 * Falls back to an in-memory list if that module is unavailable so the
 * app still runs on older Node versions.
 */
interface Store {
  insert(result: AnalysisResult): void;
  list(limit: number, mode?: AnalysisMode): HistoryItem[];
  get(id: string): AnalysisResult | null;
  clear(): void;
  kind: 'sqlite' | 'memory';
}

const preview = (msg: string) => msg.replace(/\s+/g, ' ').trim().slice(0, 90);

async function sqliteStore(): Promise<Store> {
  const { DatabaseSync } = await import('node:sqlite');
  const here = dirname(fileURLToPath(import.meta.url));
  const dir = join(here, '..', 'data');
  mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(join(dir, 'trustcheck.db'));
  db.exec(`CREATE TABLE IF NOT EXISTS analyses (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    preview TEXT NOT NULL,
    score INTEGER NOT NULL,
    level TEXT NOT NULL,
    payload TEXT NOT NULL
  )`);
  try {
    db.exec("ALTER TABLE analyses ADD COLUMN mode TEXT NOT NULL DEFAULT 'scam'");
  } catch {
    /* column already exists */
  }
  const ins = db.prepare('INSERT INTO analyses (id, created_at, preview, score, level, payload, mode) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const lst = db.prepare('SELECT id, created_at, preview, score, level, mode FROM analyses ORDER BY created_at DESC LIMIT ?');
  const lstMode = db.prepare('SELECT id, created_at, preview, score, level, mode FROM analyses WHERE mode = ? ORDER BY created_at DESC LIMIT ?');
  const one = db.prepare('SELECT payload FROM analyses WHERE id = ?');
  return {
    kind: 'sqlite',
    insert: (r) => ins.run(r.id, r.createdAt, preview(r.message), r.score, r.level, JSON.stringify(r), r.mode),
    list: (limit, mode) =>
      ((mode ? lstMode.all(mode, limit) : lst.all(limit)) as { id: string; created_at: string; preview: string; score: number; level: string; mode: string }[]).map((row) => ({
        id: row.id,
        createdAt: row.created_at,
        mode: (row.mode as AnalysisMode) ?? 'scam',
        preview: row.preview,
        score: row.score,
        level: row.level as HistoryItem['level'],
      })),
    get: (id) => {
      const row = one.get(id) as { payload: string } | undefined;
      return row ? (JSON.parse(row.payload) as AnalysisResult) : null;
    },
    clear: () => db.exec('DELETE FROM analyses'),
  };
}

function memoryStore(): Store {
  const items: AnalysisResult[] = [];
  return {
    kind: 'memory',
    insert: (r) => items.unshift(r),
    list: (limit, mode) =>
      items
        .filter((r) => !mode || r.mode === mode)
        .slice(0, limit)
        .map((r) => ({ id: r.id, createdAt: r.createdAt, mode: r.mode, preview: preview(r.message), score: r.score, level: r.level })),
    get: (id) => items.find((r) => r.id === id) ?? null,
    clear: () => items.splice(0, items.length),
  };
}

// Serverless hosts (Netlify/AWS Lambda) have a read-only, ephemeral filesystem,
// so skip SQLite there and keep history in memory.
const serverless = Boolean(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);

export const store: Store = await (serverless ? Promise.resolve(memoryStore()) : sqliteStore()).catch((err: Error) => {
  console.warn('[db] node:sqlite unavailable, using in-memory history:', err.message);
  return memoryStore();
});
