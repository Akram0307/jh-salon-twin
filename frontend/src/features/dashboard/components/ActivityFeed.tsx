import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../../core/api/client';
import { asArray } from '../../../core/api/utils';

type ActivityEvent = {
  id?: string;
  type?: string;
  message?: string;
  payload?: unknown;
  created_at?: string;
};

export default function ActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const safeEvents = useMemo(() => asArray<ActivityEvent>(events), [events]);

  useEffect(() => {
    let es: EventSource | null = null;

    apiFetch<any>('/api/activity/feed')
      .then((data) => setEvents(asArray<ActivityEvent>(data)))
      .catch(() => setEvents([]));

    try {
      const liveUrl = `${import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || ''}/api/activity/live`;
      es = new EventSource(liveUrl);
      es.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          setEvents((prev) => [parsed, ...asArray<ActivityEvent>(prev)].slice(0, 50));
        } catch {
          // ignore malformed stream payloads
        }
      };
      es.onerror = () => {
        es?.close();
      };
    } catch {
      // SSE optional
    }

    return () => {
      es?.close();
    };
  }, []);

  return (
    <div className="bg-white shadow rounded-xl p-4">
      <h2 className="font-medium mb-3">Live Salon Activity</h2>
      <ul className="text-sm text-gray-700 space-y-2 max-h-80 overflow-y-auto">
        {safeEvents.length === 0 && <li className="text-gray-400">No activity yet</li>}
        {safeEvents.map((e, i) => (
          <li key={e.id || i} className="border-b pb-1">
            <span className="font-medium">{e.type || 'Event'}</span>
            {' — '}
            <span>{e.message || (typeof e.payload === 'string' ? e.payload : 'Activity recorded')}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
