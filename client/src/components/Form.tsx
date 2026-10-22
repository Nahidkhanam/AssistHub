import { useEffect, useRef, type ReactNode } from 'react';
import { inputCls } from '../lib/ui';

export type Errors = Record<string, string>;

/** Error summary that takes focus when it appears, with links to each field. */
export function ErrorSummary({ errors, message }: { errors: Errors; message?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const keys = Object.keys(errors);
  useEffect(() => { if (keys.length || message) ref.current?.focus(); }, [errors, message]);
  if (!keys.length && !message) return null;
  return (
    <div ref={ref} tabIndex={-1} role="alert" className="rounded border-2 border-brand p-4">
      <p className="font-bold">{message ?? `There ${keys.length > 1 ? 'are problems' : 'is a problem'} with your answers:`}</p>
      {keys.length > 0 && <ul className="mt-2 list-disc pl-6">{keys.map((k) => <li key={k}><a className="underline" href={`#f-${k}`}>{errors[k]}</a></li>)}</ul>}
    </div>
  );
}

export function Field({ name, label, error, hint, required, children }: { name: string; label: string; error?: string; hint?: string; required?: boolean; children?: ReactNode }) {
  return (
    <div>
      <label htmlFor={`f-${name}`} className="font-semibold">{label}{required && <span> (required)</span>}</label>
      {hint && <p id={`h-${name}`} className="text-sm">{hint}</p>}
      {children}
      {error && <p id={`e-${name}`} className="mt-1 font-semibold">Error: {error}</p>}
    </div>
  );
}

type InputProps = { name: string; type?: string; auto?: string; error?: string; hasHint?: boolean; required?: boolean; defaultValue?: string; rows?: number; multiline?: boolean };
export function TextInput({ name, type = 'text', auto, error, hasHint, required, defaultValue, rows = 4, multiline }: InputProps) {
  const common = {
    id: `f-${name}`, name, autoComplete: auto, defaultValue, className: inputCls,
    'aria-required': required ? true : undefined, 'aria-invalid': error ? true : undefined,
    'aria-describedby': [hasHint ? `h-${name}` : '', error ? `e-${name}` : ''].filter(Boolean).join(' ') || undefined,
  } as const;
  return multiline ? <textarea rows={rows} {...common} /> : <input type={type} {...common} />;
}

export function CheckGroup({ name, legend, options, selected, error }: { name: string; legend: string; options: readonly string[]; selected: string[]; error?: string }) {
  return (
    <fieldset aria-describedby={error ? `e-${name}` : undefined} id={`f-${name}`} tabIndex={-1}>
      <legend className="font-semibold">{legend} <span>(required)</span></legend>
      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
        {options.map((o) => (
          <label key={o} className="flex min-h-11 items-center gap-2">
            <input type="checkbox" name={name} value={o} defaultChecked={selected.includes(o)} className="h-5 w-5 accent-[var(--c-brand)]" />{o}
          </label>
        ))}
      </div>
      {error && <p id={`e-${name}`} className="mt-1 font-semibold">Error: {error}</p>}
    </fieldset>
  );
}
