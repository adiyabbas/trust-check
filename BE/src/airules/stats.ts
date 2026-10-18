import type { Signal, TextSpan } from '../../../shared/types';

/**
 * Statistical tells. "Burstiness" (variation in sentence length) is the one
 * most detectors rely on: people write short and long sentences in bursts,
 * models produce evenly sized ones. These need enough text to mean anything.
 */

interface Sentence extends TextSpan {
  words: number;
}

export function splitSentences(text: string): Sentence[] {
  const out: Sentence[] = [];
  const re = /[^.!?\n]+[.!?]+["')\]]*|[^.!?\n]+$/gm;
  for (const m of text.matchAll(re)) {
    const t = m[0].trim();
    const words = t.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w)).length;
    if (words >= 2) out.push({ start: m.index, end: m.index + m[0].length, text: t, words });
  }
  return out;
}

export function wordCount(text: string): number {
  return text.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w)).length;
}

function cv(values: number[]): number {
  if (values.length < 2) return 1;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 1;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance) / mean;
}

export function runAiStats(text: string): Signal[] {
  const signals: Signal[] = [];
  const words = wordCount(text);
  const sentences = splitSentences(text);

  if (words < 50) {
    signals.push({
      id: 'too_short',
      title: 'Too little text for a reliable estimate',
      severity: 'info',
      weight: 0,
      spans: [],
      explanation: `Only ${words} words. Style statistics need at least 50 words, ideally 150+, so this result leans on phrase patterns alone and is capped at "uncertain".`,
      lesson: 'Short texts cannot be classified. Anyone who says otherwise is guessing.',
      verification: 'Ask for a longer sample from the same writer.',
    });
  }

  if (sentences.length >= 5) {
    const lengths = sentences.map((s) => s.words);
    const burst = cv(lengths);
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const pct = Math.round(burst * 100);
    if (burst < 0.3) {
      signals.push({
        id: 'low_burstiness',
        title: 'Very uniform sentence length',
        severity: 'high',
        weight: 18,
        spans: [],
        explanation: `Sentence lengths vary by only ${pct}% around an average of ${Math.round(mean)} words. Human writing usually varies by 50% or more. Low variation ("low burstiness") is the core statistic behind most AI detectors.`,
        lesson: 'Humans write in bursts: a long sentence, then a short one. Models keep a steady rhythm.',
        verification: 'Compare with a known sample of the writer: do their sentences also march in step?',
      });
    } else if (burst < 0.45) {
      signals.push({
        id: 'low_burstiness',
        title: 'Fairly uniform sentence length',
        severity: 'medium',
        weight: 9,
        spans: [],
        explanation: `Sentence lengths vary by ${pct}% around an average of ${Math.round(mean)} words. That is on the even side. Edited or academic human prose can look like this too.`,
        lesson: 'Even rhythm is a cue, not proof.',
        verification: 'Compare with other writing from the same person.',
      });
    } else if (burst > 0.7) {
      signals.push({
        id: 'high_burstiness',
        title: 'Bursty, varied sentence rhythm',
        severity: 'info',
        weight: -10,
        spans: [],
        explanation: `Sentence lengths vary by ${pct}%: a mix of very short and long sentences, which is typical of human writing.`,
        lesson: 'Rhythm is hard to fake without trying.',
        verification: 'None needed.',
      });
    }

    const openers = sentences.map((s) => s.text.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z']/g, '') ?? '');
    const distinct = new Set(openers.filter(Boolean)).size;
    if (sentences.length >= 8 && distinct / sentences.length > 0.9) {
      signals.push({
        id: 'elegant_variation',
        title: 'Every sentence opens differently',
        severity: 'low',
        weight: 6,
        spans: [],
        explanation: `${distinct} different first words across ${sentences.length} sentences. Models are trained to avoid repetition; people happily start several sentences with "I" or "The".`,
        lesson: 'Perfect variety is itself a pattern.',
        verification: 'Check the writer\'s other texts for natural repetition.',
      });
    }
  }

  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => wordCount(p))
    .filter((n) => n >= 15);
  if (paragraphs.length >= 3 && cv(paragraphs) < 0.25) {
    signals.push({
      id: 'uniform_paragraphs',
      title: 'Evenly sized paragraphs',
      severity: 'low',
      weight: 8,
      spans: [],
      explanation: `${paragraphs.length} paragraphs of almost equal length (${paragraphs.join(', ')} words). Generated essays tend to allocate equal space to each point.`,
      lesson: 'Humans ramble on the part they care about.',
      verification: 'Ask which paragraph the writer found hardest.',
    });
  }

  if (words >= 120) {
    const contractions = (text.match(/\b\w+'(?:t|s|re|ve|ll|d|m)\b/gi) ?? []).length;
    const firstPerson = (text.match(/\b(i|me|my|we|our)\b/gi) ?? []).length;
    if (contractions === 0) {
      signals.push({
        id: 'no_contractions',
        title: 'No contractions in a long text',
        severity: 'low',
        weight: 7,
        spans: [],
        explanation: `${words} words without a single contraction. Formal human writing can do this, but it is also the default register of most models.`,
        lesson: 'Zero contractions is a register choice. Ask whether it is the writer\'s.',
        verification: 'Compare with the writer\'s emails or messages.',
      });
    }
    if (firstPerson === 0) {
      signals.push({
        id: 'no_first_person',
        title: 'No first-person voice',
        severity: 'info',
        weight: 5,
        spans: [],
        explanation: 'Not one "I", "my" or "we" in the whole text. For a personal statement, reflection or email that is unusual; for a report it is normal.',
        lesson: 'Context decides whether this matters.',
        verification: 'Consider the genre before weighing this.',
      });
    }
  }

  return signals;
}
