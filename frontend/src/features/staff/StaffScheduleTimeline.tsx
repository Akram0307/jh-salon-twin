import { useEffect, useState } from "react";
import { apiFetch } from '../../services/api';
import { glass, semantic, component } from '../../lib/design-tokens';

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  client_name: string;
  service_name: string;
}

export default function StaffScheduleTimeline() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const data = await apiFetch('/api/appointments/today');
        setAppointments(data as Appointment[]);
      } catch (err) {
        setError('Failed to load schedule');
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  if (loading) return <div className="p-4 text-zinc-400">Loading schedule...</div>;
  if (error) return <div className="p-4 text-red-400">{error}</div>;

  return (
    <div className="space-y-4 p-4">
      {appointments.map((apt) => (
        <div 
          key={apt.id} 
          className="rounded-[28px] border semantic.border.default bg-zinc-900/70 p-4 backdrop-blur-lg"
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-white font-medium">{apt.client_name}</h3>
              <p className="text-zinc-400 text-sm">{apt.service_name}</p>
            </div>
            <div className="text-zinc-300 text-sm">
              {new Date(apt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
