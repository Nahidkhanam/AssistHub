import { useEffect, useState } from 'react';
import ToolCard from '../components/ToolCard';
import { needs, platforms } from '../data/content';
import { announce } from '../lib/announce';
import { api } from '../lib/api';
import { btnOutline, inputCls } from '../lib/ui';
import type { Tool } from '../types';
import { useAuth } from '../context/AuthContext';

type Page = { items: Tool[]; total: number; page: number; pages: number };

export default function Tools() {
  const { user, loading: authLoading } = useAuth();
  const [q, setQ] = useState(''); const [debounced, setDebounced] = useState('');
  const [platform, setPlatform] = useState(''); const [need, setNeed] = useState(''); const [page, setPage] = useState(1);
  const [data, setData] = useState<Page | null>(null);
  const [error, setError] = useState(''); const [loading, setLoading] = useState(true);

  useEffect(() => { const t = setTimeout(() => { setDebounced(q); setPage(1); }, 300); return () => clearTimeout(t); }, [q]);

  useEffect(() => {
    if (authLoading) return;
    let live = true;
    setLoading(true); setError('');
    const qs = new URLSearchParams({ page: String(page), limit: '6' });
    if (debounced) qs.set('q', debounced); if (platform) qs.set('platform', platform); if (need) qs.set('need', need);
    api<Page>(`/tools?${qs}`).then((d) => { if (live) { setData(d); announce(d.total ? `${d.total} tool${d.total > 1 ? 's' : ''} found. Page ${d.page} of ${d.pages}.` : 'No tools match your search.'); } })
      .catch((e) => live && setError((e as Error).message)).finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [debounced, platform, need, page, authLoading, user?.id]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-4xl font-bold text-brand md:text-5xl">Free and built-in assistive tools</h1>
      <p className="mt-3 max-w-prose">Search, or filter by the device you use and what you want to do. Open a tool to read reviews or save it to your toolkit.</p>
      <form role="search" aria-label="Find a tool" onSubmit={(e) => e.preventDefault()} className="mt-8 grid gap-4 md:grid-cols-3">
        <div><label htmlFor="q" className="font-semibold">Search by name</label><input id="q" type="search" value={q} onChange={(e) => setQ(e.target.value)} className={inputCls} /></div>
        <div><label htmlFor="pf" className="font-semibold">Device</label>
          <select id="pf" value={platform} onChange={(e) => { setPlatform(e.target.value); setPage(1); }} className={inputCls}><option value="">Any device</option>{platforms.map((p) => <option key={p}>{p}</option>)}</select></div>
        <div><label htmlFor="nd" className="font-semibold">I want to</label>
          <select id="nd" value={need} onChange={(e) => { setNeed(e.target.value); setPage(1); }} className={inputCls}><option value="">Anything</option>{needs.map((n) => <option key={n}>{n}</option>)}</select></div>
      </form>

      <div aria-busy={loading} className="mt-6">
        {error && <p role="alert" className="rounded border-2 border-brand p-4 font-semibold">{error}</p>}
        {loading && !data && <p>Loading tools…</p>}
        {data && (
          <>
            <p className="font-semibold">{data.total === 0 ? 'No tools match. Clear a filter to see more.' : `${data.total} tool${data.total > 1 ? 's' : ''} found`}</p>
            <ul className="mt-4 grid gap-6 md:grid-cols-2">{data.items.map((t) => <li key={t.id}><ToolCard tool={t} level={2} /></li>)}</ul>
            {data.pages > 1 && (
              <nav aria-label="Pages of results" className="mt-8 flex items-center gap-4">
                <button type="button" className={btnOutline} disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous page</button>
                <span>Page {data.page} of {data.pages}</span>
                <button type="button" className={btnOutline} disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next page</button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
