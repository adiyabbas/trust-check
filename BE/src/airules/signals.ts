import type { Severity, Signal, TextSpan } from '../../../shared/types';
import { findSpans } from '../rules/signals';

/**
 * Heuristic signs of AI-written text. Based on the patterns catalogued by
 * Wikipedia's "Signs of AI writing" guide (WikiProject AI Cleanup) plus the
 * usual statistical tells (see stats.ts). Each rule is transparent: regexes,
 * a per-match weight and a cap. Negative weights are signs of human writing.
 *
 * IMPORTANT: none of these prove anything. Human writers, especially those
 * taught formal academic English, use many of them.
 */
export interface AiRuleDef {
  id: string;
  title: string;
  severity: Severity;
  /** Points added per distinct match ... */
  perMatch: number;
  /** ... capped at this absolute value. */
  maxWeight: number;
  minMatches?: number;
  patterns: RegExp[];
  explanation: string;
  lesson: string;
  verification: string;
}

export const AI_RULES: AiRuleDef[] = [
  {
    id: 'chatbot_artifact',
    title: 'Chatbot conversation left in the text',
    severity: 'high',
    perMatch: 25,
    maxWeight: 35,
    patterns: [
      /\b(as an ai(?: language model)?|i am an ai|i'm an ai|as a large language model)\b/i,
      /\b(i hope this helps|let me know if you(?:'d| would) like|feel free to ask|happy to help|would you like me to)\b/i,
      /^(certainly|sure|absolutely|of course|great question)[!,.:]/im,
      /^(here(?:'s| is) (?:a|an|the|your) [\w ]{0,40}(?:version|draft|summary|overview|breakdown|essay|answer)[:.])/im,
      /\b(my knowledge cutoff|as of my last (?:update|training)|i (?:don't|do not) have access to real-time)\b/i,
    ],
    explanation: 'Phrases like "I hope this helps" or "As an AI language model" are the assistant talking to the user. They only appear when a chatbot reply was pasted without editing.',
    lesson: 'This is the one near-certain sign. Everything else is probability.',
    verification: 'Ask the writer to explain the sentence in their own words. If it was pasted, they usually cannot.',
  },
  {
    id: 'citation_artifact',
    title: 'Chatbot citation markup',
    severity: 'high',
    perMatch: 30,
    maxWeight: 30,
    patterns: [/\b(oaicite|contentReference|grok_card|attached_file|turn\d+search\d+|citeturn)\b/i, /\[\d+\]\(#?cite[^)]*\)/i, /utm_source=(?:chatgpt|openai|perplexity|copilot)/i],
    explanation: 'Tokens such as "oaicite" or "contentReference" are internal citation markers from ChatGPT, Grok or similar tools. They have no other origin.',
    lesson: 'Machine artifacts are stronger evidence than any style cue.',
    verification: 'Search the text for the token and ask where it came from.',
  },
  {
    id: 'ai_vocabulary',
    title: 'Overused AI vocabulary',
    severity: 'medium',
    perMatch: 4,
    maxWeight: 20,
    minMatches: 2,
    patterns: [
      /\b(delve|delves|delving|tapestry|testament|pivotal|multifaceted|meticulous(?:ly)?|intricate|intricacies|interplay|underscore[sd]?|underscoring|bolster(?:ed|s)?|garner(?:ed|s)?|foster(?:ing|s|ed)?|leverag(?:e|es|ing|ed)|harness(?:ing|es|ed)?|elevat(?:e|es|ing)|seamless(?:ly)?|robust|holistic|synergy|paradigm|realm|beacon|embark(?:ing|ed|s)?|navigat(?:e|ing) the|unlock(?:ing)? the (?:potential|power)|game-changer|cutting-edge|ever-evolving|fast-paced|transformative|empower(?:ing|s|ed)?|resonat(?:e|es|ing) with|align(?:s|ed|ing)? with|showcas(?:e|es|ing)|vibrant|enduring|invaluable|crucial|comprehensive)\b/gi,
    ],
    explanation: 'Words such as "delve", "tapestry", "pivotal", "foster" and "leverage" appear far more often in LLM output than in typical student writing. One or two mean nothing. A cluster is a cue.',
    lesson: 'Count the cluster, not the single word.',
    verification: 'Ask the writer to define two of the flagged words in their own words.',
  },
  {
    id: 'significance_inflation',
    title: 'Inflated significance ("stands as a testament")',
    severity: 'medium',
    perMatch: 6,
    maxWeight: 18,
    patterns: [
      /\b(stands? as (?:a )?(?:testament|reminder|symbol)|serves? as a (?:testament|reminder|cornerstone|foundation)|is a testament to|plays? a (?:crucial|vital|pivotal|key|significant) role|key turning point|indelible mark|deeply rooted|setting the stage for|evolving landscape|focal point|underscores? (?:its|the) (?:importance|significance)|highlights? (?:its|the) significance|reflects? broader|lasting (?:impact|legacy)|rich (?:history|heritage|tapestry)|cannot be overstated)\b/gi,
    ],
    explanation: 'LLMs habitually tell the reader that something is important ("plays a vital role", "stands as a testament") instead of showing it with a concrete fact.',
    lesson: 'Real writers show significance with specifics. Models announce it.',
    verification: 'Ask for the specific fact behind each claim of importance.',
  },
  {
    id: 'copula_avoidance',
    title: 'Avoids simple "is" / "has"',
    severity: 'low',
    perMatch: 3,
    maxWeight: 12,
    minMatches: 2,
    patterns: [/\b(serves as|stands as|functions as|operates as|represents a|boasts (?:a|an|over|more)|features a|offers a (?:range|variety|glimpse)|marks a|embodies|encompasses|refers to)\b/gi],
    explanation: '"Serves as", "boasts", "encompasses" and "refers to" in place of a plain "is" or "has" is a documented LLM habit.',
    lesson: 'Plain verbs are a human habit. Fancy copulas are a model habit.',
    verification: 'Compare with the writer\'s earlier work: do they usually write "is" or "serves as"?',
  },
  {
    id: 'negative_parallelism',
    title: 'Negative parallelism ("not just X, but Y")',
    severity: 'medium',
    perMatch: 6,
    maxWeight: 12,
    patterns: [/\b(not only\b[^.?!\n]{3,80}?\bbut also)\b/gi, /\b(?:it'?s|this is|that is|it is) not (?:just|only|merely|simply|about)\b[^.?!\n]{3,80}?\b(?:it'?s|but|it is)\b/gi, /\bno [a-z]+, no [a-z]+, (?:just|only)\b/gi, /\bisn'?t (?:just|only|about)\b[^.?!\n]{3,60}?\bit'?s\b/gi],
    explanation: 'The "it is not just X, it is Y" construction is one of the most recognisable LLM rhythms. Humans use it too, but rarely several times in one piece.',
    lesson: 'One is rhetoric. Three is a template.',
    verification: 'Count how many sentences follow the same shape.',
  },
  {
    id: 'rule_of_three',
    title: 'Adjective triplets',
    severity: 'low',
    perMatch: 3,
    maxWeight: 9,
    minMatches: 2,
    patterns: [/\b[a-z]+(?:ive|ful|ous|al|ing|ed|ant|ent|able|ible), [a-z]+(?:ive|ful|ous|al|ing|ed|ant|ent|able|ible),? and [a-z]+(?:ive|ful|ous|al|ing|ed|ant|ent|able|ible)\b/gi],
    explanation: 'Lists of exactly three matched adjectives ("innovative, scalable, and sustainable") are a stylistic default of LLMs.',
    lesson: 'Humans list two or five. Models list three.',
    verification: 'Ask the writer why those three and not two.',
  },
  {
    id: 'formulaic_transitions',
    title: 'Formulaic sentence openers',
    severity: 'low',
    perMatch: 3,
    maxWeight: 12,
    minMatches: 2,
    patterns: [/(?:^|(?<=[.!?]\s))(Additionally|Furthermore|Moreover|In addition|Ultimately|Overall|Importantly|Notably|Crucially|Consequently|In today'?s [\w -]+(?:world|era|landscape|age)),?\s/gm],
    explanation: 'Starting many sentences with "Additionally", "Furthermore", "Moreover" or "In today\'s fast-paced world" is classic essay-generator glue.',
    lesson: 'Transitions should be rare and varied. Stacked ones read as machine glue.',
    verification: 'Remove the transition words and see whether the sentences still connect.',
  },
  {
    id: 'summary_closer',
    title: 'Formulaic conclusion',
    severity: 'low',
    perMatch: 6,
    maxWeight: 12,
    patterns: [/(?:^|(?<=[.!?]\s))(In conclusion|In summary|To sum up|To summarize|All in all|In essence|At its core|Looking ahead|Moving forward|As we (?:move|look) forward),?\s/gim, /\b(the future (?:looks|remains) (?:bright|promising)|only time will tell|the journey (?:has just )?begins?)\b/gi],
    explanation: 'A tidy closing paragraph beginning "In conclusion" that restates the opening is a strong default of LLM essays.',
    lesson: 'Humans often just stop. Models always wrap up.',
    verification: 'Ask what the conclusion adds beyond the introduction.',
  },
  {
    id: 'markdown_formatting',
    title: 'Chat-style formatting (bold, headers, emoji bullets)',
    severity: 'medium',
    perMatch: 6,
    maxWeight: 18,
    patterns: [/\*\*[^*\n]{2,60}\*\*:?/g, /^#{1,4}\s+\S/gm, /^\s*[-*•]\s+\*\*[^*\n]+\*\*/gm, /^\s*(?:[✅✨\u{1F680}\u{1F4A1}\u{1F525}\u{1F4CC}\u{1F4DD}\u{1F3AF}\u{1F511}\u{1F4CA}\u{1F4C8}\u{1F9E0}⚠✔\u{1F449}])\s/gmu, /^\s*---+\s*$/gm],
    explanation: 'Bold lead-ins, markdown headers, horizontal rules and emoji bullets are how chat assistants format answers. In a pasted assignment or email they stand out.',
    lesson: 'Formatting travels with the paste.',
    verification: 'Check whether the writer\'s other documents use the same formatting.',
  },
  {
    id: 'em_dash',
    title: 'Frequent em dashes',
    severity: 'low',
    perMatch: 3,
    maxWeight: 12,
    minMatches: 2,
    patterns: [/—/g, /\s--\s/g],
    explanation: 'Heavy use of the em dash (—) was the most-cited surface tell of ChatGPT-era text. Humans type a hyphen; models emit the typographic dash.',
    lesson: 'Count the dashes. Then check the keyboard: who types — on a phone?',
    verification: 'Ask the writer how they typed the dash.',
  },
  {
    id: 'curly_quotes',
    title: 'Typographic (curly) quotes in plain text',
    severity: 'info',
    perMatch: 2,
    maxWeight: 6,
    minMatches: 3,
    patterns: [/[“”‘’]/g],
    explanation: 'Curly quotes and apostrophes are produced by word processors and chatbots, not by WhatsApp, Notepad or most code editors. Weak on its own.',
    lesson: 'Weak cue. Useful only together with others.',
    verification: 'Check whether the text came through Word or Docs, which also curl quotes.',
  },
  {
    id: 'vague_attribution',
    title: 'Vague authorities ("experts argue")',
    severity: 'low',
    perMatch: 5,
    maxWeight: 10,
    patterns: [/\b(experts? (?:argue|agree|suggest|believe|say)|studies (?:show|suggest|have shown)|research (?:shows|suggests|indicates)|observers have (?:cited|noted)|industry reports|some critics argue|it is widely (?:believed|accepted|recognised|recognized))\b/gi],
    explanation: 'Unnamed experts and uncited "studies" are how a model fills the gap where a human would name a source or admit they do not know.',
    lesson: 'Ask: which experts? Which study?',
    verification: 'Ask the writer to name one source for each claim.',
  },
  {
    id: 'hedged_balance',
    title: 'Hedged "while X, Y" balancing',
    severity: 'info',
    perMatch: 3,
    maxWeight: 9,
    minMatches: 2,
    patterns: [/\b(while (?:there are|it is|this|these|some)\b[^.?!\n]{5,80}?,\s*(?:it is|there are|others|it also|it remains))/gi, /\b(it is (?:important|worth|essential) to (?:note|consider|remember|recognise|recognize|acknowledge))\b/gi, /\b(on the other hand|that being said|with that said|at the same time)\b/gi],
    explanation: '"It is important to note" and endless both-sides balancing are safety habits of models trained to avoid taking positions.',
    lesson: 'Humans have opinions. Models have balance.',
    verification: 'Ask the writer what they actually think.',
  },

  // ---------- Human counter-indicators (negative) ----------
  {
    id: 'contractions',
    title: 'Natural contractions',
    severity: 'info',
    perMatch: -1,
    maxWeight: -8,
    minMatches: 2,
    patterns: [/\b(?:i'm|i've|i'd|i'll|don't|doesn't|didn't|can't|couldn't|won't|wouldn't|isn't|aren't|wasn't|weren't|it's|that's|there's|we're|they're|you're|we've|they've|let's|ain't|gonna|wanna|gotta)\b/gi],
    explanation: 'Contractions and casual verb forms are typical of spontaneous human writing. Models default to full forms unless told otherwise.',
    lesson: 'Casual grammar is a human fingerprint.',
    verification: 'Compare with how the writer messages normally.',
  },
  {
    id: 'informal_slang',
    title: 'Slang and informal tone',
    severity: 'info',
    perMatch: -4,
    maxWeight: -12,
    patterns: [/\b(lol|lmao|tbh|idk|imo|ngl|btw|omg|bruh|kinda|sorta|dunno|ya|yeah|yep|nah|nope|gonna|coz|cuz|pls|plz|thx|srsly|legit|lowkey|highkey|vibe|sus)\b/gi, /\b(yaar|bhai|bro|dude|arre|arey|acha|accha|haan|nahi|kya|matlab|bas|chalo|theek|thik|hai na)\b/gi],
    explanation: 'Slang, Hinglish and chat shorthand almost never appear in unedited model output.',
    lesson: 'Models do not say "yaar".',
    verification: 'None needed. This is the writer\'s natural voice.',
  },
  {
    id: 'typos_messiness',
    title: 'Typos and messy punctuation',
    severity: 'info',
    perMatch: -3,
    maxWeight: -12,
    patterns: [/(?:^|\s)i(?=\s)/g, /\s[,.;:!?]/g, /[a-z]\s{2,}[a-z]/g, /\.{2}(?!\.)/g, /\b(teh|recieve|definately|seperate|occured|untill|wich|becuase|alot|thier|truely|writting|tommorow|enviroment)\b/gi, /(?<=[.!?]\s)[a-z]/g],
    explanation: 'Lower-case "i", spaces before commas, double spaces and common misspellings are human errors. Models almost never produce them.',
    lesson: 'Imperfection is evidence of a person.',
    verification: 'None needed.',
  },
  {
    id: 'personal_specifics',
    title: 'Concrete personal detail',
    severity: 'info',
    perMatch: -3,
    maxWeight: -9,
    patterns: [/\b(my (?:mom|mum|dad|mother|father|brother|sister|roommate|hostel|teacher|professor|prof|friend|cousin|batchmate|senior))\b/gi, /\b(yesterday|last night|this morning|last week|day before yesterday|at \d{1,2}(?::\d{2})?\s?(?:am|pm))\b/gi, /\b(?:room|hostel|block|sem|semester)\s?\d+\b/gi],
    explanation: 'Specific, checkable personal details (who, when, where) are what a model cannot invent about the writer\'s actual life.',
    lesson: 'Specifics are human. Generalities are safe for a machine.',
    verification: 'The details themselves can be checked.',
  },
  {
    id: 'emphatic_punctuation',
    title: 'Emotional punctuation and emoticons',
    severity: 'info',
    perMatch: -3,
    maxWeight: -6,
    patterns: [/[!?]{2,}/g, /(?:^|\s)(?::\)|:\(|:D|xD|XD|:P|;\)|<3)(?=\s|$)/g, /\b(?:haha+|hehe+|lmao+)\b/gi],
    explanation: 'Repeated punctuation and emoticons are spontaneous human habits. Models use emoji, not emoticons, and rarely stack exclamation marks.',
    lesson: 'Emotion leaks through punctuation.',
    verification: 'None needed.',
  },
];

export function toAiSignal(rule: AiRuleDef, spans: TextSpan[]): Signal | null {
  const min = rule.minMatches ?? 1;
  if (spans.length < min) return null;
  const raw = rule.perMatch * spans.length;
  const weight = rule.maxWeight < 0 ? Math.max(rule.maxWeight, raw) : Math.min(rule.maxWeight, raw);
  return {
    id: rule.id,
    title: rule.title,
    severity: rule.severity,
    weight,
    spans,
    explanation: rule.explanation,
    lesson: rule.lesson,
    verification: rule.verification,
  };
}

export function runAiPatternRules(text: string): Signal[] {
  const out: Signal[] = [];
  for (const rule of AI_RULES) {
    const spans = findSpans(text, rule.patterns);
    const sig = toAiSignal(rule, spans);
    if (sig) out.push(sig);
  }
  return out;
}
