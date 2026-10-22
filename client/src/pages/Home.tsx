import { Link } from 'react-router-dom';
import Accordion from '../components/Accordion';
import HeroArt from '../components/HeroArt';
import FeaturedTools from '../components/FeaturedTools';
import { audiences, faqs, nvdaPanels } from '../data/content';

const wrap = 'mx-auto max-w-6xl px-4';
const h2 = 'text-3xl font-bold text-brand md:text-4xl';

export default function Home() {
  return (
    <>
      <section aria-labelledby="hero-h" className="bg-gradient-to-br from-[#cfe3f3] to-[#f0fafb] text-[#000080]">
        <div className={`${wrap} grid items-center gap-6 py-12 md:grid-cols-2`}>
          <div>
            <h1 id="hero-h" className="text-5xl font-bold md:text-6xl">AssistHub</h1>
            <p className="mt-4 text-2xl font-semibold">Free assistive tools for blind and low-vision users, explained simply</p>
            <p className="mt-4 max-w-prose">Find a screen reader or app that fits your device, learn the basics, and use a site built to work with all of them.</p>
          </div>
          <HeroArt />
        </div>
      </section>

      <section id="about" tabIndex={-1} aria-labelledby="about-h" className="outline-none">
        <div className={`${wrap} space-y-4 py-14`}>
          <h2 id="about-h" className={h2}>What is AssistHub?</h2>
          <p className="max-w-prose">AssistHub is a small guide to free and built-in assistive technology. Each tool has a plain-language summary, the devices it works on, what it costs, and a link to its official website.</p>
          <p className="max-w-prose">The site itself is built to the WCAG 2.2 AA guidelines. You can change the text size, switch to high contrast, and have any page read aloud.</p>
        </div>
      </section>

      <section id="featured" tabIndex={-1} aria-labelledby="feat-h" className="bg-wash outline-none">
        <div className={`${wrap} py-14`}>
          <h2 id="feat-h" className={h2}>Featured tool: NVDA</h2>
          <p className="mt-3 max-w-prose">A free, open-source screen reader for Windows, and a good place to start if you use a Windows computer.</p>
          <div className="mt-6 max-w-4xl">
            <Accordion items={nvdaPanels.map((p) => ({
              id: p.id, title: p.title,
              content: (
                <div className="space-y-3">
                  {p.body?.map((t) => <p key={t} className="max-w-prose">{t}</p>)}
                  {p.list && (p.id === 'start'
                    ? <ol className="list-decimal space-y-1 pl-6">{p.list.map((i) => <li key={i}>{i}</li>)}</ol>
                    : <ul className="list-disc space-y-1 pl-6">{p.list.map((i) => <li key={i}>{i}</li>)}</ul>)}
                </div>
              ),
            }))} />
          </div>
          <p className="mt-6"><Link to="/learn" className="inline-flex min-h-11 items-center font-bold underline">See NVDA keyboard shortcuts on the Learn page</Link></p>
        </div>
      </section>

      <section id="catalog" tabIndex={-1} aria-labelledby="cat-h" className="outline-none">
        <div className={`${wrap} py-14`}>
          <h2 id="cat-h" className={h2}>Free and built-in tools</h2>
          <p className="mb-6 mt-3 max-w-prose">A few tools to start with. Browse the full list to search, filter, read reviews and save tools to your own toolkit.</p>
          <FeaturedTools />
        </div>
      </section>

      <section id="who" tabIndex={-1} aria-labelledby="who-h" className="bg-wash outline-none">
        <div className={`${wrap} py-14`}>
          <h2 id="who-h" className={h2}>Who AssistHub helps</h2>
          <ul className="mt-8 grid gap-6 md:grid-cols-3">
            {audiences.map((a) => (
              <li key={a.title} className="rounded-2xl bg-paper p-6">
                <h3 className="text-xl font-bold text-brand">{a.title}</h3>
                <p className="mt-2">{a.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="faq" tabIndex={-1} aria-labelledby="faq-h" className="outline-none">
        <div className={`${wrap} max-w-4xl py-14`}>
          <h2 id="faq-h" className={h2}>Frequently asked questions</h2>
          <div className="mt-6"><Accordion items={faqs.map((f, i) => ({ id: `faq${i}`, title: f.q, content: <p className="max-w-prose">{f.a}</p> }))} /></div>
        </div>
      </section>

      <section aria-labelledby="cta-h" className="bg-wash">
        <div className={`${wrap} py-14 text-center`}>
          <h2 id="cta-h" className={h2}>Know a tool we should add?</h2>
          <Link to="/suggest" className="mt-6 inline-flex min-h-12 items-center rounded-full bg-brand px-8 font-bold text-onbrand">Suggest a tool</Link>
        </div>
      </section>
    </>
  );
}
