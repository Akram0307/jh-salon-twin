import { useEffect, useState } from "react";
import { apiFetch } from '../../../core/api/client';

interface WaitlistStats {
  waitingClients: number;
  offersSent: number;
  recoveredBookings: number;
  recoveryRevenue: number;
}

export default function WaitlistRecoveryMonitor() {
  const [stats, setStats] = useState<WaitlistStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<WaitlistStats>('/api/waitlist/recovery-stats')
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4">Loading waitlist recovery...</div>;
  if (!stats) return <div className="p-4">No waitlist data</div>;

  return (
    <div className="bg-white shadow rounded-xl p-4">
      <h2 className="text-lg font-semibold mb-4">Waitlist Recovery Monitor</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 rounded"><div className="text-sm text-gray-500">Clients Waiting</div><div className="text-xl font-bold">{stats.waitingClients}</div></div>
        <div className="p-3 bg-gray-50 rounded"><div className="text-sm text-gray-500">AI Offers Sent</div><div className="text-xl font-bold">{stats.offersSent}</div></div>
        <div className="p-3 bg-gray-50 rounded"><div className="text-sm text-gray-500">Recovered Bookings</div><div className="text-xl font-bold">{stats.recoveredBookings}</div></div>
        <div className="p-3 bg-gray-50 rounded"><div className="text-sm text-gray-500">Recovery Revenue</div><div className="text-xl font-bold">${stats.recoveryRevenue}</div></div>
      </div>
    </div>
  );
}
