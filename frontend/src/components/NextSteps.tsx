import { useState } from 'react';

interface Props {
  steps: string[];
  questions: string[];
  observations: string[];
  uncertainty: string;
  stepsTitle?: string;
  questionsTitle?: string;
  questionsHint?: string;
}

export function NextSteps({ steps, questions, observations, uncertainty, stepsTitle = 'Recommended next steps', questionsTitle = 'Questions to ask the provider', questionsHint = 'Use contact details you found yourself, not the ones in the message.' }: Props) {
  const [done, setDone] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);

  function toggle(i: number) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  async function copyChecklist() {
    const text = ['Questions to ask the provider before responding:', ...questions.map((q, i) => `${i + 1}. ${q}`)].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div>
      {steps.length > 0 && (
        <>
          <div className="detail-head">
            <h3>{stepsTitle}</h3>
          </div>
          <ol className="steps">
            {steps.map((s, i) => (
              <li key={i} className={done.has(i) ? 'done' : ''}>
                <label>
                  <input type="checkbox" checked={done.has(i)} onChange={() => toggle(i)} /> <span>{s}</span>
                </label>
              </li>
            ))}
          </ol>
        </>
      )}

      {questions.length > 0 && (
        <>
          <div className="detail-head">
            <h3>{questionsTitle}</h3>
            <button type="button" className="btn ghost small" onClick={copyChecklist}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="muted">{questionsHint}</p>
          <ol className="questions">
            {questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ol>
        </>
      )}

      {observations.length > 0 && (
        <>
          <h4 className="subhead">AI observations (not scored)</h4>
          <ul className="questions">
            {observations.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </>
      )}

      <p className="uncertainty">
        <strong>What this analysis cannot tell you:</strong> {uncertainty}
      </p>
    </div>
  );
}
