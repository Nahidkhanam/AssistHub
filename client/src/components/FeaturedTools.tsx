import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { btn } from '../lib/ui';
import type { Tool } from '../types';
import ToolCard from './ToolCard';

export default function FeaturedTools() {
  const { loading, user } = useAuth();
  const [tools, setTools] = useState<Tool[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (loading) return;
    api<{ items: Tool[] }>('/tools?limit=4').then((r) => setTools(r.items)).catch((e) => setError((e as Error).message));
  }, [loading, user?.id]);
  return (
    <div aria-busy={!tools && !error}>
      {error && <p role="alert" className="rounded border-2 border-brand p-4 font-semibold">{error}</p>}
      {!tools && !error && <p>Loading tools…</p>}
      {tools && <ul className="grid gap-6 md:grid-cols-2">{tools.map((t) => <li key={t.id}><ToolCard tool={t} /></li>)}</ul>}
      <p className="mt-8"><Link to="/tools" className={btn}>Browse all tools</Link></p>
    </div>
  );
}
