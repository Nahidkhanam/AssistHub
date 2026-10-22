import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ToolCard from '../components/ToolCard';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type { Tool } from '../types';

type Suggestion = { id: string; name: string; status: string; createdAt: string };
const label: Record<string, string> = { pending: 'Waiting for review', published: 'Published', rejected: 'Not accepted' };

export default function Account() {
  const { user } = useAuth();
  const [favs, setFavs] = useState<Tool[] | null>(null);
  const [sugg, setSugg] = useState<Suggestion[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    api<{ items: Tool[] }>('/me/favorites').then((r) => setFavs(r.items)).catch((e) => setError((e as Error).message));
    api<{ items: Suggestion[] }>('/me/suggestions').then((r) => setSugg(r.items)).catch(() => undefined);
  }, []);
  if (!user) return null;
  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-12">
      <div>
        <h1 className="text-4xl font-bold text-brand">Your account</h1>
        <p className="mt-3">Signed in as {user.name} ({user.email}). Your text size and contrast settings are saved to your account and follow you to other devices.</p>
      </div>
      <section aria-labelledby="kit-h">
        <h2 id="kit-h" className="text-3xl font-bold text-brand">My toolkit</h2>
        {error && <p role="alert" className="mt-3 font-semibold">{error}</p>}
        {favs && favs.length === 0 && <p className="mt-3">You have not saved any tools yet. <Link className="font-bold underline" to="/tools">Browse the tools</Link>.</p>}
        {favs && favs.length > 0 && (
          <ul className="mt-5 grid gap-6 md:grid-cols-2">
            {favs.map((t) => <li key={t.id}><ToolCard tool={t} onFavChange={(f) => !f && setFavs((x) => x!.filter((y) => y.id !== t.id))} /></li>)}
          </ul>
        )}
      </section>
      <section aria-labelledby="sug-h">
        <h2 id="sug-h" className="text-3xl font-bold text-brand">My suggestions</h2>
        {sugg.length === 0 ? <p className="mt-3">You have not suggested a tool yet. <Link className="font-bold underline" to="/suggest">Suggest one</Link>.</p> : (
          <ul className="mt-4 space-y-2">{sugg.map((s) => <li key={s.id}><strong>{s.name}</strong>: {label[s.status] ?? s.status}</li>)}</ul>
        )}
      </section>
    </div>
  );
}
