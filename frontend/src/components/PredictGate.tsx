import type { AnalysisMode, RiskLevel } from '@shared/types';
import { MODE_TEXT, levelLabel } from '../lib/format';

interface Props {
  mode: AnalysisMode;
  onPick: (level: RiskLevel) => void;
}

/** "Judge mode": ask the audience to predict the outcome before revealing it. */
export function PredictGate({ mode, onPick }: Props) {
  return (
    <div className="card predict">
      <h3>Before we reveal the result…</h3>
      <p className="muted">{MODE_TEXT[mode].predictQuestion}</p>
      <div className="predict-buttons">
        {(['low', 'medium', 'high'] as RiskLevel[]).map((l) => (
          <button key={l} type="button" className={`btn level-btn level-${l}`} onClick={() => onPick(l)}>
            {levelLabel(mode, l)}
          </button>
        ))}
      </div>
    </div>
  );
}
