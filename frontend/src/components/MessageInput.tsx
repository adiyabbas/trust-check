import { useRef, useState } from 'react';
import type { AnalysisMode } from '@shared/types';
import { MODE_TEXT } from '../lib/format';
import { extractTextFromImage } from '../lib/ocr';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onAnalyze: () => void;
  busy: boolean;
  mode: AnalysisMode;
}

export function MessageInput({ value, onChange, onAnalyze, busy, mode }: Props) {
  const t = MODE_TEXT[mode];
  const fileRef = useRef<HTMLInputElement>(null);
  const [ocr, setOcr] = useState<{ running: boolean; pct: number; error?: string }>({ running: false, pct: 0 });

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setOcr({ running: true, pct: 0 });
    try {
      const text = await extractTextFromImage(file, (pct) => setOcr({ running: true, pct }));
      onChange(text || '(No readable text found in the image. Try a clearer screenshot.)');
      setOcr({ running: false, pct: 100 });
    } catch (err) {
      setOcr({ running: false, pct: 0, error: (err as Error).message });
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <section className="card input-card">
      <div className="card-head">
        <h2>{t.inputTitle}</h2>
        <span className="muted">{t.inputHint}</span>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t.placeholder}
        rows={11}
        spellCheck={false}
        onDrop={(e) => {
          e.preventDefault();
          void handleFile(e.dataTransfer.files?.[0]);
        }}
        onDragOver={(e) => e.preventDefault()}
      />

      <div className="input-actions">
        <div className="left">
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => void handleFile(e.target.files?.[0])} />
          <button type="button" className="btn ghost" onClick={() => fileRef.current?.click()} disabled={busy || ocr.running}>
            {ocr.running ? `Reading image… ${ocr.pct}%` : 'Upload screenshot'}
          </button>
          {ocr.error && <span className="error-text">OCR failed: {ocr.error}</span>}
          <button type="button" className="btn link" onClick={() => onChange('')} disabled={busy || !value}>
            Clear
          </button>
        </div>
        <button type="button" className="btn primary" onClick={onAnalyze} disabled={busy || value.trim().length < 10}>
          {busy ? 'Analyzing…' : t.analyze}
        </button>
      </div>
      <p className="fineprint">Messages are processed locally by your own server. Remove personal details before sharing screenshots of results.</p>
    </section>
  );
}
