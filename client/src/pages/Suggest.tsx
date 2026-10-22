import { useState } from 'react';
import { Link } from 'react-router-dom';
import ToolForm from '../components/ToolForm';
import { announce } from '../lib/announce';
import { api } from '../lib/api';

export default function Suggest() {
  const [done, setDone] = useState('');
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl font-bold text-brand">Suggest a tool</h1>
      <p className="mt-3 max-w-prose">Know a free or built-in assistive tool that is missing? Tell us about it. An admin checks every suggestion before it appears.</p>
      {done ? (
        <div role="status" className="mt-8 rounded border-2 border-brand p-5">
          <p className="font-bold">{done}</p>
          <p className="mt-2"><Link className="underline" to="/account">See the status of your suggestions</Link></p>
        </div>
      ) : (
        <div className="mt-8">
          <ToolForm submitLabel="Send suggestion" onSubmit={async (v) => {
            const r = await api<{ message: string }>('/tools/suggest', { method: 'POST', body: v });
            setDone(r.message); announce(r.message);
          }} />
        </div>
      )}
    </div>
  );
}
