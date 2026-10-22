import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ErrorSummary, Field, TextInput, type Errors } from '../components/Form';
import { useAuth } from '../context/AuthContext';
import { announce } from '../lib/announce';
import { ApiError } from '../lib/api';
import { btn } from '../lib/ui';

export default function Auth({ mode }: { mode: 'login' | 'register' }) {
  const { login, register } = useAuth();
  const nav = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/account';
  const [errors, setErrors] = useState<Errors>({}); const [formError, setFormError] = useState(''); const [busy, setBusy] = useState(false);
  const isLogin = mode === 'login';

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get('name') ?? ''), email = String(f.get('email') ?? ''), password = String(f.get('password') ?? '');
    const errs: Errors = {};
    if (!isLogin && name.trim().length < 2) errs.name = 'Enter your name.';
    if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = 'Enter an email like name@example.com.';
    if (!password) errs.password = 'Enter your password.'; else if (!isLogin && password.length < 8) errs.password = 'Use at least 8 characters.';
    setErrors(errs); setFormError('');
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      if (isLogin) await login(email, password); else await register(name, email, password);
      announce(isLogin ? 'Signed in.' : 'Account created. You are signed in.');
      nav(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields); else setFormError((err as Error).message);
    } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-4xl font-bold text-brand">{isLogin ? 'Sign in' : 'Create an account'}</h1>
      <p className="mt-3">{isLogin ? 'Sign in to save tools, write reviews and keep your display settings.' : 'An account lets you save tools, write reviews and keep your display settings on every device.'}</p>
      <form onSubmit={submit} noValidate className="mt-8 space-y-5">
        <ErrorSummary errors={errors} message={formError || undefined} />
        {!isLogin && <Field name="name" label="Your name" required error={errors.name}><TextInput name="name" auto="name" required error={errors.name} /></Field>}
        <Field name="email" label="Email" required error={errors.email}><TextInput name="email" type="email" auto="email" required error={errors.email} /></Field>
        <Field name="password" label="Password" required hint={isLogin ? undefined : 'At least 8 characters.'} error={errors.password}>
          <TextInput name="password" type="password" auto={isLogin ? 'current-password' : 'new-password'} required hasHint={!isLogin} error={errors.password} />
        </Field>
        <button type="submit" disabled={busy} className={btn}>{busy ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}</button>
      </form>
      <p className="mt-6">{isLogin ? <>New here? <Link className="font-bold underline" to="/register" state={{ from }}>Create an account</Link></> : <>Already have an account? <Link className="font-bold underline" to="/login" state={{ from }}>Sign in</Link></>}</p>
    </div>
  );
}
