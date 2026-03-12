import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../../core/api/client';
import { asArray } from '../../../core/api/utils';

interface Client {
  id: string;
  name?: string;
  full_name?: string;
  phone?: string;
  total_visits?: number;
  total_spent?: number;
}

export default function ClientProfiles() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiFetch<any>('/api/clients')
      .then((data) => setClients(asArray<Client>(data)))
      .catch(() => setClients([]));
  }, []);

  const safeClients = useMemo(() => asArray<Client>(clients), [clients]);
  const filtered = useMemo(
    () => safeClients.filter((c) => (c.name || c.full_name || '').toLowerCase().includes(search.toLowerCase()) || (c.phone || '').includes(search)),
    [safeClients, search]
  );

  return (
    <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
      <h3 className="text-lg font-semibold mb-4">Client Profiles</h3>
      <input placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full mb-4 bg-zinc-800 text-sm p-2 rounded border border-zinc-700" />
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {filtered.length ? filtered.map((c) => (
          <div key={c.id} className="flex justify-between text-sm border-b border-zinc-800 pb-2">
            <div><div className="font-medium">{c.name || c.full_name || 'Client'}</div><div className="text-zinc-400">{c.phone || '—'}</div></div>
            <div className="text-right text-zinc-400"><div>{c.total_visits ?? 0} visits</div><div>${c.total_spent ?? 0}</div></div>
          </div>
        )) : <p className="text-zinc-500 text-sm">No clients found</p>}
      </div>
    </div>
  );
}
