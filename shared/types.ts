// Types shared between the frontend and the backend.

export type RiskLevel = 'low' | 'medium' | 'high';

/** What the analyser is looking for. */
export type AnalysisMode = 'scam' | 'ai';

export type Severity = 'info' | 'low' | 'medium' | 'high';

export interface TextSpan {
  start: number;
  end: number;
  text: string;
}

export interface Signal {
  id: string;
  title: string;
  severity: Severity;
  /** Points this signal contributes to the risk score (negative = legitimacy indicator). */
  weight: number;
  /** Exact parts of the message that triggered the rule. */
  spans: TextSpan[];
  /** Why this matters (rule default, replaced by LLM text when available). */
  explanation: string;
  /** Short lesson for scam-education mode. */
  lesson: string;
  /** What the student should do to verify. */
  verification: string;
}

export type LinkVerdict = 'unverified' | 'suspicious' | 'flagged' | 'likely-official';

export interface LinkCheck {
  url: string;
  domain: string;
  verdict: LinkVerdict;
  reasons: string[];
}

export interface LlmInfo {
  used: boolean;
  provider: string;
  model: string | null;
  error?: string;
}

export interface AnalysisResult {
  id: string;
  createdAt: string;
  mode: AnalysisMode;
  message: string;
  score: number;
  level: RiskLevel;
  summary: string;
  signals: Signal[];
  links: LinkCheck[];
  verificationSteps: string[];
  checklistQuestions: string[];
  /** Extra things the LLM noticed. Shown separately, never scored. */
  aiObservations: string[];
  uncertainty: string;
  llm: LlmInfo;
}

export interface HistoryItem {
  id: string;
  createdAt: string;
  mode: AnalysisMode;
  preview: string;
  score: number;
  level: RiskLevel;
}

export interface SampleMessage {
  id: string;
  mode: AnalysisMode;
  label: string;
  description: string;
  expected: RiskLevel;
  text: string;
}
