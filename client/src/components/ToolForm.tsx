import { useState, type FormEvent } from 'react';
import { ApiError } from '../lib/api';
import { needs, platforms } from '../data/content';
import { btn } from '../lib/ui';
import type { Tool } from '../types';
import { CheckGroup, ErrorSummary, Field, TextInput, type Errors } from './Form';

export type ToolValues = Pick<Tool, 'name' | 'maker' | 'kind' | 'platforms' | 'needs' | 'cost' | 'summary' | 'url'>;

/** Used by "Suggest a tool" and by the admin dashboard (create and edit). */
export default function ToolForm({ initial, submitLabel, onSubmit }: { initial?: Partial<ToolValues>; submitLabel: string; onSubmit: (v: ToolValues) => Promise<void> }) {
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v: ToolValues = {
      name: String(f.get('name') ?? ''), maker: String(f.get('maker') ?? ''), kind: String(f.get('kind') ?? ''),
      platforms: f.getAll('platforms').map(String), needs: f.getAll('needs').map(String),
      cost: String(f.get('cost') ?? ''), summary: String(f.get('summary') ?? ''), url: String(f.get('url') ?? ''),
    };
    setBusy(true); setErrors({}); setFormError('');
    try { await onSubmit(v); } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields); else setFormError((err as Error).message);
    } finally { setBusy(false); }
  }

  const t = (n: keyof ToolValues) => initial?.[n] as string | undefined;
  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <ErrorSummary errors={errors} message={formError || undefined} />
      <div className="grid gap-5 md:grid-cols-2">
        <Field name="name" label="Tool name" required error={errors.name}><TextInput name="name" required defaultValue={t('name')} error={errors.name} /></Field>
        <Field name="maker" label="Made by" required error={errors.maker}><TextInput name="maker" required defaultValue={t('maker')} error={errors.maker} /></Field>
        <Field name="kind" label="Type" required hint="For example: Screen reader, Mobile app" error={errors.kind}><TextInput name="kind" required defaultValue={t('kind')} hasHint error={errors.kind} /></Field>
        <Field name="cost" label="Cost" required hint="For example: Free app, Built in to Windows" error={errors.cost}><TextInput name="cost" required defaultValue={t('cost')} hasHint error={errors.cost} /></Field>
      </div>
      <CheckGroup name="platforms" legend="Works on" options={platforms} selected={initial?.platforms ?? []} error={errors.platforms} />
      <CheckGroup name="needs" legend="Helps you" options={needs} selected={initial?.needs ?? []} error={errors.needs} />
      <Field name="summary" label="Summary" required hint="Describe it in your own words, 20 to 500 characters. Please do not copy text from the official site." error={errors.summary}>
        <TextInput name="summary" multiline required defaultValue={t('summary')} hasHint error={errors.summary} />
      </Field>
      <Field name="url" label="Official website" required hint="Must start with https://" error={errors.url}>
        <TextInput name="url" type="url" required defaultValue={t('url')} hasHint error={errors.url} />
      </Field>
      <button type="submit" disabled={busy} className={btn}>{busy ? 'Saving…' : submitLabel}</button>
    </form>
  );
}
