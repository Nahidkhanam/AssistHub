import { useEffect, useId, useState } from 'react';

const SAMPLE = 'Welcome to AssistHub. This sentence is spoken at the speed you choose. Many experienced screen reader users listen at a much faster rate than most people expect.';
const label = (r: number) => (r === 1 ? 'normal speed' : `${r} times normal speed`);

export default function SpeechRateDemo() {
  const id = useId();
  const [rate, setRate] = useState(1);
  const [on, setOn] = useState(false);
  const ok = typeof window !== 'undefined' && 'speechSynthesis' in window;
  useEffect(() => () => { if (ok) window.speechSynthesis.cancel(); }, [ok]);
  if (!ok) return <p>Your browser does not support speech, so this demo is not available.</p>;

  const play = () => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(SAMPLE); u.rate = rate; u.onend = () => setOn(false);
    window.speechSynthesis.speak(u); setOn(true);
  };
  const stop = () => { window.speechSynthesis.cancel(); setOn(false); };

  return (
    <div className="rounded-2xl border-2 border-brand p-5 md:p-8">
      <label htmlFor={id} className="block text-lg font-semibold">Speech speed</label>
      <input id={id} type="range" min={0.5} max={2} step={0.25} value={rate} disabled={on}
        onChange={(e) => setRate(Number(e.target.value))} aria-valuetext={label(rate)}
        className="mt-3 h-10 w-full accent-[var(--c-brand)]" />
      <p className="mt-1" aria-hidden="true">Current: {label(rate)}</p>
      <blockquote className="mt-4 max-w-prose border-l-4 border-brand pl-4">{SAMPLE}</blockquote>
      <button type="button" onClick={on ? stop : play} className="mt-5 min-h-12 rounded-full bg-brand px-6 font-bold text-onbrand">
        {on ? 'Stop' : 'Play sample'}
      </button>
    </div>
  );
}
