import { useEffect, useState } from 'react';
import { apiFetch } from '../../../core/api/client';

interface Health {
  api: string;
  db: string;
  redis: string;
}

export default function SystemHealthPanel() {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    apiFetch<Health>('/api/owner/system-health')
      .then(setHealth)
      .catch(() => setHealth({ api: 'ok', db: 'unknown', redis: 'unknown' }));
  }, []);

  const badge = (status: string) => status === 'ok' ? 'text-green-400' : status === 'unknown' ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-lg font-semibold mb-4">System Health</h3>
      {!health && <p className="text-zinc-400">Checking system...</p>}
      {health && <div className="space-y-2 text-sm"><p>API: <span className={badge(health.api)}>{health.api}</span></p><p>Database: <span className={badge(health.db)}>{health.db}</span></p><p>Redis: <span className={badge(health.redis)}>{health.redis}</span></p></div>}
    </div>
  );
}
