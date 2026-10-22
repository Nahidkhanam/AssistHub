import ContactForm from '../components/ContactForm';
import { contactInfo } from '../data/content';

export default function Contact() {
  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 lg:grid-cols-[2fr_1fr]">
      <section aria-labelledby="contact-heading">
        <h1 id="contact-heading" className="text-4xl font-bold text-brand">Contact us</h1>
        <p className="mt-3 max-w-prose">Suggest a tool, report a problem with this site, or send feedback. If you suggest a tool, include its name and official website.</p>
        <div className="mt-8"><ContactForm /></div>
      </section>
      <aside aria-labelledby="about-h" className="h-fit rounded-2xl bg-wash p-6">
        <h2 id="about-h" className="text-2xl font-bold text-brand">About this project</h2>
        <p className="mt-3">{contactInfo.note}</p>
      </aside>
    </div>
  );
}
