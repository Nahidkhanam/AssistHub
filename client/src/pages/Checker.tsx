import { useState, type FormEvent } from 'react';
import { ErrorSummary, Field, TextInput, type Errors } from '../components/Form';
import { announce } from '../lib/announce';
import { ApiError, api } from '../lib/api';
import { btn, card } from '../lib/ui';
import type { CheckResult } from '../types';

export default function Checker() {
  const [result, setResult] = useState<CheckResult | null>(null);
  const [errors, setErrors] = useState<Errors>({}); const [formError, setFormError] = useState(''); const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const url = String(new FormData(e.currentTarget).get('url') ?? '').trim();
    setErrors({}); setFormError(''); setResult(null);
    if (url.length < 4) { setErrors({ url: 'Enter a web address, for example example.com.' }); return; }
    setBusy(true); announce('Checking the page. This can take a few seconds.');
    try {
      const r = await api<CheckResult>('/checker', { method: 'POST', body: { url } });
      setResult(r); announce(`Check finished. Quick score ${r.score} out of 100. ${r.issues.length} kinds of issue found.`);
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields); else setFormError((err as Error).message);
    } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-4xl font-bold text-brand md:text-5xl">Page accessibility checker</h1>
      <p className="mt-3 max-w-prose">Enter the address of a public web page. AssistHub loads it and runs eleven quick checks for common barriers that affect screen-reader, keyboard and low-vision users, with a plain-language fix for each.</p>
      <form onSubmit={submit} noValidate className="mt-8 max-w-xl space-y-5">
        <ErrorSummary errors={errors} message={formError || undefined} />
        <Field name="url" label="Web address" required hint="For example: https://example.com" error={errors.url}>
          <TextInput name="url" type="text" auto="url" required hasHint error={errors.url} />
        </Field>
        <button type="submit" disabled={busy} className={btn}>{busy ? 'Checking…' : 'Check this page'}</button>
      </form>

      {result && (
        <section aria-labelledby="res-h" className="mt-12">
          <h2 id="res-h" className="text-3xl font-bold text-brand">Results for {result.url}</h2>
          <p className="mt-4 text-5xl font-bold">{result.score}<span className="text-2xl font-semibold"> out of 100</span></p>
          <p className="mt-1">{result.rulesPassed} of {result.rulesChecked} checks passed with no problems.</p>
          <p className="mt-3 max-w-prose text-sm">{result.note}</p>
          {result.issues.length === 0 ? <p className="mt-6 font-semibold">No problems found by these checks. That is a good start, but also test with a keyboard and a screen reader.</p> : (
            <ol className="mt-6 space-y-5">
              {result.issues.map((i) => (
                <li key={i.id}>
                  <article className={card} aria-labelledby={`i-${i.id}`}>
                    <h3 id={`i-${i.id}`} className="text-xl font-bold">{i.title}</h3>
                    <p className="mt-1 text-sm"><strong>{i.severity === 'error' ? 'Error' : 'Warning'}</strong>. Found {i.count} time{i.count > 1 ? 's' : ''}. WCAG {i.wcag}.</p>
                    <p className="mt-3"><strong>How to fix:</strong> {i.fix}</p>
                    {i.examples.length > 0 && (
                      <div className="mt-3"><p className="text-sm font-semibold">Examples from the page:</p>
                        <ul className="mt-1 space-y-1">{i.examples.map((x, n) => <li key={n}><code className="block overflow-x-auto whitespace-pre rounded bg-wash p-2 text-sm">{x}</code></li>)}</ul>
                      </div>
                    )}
                  </article>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </div>
  );
}
