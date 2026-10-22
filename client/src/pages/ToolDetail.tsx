import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ErrorSummary, Field, TextInput, type Errors } from '../components/Form';
import { FavoriteButton, ratingText } from '../components/ToolCard';
import { useAuth } from '../context/AuthContext';
import { announce } from '../lib/announce';
import { ApiError, api } from '../lib/api';
import { btn, card, inputCls } from '../lib/ui';
import type { Review, Tool } from '../types';

type Detail = { tool: Tool; reviews: Review[]; myReview: { rating: number; body: string; status: string } | null };

export default function ToolDetail() {
  const { slug } = useParams();
  const { user, loading: authLoading } = useAuth();
  const loc = useLocation();
  const [d, setD] = useState<Detail | null>(null);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api<Detail>(`/tools/${slug}`).then((r) => { setD(r); document.title = `${r.tool.name} | AssistHub`; }).catch((e) => setError((e as Error).message));
  useEffect(() => { if (!authLoading) load(); }, [slug, authLoading, user?.id]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setErrors({}); setMsg('');
    try {
      const r = await api<{ message: string }>(`/tools/${d!.tool.id}/reviews`, { method: 'POST', body: { rating: Number(f.get('rating')), body: String(f.get('body') ?? '') } });
      setMsg(r.message); announce(r.message); load();
    } catch (err) { if (err instanceof ApiError && err.fields) setErrors(err.fields); else setMsg((err as Error).message); }
    finally { setBusy(false); }
  }

  if (error) return <section className="mx-auto max-w-3xl px-4 py-12"><h1 className="text-4xl font-bold text-brand">Tool not found</h1><p className="mt-3">{error}</p><p className="mt-4"><Link className="underline" to="/tools">Back to all tools</Link></p></section>;
  if (!d) return <p role="status" className="mx-auto max-w-3xl px-4 py-12">Loading…</p>;
  const { tool } = d;

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-12">
      <p><Link className="underline" to="/tools">Back to all tools</Link></p>
      <section aria-labelledby="tool-h">
        <h1 id="tool-h" className="text-4xl font-bold text-brand md:text-5xl">{tool.name}</h1>
        <p className="mt-1 text-lg">by {tool.maker}</p>
        <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="font-semibold">Type</dt><dd>{tool.kind}</dd>
          <dt className="font-semibold">Works on</dt><dd>{tool.platforms.join(', ')}</dd>
          <dt className="font-semibold">Helps you</dt><dd>{tool.needs.join(', ')}</dd>
          <dt className="font-semibold">Cost</dt><dd>{tool.cost}</dd>
          <dt className="font-semibold">Reviews</dt><dd>{ratingText(tool)}</dd>
        </dl>
        <p className="mt-5 max-w-prose">{tool.summary}</p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <a href={tool.url} target="_blank" rel="noopener noreferrer" className={btn}>Visit the official site<span className="sr-only"> for {tool.name} (opens in a new tab)</span></a>
          <FavoriteButton tool={tool} />
        </div>
      </section>

      <section aria-labelledby="rev-h">
        <h2 id="rev-h" className="text-3xl font-bold text-brand">Reviews</h2>
        {d.reviews.length === 0 ? <p className="mt-3">No reviews yet. Be the first to share how it worked for you.</p> : (
          <ul className="mt-4 space-y-4">
            {d.reviews.map((r) => (
              <li key={r.id} className={card}>
                <p className="font-bold">{r.rating} out of 5 <span className="font-normal">by {r.author}</span></p>
                <p className="mt-2 max-w-prose whitespace-pre-wrap">{r.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="write-h">
        <h2 id="write-h" className="text-3xl font-bold text-brand">Write a review</h2>
        {!user ? <p className="mt-3"><Link to="/login" state={{ from: loc.pathname }} className="font-bold underline">Sign in</Link> to write a review.</p> : (
          <form onSubmit={submit} noValidate className="mt-4 max-w-xl space-y-5">
            {d.myReview && <p className="rounded border-2 border-brand p-3">Your review is {d.myReview.status === 'approved' ? 'published' : d.myReview.status === 'pending' ? 'waiting to be checked' : 'not published'}. Sending again replaces it.</p>}
            <ErrorSummary errors={errors} />
            <Field name="rating" label="Rating" required error={errors.rating}>
              <select id="f-rating" name="rating" defaultValue={d.myReview?.rating ?? ''} required aria-required="true" aria-invalid={errors.rating ? true : undefined} aria-describedby={errors.rating ? 'e-rating' : undefined} className={inputCls}>
                <option value="" disabled>Choose a rating</option>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} out of 5</option>)}
              </select>
            </Field>
            <Field name="body" label="Your review" required hint="Say how it worked for you. 10 to 1000 characters." error={errors.body}>
              <TextInput name="body" multiline required defaultValue={d.myReview?.body} hasHint error={errors.body} />
            </Field>
            <button type="submit" disabled={busy} className={btn}>{busy ? 'Sending…' : 'Send review'}</button>
            {msg && <p role="status" className="font-semibold">{msg}</p>}
          </form>
        )}
      </section>
    </div>
  );
}
