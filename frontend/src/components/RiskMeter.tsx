import type { AnalysisMode, RiskLevel } from '@shared/types';
import { MODE_TEXT, levelLabel } from '../lib/format';

export function RiskMeter({ score, level, mode }: { score: number; level: RiskLevel; mode: AnalysisMode }) {
  const t = MODE_TEXT[mode];
  return (
    <div className={`risk-meter level-${level}`}>
      <div className="risk-head">
        <h3>{t.meterTitle}</h3>
        <span className={`badge level-${level}`}>{levelLabel(mode, level)}</span>
      </div>
      <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score} aria-label={t.meterTitle}>
        <div className="meter-fill" style={{ width: `${score}%` }} />
        <span className="meter-tick" style={{ left: '30%' }} />
        <span className="meter-tick" style={{ left: '60%' }} />
      </div>
      <div className="meter-labels">
        <span>Score {score}/100</span>
        <span className="muted">{t.meterNote}</span>
      </div>
    </div>
  );
}
