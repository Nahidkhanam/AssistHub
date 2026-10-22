import { useState, type FormEvent } from 'react';
import { announce } from '../lib/announce';
import { ApiError, api } from '../lib/api';
import { btn } from '../lib/ui';
import { ErrorSummary, Field, TextInput, type Errors } from './Form';

export default function ContactForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const v = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const errs: Errors = {};
    if (!v.name?.trim()) errs.name = 'Enter your name.';
    if (!/^\S+@\S+\.\S+$/.test(v.email ?? '')) errs.email = 'Enter an email like name@example.com.';
    if ((v.message ?? '').trim().length < 10) errs.message = 'Write at least 10 characters.';
    setErrors(errs); setFormError('');
    if (Object.keys(errs).length) { announce('Please fix the problems and send again.'); return; }
    setStatus('sending'); announce('Sending your message.');
    try {
      await api('/contact', { method: 'POST', body: v });
      setStatus('sent'); form.reset(); announce('Message sent. Thank you.');
    } catch (err) {
      setStatus('idle');
      if (err instanceof ApiError && err.fields) setErrors(err.fields); else setFormError((err as Error).message);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-label="Contact form" className="space-y-5">
      <ErrorSummary errors={errors} message={formError || undefined} />
      <Field name="name" label="Your name" required error={errors.name}><TextInput name="name" auto="name" required error={errors.name} /></Field>
      <Field name="email" label="Email" required error={errors.email}><TextInput name="email" type="email" auto="email" required error={errors.email} /></Field>
      <Field name="message" label="Message" required error={errors.message}><TextInput name="message" multiline rows={6} required error={errors.message} /></Field>
      <div className="absolute -left-[9999px]" aria-hidden="true"><label>Leave this empty<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <button type="submit" disabled={status === 'sending'} className={btn}>{status === 'sending' ? 'Sending…' : 'Send message'}</button>
      {status === 'sent' && <p role="status" className="font-semibold">Message sent. Thank you, we will read it soon.</p>}
    </form>
  );
}
