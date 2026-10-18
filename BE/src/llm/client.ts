import { config, llmEnabled } from '../config';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class LlmError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

/**
 * Minimal OpenAI-compatible chat client. Works for Groq, Gemini (OpenAI
 * compatibility endpoint), OpenRouter and OpenAI with no SDK.
 */
export async function chat(messages: ChatMessage[], opts: { json?: boolean; maxTokens?: number } = {}): Promise<string> {
  if (!llmEnabled()) throw new LlmError('LLM provider not configured');

  const { baseUrl, apiKey, model, provider } = config.llm;
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    authorization: `Bearer ${apiKey}`,
  };
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'http://localhost:5173';
    headers['X-Title'] = 'TrustCheck';
  }

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: 0.2,
    max_tokens: opts.maxTokens ?? 900,
  };
  if (opts.json) body.response_format = { type: 'json_object' };

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new LlmError(`${provider} ${res.status}: ${text.slice(0, 300)}`, res.status);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new LlmError('Empty response from LLM');
  return content;
}
