import type { AnalysisResult } from '@shared/types';
import type { Selection } from '../lib/selection';
import { EvidenceList } from './EvidenceList';
import { HighlightedMessage } from './HighlightedMessage';
import { LinksPanel } from './LinksPanel';
import { RiskMeter } from './RiskMeter';
import { MODE_TEXT } from '../lib/format';

interface Props {
  result: AnalysisResult;
  selection: Selection;
  onSelect: (s: Selection) => void;
  activeId: string | null;
  onHover: (id: string | null) => void;
}

/** Middle column: overview + clickable navigation. Details render in the right panel. */
export function Report({ result, selection, onSelect, activeId, onHover }: Props) {
  const t = MODE_TEXT[result.mode];
  const selectedSignal = selection.kind === 'signal' ? selection.id : null;
  const selectedUrl = selection.kind === 'link' ? selection.url : null;

  return (
    <div className="report">
      <div className="card summary-card">
        <RiskMeter score={result.score} level={result.level} mode={result.mode} />
        <div className="section-nav">
          <button type="button" className={`btn ghost small ${selection.kind === 'summary' ? 'selected' : ''}`} onClick={() => onSelect({ kind: 'summary' })}>
            Summary
          </button>
          <button type="button" className={`btn ghost small ${selection.kind === 'steps' ? 'selected' : ''}`} onClick={() => onSelect({ kind: 'steps' })}>
            {t.stepsTitle}
          </button>
          <button type="button" className={`btn ghost small ${selection.kind === 'questions' ? 'selected' : ''}`} onClick={() => onSelect({ kind: 'questions' })}>
            {t.questionsTitle}
          </button>
        </div>
      </div>

      <HighlightedMessage message={result.message} signals={result.signals.filter((sg) => sg.spans.length > 0)} activeId={activeId} onHover={onHover} onSelect={(id) => onSelect({ kind: 'signal', id })} />
      <EvidenceList signals={result.signals} activeId={activeId} selectedId={selectedSignal} onHover={onHover} onSelect={(id) => onSelect({ kind: 'signal', id })} mode={result.mode} />
      <LinksPanel links={result.links} selectedUrl={selectedUrl} onSelect={(url) => onSelect({ kind: 'link', url })} />
    </div>
  );
}
