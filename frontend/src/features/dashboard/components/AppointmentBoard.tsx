import { useEffect, useMemo, useState } from "react";
import { getAppointmentsToday, AppointmentsTodayResponse } from '../../../services/api';
import { asArray } from '../../../core/api/utils';

type Appointment = {
  id: string;
  client_name: string;
  service_name: string;
  staff_name: string;
  start_time: string;
  status: string;
};

export default function AppointmentBoard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAppointmentsToday()
      .then((data) => setAppointments(((data as AppointmentsTodayResponse).appointments || []) as unknown as Appointment[]))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, []);

  const safeAppointments = useMemo(() => asArray<Appointment>(appointments), [appointments]);

  if (loading) return <div className="card">Loading appointments...</div>;

  return (
    <div className="card">
      <h3>Today's Appointments</h3>
      <div>
        {safeAppointments.map((a) => (
          <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
            <div>
              <strong>{a.client_name}</strong>
              <div style={{ fontSize: 12, color: '#666' }}>{a.service_name}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div>{a.start_time ? new Date(a.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</div>
              <div style={{ fontSize: 12, color: '#888' }}>{a.staff_name}</div>
            </div>
            <div><span style={{ padding: '4px 8px', borderRadius: 6, fontSize: 12, background: '#f3f3f3' }}>{a.status}</span></div>
          </div>
        ))}
        {safeAppointments.length === 0 && <div style={{ padding: 10, color: '#888' }}>No appointments today</div>}
      </div>
    </div>
  );
}
