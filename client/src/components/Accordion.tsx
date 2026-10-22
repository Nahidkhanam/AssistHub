import { useId, useState, type ReactNode } from 'react';

export type AccordionItem = { id: string; title: string; content: ReactNode };

/** WAI-ARIA accordion: heading + button, aria-expanded, aria-controls. */
export default function Accordion({ items, headingLevel = 3 }: { items: AccordionItem[]; headingLevel?: 2 | 3 | 4 }) {
  const [open, setOpen] = useState<string | null>(null);
  const base = useId();
  const H = `h${headingLevel}` as 'h2' | 'h3' | 'h4';
  return (
    <div className="divide-y-2 divide-brand border-y-2 border-brand">
      {items.map((it) => {
        const isOpen = open === it.id;
        const pid = `${base}-${it.id}-panel`;
        return (
          <div key={it.id}>
            <H className="text-lg font-semibold md:text-xl">
              <button
                type="button" id={`${base}-${it.id}-btn`} aria-expanded={isOpen} aria-controls={pid}
                onClick={() => setOpen(isOpen ? null : it.id)}
                className="flex min-h-14 w-full items-center justify-between gap-4 py-4 text-left"
              >
                <span>{it.title}</span>
                <span aria-hidden="true" className="text-2xl">{isOpen ? '−' : '+'}</span>
              </button>
            </H>
            <div id={pid} role="region" aria-labelledby={`${base}-${it.id}-btn`} hidden={!isOpen} className="pb-5">
              {it.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
