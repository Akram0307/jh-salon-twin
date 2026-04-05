import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../../core/api/client';
import { asArray } from '../../../core/api/utils';

interface StaffMetric {
  staff_id?: string;
  id?: string;
  name?: string;
  full_name?: string;
  revenue?: number;
  appointments?: number;
  appointments_today?: number;
  avg_ticket?: number;
}

export default function StaffPerformancePanel() {
  const [data, setData] = useState<StaffMetric[]>([]);

  useEffect(() => {
    apiFetch<any>('/api/analytics/staff-performance')
      .then((res) => setData(asArray<StaffMetric>(res)))
      .catch(() => setData([]));
  }, []);

  const safeData = useMemo(() => asArray<StaffMetric>(data), [data]);

  return (
    <div className="panel">
      <h3>Staff Performance</h3>
      <table style={{ width: '100%', fontSize: '14px' }}>
        <thead><tr><th align="left">Staff</th><th align="right">Revenue</th><th align="right">Appointments</th><th align="right">Avg Ticket</th></tr></thead>
        <tbody>
          {safeData.map((s) => (
            <tr key={s.staff_id || s.id}>
              <td>{s.name || s.full_name || 'Staff'}</td>
              <td align="right">${s.revenue ?? 0}</td>
              <td align="right">{s.appointments ?? s.appointments_today ?? 0}</td>
              <td align="right">${s.avg_ticket ?? 0}</td>
            </tr>
          ))}
          {safeData.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: '10px' }}>No staff metrics available</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
