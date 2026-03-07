import { useEffect, useState } from 'react';
import { apiFetch } from '../../../core/api/client';

interface PosStats {
  avg_ticket?: number;
  tip_rate?: number;
  top_service?: string;
  top_staff?: string;
}

export default function POSIntelligencePanel() {
  const [stats, setStats] = useState<PosStats | null>(null);

  useEffect(() => {
    apiFetch<PosStats>('/api/analytics/pos-stats')
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-lg font-semibold mb-4">POS Intelligence</h3>
      {!stats && <p className="text-zinc-400">Loading POS metrics...</p>}
      {stats && (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-zinc-400">Average Ticket</p><p className="text-xl font-semibold">${stats.avg_ticket ?? 0}</p></div>
          <div><p className="text-zinc-400">Tip Rate</p><p className="text-xl font-semibold">{stats.tip_rate ?? 0}%</p></div>
          <div><p className="text-zinc-400">Top Service</p><p className="font-medium">{stats.top_service ?? '—'}</p></div>
          <div><p className="text-zinc-400">Top Staff</p><p className="font-medium">{stats.top_staff ?? '—'}</p></div>
        </div>
      )}
    </div>
  );
}
