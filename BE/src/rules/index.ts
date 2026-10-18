import type { LinkCheck, RiskLevel, Signal, TextSpan } from '../../../shared/types';
import { RULES, findSpans, toSignal } from './signals';

export interface RuleOutput {
  signals: Signal[];
  score: number;
  level: RiskLevel;
}

export function scoreToLevel(score: number): RiskLevel {
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

const LINK_WEIGHT: Record<LinkCheck['verdict'], number> = { 'likely-official': 0, unverified: 6, suspicious: 12, flagged: 30 };

/** Link signal is derived from the URL checker so the weight reflects the verdict. */
function linkSignal(links: LinkCheck[], spans: TextSpan[]): Signal | null {
  if (links.length === 0) return null;
  const worst = links.reduce((a, b) => (LINK_WEIGHT[b.verdict] > LINK_WEIGHT[a.verdict] ? b : a));
  const weight = LINK_WEIGHT[worst.verdict];
  if (weight === 0) return null;
  const titles: Record<LinkCheck['verdict'], string> = {
    'likely-official': 'Official-looking link',
    unverified: 'Unverified link',
    suspicious: 'Suspicious link',
    flagged: 'Link flagged as dangerous',
  };
  return {
    id: 'suspicious_link',
    title: titles[worst.verdict],
    severity: weight >= 30 ? 'high' : weight >= 12 ? 'medium' : 'low',
    weight,
    spans,
    explanation:
      worst.verdict === 'flagged'
        ? 'This link is listed by Google Safe Browsing as malicious or deceptive. Do not open it.'
        : 'Links in unsolicited messages often lead to look-alike pages that harvest documents or payments. A link cannot be trusted just because the page looks professional.',
    lesson: 'Never navigate from the link in the message. Search for the organisation yourself and compare the domain.',
    verification: "Open the provider's site from a search engine or a known bookmark and compare the exact domain with the one in the message.",
  };
}

export function runRules(message: string, links: LinkCheck[] = [], linkSpans: TextSpan[] = []): RuleOutput {
  const signals: Signal[] = [];

  for (const rule of RULES) {
    const spans = findSpans(message, rule.patterns);
    const min = rule.minMatches ?? 1;
    if (spans.length >= min) signals.push(toSignal(rule, spans));
  }
  const ls = linkSignal(links, linkSpans);
  if (ls) signals.push(ls);

  // Combination boosts: certain pairs are far more dangerous together.
  const has = (id: string) => signals.some((s) => s.id === id);
  let bonus = 0;
  if (has('upfront_payment') && has('artificial_urgency')) bonus += 8;
  if (has('upfront_payment') && has('payment_channel')) bonus += 8;
  if (has('sensitive_info') && has('suspicious_link')) bonus += 8;
  if (has('authority_impersonation') && has('upfront_payment')) bonus += 8;

  const raw = Math.max(0, signals.reduce((sum, s) => sum + s.weight, 0) + bonus);
  // Diminishing returns: 30 raw points -> ~42, 50 -> ~60, 100 -> ~84, 150 -> ~93.
  // Keeps the meter informative instead of pinning every scam at 100.
  const score = Math.min(100, Math.round(100 * (1 - Math.exp(-raw / 55))));

  signals.sort((a, b) => b.weight - a.weight);
  return { signals, score, level: scoreToLevel(score) };
}
