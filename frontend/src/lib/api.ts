import type { AnalysisMode, AnalysisResult, HistoryItem, SampleMessage } from '@shared/types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, { headers: { 'content-type': 'application/json' }, ...init });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data;
}

export interface Health {
  ok: boolean;
  llm: { provider: string; model: string | null; enabled: boolean };
  safeBrowsing: boolean;
  history: 'sqlite' | 'memory';
}

export const api = {
  health: () => request<Health>('/health'),
  samples: (mode: AnalysisMode) => request<SampleMessage[]>(`/samples?mode=${mode}`),
  analyze: (message: string, mode: AnalysisMode) => request<AnalysisResult>('/analyze', { method: 'POST', body: JSON.stringify({ message, mode }) }),
  history: (mode: AnalysisMode) => request<HistoryItem[]>(`/history?mode=${mode}`),
  historyItem: (id: string) => request<AnalysisResult>(`/history/${id}`),
  clearHistory: () => request<{ ok: boolean }>('/history', { method: 'DELETE' }),
};
