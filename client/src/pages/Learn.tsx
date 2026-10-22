import Accordion from '../components/Accordion';
import ShortcutTable from '../components/ShortcutTable';
import SpeechRateDemo from '../components/SpeechRateDemo';
import { checks } from '../data/content';

export default function Learn() {
  const h2 = 'text-3xl font-bold text-brand';
  return (
    <div className="bg-wash">
      <div className="mx-auto max-w-5xl space-y-16 px-4 py-12">
        <div>
          <h1 className="text-4xl font-bold text-brand md:text-5xl">Learn to browse with a screen reader</h1>
          <p className="mt-4 max-w-prose">A screen reader speaks what is on the screen and lets you move around with the keyboard or touch. These short lessons help you start.</p>
        </div>
        <section aria-labelledby="speed-h">
          <h2 id="speed-h" className={h2}>Try it: speech speed</h2>
          <p className="mb-5 mt-3 max-w-prose">Experienced users often listen much faster than normal speech. Move the slider and play the sample.</p>
          <SpeechRateDemo />
        </section>
        <section aria-labelledby="keys-h">
          <h2 id="keys-h" className={h2}>NVDA keyboard shortcuts</h2>
          <div className="mt-5"><ShortcutTable /></div>
        </section>
        <section aria-labelledby="check-h">
          <h2 id="check-h" className={h2}>Is a website accessible? Five quick checks</h2>
          <p className="mb-5 mt-3 max-w-prose">Anyone can try these, including people who build websites.</p>
          <Accordion items={checks.map((c, i) => ({ id: `c${i}`, title: c.title, content: <p className="max-w-prose">{c.text}</p> }))} />
        </section>
      </div>
    </div>
  );
}
