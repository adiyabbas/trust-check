import type { AnalysisMode, Signal } from '@shared/types';
import { MODE_TEXT, SEVERITY_LABEL } from '../lib/format';

interface Props {
  signals: Signal[];
  activeId: string | null;
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  mode: AnalysisMode;
}

/** Compact, clickable list. Full explanation opens in the detail panel. */
export function EvidenceList({ signals, activeId, selectedId, onHover, onSelect, mode }: Props) {
  const t = MODE_TEXT[mode];
  const warnings = signals.filter((s) => s.weight >= 0);
  const positives = signals.filter((s) => s.weight < 0);

  return (
    <div className="card">
      <div className="card-head">
        <h3>{t.evidenceTitle}</h3>
        <span className="muted">
          {warnings.length} signal{warnings.length === 1 ? '' : 's'} · {positives.length} positive
        </span>
      </div>
      {warnings.length === 0 && <p className="muted">{t.evidenceEmpty}</p>}
      <ul className="evidence-nav">
        {warnings.map((s) => (
          <Row key={s.id} s={s} active={activeId === s.id} selected={selectedId === s.id} onHover={onHover} onSelect={onSelect} />
        ))}
      </ul>
      {positives.length > 0 && (
        <>
          <h4 className="subhead">{t.positiveTitle}</h4>
          <ul className="evidence-nav">
            {positives.map((s) => (
              <Row key={s.id} s={s} active={activeId === s.id} selected={selectedId === s.id} onHover={onHover} onSelect={onSelect} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function Row({ s, active, selected, onHover, onSelect }: { s: Signal; active: boolean; selected: boolean; onHover: (id: string | null) => void; onSelect: (id: string) => void }) {
  const positive = s.weight < 0;
  return (
    <li>
      <button
        type="button"
        className={`evidence-row sev-${s.severity} ${positive ? 'positive' : ''} ${active ? 'active' : ''} ${selected ? 'selected' : ''}`}
        onMouseEnter={() => onHover(s.id)}
        onMouseLeave={() => onHover(null)}
        onClick={() => onSelect(s.id)}
        aria-pressed={selected}
      >
        <span className={`dot sev-${s.severity} ${positive ? 'positive' : ''}`} aria-hidden />
        <span className="evidence-row-title">{s.title}</span>
        <span className={`pill sev-${positive ? 'positive' : s.severity}`}>{positive ? 'Positive' : SEVERITY_LABEL[s.severity]}</span>
        <span className="chevron" aria-hidden>
          ›
        </span>
      </button>
    </li>
  );
}
