import { useEffect, useState } from 'react';
import { announce } from '../lib/announce';

/** Reads the main content aloud with the browser's built-in speech (Web Speech API). */
export default function ReadAloud() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [on, setOn] = useState(false);
  const [rate, setRate] = useState(1);

  useEffect(() => () => { if (supported) window.speechSynthesis.cancel(); }, [supported]);
  if (!supported) return null;

  const stop = () => { window.speechSynthesis.cancel(); setOn(false); announce('Reading stopped.'); };

  const start = () => {
    const text = (document.getElementById('main')?.innerText ?? '').replace(/[▶★−+]/g, ' ').replace(/\s+/g, ' ').trim();
    const sentences = text.match(/[^.!?]+[.!?]*\s*/g) ?? [text];
    const chunks: string[] = [];
    for (const s of sentences) {
      if (chunks.length && chunks[chunks.length - 1].length + s.length < 200) chunks[chunks.length - 1] += s;
      else chunks.push(s);
    }
    window.speechSynthesis.cancel();
    chunks.forEach((c, i) => {
      const u = new SpeechSynthesisUtterance(c);
      u.rate = rate; u.lang = document.documentElement.lang || 'en';
      if (i === chunks.length - 1) u.onend = () => setOn(false);
      u.onerror = () => setOn(false);
      window.speechSynthesis.speak(u);
    });
    setOn(true);
  };

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={on ? stop : start}
        className="min-h-11 rounded border-2 border-current px-3 font-semibold">
        {on ? 'Stop reading' : 'Read this page aloud'}
      </button>
      <label className="flex items-center gap-1">
        <span>Speed</span>
        <select value={rate} onChange={(e) => setRate(Number(e.target.value))} disabled={on}
          className="min-h-11 rounded border-2 border-current bg-paper px-2 text-ink">
          <option value={0.75}>Slow</option><option value={1}>Normal</option>
          <option value={1.25}>Fast</option><option value={1.5}>Very fast</option>
        </select>
      </label>
    </div>
  );
}
