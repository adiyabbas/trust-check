import type { RiskLevel, Signal } from '../../../shared/types';
import { runAiPatternRules } from './signals';
import { runAiStats, wordCount } from './stats';

export interface AiRuleOutput {
  signals: Signal[];
  score: number;
  level: RiskLevel;
}

export function aiScoreToLevel(score: number): RiskLevel {
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

export function runAiRules(text: string): AiRuleOutput {
  const signals = [...runAiPatternRules(text), ...runAiStats(text)];

  const has = (id: string) => signals.some((s) => s.id === id);
  let bonus = 0;
  if (has('ai_vocabulary') && has('significance_inflation')) bonus += 8;
  if (has('low_burstiness') && has('formulaic_transitions')) bonus += 8;
  if (has('markdown_formatting') && has('summary_closer')) bonus += 6;

  const raw = Math.max(0, signals.reduce((sum, s) => sum + s.weight, 0) + bonus);
  let score = Math.min(100, Math.round(100 * (1 - Math.exp(-raw / 55))));

  // Short texts can never be "likely AI" from style alone, unless a hard artifact is present.
  const hardEvidence = has('chatbot_artifact') || has('citation_artifact');
  if (wordCount(text) < 50 && !hardEvidence) score = Math.min(score, 45);

  signals.sort((a, b) => b.weight - a.weight);
  return { signals, score, level: aiScoreToLevel(score) };
}
