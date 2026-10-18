import { Fragment, useMemo } from 'react';
import type { Signal } from '@shared/types';

interface Props {
  message: string;
  signals: Signal[];
  activeId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}

interface Piece {
  text: string;
  signalId?: string;
  severity?: Signal['severity'];
  negative?: boolean;
}

export function HighlightedMessage({ message, signals, activeId, onHover, onSelect }: Props) {
  const pieces = useMemo<Piece[]>(() => {
    const marks: { start: number; end: number; id: string; severity: Signal['severity']; negative: boolean }[] = [];
    for (const s of signals) for (const sp of s.spans) marks.push({ start: sp.start, end: sp.end, id: s.id, severity: s.severity, negative: s.weight < 0 });
    marks.sort((a, b) => a.start - b.start || b.end - a.end);

    const out: Piece[] = [];
    let cursor = 0;
    for (const m of marks) {
      if (m.start < cursor) continue;
      if (m.start > cursor) out.push({ text: message.slice(cursor, m.start) });
      out.push({ text: message.slice(m.start, m.end), signalId: m.id, severity: m.severity, negative: m.negative });
      cursor = m.end;
    }
    if (cursor < message.length) out.push({ text: message.slice(cursor) });
    return out;
  }, [message, signals]);

  return (
    <div className="card">
      <div className="card-head">
        <h3>Where the evidence is</h3>
        <span className="muted">Click a highlight for details</span>
      </div>
      <pre className="message-view">
        {pieces.map((p, i) =>
          p.signalId ? (
            <mark
              key={i}
              className={`hl sev-${p.severity} ${p.negative ? 'positive' : ''} ${activeId === p.signalId ? 'active' : ''} ${activeId && activeId !== p.signalId ? 'dim' : ''}`}
              onMouseEnter={() => onHover(p.signalId!)}
              onMouseLeave={() => onHover(null)}
              onClick={() => onSelect(p.signalId!)}
              title={signals.find((s) => s.id === p.signalId)?.title}
            >
              {p.text}
            </mark>
          ) : (
            <Fragment key={i}>{p.text}</Fragment>
          ),
        )}
      </pre>
    </div>
  );
}
