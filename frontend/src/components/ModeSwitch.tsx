import type { AnalysisMode } from '@shared/types';
import { MODE_TEXT } from '../lib/format';

interface Props {
  mode: AnalysisMode;
  onChange: (m: AnalysisMode) => void;
  disabled?: boolean;
}

export function ModeSwitch({ mode, onChange, disabled }: Props) {
  return (
    <div className="mode-switch" role="tablist" aria-label="Check type">
      {(['scam', 'ai'] as AnalysisMode[]).map((m) => (
        <button key={m} type="button" role="tab" aria-selected={mode === m} className={`mode-tab ${mode === m ? 'active' : ''}`} onClick={() => onChange(m)} disabled={disabled}>
          <span className="mode-icon" aria-hidden>
            {m === 'scam' ? '⚠' : '✎'}
          </span>
          {MODE_TEXT[m].name}
        </button>
      ))}
    </div>
  );
}
