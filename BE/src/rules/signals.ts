import type { Severity, Signal, TextSpan } from '../../../shared/types';

/**
 * Every rule is transparent: a regex (or small function) plus a fixed weight.
 * The LLM never changes these weights, it only explains them in context.
 */
export interface RuleDef {
  id: string;
  title: string;
  severity: Severity;
  weight: number;
  patterns: RegExp[];
  /** Optional: only fire if this many distinct matches are found. */
  minMatches?: number;
  explanation: string;
  lesson: string;
  verification: string;
}

export const RULES: RuleDef[] = [
  {
    id: 'upfront_payment',
    title: 'Upfront payment request',
    severity: 'high',
    weight: 30,
    patterns: [
      /\b(pay|deposit|transfer|send)\b[^.\n]{0,60}?\b(fee|fees|amount|charge|charges|money|₹|rs\.?|inr|\$)/i,
      /\b(registration|processing|verification|security|activation|onboarding|training|documentation|courier|admin(?:istration)?)\s+(fee|fees|charge|charges|deposit|amount)\b/i,
      /(₹|rs\.?|inr)\s?\d[\d,]*/i,
    ],
    explanation:
      'Genuine scholarships, internships and jobs do not ask the student to pay to receive money or an offer. A fee to "release" an award is the single most common scam pattern.',
    lesson: 'Rule of thumb: if you must pay to get paid, it is almost always a scam.',
    verification:
      'Ask the official office (not the sender) whether any fee exists. Legit providers list fees on their official website.',
  },
  {
    id: 'refundable_claim',
    title: '"Refundable" fee promise',
    severity: 'medium',
    weight: 8,
    patterns: [/\brefundable\b/i, /\b(will be|fully)\s+(refunded|returned)\b/i],
    explanation:
      'Calling the fee "refundable" lowers the victim\'s guard. The refund never comes because the sender disappears after payment.',
    lesson: 'A "refundable" fee is still a fee. Legit providers simply do not charge it.',
    verification: 'Ask for the refund policy in writing from an official email domain, then verify that domain independently.',
  },
  {
    id: 'artificial_urgency',
    title: 'Artificial urgency',
    severity: 'high',
    weight: 15,
    patterns: [
      /\bwithin\s+(?:\d+\s*(?:min(?:ute)?s?|hours?|hrs?)|[1-3]\s*days?)\b/i,
      /\b(limited seats|seats are limited|first[- ]come)\b/i,
      /\b(today only|last chance|final (?:notice|warning|reminder)|act now|immediately|right now|asap|hurry|expires? (?:today|tonight|in \d+))\b/i,
      /\b(will be|gets?|get)\s+(cancell?ed|forfeited|revoked|blocked|suspended)\b/i,
      /\burgent(?:ly)?\b/i,
    ],
    explanation:
      'Very short deadlines (minutes or hours) are designed to stop the student from pausing to verify. Real institutions give days or weeks and publish deadlines in advance.',
    lesson: 'Pressure is a tactic. Anyone who refuses to let you think it over is not acting in your interest.',
    verification: 'Ignore the countdown. Check the deadline on the provider\'s official website or by calling their published number.',
  },
  {
    id: 'sensitive_info',
    title: 'Sensitive information requested',
    severity: 'high',
    weight: 20,
    patterns: [
      /\b(aadhaa?r|aadhar|pan\s*(?:card|number|no\.?)|passport|voter\s*id)\b/i,
      /\b(otp|one[- ]time password|cvv|upi\s*pin|atm\s*pin|password|net ?banking)\b/i,
      /\b(bank|account)\s*(details|number|no\.?)\b/i,
      /\b(debit|credit)\s*card\b/i,
    ],
    explanation:
      'Identity documents, OTPs, PINs and bank details let a scammer open accounts, take loans or empty a bank account. No legitimate scholarship needs an OTP or a PIN, and documents are collected through official portals, not chat links.',
    lesson: 'Never share OTP, PIN, CVV or passwords with anyone. Share ID documents only on an official portal you reached yourself.',
    verification: 'Log in to the official portal directly (type the address yourself) and check whether documents are actually requested there.',
  },
  {
    id: 'too_good',
    title: 'Too-good-to-be-true offer',
    severity: 'medium',
    weight: 10,
    patterns: [
      /\b(congratulations?|congrats)\b/i,
      /\b(you (?:have been|are|were) (?:selected|chosen|shortlisted|awarded|approved))\b/i,
      /\b(guaranteed|100\s?%|assured|no interview|without (?:any )?(?:interview|exam|test|application))\b/i,
      /\b(won|winner|lucky|lottery|prize)\b/i,
    ],
    minMatches: 2,
    explanation:
      'Being "selected" for money without applying, or guaranteed placement with no interview, does not happen. Scammers lead with good news so the student feels lucky rather than cautious.',
    lesson: 'Ask: did I apply for this? If not, why would they pick me?',
    verification: 'Check whether you ever applied, and whether the provider lists this scheme on its official website.',
  },
  {
    id: 'unofficial_contact',
    title: 'Unofficial contact channel',
    severity: 'medium',
    weight: 12,
    patterns: [
      /\b[a-z0-9._%+-]+@(gmail|yahoo|hotmail|outlook|rediffmail|proton(?:mail)?)\.(com|in|co\.in)\b/i,
      /\b(whatsapp|telegram|signal)\s+(only|us|me|number|no\.?|at)\b/i,
      /\b(contact|reply|message|dm|ping)\s+(?:me|us)\s+(?:on\s+)?(whatsapp|telegram|instagram)\b/i,
      /\bt\.me\/|wa\.me\//i,
    ],
    explanation:
      'Institutions and companies communicate from their own domain and official phone numbers. Free email accounts and chat-only contact make the sender impossible to trace.',
    lesson: 'Official = official domain. A college does not run scholarships from a Gmail address.',
    verification: 'Find the official contact details on the institution\'s website and reach out there, not through the number in the message.',
  },
  {
    id: 'payment_channel',
    title: 'Untraceable payment method',
    severity: 'high',
    weight: 15,
    patterns: [
      /\b(upi|paytm|phonepe|google pay|gpay|bhim)\b/i,
      /\b[a-z0-9.\-_]{2,}@(ybl|okaxis|oksbi|okicici|okhdfcbank|paytm|upi|apl|ibl|axl)\b/i,
      /\b(gift ?cards?|crypto|bitcoin|usdt|western union)\b/i,
    ],
    explanation:
      'Payments to personal UPI IDs, wallets, gift cards or crypto cannot be reversed. Legitimate fees (where they exist at all) go through official payment gateways with receipts.',
    lesson: 'If the payee is a person rather than an institution, stop.',
    verification: 'Ask for the institution\'s official payment page and verify its domain. Never pay a personal UPI ID.',
  },
  {
    id: 'authority_impersonation',
    title: 'Authority name used as pressure',
    severity: 'medium',
    weight: 8,
    patterns: [
      /\b(ministry|government|govt\.?|ugc|aicte|nsp|national scholarship|rbi|income tax|cbse|ncert|pm ?(?:modi|cares|yojana))\b/i,
    ],
    explanation:
      'Dropping a government or regulator name adds false authority. Government schemes are announced on official portals (for example scholarships.gov.in), never over personal messages.',
    lesson: 'Big names are easy to type. Check the scheme on the official government portal.',
    verification: 'Search the scheme name on the official government portal and compare the process described there with the message.',
  },
  {
    id: 'secrecy',
    title: 'Request for secrecy',
    severity: 'medium',
    weight: 8,
    patterns: [/\b(do not|don't|dont)\s+(share|tell|discuss|disclose)\b/i, /\b(keep (?:this|it) (?:confidential|secret|private))\b/i, /\bconfidential\b/i],
    explanation: 'Asking the student not to tell parents, teachers or friends removes the people most likely to spot the scam.',
    lesson: 'Anything you are told to hide from your family is a red flag.',
    verification: 'Do the opposite: show the message to a teacher, parent or the college placement cell.',
  },
  {
    id: 'generic_greeting',
    title: 'Generic, impersonal greeting',
    severity: 'low',
    weight: 4,
    patterns: [/\bdear\s+(student|candidate|applicant|user|customer|beneficiary|sir\/madam)\b/i],
    explanation: 'Mass-sent scams do not know the recipient\'s name. A provider that actually selected you would address you by name and reference your application.',
    lesson: 'No name, no application number, no specific course = probably a bulk message.',
    verification: 'Check whether the message references details only a real provider would know (your name, application ID, course).',
  },
  {
    id: 'shouting',
    title: 'Excessive capitals or punctuation',
    severity: 'info',
    weight: 2,
    patterns: [/!{2,}/, /\b[A-Z]{6,}\b/],
    minMatches: 2,
    explanation: 'Caps-lock words and stacked exclamation marks are an emotional nudge, common in bulk scam templates and rare in official communication.',
    lesson: 'Official letters are boring on purpose. Excitement in the formatting is a hint.',
    verification: 'Compare the tone with a real notice from the same institution.',
  },

  // ---- Legitimacy indicators (negative weight) ----
  {
    id: 'official_domain',
    title: 'Official-looking domain present',
    severity: 'info',
    weight: -15,
    patterns: [/\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(ac\.in|edu|edu\.in|gov\.in|nic\.in|gov|res\.in)\b/i],
    explanation:
      'Addresses on .ac.in, .edu, .gov.in or .nic.in domains are restricted to registered institutions and government bodies. This lowers risk but does not prove the message is real: the domain could be spoofed in the display text.',
    lesson: 'Restricted domains are harder to fake, but still compare the exact spelling.',
    verification: 'Open the domain yourself (not via the link) and confirm the notice is published there.',
  },
  {
    id: 'no_fee_stated',
    title: 'States that no fee is charged',
    severity: 'info',
    weight: -10,
    patterns: [/\b(no (?:application |processing |registration )?fee|free of (?:cost|charge)|no payment (?:is )?required)\b/i],
    explanation: 'An explicit "no fee" statement is consistent with how genuine scholarships operate.',
    lesson: 'Real scholarships cost nothing to apply for.',
    verification: 'Still confirm on the official website that the scheme exists.',
  },
  {
    id: 'named_contact',
    title: 'Named contact with designation',
    severity: 'info',
    weight: -8,
    patterns: [/\b(dean|registrar|principal|coordinator|professor|prof\.|dr\.|hod|placement officer|scholarship cell|office of)\b/i],
    explanation: 'A named person with an official designation can be looked up and called back through the institution\'s switchboard.',
    lesson: 'Accountability is a good sign. Anonymous senders are not.',
    verification: 'Call the institution\'s published number and ask for that person by name.',
  },
  {
    id: 'reasonable_deadline',
    title: 'Reasonable, dated deadline',
    severity: 'info',
    weight: -5,
    patterns: [/\b(deadline|last date|apply by|closes? on)\b[^.\n]{0,40}\b\d{1,2}(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\b/i],
    explanation: 'A specific calendar date, rather than a countdown in minutes, matches how institutions actually announce schemes.',
    lesson: 'Real deadlines are dates on a notice board, not timers in a chat.',
    verification: 'Match the date against the official notice.',
  },
];

export function findSpans(text: string, patterns: RegExp[]): TextSpan[] {
  const spans: TextSpan[] = [];
  for (const p of patterns) {
    const re = new RegExp(p.source, p.flags.includes('g') ? p.flags : p.flags + 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (m[0].length === 0) {
        re.lastIndex++;
        continue;
      }
      spans.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
    }
  }
  // de-duplicate overlapping spans
  spans.sort((a, b) => a.start - b.start || b.end - a.end);
  const merged: TextSpan[] = [];
  for (const s of spans) {
    const last = merged[merged.length - 1];
    if (last && s.start < last.end) {
      if (s.end > last.end) {
        last.end = s.end;
        last.text = text.slice(last.start, last.end);
      }
    } else {
      merged.push({ ...s });
    }
  }
  return merged;
}

export function toSignal(rule: RuleDef, spans: TextSpan[]): Signal {
  return {
    id: rule.id,
    title: rule.title,
    severity: rule.severity,
    weight: rule.weight,
    spans,
    explanation: rule.explanation,
    lesson: rule.lesson,
    verification: rule.verification,
  };
}
