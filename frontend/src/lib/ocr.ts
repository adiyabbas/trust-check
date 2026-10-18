import Tesseract from 'tesseract.js';

/** Runs OCR fully in the browser. The language data (~4 MB) downloads on first use. */
export async function extractTextFromImage(file: File, onProgress?: (pct: number) => void): Promise<string> {
  const { data } = await Tesseract.recognize(file, 'eng', {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) onProgress(Math.round(m.progress * 100));
    },
  });
  return data.text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
