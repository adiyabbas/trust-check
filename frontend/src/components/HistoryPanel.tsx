import type { HistoryItem } from '@shared/types';
import { formatTime, levelLabel } from '../lib/format';

interface Props {
  items: HistoryItem[];
  onSelect: (id: string) => void;
  onClear: () => void;
  selectedId: string | null;
}

export function HistoryPanel({ items, onSelect, onClear, selectedId }: Props) {
  return (
    <aside className="card history">
      <div className="card-head">
        <h3>History</h3>
        {items.length > 0 && (
          <button type="button" className="btn link small" onClick={onClear}>
            Clear
          </button>
        )}
      </div>
      {items.length === 0 && <p className="muted">Analysed messages appear here.</p>}
      <ul>
        {items.map((h) => (
          <li key={h.id}>
            <button type="button" className={`history-item ${selectedId === h.id ? 'active' : ''}`} onClick={() => onSelect(h.id)}>
              <span className={`dot level-${h.level}`} aria-hidden />
              <span className="history-text">
                <span className="history-preview">{h.preview || '(empty)'}</span>
                <span className="muted">
                  {levelLabel(h.mode, h.level)} · {h.score}/100 · {formatTime(h.createdAt)}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
