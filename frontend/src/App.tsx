import { useCallback, useEffect, useState } from 'react';
import type { AnalysisMode, AnalysisResult, HistoryItem, RiskLevel, SampleMessage } from '@shared/types';
import { DetailPanel } from './components/DetailPanel';
import { Footer } from './components/Footer';
import { HistoryPanel } from './components/HistoryPanel';
import { MessageInput } from './components/MessageInput';
import { ModeSwitch } from './components/ModeSwitch';
import { PredictGate } from './components/PredictGate';
import { Report } from './components/Report';
import { api, type Health } from './lib/api';
import { MODE_TEXT, levelLabel } from './lib/format';
import { SUMMARY, type Selection } from './lib/selection';

export default function App() {
  const [mode, setMode] = useState<AnalysisMode>('scam');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [samples, setSamples] = useState<SampleMessage[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [educationMode, setEducationMode] = useState(true);
  const [judgeMode, setJudgeMode] = useState(false);
  const [prediction, setPrediction] = useState<RiskLevel | null>(null);
  const [revealed, setRevealed] = useState(true);
  const [selection, setSelection] = useState<Selection>(SUMMARY);
  const [activeId, setActiveId] = useState<string | null>(null);

  const t = MODE_TEXT[mode];

  const refreshHistory = useCallback(() => {
    api
      .history(mode)
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [mode]);

  useEffect(() => {
    api.health().then(setHealth).catch(() => setHealth(null));
  }, []);

  useEffect(() => {
    api
      .samples(mode)
      .then(setSamples)
      .catch(() => setSamples([]));
    refreshHistory();
  }, [mode, refreshHistory]);

  function switchMode(next: AnalysisMode) {
    if (next === mode) return;
    setMode(next);
    setResult(null);
    setMessage('');
    setError(null);
    setPrediction(null);
    setSelection(SUMMARY);
    setActiveId(null);
  }

  function showResult(r: AnalysisResult, reveal: boolean) {
    setResult(r);
    setSelection(SUMMARY);
    setActiveId(null);
    setRevealed(reveal);
  }

  async function analyze() {
    setBusy(true);
    setError(null);
    setPrediction(null);
    try {
      const r = await api.analyze(message, mode);
      showResult(r, !judgeMode);
      refreshHistory();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function openHistory(id: string) {
    try {
      const r = await api.historyItem(id);
      setMessage(r.message);
      setPrediction(null);
      showResult(r, true);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function clearHistory() {
    await api.clearHistory().catch(() => undefined);
    refreshHistory();
  }

  return (
    <div className={`page mode-${mode}`}>
      <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden>
            ✓
          </span>
          <div>
            <h1>TrustCheck AI</h1>
            <p className="muted">{t.tagline}</p>
          </div>
        </div>

        <ModeSwitch mode={mode} onChange={switchMode} disabled={busy} />

        <div className="toggles">
          <label className="toggle">
            <input type="checkbox" checked={educationMode} onChange={(e) => setEducationMode(e.target.checked)} /> Education mode
          </label>
          <label className="toggle">
            <input type="checkbox" checked={judgeMode} onChange={(e) => setJudgeMode(e.target.checked)} /> Predict first
          </label>
          {health && (
            <span className={`status ${health.llm.enabled ? 'on' : 'off'}`} title={health.llm.enabled ? `${health.llm.provider} / ${health.llm.model}` : 'Add an API key in .env'}>
              {health.llm.enabled ? `AI: ${health.llm.provider}` : 'AI: off (rules only)'}
            </span>
          )}
        </div>
      </header>

      <main className="layout three-col">
        <HistoryPanel items={history} onSelect={openHistory} onClear={clearHistory} selectedId={result?.id ?? null} />

        <div className="main-col">
          <MessageInput value={message} onChange={setMessage} onAnalyze={analyze} busy={busy} mode={mode} />

          {error && <div className="alert">{error}</div>}

          {result && !revealed && (
            <PredictGate
              mode={result.mode}
              onPick={(l) => {
                setPrediction(l);
                setRevealed(true);
              }}
            />
          )}

          {result && revealed && (
            <>
              {prediction && (
                <div className={`alert ${prediction === result.level ? 'ok' : 'warn'}`}>
                  You predicted <strong>{levelLabel(result.mode, prediction)}</strong>. TrustCheck says <strong>{levelLabel(result.mode, result.level)}</strong>.{' '}
                  {prediction === result.level ? 'Good instinct.' : 'See the evidence for why.'}
                </div>
              )}
              <Report result={result} selection={selection} onSelect={setSelection} activeId={activeId} onHover={setActiveId} />
            </>
          )}
        </div>

        <div className="detail-col">
          <DetailPanel
            result={result && revealed ? result : null}
            selection={selection}
            educationMode={educationMode}
            onSelect={setSelection}
            samples={samples}
            mode={mode}
            onLoadSample={(text) => {
              setMessage(text);
              setResult(null);
            }}
          />
        </div>
      </main>

      </div>
      <Footer mode={mode} />
    </div>
  );
}
