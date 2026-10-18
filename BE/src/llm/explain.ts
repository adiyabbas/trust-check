import type { AnalysisMode, LinkCheck, RiskLevel, Signal } from '../../../shared/types';
import { config, llmEnabled } from '../config';
import { chat, LlmError } from './client';

export interface Explanation {
  summary: string;
  evidence: Record<string, string>;
  lessons: Record<string, string>;
  verificationSteps: string[];
  checklistQuestions: string[];
  aiObservations: string[];
  uncertainty: string;
}

export interface ExplainResult {
  explanation: Explanation;
  used: boolean;
  model: string | null;
  error?: string;
}

const SCAM_SYSTEM_PROMPT = `You are TrustCheck, a scam-awareness assistant for college students in India.
You receive a suspicious message plus a list of warning signs that a transparent rule engine already detected.
Your job is to EXPLAIN, not to decide. You must not invent new risk scores and must not claim certainty about whether the message is a scam.
Write for a 19-year-old student: plain English, short sentences, no jargon. Be concrete and reference the actual wording of the message.
Respond with ONLY a JSON object with exactly these keys:
{
  "summary": string (2-3 sentences: what the message is asking for and the main concern, hedged appropriately),
  "evidence": { "<signal_id>": string (1-2 sentences on why THIS instance matters, quoting the message) },
  "lessons": { "<signal_id>": string (one memorable sentence a student can remember for next time) },
  "verificationSteps": string[] (3-5 practical steps, ordered, each starting with a verb),
  "checklistQuestions": string[] (3-5 questions the student should ask the purported provider),
  "aiObservations": string[] (0-3 additional things you noticed that the rules did NOT flag; empty array if none),
  "uncertainty": string (one sentence on what you cannot know from the text alone)
}`;

const AI_SYSTEM_PROMPT = `You are TrustCheck in "AI-writing check" mode, helping students and teachers in India reason about whether a text was written with an AI assistant.
You receive the text plus the stylistic signals a transparent rule engine detected (vocabulary, structure, statistics).
You EXPLAIN the signals, you do not decide authorship. AI-text detection is unreliable and produces false positives, especially for non-native English writers and formal academic prose. Never state that the text is definitely AI-written or definitely human.
Write for a 19-year-old student: plain English, short sentences. Quote the actual wording when explaining a signal.
Respond with ONLY a JSON object with exactly these keys:
{
  "summary": string (2-3 sentences: what kind of text this is, which signals are strongest, and a clear statement that this is a probability cue, not proof),
  "evidence": { "<signal_id>": string (1-2 sentences on why THIS instance of the signal matters, quoting the text) },
  "lessons": { "<signal_id>": string (one memorable sentence about recognising this pattern) },
  "verificationSteps": string[] (3-5 fair, practical steps a teacher or student can take to check authorship WITHOUT relying on detectors: ask for drafts, discuss the content orally, compare with earlier work, check document history),
  "checklistQuestions": string[] (3-5 questions to ask the writer about their own text),
  "aiObservations": string[] (0-3 additional stylistic things you noticed that the rules did NOT flag; empty array if none),
  "uncertainty": string (one sentence on the limits of this analysis, mentioning false positives)
}`;

function extractJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
    throw new LlmError('LLM did not return JSON');
  }
}

const asStr = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v.trim() : fallback);
const asStrArr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').map((s) => s.trim()).filter(Boolean) : []);
const asStrMap = (v: unknown): Record<string, string> => {
  if (!v || typeof v !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) if (typeof val === 'string') out[k] = val.trim();
  return out;
};

function aiFallback(signals: Signal[], level: RiskLevel): Explanation {
  const positives = signals.filter((s) => s.weight > 0);
  const summaryByLevel: Record<RiskLevel, string> = {
    high: `This text shows ${positives.length} stylistic pattern${positives.length === 1 ? '' : 's'} that are common in AI-generated writing. That makes AI assistance plausible, not proven: formal human writing can trigger the same cues.`,
    medium: `Some AI-style patterns are present alongside signs of human writing. The result is uncertain. Treat it as a reason to ask questions, not as a verdict.`,
    low: `Few AI-style patterns were found and several signs point to a human writer. This does not rule out AI help; it only means the text does not look like unedited model output.`,
  };
  return {
    summary: summaryByLevel[level],
    evidence: {},
    lessons: {},
    verificationSteps: [
      'Do not treat this score as proof. Detectors, including this one, produce false positives, especially for non-native English writers.',
      'Ask the writer to talk through the text: what each paragraph argues and why they chose specific words.',
      'Compare with earlier writing from the same person (emails, previous assignments) for voice and habits.',
      'Ask for drafts, notes or the document\'s version history, which show the writing process.',
      'If AI use is allowed, ask how it was used rather than whether.',
    ],
    checklistQuestions: [
      'Can you explain this sentence in your own words?',
      'Where did this fact or figure come from?',
      'Which part was hardest to write, and why?',
      'Did you use any tool to draft, rewrite or polish this? Which parts?',
      'Can you show me an earlier draft?',
    ],
    aiObservations: [],
    uncertainty: 'Style statistics cannot identify the author. Formal, edited or non-native human writing often looks like model output, and lightly edited model output often looks human.',
  };
}

/** Rule-only fallback so the demo works offline / without a key. */
export function fallbackExplanation(signals: Signal[], level: RiskLevel, links: LinkCheck[], mode: AnalysisMode = 'scam'): Explanation {
  if (mode === 'ai') return aiFallback(signals, level);
  const positives = signals.filter((s) => s.weight > 0);
  const summaryByLevel: Record<RiskLevel, string> = {
    high: `This message shows ${positives.length} warning sign${positives.length === 1 ? '' : 's'} that commonly appear together in scams. Do not pay or share anything until you have verified the offer through an official channel.`,
    medium: `This message has some warning signs but also features that could be legitimate. Treat it as unverified and confirm it independently before responding.`,
    low: `Few textual warning signs were found. That does not prove the message is genuine, so still verify the offer through the provider's official website or office.`,
  };
  const steps = [
    'Do not pay any fee or share documents, OTPs or bank details until the offer is verified.',
    "Find the provider's official website yourself through a search engine, not through the link in the message.",
    'Confirm the award and any requirements using the contact details published on that official site.',
    'Show the message to a teacher, parent or your college placement / scholarship cell.',
  ];
  if (links.some((l) => l.verdict !== 'likely-official')) steps.splice(2, 0, 'Compare the domain in the message with the official domain character by character.');
  return {
    summary: summaryByLevel[level],
    evidence: {},
    lessons: {},
    verificationSteps: steps,
    checklistQuestions: [
      'Which office issued this offer, and what is its official phone number and email domain?',
      'Where is this scheme listed on your official website?',
      'Did I apply for this? If not, how was I selected?',
      'Is any payment required at any stage? If yes, through which official payment page?',
      'Can I complete this through the official portal instead of this link?',
    ],
    aiObservations: [],
    uncertainty: 'Text analysis cannot confirm who actually sent this message or whether the organisation exists.',
  };
}

export async function explain(message: string, signals: Signal[], level: RiskLevel, links: LinkCheck[], mode: AnalysisMode = 'scam'): Promise<ExplainResult> {
  const fallback = fallbackExplanation(signals, level, links, mode);
  if (!llmEnabled()) {
    return { explanation: fallback, used: false, model: null, error: 'LLM not configured (set LLM_PROVIDER and an API key in .env)' };
  }

  const ruleSummary = signals.map((s) => ({
    id: s.id,
    title: s.title,
    weight: s.weight,
    matched: s.spans.map((sp) => sp.text).slice(0, 5),
  }));

  const levelName = mode === 'ai' ? `AI-likelihood level = ${level} (low = likely human, medium = uncertain, high = likely AI-assisted)` : `risk level = ${level}`;
  const linkPart = mode === 'ai' ? '' : `\nLINK CHECKS (JSON): ${JSON.stringify(links.map((l) => ({ domain: l.domain, verdict: l.verdict })))}`;
  const user = `TEXT (between triple quotes):\n"""\n${message.slice(0, 4000)}\n"""\n\nRULE ENGINE RESULT: ${levelName}\nDETECTED SIGNALS (JSON): ${JSON.stringify(ruleSummary)}${linkPart}\n\nProduce the JSON described in the system prompt. Keys in "evidence" and "lessons" must be the signal ids above.`;

  try {
    const raw = await chat(
      [
        { role: 'system', content: mode === 'ai' ? AI_SYSTEM_PROMPT : SCAM_SYSTEM_PROMPT },
        { role: 'user', content: user },
      ],
      { json: true },
    );
    const j = extractJson(raw) as Record<string, unknown>;
    const explanation: Explanation = {
      summary: asStr(j.summary, fallback.summary),
      evidence: asStrMap(j.evidence),
      lessons: asStrMap(j.lessons),
      verificationSteps: asStrArr(j.verificationSteps).length ? asStrArr(j.verificationSteps) : fallback.verificationSteps,
      checklistQuestions: asStrArr(j.checklistQuestions).length ? asStrArr(j.checklistQuestions) : fallback.checklistQuestions,
      aiObservations: asStrArr(j.aiObservations).slice(0, 3),
      uncertainty: asStr(j.uncertainty, fallback.uncertainty),
    };
    return { explanation, used: true, model: config.llm.model };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[llm] falling back to rule explanations:', msg);
    return { explanation: fallback, used: false, model: config.llm.model, error: msg };
  }
}
