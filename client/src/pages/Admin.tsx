import { useCallback, useEffect, useState } from 'react';
import ToolForm from '../components/ToolForm';
import { announce } from '../lib/announce';
import { api } from '../lib/api';
import { btn, btnOutline, card, inputCls } from '../lib/ui';
import type { Tool } from '../types';

type Stats = { users: number; tools: number; pending_tools: number; pending_reviews: number; messages: number };
type PendingReview = { id: string; rating: number; body: string; tool: string; author: string };
type Msg = { id: string; name: string; email: string; message: string; createdAt: string };

export default function Admin() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [status, setStatus] = useState('pending');
  const [tools, setTools] = useState<Tool[]>([]);
  const [reviews, setReviews] = useState<PendingReview[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [form, setForm] = useState<'none' | 'new' | Tool>('none');
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const [s, t, r, m] = await Promise.all([
        api<Stats>('/admin/stats'), api<{ items: Tool[] }>(`/admin/tools?status=${status}`),
        api<{ items: PendingReview[] }>('/admin/reviews'), api<{ items: Msg[] }>('/admin/messages'),
      ]);
      setStats(s); setTools(t.items); setReviews(r.items); setMsgs(m.items); setError('');
    } catch (e) { setError((e as Error).message); }
  }, [status]);
  useEffect(() => { refresh(); }, [refresh]);

  const act = async (fn: () => Promise<unknown>, done: string) => {
    try { await fn(); announce(done); await refresh(); } catch (e) { setError((e as Error).message); }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-14 px-4 py-12">
      <h1 className="text-4xl font-bold text-brand">Admin dashboard</h1>
      {error && <p role="alert" className="rounded border-2 border-brand p-4 font-semibold">{error}</p>}

      {stats && (
        <section aria-labelledby="stats-h">
          <h2 id="stats-h" className="text-3xl font-bold text-brand">Overview</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-5">
            {([['Users', stats.users], ['Published tools', stats.tools], ['Tools to review', stats.pending_tools], ['Reviews to check', stats.pending_reviews], ['Messages', stats.messages]] as const).map(([k, v]) => (
              <div key={k} className={card}><dt className="text-sm font-semibold">{k}</dt><dd className="text-3xl font-bold">{v}</dd></div>
            ))}
          </dl>
        </section>
      )}

      <section aria-labelledby="tools-h">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="tools-h" className="text-3xl font-bold text-brand">Tools</h2>
          <div className="flex items-end gap-3">
            <div><label htmlFor="st" className="font-semibold">Show</label>
              <select id="st" value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
                <option value="pending">Waiting for review</option><option value="published">Published</option><option value="rejected">Rejected</option>
              </select></div>
            <button type="button" className={btn} onClick={() => setForm('new')}>Add a tool</button>
          </div>
        </div>
        {form !== 'none' && (
          <div className={`${card} mt-6`}>
            <h3 className="mb-4 text-2xl font-bold">{form === 'new' ? 'Add a tool' : `Edit ${form.name}`}</h3>
            <ToolForm key={form === 'new' ? 'new' : form.id} initial={form === 'new' ? undefined : form} submitLabel={form === 'new' ? 'Publish tool' : 'Save changes'}
              onSubmit={async (v) => { if (form === 'new') await api('/admin/tools', { method: 'POST', body: v }); else await api(`/admin/tools/${form.id}`, { method: 'PATCH', body: v }); announce('Saved.'); setForm('none'); await refresh(); }} />
            <button type="button" className={`${btnOutline} mt-4`} onClick={() => setForm('none')}>Cancel</button>
          </div>
        )}
        {tools.length === 0 ? <p className="mt-4">No tools in this list.</p> : (
          <ul className="mt-6 space-y-4">
            {tools.map((t) => (
              <li key={t.id} className={card}>
                <h3 className="text-xl font-bold">{t.name} <span className="text-base font-normal">by {t.maker}</span></h3>
                <p className="mt-1 text-sm">{t.platforms.join(', ')}. {t.cost}.{t.submitter ? ` Suggested by ${t.submitter}.` : ''}</p>
                <p className="mt-2 max-w-prose">{t.summary}</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {t.status !== 'published' && <button type="button" className={btn} onClick={() => act(() => api(`/admin/tools/${t.id}`, { method: 'PATCH', body: { status: 'published' } }), `${t.name} published.`)}>Approve<span className="sr-only"> {t.name}</span></button>}
                  {t.status === 'pending' && <button type="button" className={btnOutline} onClick={() => act(() => api(`/admin/tools/${t.id}`, { method: 'PATCH', body: { status: 'rejected' } }), `${t.name} rejected.`)}>Reject<span className="sr-only"> {t.name}</span></button>}
                  <button type="button" className={btnOutline} onClick={() => setForm(t)}>Edit<span className="sr-only"> {t.name}</span></button>
                  <button type="button" className={btnOutline} onClick={() => confirm(`Delete ${t.name}? This cannot be undone.`) && act(() => api(`/admin/tools/${t.id}`, { method: 'DELETE' }), `${t.name} deleted.`)}>Delete<span className="sr-only"> {t.name}</span></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="rev-h">
        <h2 id="rev-h" className="text-3xl font-bold text-brand">Reviews waiting to be checked</h2>
        {reviews.length === 0 ? <p className="mt-4">Nothing to check.</p> : (
          <ul className="mt-4 space-y-4">
            {reviews.map((r) => (
              <li key={r.id} className={card}>
                <p className="font-bold">{r.tool}: {r.rating} out of 5 <span className="font-normal">by {r.author}</span></p>
                <p className="mt-2 max-w-prose whitespace-pre-wrap">{r.body}</p>
                <div className="mt-3 flex gap-3">
                  <button type="button" className={btn} onClick={() => act(() => api(`/admin/reviews/${r.id}`, { method: 'PATCH', body: { status: 'approved' } }), 'Review approved.')}>Approve<span className="sr-only"> review of {r.tool}</span></button>
                  <button type="button" className={btnOutline} onClick={() => act(() => api(`/admin/reviews/${r.id}`, { method: 'PATCH', body: { status: 'rejected' } }), 'Review rejected.')}>Reject<span className="sr-only"> review of {r.tool}</span></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="msg-h">
        <h2 id="msg-h" className="text-3xl font-bold text-brand">Messages</h2>
        {msgs.length === 0 ? <p className="mt-4">No messages yet.</p> : (
          <ul className="mt-4 space-y-4">
            {msgs.map((m) => (
              <li key={m.id} className={card}>
                <p className="font-bold">{m.name} <a className="font-normal underline" href={`mailto:${m.email}`}>{m.email}</a></p>
                <p className="text-sm">{new Date(m.createdAt).toLocaleString()}</p>
                <p className="mt-2 max-w-prose whitespace-pre-wrap">{m.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
