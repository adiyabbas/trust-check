import 'dotenv/config';

export type Provider = 'groq' | 'gemini' | 'openrouter' | 'openai' | 'none';

interface ProviderPreset {
  baseUrl: string;
  defaultModel: string;
  keyEnv: string;
}

// All of these expose an OpenAI-compatible /chat/completions endpoint,
// so one small HTTP client covers every provider.
export const PROVIDERS: Record<Exclude<Provider, 'none'>, ProviderPreset> = {
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'openai/gpt-oss-120b',
    keyEnv: 'GROQ_API_KEY',
  },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.5-flash',
    keyEnv: 'GEMINI_API_KEY',
  },
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'openai/gpt-oss-20b:free',
    keyEnv: 'OPENROUTER_API_KEY',
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    keyEnv: 'OPENAI_API_KEY',
  },
};

function readProvider(): Provider {
  const raw = (process.env.LLM_PROVIDER ?? 'none').trim().toLowerCase();
  if (raw in PROVIDERS || raw === 'none') return raw as Provider;
  console.warn(`[config] Unknown LLM_PROVIDER "${raw}", falling back to "none".`);
  return 'none';
}

const provider = readProvider();
const preset = provider === 'none' ? null : PROVIDERS[provider];

export const config = {
  port: Number(process.env.PORT ?? 3001),
  isProd: process.env.NODE_ENV === 'production',
  llm: {
    provider,
    apiKey: preset ? (process.env[preset.keyEnv] ?? '').trim() : '',
    baseUrl: preset?.baseUrl ?? '',
    model: (process.env.LLM_MODEL ?? '').trim() || preset?.defaultModel || '',
  },
  safeBrowsingKey: (process.env.SAFE_BROWSING_API_KEY ?? '').trim(),
};

export function llmEnabled(): boolean {
  return config.llm.provider !== 'none' && config.llm.apiKey.length > 0;
}
