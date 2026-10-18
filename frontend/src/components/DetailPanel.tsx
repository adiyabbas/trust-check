import type { AnalysisMode, AnalysisResult, SampleMessage } from '@shared/types';
import { MODE_TEXT, SEVERITY_LABEL, VERDICT_LABEL, levelLabel } from '../lib/format';
import type { Selection } from '../lib/selection';
import { NextSteps } from './NextSteps';

interface Props {
  result: AnalysisResult | null;
  selection: Selection;
  educationMode: boolean;
  onSelect: (s: Selection) => void;
  samples: SampleMessage[];
  onLoadSample: (text: string) => void;
  mode: AnalysisMode;
}

/** Right column: shows whatever is selected in the middle column. */
export function DetailPanel({ result, selection, educationMode, onSelect, samples, onLoadSample, mode }: Props) {
  const t = MODE_TEXT[mode];
  if (!result) {
    return (
      <aside className="card detail intro">
        <h3>{t.name}</h3>
        <p>{t.introLead}</p>
        <ol className="how">
          {mode === 'scam' ? (
            <>
              <li>
                <strong>Input.</strong> Paste the text or upload a screenshot (OCR runs in your browser).
              </li>
              <li>
                <strong>Transparent rules</strong> detect known warning signs and compute the risk score.
              </li>
              <li>
                <strong>AI explains</strong> why each sign matters in this message. It never sets the score.
              </li>
              <li>
                <strong>Risk report</strong> with evidence, uncertainty and safe verification steps.
              </li>
            </>
          ) : (
            <>
              <li>
                <strong>Pattern rules</strong> look for documented AI habits: overused words, "stands as a testament", "not just X but Y", formulaic transitions, chat formatting.
              </li>
              <li>
                <strong>Statistics</strong> measure sentence-length variation (burstiness), paragraph uniformity and register.
              </li>
              <li>
                <strong>Human signals</strong> such as slang, typos, contractions and personal detail lower the score.
              </li>
              <li>
                <strong>Result</strong> is a likelihood cue with questions to ask the writer. It is never proof.
              </li>
            </>
          )}
        </ol>
        {samples.length > 0 && (
          <>
            <h4 className="subhead">Try a sample</h4>
            <ul className="evidence-nav">
              {samples.map((smp) => (
                <li key={smp.id}>
                  <button type="button" className="evidence-row link-row" title={smp.description} onClick={() => onLoadSample(smp.text)}>
                    <span className="evidence-row-title">{smp.label}</span>
                    <span className="chevron" aria-hidden>
                      ›
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </aside>
    );
  }

  switch (selection.kind) {
    case 'signal': {
      const s = result.signals.find((x) => x.id === selection.id);
      if (!s) return <Empty onBack={() => onSelect({ kind: 'summary' })} />;
      const positive = s.weight < 0;
      return (
        <aside className={`card detail sev-${s.severity} ${positive ? 'positive' : ''}`}>
          <Back onBack={() => onSelect({ kind: 'summary' })} />
          <div className="detail-head">
            <span className={`dot sev-${s.severity} ${positive ? 'positive' : ''}`} aria-hidden />
            <h3>{s.title}</h3>
          </div>
          <p className={`pill inline sev-${positive ? 'positive' : s.severity}`}>{positive ? 'Positive sign' : `${SEVERITY_LABEL[s.severity]} severity`}</p>
          <h4 className="subhead">Why it matters</h4>
          <p>{s.explanation}</p>
          {s.spans.length > 0 && (
            <>
              <h4 className="subhead">Matched in the message</h4>
              <ul className="matched-list">
                {s.spans.slice(0, 8).map((sp, i) => (
                  <li key={i}>
                    <code>{sp.text}</code>
                  </li>
                ))}
                {s.spans.length > 8 && <li className="muted">+{s.spans.length - 8} more</li>}
              </ul>
            </>
          )}
          {educationMode && (
            <div className="lesson">
              <span className="lesson-tag">Lesson</span> {s.lesson}
            </div>
          )}
          <h4 className="subhead">How to verify</h4>
          <p className="verify">{s.verification}</p>
        </aside>
      );
    }
    case 'link': {
      const l = result.links.find((x) => x.url === selection.url);
      if (!l) return <Empty onBack={() => onSelect({ kind: 'summary' })} />;
      return (
        <aside className="card detail">
          <Back onBack={() => onSelect({ kind: 'summary' })} />
          <div className="detail-head">
            <h3>Link check</h3>
            <span className={`badge verdict-${l.verdict}`}>{VERDICT_LABEL[l.verdict]}</span>
          </div>
          <p>
            <code className="domain">{l.url}</code>
          </p>
          <h4 className="subhead">What we noticed</h4>
          <ul className="reasons">
            {l.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
          <h4 className="subhead">What to do</h4>
          <p className="verify">Do not open it from the message. Search for the organisation yourself and compare the domain character by character.</p>
        </aside>
      );
    }
    case 'steps':
      return (
        <aside className="card detail">
          <Back onBack={() => onSelect({ kind: 'summary' })} />
          <NextSteps steps={result.verificationSteps} questions={[]} observations={result.aiObservations} uncertainty={result.uncertainty} stepsTitle={result.mode === 'ai' ? 'How to use this result' : 'Recommended next steps'} />
        </aside>
      );
    case 'questions':
      return (
        <aside className="card detail">
          <Back onBack={() => onSelect({ kind: 'summary' })} />
          <NextSteps steps={[]} questions={result.checklistQuestions} observations={[]} uncertainty={result.uncertainty} questionsTitle={result.mode === 'ai' ? 'Questions for the writer' : 'Questions to ask the provider'} questionsHint={MODE_TEXT[result.mode].questionsHint} />
        </aside>
      );
    case 'summary':
    default:
      return (
        <aside className={`card detail level-${result.level}`}>
          <div className="detail-head">
            <h3>Summary</h3>
            <span className={`badge level-${result.level}`}>{levelLabel(result.mode, result.level)}</span>
          </div>
          <p className="summary">{result.summary}</p>
          <p className="llm-note muted">
            {result.llm.used
              ? `Explanations by ${result.llm.provider} (${result.llm.model}). The score comes from transparent rules only.`
              : `Rules-only mode: AI explanations unavailable${result.llm.error ? ` (${result.llm.error})` : ''}.`}
          </p>
          <h4 className="subhead">At a glance</h4>
          <ul className="glance">
            <li>
              {result.signals.filter((s) => s.weight > 0).length} {result.mode === 'ai' ? 'AI-style signal' : 'warning sign'}
              {result.signals.filter((s) => s.weight > 0).length === 1 ? '' : 's'}
            </li>
            <li>
              {result.signals.filter((s) => s.weight < 0).length} {result.mode === 'ai' ? 'human-writing signals' : 'legitimacy indicators'}
            </li>
            {result.mode === 'scam' && (
              <li>
                {result.links.length} link{result.links.length === 1 ? '' : 's'} checked
              </li>
            )}
          </ul>
          <div className="section-nav">
            <button type="button" className="btn primary small" onClick={() => onSelect({ kind: 'steps' })}>
              {MODE_TEXT[result.mode].stepsTitle}
            </button>
            <button type="button" className="btn ghost small" onClick={() => onSelect({ kind: 'questions' })}>
              {MODE_TEXT[result.mode].questionsTitle}
            </button>
          </div>
          <p className="uncertainty">
            <strong>What this cannot tell you:</strong> {result.uncertainty}
          </p>
          <p className="muted">Click any evidence row, highlight or link in the middle column to see details here.</p>
        </aside>
      );
  }
}

function Back({ onBack }: { onBack: () => void }) {
  return (
    <button type="button" className="btn link small back" onClick={onBack}>
      ‹ Summary
    </button>
  );
}

function Empty({ onBack }: { onBack: () => void }) {
  return (
    <aside className="card detail">
      <Back onBack={onBack} />
      <p className="muted">Nothing selected.</p>
    </aside>
  );
}
