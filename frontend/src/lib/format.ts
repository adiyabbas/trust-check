import type { AnalysisMode, LinkCheck, RiskLevel, Severity } from '@shared/types';

export const SEVERITY_LABEL: Record<Severity, string> = { info: 'Info', low: 'Low', medium: 'Medium', high: 'High' };

export const VERDICT_LABEL: Record<LinkCheck['verdict'], string> = {
  'likely-official': 'Likely official',
  unverified: 'Unverified',
  suspicious: 'Suspicious',
  flagged: 'Flagged',
};

const LEVELS: Record<AnalysisMode, Record<RiskLevel, string>> = {
  scam: { low: 'Low risk', medium: 'Medium risk', high: 'High risk' },
  ai: { low: 'Likely human', medium: 'Uncertain', high: 'Likely AI-assisted' },
};

export function levelLabel(mode: AnalysisMode, level: RiskLevel): string {
  return LEVELS[mode][level];
}

/** All user-facing wording that differs between the two modes. */
export const MODE_TEXT: Record<
  AnalysisMode,
  {
    name: string;
    tagline: string;
    inputTitle: string;
    inputHint: string;
    placeholder: string;
    analyze: string;
    meterTitle: string;
    meterNote: string;
    evidenceTitle: string;
    evidenceEmpty: string;
    positiveTitle: string;
    stepsTitle: string;
    questionsTitle: string;
    questionsHint: string;
    predictQuestion: string;
    introLead: string;
    disclaimer: string;
  }
> = {
  scam: {
    name: 'Scam check',
    tagline: 'Student scam-awareness assistant',
    inputTitle: 'Message to check',
    inputHint: 'Paste text or upload a screenshot',
    placeholder: 'Paste the WhatsApp / SMS / email text here...',
    analyze: 'Analyze message',
    meterTitle: 'Risk assessment',
    meterNote: 'Illustrative score from transparent rules, not a calibrated probability of fraud.',
    evidenceTitle: 'Evidence detected',
    evidenceEmpty: 'No textual warning signs matched. Independent verification is still recommended.',
    positiveTitle: 'Consistent with a genuine message',
    stepsTitle: 'Next steps',
    questionsTitle: 'Questions to ask',
    questionsHint: 'Use contact details you found yourself, not the ones in the message.',
    predictQuestion: 'What risk level do you expect for this message?',
    introLead: 'Paste a suspicious scholarship, internship or job message. Rules find the warning signs, AI explains them, and you get safe verification steps.',
    disclaimer: 'TrustCheck highlights warning signs; it cannot prove a message is genuine or fake. Always verify through official channels.',
  },
  ai: {
    name: 'AI-writing check',
    tagline: 'Is this text AI-written? Signals, not verdicts.',
    inputTitle: 'Text to check',
    inputHint: 'Paste an essay, email or assignment (150+ words works best)',
    placeholder: 'Paste the essay, email or assignment text here...',
    analyze: 'Analyze text',
    meterTitle: 'AI-writing likelihood',
    meterNote: 'Style cues only. False positives are common, especially for formal or non-native English writing. Never treat this as proof.',
    evidenceTitle: 'AI-style signals',
    evidenceEmpty: 'No AI-style patterns matched. That does not rule out AI help; it means the text does not look like unedited model output.',
    positiveTitle: 'Signs of human writing',
    stepsTitle: 'How to use this',
    questionsTitle: 'Questions for the writer',
    questionsHint: 'Ask these in conversation. A writer who wrote it can usually answer easily.',
    predictQuestion: 'Do you think this text was written by a person or with AI?',
    introLead: 'Paste any text. Transparent rules look for known AI-writing patterns (vocabulary, structure, sentence rhythm) and for signs of a human voice, then show you both.',
    disclaimer: 'AI-writing detection is unreliable. TrustCheck shows stylistic cues to start a conversation, never to accuse.',
  },
};

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}
