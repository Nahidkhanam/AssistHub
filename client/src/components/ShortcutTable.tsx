import { useState } from 'react';
import { shortcuts } from '../data/content';

export default function ShortcutTable() {
  const [q, setQ] = useState('');
  const rows = shortcuts.filter((s) => `${s.keys} ${s.does}`.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div>
      <label htmlFor="sc-q" className="font-semibold">Filter shortcuts</label>
      <input id="sc-q" type="search" value={q} onChange={(e) => setQ(e.target.value)}
        className="mt-1 block min-h-12 w-full max-w-md rounded border-2 border-brand bg-paper px-3 text-ink" />
      <p role="status" aria-live="polite" className="mt-3 font-semibold">{rows.length} shortcut{rows.length === 1 ? '' : 's'} shown</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-left">
          <caption className="mb-2 text-left text-sm">Common NVDA commands, default desktop layout. Confirm in the official NVDA user guide.</caption>
          <thead><tr className="border-b-2 border-brand"><th scope="col" className="p-3">Keys</th><th scope="col" className="p-3">What it does</th></tr></thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.keys} className="border-b border-brand/40">
                <th scope="row" className="p-3 font-semibold"><kbd>{s.keys}</kbd></th><td className="p-3">{s.does}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
