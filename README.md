# TrustCheck AI

> Paste a message. See the evidence. Verify before you trust.

TrustCheck is a student-safety tool with **two checks in one app**:

| Mode | Question it answers | Typical input |
|---|---|---|
| **Scam check** | Is this scholarship / internship / job message a scam? | WhatsApp, SMS, email, screenshot |
| **AI-writing check** | Does this text look AI-written? | Essay, assignment, cover letter, email |

Both modes follow one design rule:

> **Transparent rules decide the score. The LLM only explains. The student verifies.**

The app works fully **without any API key** (rules-only mode). Adding a free key
turns on AI-written, message-specific explanations.

For an interactive, clickable walkthrough of the whole system, open
**[how-it-works.html](how-it-works.html)** in a browser.

---

## Contents

1. [Features](#features)
2. [Quick start](#quick-start)
3. [Configuration (.env)](#configuration-env)
4. [Project structure](#project-structure)
5. [Architecture](#architecture)
6. [Scam check: how it decides](#scam-check-how-it-decides)
7. [AI-writing check: how it decides](#ai-writing-check-how-it-decides)
8. [The LLM layer](#the-llm-layer)
9. [API reference](#api-reference)
10. [Frontend](#frontend)
11. [Data and privacy](#data-and-privacy)
12. [Demo script](#demo-script)
13. [Extending](#extending)
14. [Limitations](#limitations)
15. [Troubleshooting](#troubleshooting)
16. [Contact](#contact)

---

## Features

- **Two modes** behind one switch at the top of the page.
- **Paste or screenshot.** OCR runs inside the browser with tesseract.js. The image never leaves the device.
- **Evidence highlighting.** The exact words that triggered each rule are highlighted in the message. Click a highlight to open its explanation.
- **Severity, not magic numbers.** Each signal is labelled High, Medium, Low, Info or Positive.
- **Risk meter** from 0 to 100 with three bands. It is labelled as illustrative, not a probability.
- **Link checker** for scam mode. It flags shorteners, raw IPs, abused TLDs, look-alike words and plain HTTP. Google Safe Browsing is optional.
- **Education mode.** Every signal carries a one-line lesson.
- **Verification assistant.** Gives next steps and a copyable list of questions to ask the sender or writer.
- **Predict first (judge mode).** The audience guesses the result before it is revealed.
- **History** stored in SQLite and filtered per mode.
- **Works offline from the LLM.** Any LLM failure falls back to rule-written explanations.
- **Three-column layout.** History on the left, input and evidence in the middle (the only scrolling column), details on the right, footer below the fold.

---

## Quick start

**Requirements:** Node.js 22.5 or newer, for the built-in `node:sqlite`. Tested on Node 26.

```bash
cd TrustCheck
npm install
cp .env.example .env      # optional: add a free LLM key
npm run dev               # backend :3001 + frontend :5173
```

Open **http://localhost:5173**.

| Script | What it does |
|---|---|
| `npm run dev` | Backend (tsx watch) and frontend (Vite) together |
| `npm run dev:be` | Backend only, port 3001 |
| `npm run dev:fe` | Frontend only, port 5173, proxies `/api` to 3001 |
| `npm run build` | Builds the frontend into `dist/` |
| `npm start` | Production: backend serves the API and `dist/` on port 3001 |
| `npm run typecheck` | `tsc --noEmit` over frontend, backend and shared |
| `npm run lint` / `lint:fix` | ESLint 9 flat config |

---

## Configuration (.env)

All configuration lives in `.env` at the project root. The template is `.env.example`.

| Variable | Default | Purpose |
|---|---|---|
| `LLM_PROVIDER` | `groq` | `groq`, `gemini`, `openrouter`, `openai` or `none` |
| `GROQ_API_KEY` | empty | Free key from https://console.groq.com/keys |
| `GEMINI_API_KEY` | empty | Free key from https://aistudio.google.com/apikey |
| `OPENROUTER_API_KEY` | empty | Free key from https://openrouter.ai/keys |
| `OPENAI_API_KEY` | empty | Paid key from https://platform.openai.com/api-keys |
| `LLM_MODEL` | provider default | Override the model name |
| `SAFE_BROWSING_API_KEY` | empty | Optional Google Safe Browsing Lookup API key |
| `PORT` | `3001` | Backend port |

### Which free LLM to use

Researched October 2026. Free tiers change, so check each dashboard.

| Provider | Free tier | Default model |
|---|---|---|
| **Groq (recommended)** | No card. About 1,000 requests a day, 30 a minute. Very fast. | `openai/gpt-oss-120b` |
| Gemini | No card. Flash models only. Limits shown in AI Studio. | `gemini-2.5-flash` |
| OpenRouter | `:free` models. 50 requests a day, 1,000 after a $10 top-up. | `openai/gpt-oss-20b:free` |
| OpenAI | Paid | `gpt-4o-mini` |

Groq retired its Llama 3.3 and 3.1 models on 16 August 2026. If a default model
disappears, set `LLM_MODEL`.

If no key is set, or the key fails, the app runs in **rules-only mode**. The
header badge shows `AI: off (rules only)`. Everything still works.

---

## Project structure

All frontend code is in `frontend/`. All backend code is in `BE/`. Tooling,
`node_modules`, lint and type config stay at the root.

```
TrustCheck/
├── frontend/                       React 19 + Vite 7 + TypeScript
│   ├── index.html
│   └── src/
│       ├── main.tsx                React entry
│       ├── App.tsx                 page state: mode, result, selection, history
│       ├── styles.css              design tokens, 3-column layout, light/dark
│       ├── components/
│       │   ├── ModeSwitch.tsx      Scam check / AI-writing check toggle
│       │   ├── MessageInput.tsx    textarea, screenshot upload (OCR), Analyze
│       │   ├── Report.tsx          middle column: meter + nav + evidence
│       │   ├── RiskMeter.tsx       0-100 bar with bands
│       │   ├── HighlightedMessage.tsx  message with clickable highlights
│       │   ├── EvidenceList.tsx    compact signal rows
│       │   ├── LinksPanel.tsx      compact link rows (scam mode)
│       │   ├── DetailPanel.tsx     right column: whatever is selected
│       │   ├── NextSteps.tsx       checklist + copyable questions
│       │   ├── HistoryPanel.tsx    left column
│       │   ├── PredictGate.tsx     "predict first" judge mode
│       │   └── Footer.tsx          brand + contact (LinkedIn, email, WhatsApp)
│       └── lib/
│           ├── api.ts              typed fetch wrapper for /api
│           ├── ocr.ts              tesseract.js in the browser
│           ├── format.ts           labels and all mode-specific wording
│           └── selection.ts        what the right panel is showing
│
├── BE/                             Express 5 + TypeScript (run with tsx)
│   ├── src/
│   │   ├── server.ts               Express app; serves dist/ in production
│   │   ├── config.ts               .env loading, provider presets
│   │   ├── analyze.ts              pipeline orchestrator + cache
│   │   ├── urlcheck.ts             URL extraction, heuristics, Safe Browsing
│   │   ├── rules/
│   │   │   ├── signals.ts          scam rules (regex + weight + texts)
│   │   │   └── index.ts            scam scorer, link signal, combo bonuses
│   │   ├── airules/
│   │   │   ├── signals.ts          AI-writing pattern rules + human signals
│   │   │   ├── stats.ts            burstiness, paragraph and register statistics
│   │   │   └── index.ts            AI scorer, combo bonuses, short-text cap
│   │   ├── llm/
│   │   │   ├── client.ts           OpenAI-compatible chat client (no SDK)
│   │   │   └── explain.ts          prompts per mode, JSON parsing, fallbacks
│   │   ├── routes/api.ts           REST endpoints
│   │   ├── db.ts                   history in node:sqlite, in-memory fallback
│   │   └── samples.ts              demo texts A-D (scam), E-G (AI)
│   └── data/trustcheck.db          created at runtime, git-ignored
│
├── shared/types.ts                 types used by both sides
├── how-it-works.html               interactive architecture explorer
├── package.json  tsconfig.json  eslint.config.js  vite.config.ts
├── .env  .env.example  .gitignore
└── dist/                           production build output
```

---

## Architecture

```
 ┌──────────────┐   paste / screenshot (OCR in browser) / sample
 │   Student    │──────────────────────────────────────────────┐
 └──────────────┘                                              ▼
                                                   ┌──────────────────────┐
                                                   │ Frontend (React)     │
                                                   │ ModeSwitch + Input   │
                                                   └──────────┬───────────┘
                                         POST /api/analyze {message, mode}
                                                              ▼
                                                   ┌──────────────────────┐
                                                   │ Express API          │
                                                   │ validate 10-8000 ch  │
                                                   └──────────┬───────────┘
                                                              ▼
                                                   ┌──────────────────────┐
                                                   │ analyze.ts           │
                                                   │ cache lookup (sha1)  │
                                                   └───┬──────────────┬───┘
                                        mode = scam    │              │   mode = ai
                              ┌────────────────────────▼─┐        ┌───▼──────────────────────┐
                              │ urlcheck → link verdicts │        │ AI pattern rules         │
                              │ scam rules (regex)       │        │ statistics (burstiness)  │
                              │ link signal + bonuses    │        │ human counter-signals    │
                              │ score curve → level      │        │ bonuses, short-text cap  │
                              └────────────┬─────────────┘        └────────────┬─────────────┘
                                           └──────────────┬────────────────────┘
                                                          ▼
                                               ┌──────────────────────┐
                                               │ LLM explain (opt.)   │
                                               │ mode-specific prompt │
                                               │ JSON → merge texts   │
                                               │ fail → rule fallback │
                                               └──────────┬───────────┘
                                                          ▼
                                               ┌──────────────────────┐
                                               │ AnalysisResult       │
                                               │ → SQLite history     │
                                               └──────────┬───────────┘
                                                          ▼
                     ┌────────────────┬──────────────────────────────┬────────────────────┐
                     │ History (left) │ Meter, highlights, evidence  │ Detail panel       │
                     │                │ rows, links (middle)         │ (right)            │
                     └────────────────┴──────────────────────────────┴────────────────────┘
```

**Key point.** The score is computed before the LLM is called. The LLM receives
the detected signals and may only rewrite their explanations, lessons, steps and
questions. Its extra observations are shown separately and never scored.

---

## Scam check: how it decides

Source: `BE/src/rules/signals.ts`, `BE/src/rules/index.ts`, `BE/src/urlcheck.ts`.

### 1. Link check

URLs are extracted with positions so they can be highlighted. Scheme-less
matches count only if they end in a known TLD, so `B.Tech` or `8.5` are not
treated as links. Email addresses and UPI IDs are skipped.

| Heuristic | Effect |
|---|---|
| Shortener (bit.ly, tinyurl, cutt.ly …) | +2 suspicion |
| Raw IP address | +2 |
| Abused TLD (.xyz, .top, .club, .tk, .site, .online …) | +1 |
| Trust words in domain (verify, official, secure, kyc, claim …) | +1 |
| 3 or more sub-domain labels | +1 |
| Plain `http://` | +1 |
| `.ac.in`, `.edu`, `.gov.in`, `.nic.in`, `.gov`, `.res.in` with no suspicion | likely official |

Verdict: any suspicion gives **suspicious**, none gives **unverified**, a Safe
Browsing match gives **flagged**. Unknown is never treated as safe.

### 2. Rules

Each rule is a set of regexes with a fixed weight, a default explanation, a
lesson and a verification tip.

| Rule | Severity | Weight | Triggers on |
|---|---|---|---|
| Upfront payment | High | +30 | "pay … fee", "verification fee", "₹499" |
| Sensitive information | High | +20 | Aadhaar, PAN, OTP, CVV, UPI PIN, bank details |
| Artificial urgency | High | +15 | "within 15 minutes", "within 2 days", "urgent", "will be cancelled", "limited seats" |
| Untraceable payment | High | +15 | UPI apps, personal UPI IDs, gift cards, crypto |
| Unofficial contact | Medium | +12 | Gmail / Yahoo addresses, "WhatsApp only", t.me, wa.me |
| Too good to be true | Medium | +10 | 2+ of "congratulations", "you have been selected", "guaranteed", "no interview" |
| "Refundable" fee | Medium | +8 | "refundable", "will be refunded" |
| Authority name | Medium | +8 | Ministry, UGC, AICTE, NSP, RBI, "PM Yojana" |
| Secrecy | Medium | +8 | "do not share", "keep this confidential" |
| Generic greeting | Low | +4 | "Dear student / candidate / user" |
| Shouting | Info | +2 | 2+ of `!!` or ALL-CAPS words |
| Link signal | from verdict | +6 / +12 / +30 | unverified / suspicious / flagged |
| Official domain | Positive | −15 | .ac.in, .edu, .gov.in … |
| "No fee" stated | Positive | −10 | "no application fee", "free of cost" |
| Named contact | Positive | −8 | Dean, Registrar, Coordinator, Dr., Prof. |
| Dated deadline | Positive | −5 | "last date … 30 November" |

**Combination bonuses**, +8 each: payment with urgency, payment with untraceable
channel, sensitive data with a link, authority name with payment.

### 3. Score

```
raw   = max(0, sum(weights) + bonuses)
score = round(100 × (1 − e^(−raw / 55)))      // diminishing returns
level = score < 30 → Low,  30–59 → Medium,  ≥ 60 → High
```

The curve stops every scam from pinning at 100 and keeps the meter informative.

---

## AI-writing check: how it decides

Source: `BE/src/airules/`. Pattern rules come from Wikipedia's *Signs of AI
writing* field guide (WikiProject AI Cleanup) and common detector write-ups.

### Pattern rules

Each rule adds points per match, up to a cap.

| Signal | Severity | Per match / cap | Examples |
|---|---|---|---|
| Chatbot artifact | High | +25 / 35 | "As an AI language model", "I hope this helps", "Certainly!" |
| Citation markup | High | +30 / 30 | `oaicite`, `contentReference`, `utm_source=chatgpt` |
| AI vocabulary (2+) | Medium | +4 / 20 | delve, tapestry, testament, pivotal, foster, leverage, robust |
| Inflated significance | Medium | +6 / 18 | "stands as a testament", "plays a vital role" |
| Chat formatting | Medium | +6 / 18 | `**bold:**`, `## headers`, emoji bullets, `---` |
| Negative parallelism | Medium | +6 / 12 | "not only … but also", "it's not just X, it's Y" |
| Copula avoidance (2+) | Low | +3 / 12 | "serves as", "boasts", "encompasses" |
| Formulaic transitions (2+) | Low | +3 / 12 | Additionally, Furthermore, Moreover |
| Formulaic conclusion | Low | +6 / 12 | "In conclusion", "Looking ahead" |
| Em dashes (2+) | Low | +3 / 12 | — |
| Vague authorities | Low | +5 / 10 | "experts argue", "studies show" |
| Adjective triplets (2+) | Low | +3 / 9 | "innovative, scalable, and sustainable" |
| Hedged balance (2+) | Info | +3 / 9 | "it is important to note", "on the other hand" |
| Curly quotes (3+) | Info | +2 / 6 | “ ” ‘ ’ |

### Statistics (`stats.ts`)

| Signal | Condition | Weight |
|---|---|---|
| Very uniform sentence length | burstiness (CV of sentence length) < 0.30, 5+ sentences | +18 |
| Fairly uniform sentence length | CV < 0.45 | +9 |
| Bursty rhythm | CV > 0.70 | −10 |
| Evenly sized paragraphs | 3+ paragraphs, CV < 0.25 | +8 |
| Every sentence opens differently | 8+ sentences, >90% distinct first words | +6 |
| No contractions | 120+ words, zero contractions | +7 |
| No first person | 120+ words, no I / my / we | +5 |
| Too short | under 50 words | info, caps the score |

### Human counter-signals (negative)

| Signal | Per match / cap | Examples |
|---|---|---|
| Slang and Hinglish | −4 / −12 | lol, tbh, idk, yaar, bhai, nahi |
| Typos and messy punctuation | −3 / −12 | lower-case "i", space before comma, "recieve" |
| Concrete personal detail | −3 / −9 | "my roommate", "yesterday", "at 2pm", "sem 4" |
| Contractions (2+) | −1 / −8 | don't, I'm, gonna |
| Emotional punctuation | −3 / −6 | `!!`, `:)`, haha |

**Bonuses:** vocabulary with inflated significance +8, uniform rhythm with
formulaic transitions +8, chat formatting with a formulaic conclusion +6.

**Score** uses the same curve and bands. Labels are *Likely human*,
*Uncertain* and *Likely AI-assisted*. Texts under 50 words are capped at 45
unless a chatbot or citation artifact is present.

**This mode is a conversation starter, not a detector.** Formal, edited or
non-native human writing triggers many of these cues. The next steps in this
mode are about asking the writer, never accusing them.

---

## The LLM layer

Source: `BE/src/llm/`.

- **One client for every provider.** Groq, Gemini, OpenRouter and OpenAI all
  expose an OpenAI-compatible `/chat/completions` endpoint, so there is no SDK.
- **Settings:** temperature 0.2, max 900 tokens, `response_format: json_object`, 25-second timeout.
- **Two system prompts.** The scam prompt says "explain, do not decide". The AI
  prompt also forbids verdicts and requires a false-positive warning.
- **Input:** the text, up to 4,000 characters, plus the detected signal IDs and
  matched snippets, plus link verdicts in scam mode.
- **Output JSON:** `summary`, `evidence{id}`, `lessons{id}`, `verificationSteps[]`,
  `checklistQuestions[]`, `aiObservations[]`, `uncertainty`.
- **Validation.** Every field is type-checked. A missing field falls back to the rule text.
- **Fallback.** Any error, timeout or bad JSON returns the rule-written
  explanation. The error is shown in small print, not as a failure.
- **Cache.** Results with a successful LLM call are cached in memory by
  `sha1(mode:provider:model:text)`. Repeat demo runs do not use quota.

---

## API reference

Base URL: `http://localhost:3001/api`. The Vite dev server proxies `/api`.

| Method | Path | Body / query | Returns |
|---|---|---|---|
| GET | `/health` | none | `{ ok, llm: {provider, model, enabled}, safeBrowsing, history }` |
| GET | `/samples` | `?mode=scam\|ai` | `SampleMessage[]` |
| POST | `/analyze` | `{ message, mode?: 'scam'\|'ai', save?: boolean }` | `AnalysisResult` |
| GET | `/history` | `?mode=scam\|ai&limit=20` | `HistoryItem[]` |
| GET | `/history/:id` | none | `AnalysisResult` |
| DELETE | `/history` | none | `{ ok: true }` |

`/analyze` rejects messages under 10 or over 8,000 characters with HTTP 400.

```bash
curl -X POST localhost:3001/api/analyze \
  -H 'content-type: application/json' \
  -d '{"mode":"scam","message":"Pay ₹499 fee within 15 minutes to claim your scholarship"}'
```

Main result type, from `shared/types.ts`:

```ts
interface AnalysisResult {
  id: string; createdAt: string; mode: 'scam' | 'ai'; message: string;
  score: number; level: 'low' | 'medium' | 'high'; summary: string;
  signals: Signal[];            // id, title, severity, weight, spans[], explanation, lesson, verification
  links: LinkCheck[];           // scam mode only
  verificationSteps: string[]; checklistQuestions: string[];
  aiObservations: string[]; uncertainty: string;
  llm: { used: boolean; provider: string; model: string | null; error?: string };
}
```

---

## Frontend

- **Layout.** The header and three columns fill exactly one viewport. Only the
  middle column scrolls. The footer sits below the fold. Under 1000px the page
  becomes one normal scrolling column.
- **Selection model.** `lib/selection.ts` holds what the right panel shows:
  `summary`, `signal`, `link`, `steps` or `questions`. Clicking an evidence row,
  a highlight, a link row or a nav button sets it.
- **Mode wording.** Every label that differs between modes lives in `MODE_TEXT`
  in `lib/format.ts`. AI mode also switches the accent colour to violet.
- **Highlighting.** `HighlightedMessage` merges all spans, skips overlaps and
  links each `<mark>` back to its signal. Hover dims the others.
- **OCR.** `lib/ocr.ts` calls tesseract.js with English data, about 4 MB on first use.
- **Theming.** CSS custom properties with a `prefers-color-scheme: dark` override.

---

## Data and privacy

- History is stored locally in `BE/data/trustcheck.db`. The file is git-ignored.
  Clear it from the History panel or with `DELETE /api/history`.
- OCR runs in the browser. Screenshots are never uploaded.
- With an LLM key, message text is sent to that provider. Free tiers may use
  prompts for training. Remove personal details before testing with real messages.
- With no key, nothing leaves your machine except an optional Safe Browsing lookup.

---

## Demo script

Turn on **Predict first** in the header. Ask the room to guess before each reveal.

**Scam check**

| Sample | What it shows | Result |
|---|---|---|
| A. Obvious scam | Fee, 15-minute deadline, UPI, Aadhaar, secrecy | High (96) |
| B. Legitimate notice | .ac.in portal, named coordinator, no fee, dated deadline | Low (0) |
| C. Sophisticated scam | Polished offer letter, refundable training fee, PAN, Gmail | High (88) |
| D. Grey area | No fee, but bit.ly, Gmail and a 3-day window | Medium (41) |

**AI-writing check**

| Sample | What it shows | Result |
|---|---|---|
| E. AI-style essay | Vocabulary, "testament", triplets, "In conclusion", even rhythm | Likely AI (92) |
| F. Human WhatsApp message | Typos, Hinglish, personal detail | Likely human (0) |
| G. Polished human report | Formal but concrete | Uncertain (35) |

Sample G is the key talking point. Formal human writing looks borderline, which
is why the tool never accuses. Scores above are rules-only. With an LLM, the
scores stay the same and only the explanations change.

---

## Extending

**Add a scam rule.** Append an object to `RULES` in `BE/src/rules/signals.ts`
with `id`, `title`, `severity`, `weight`, `patterns`, `explanation`, `lesson`,
`verification`, and optionally `minMatches`.

**Add an AI-writing rule.** Append to `AI_RULES` in `BE/src/airules/signals.ts`
with `perMatch` and `maxWeight` instead of `weight`. Use negative values for
human signals.

**Add a statistic.** Push a `Signal` with empty `spans` from `runAiStats` in
`BE/src/airules/stats.ts`.

**Add a provider.** Add a preset to `PROVIDERS` in `BE/src/config.ts`. Any
OpenAI-compatible endpoint works.

The frontend needs no change for any of these. It renders whatever signals and
spans the backend returns.

---

## Limitations

- Text analysis cannot confirm who sent a message or whether an organisation exists.
- Regex rules can be evaded by a scammer who avoids the trigger phrases.
- Link reputation without a Safe Browsing key is heuristic only.
- AI-writing detection by style is inherently unreliable, in both directions.
- Rules are English-first. Hinglish appears only as human signals in AI mode.
- OCR quality depends on the screenshot. Pasted text is the most reliable input.
- Scores are illustrative and not calibrated probabilities.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Header says `AI: off (rules only)` | Add a key to `.env` and check `LLM_PROVIDER` matches it. The backend restarts on save. |
| Small print shows `groq 404` or `model not found` | The model was retired. Set `LLM_MODEL` to a current one. |
| `groq 429` | Free-tier rate limit. Wait a minute. Cached repeats do not count. |
| `node:sqlite unavailable` warning | Node is older than 22.5. History falls back to memory. Upgrade Node. |
| Port 3001 or 5173 already in use | `pkill -f concurrently` or change `PORT` in `.env`. |
| OCR is slow the first time | It downloads English language data once, about 4 MB. |

---

## Contact

Built by **Ashad Abbas** as a college hackathon project.

- LinkedIn: https://www.linkedin.com/in/ashad-abbas/
- Email: abbasashad15@gmail.com
- WhatsApp: +91 8535097644

---

### References

- Wikipedia, *Signs of AI writing*: https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing
- Groq model deprecations: https://console.groq.com/docs/deprecations
- OpenRouter, free LLM APIs compared: https://openrouter.ai/blog/tutorials/free-llm-apis-compared/
- Google Safe Browsing Lookup API: https://developers.google.com/safe-browsing/v4/lookup-api
