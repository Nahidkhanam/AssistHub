import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { announce } from '../lib/announce';
import { api } from '../lib/api';
import { btnOutline, card } from '../lib/ui';
import type { Tool } from '../types';

export const ratingText = (t: Pick<Tool, 'ratingAvg' | 'ratingCount'>) =>
  t.ratingCount ? `Rated ${t.ratingAvg} out of 5 from ${t.ratingCount} review${t.ratingCount > 1 ? 's' : ''}` : 'No reviews yet';

export function FavoriteButton({ tool, onChange }: { tool: Tool; onChange?: (fav: boolean) => void }) {
  const { user } = useAuth();
  const loc = useLocation();
  const [fav, setFav] = useState(tool.favorited);
  const [busy, setBusy] = useState(false);
  if (!user) return <Link to="/login" state={{ from: loc.pathname }} className="inline-flex min-h-11 items-center font-semibold underline">Sign in to save {tool.name}</Link>;
  const toggle = async () => {
    setBusy(true);
    try {
      await api(`/tools/${tool.id}/favorite`, { method: fav ? 'DELETE' : 'PUT' });
      setFav(!fav); onChange?.(!fav);
      announce(fav ? `${tool.name} removed from your toolkit.` : `${tool.name} saved to your toolkit.`);
    } catch (e) { announce((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <button type="button" onClick={toggle} disabled={busy} aria-pressed={fav} className={btnOutline}>
      {fav ? 'Saved to my toolkit' : 'Save to my toolkit'}<span className="sr-only">: {tool.name}</span>
    </button>
  );
}

export default function ToolCard({ tool, onFavChange, level = 3 }: { tool: Tool; onFavChange?: (fav: boolean) => void; level?: 2 | 3 }) {
  const H = `h${level}` as 'h2' | 'h3';
  return (
    <article aria-labelledby={`t-${tool.id}`} className={`${card} h-full`}>
      <H id={`t-${tool.id}`} className="text-xl font-bold text-brand">
        <Link to={`/tools/${tool.slug}`} className="underline-offset-4 hover:underline">{tool.name}</Link>
        <span className="text-base font-medium text-ink"> by {tool.maker}</span>
      </H>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="font-semibold">Type</dt><dd>{tool.kind}</dd>
        <dt className="font-semibold">Works on</dt><dd>{tool.platforms.join(', ')}</dd>
        <dt className="font-semibold">Cost</dt><dd>{tool.cost}</dd>
        <dt className="font-semibold">Reviews</dt><dd>{ratingText(tool)}</dd>
      </dl>
      <p className="mt-3">{tool.summary}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link to={`/tools/${tool.slug}`} className="inline-flex min-h-11 items-center font-bold underline">Details and reviews<span className="sr-only"> for {tool.name}</span></Link>
        <FavoriteButton tool={tool} onChange={onFavChange} />
      </div>
    </article>
  );
}
