import { createHash, randomUUID } from 'node:crypto';
import type { AnalysisMode, AnalysisResult } from '../../shared/types';
import { runAiRules } from './airules';
import { config } from './config';
import { explain } from './llm/explain';
import { runRules } from './rules';
import { checkLinks } from './urlcheck';

// Small in-memory cache keyed by message hash: saves free-tier LLM quota
// when the same demo message is analysed repeatedly.
const cache = new Map<string, AnalysisResult>();

export async function analyzeMessage(message: string, opts: { useCache?: boolean; mode?: AnalysisMode } = {}): Promise<AnalysisResult> {
  const mode: AnalysisMode = opts.mode ?? 'scam';
  const normalized = message.replace(/\r\n/g, '\n').trim();
  const key = createHash('sha1').update(`${mode}:${config.llm.provider}:${config.llm.model}:${normalized}`).digest('hex');

  if (opts.useCache !== false && cache.has(key)) {
    const cached = cache.get(key)!;
    return { ...cached, id: randomUUID(), createdAt: new Date().toISOString() };
  }

  const { links, spans: linkSpans } = mode === 'scam' ? await checkLinks(normalized) : { links: [], spans: [] };
  const rules = mode === 'scam' ? runRules(normalized, links, linkSpans) : runAiRules(normalized);
  const { explanation, used, model, error } = await explain(normalized, rules.signals, rules.level, links, mode);

  const signals = rules.signals.map((s) => ({
    ...s,
    explanation: explanation.evidence[s.id] || s.explanation,
    lesson: explanation.lessons[s.id] || s.lesson,
  }));

  const result: AnalysisResult = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    mode,
    message: normalized,
    score: rules.score,
    level: rules.level,
    summary: explanation.summary,
    signals,
    links,
    verificationSteps: explanation.verificationSteps,
    checklistQuestions: explanation.checklistQuestions,
    aiObservations: explanation.aiObservations,
    uncertainty: explanation.uncertainty,
    llm: { used, provider: config.llm.provider, model, ...(error ? { error } : {}) },
  };

  if (used) cache.set(key, result);
  return result;
}
