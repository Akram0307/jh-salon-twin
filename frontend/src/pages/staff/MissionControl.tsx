import { useState, useEffect } from 'react';

interface Appointment {
  id: number;
  client_name: string;
  service_name: string;
  staff_name: string;
  start_time: string;
  status: string;
}

interface Staff {
  id: number;
  name: string;
  role: string;
  is_available: boolean;
  break_times: any[];
}

export default function MissionControl() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    fetchData();

    if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  const fetchData = async () => {
    try {
      const apptRes = await fetch('http://localhost:3000/api/appointments/today');
      const apptData = await apptRes.json();
      setAppointments(apptData);

      const staffRes = await fetch('http://localhost:3000/api/staff/schedule');
      const staffData = await staffRes.json();
      setStaff(staffData);
    } catch (err) {
      console.error('Dashboard fetch failed', err);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await fetch(`http://localhost:3000/api/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      fetchData();
    } catch (err) {
      console.error('Status update failed', err);
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    if (permission === 'granted') setNotificationsEnabled(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-24">
      <header className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm">
        <h1 className="text-2xl font-bold">Mission Control</h1>
        {!notificationsEnabled && (
          <button
            onClick={requestNotificationPermission}
            className="bg-blue-500 text-white px-3 py-1 rounded-lg"
          >
            Enable Alerts
          </button>
        )}
      </header>

      {/* Staff Availability */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Staff Availability</h2>
        <div className="grid grid-cols-2 gap-3">
          {staff.map((s) => (
            <div key={s.id} className="bg-white p-3 rounded-xl shadow-sm">
              <div className="font-semibold">{s.name}</div>
              <div className="text-sm text-gray-500">{s.role}</div>
              <div className={`text-sm mt-1 ${s.is_available ? 'text-green-600' : 'text-red-500'}`}>
                {s.is_available ? 'Available' : 'Busy'}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Today's Appointments */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Today's Queue</h2>
        <div className="space-y-3">
          {appointments.map((a) => (
            <div key={a.id} className="bg-white p-3 rounded-xl shadow-sm">
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">{a.client_name}</div>
                  <div className="text-sm text-gray-500">{a.service_name}</div>
                  <div className="text-xs text-gray-400">{new Date(a.start_time).toLocaleTimeString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{a.staff_name}</div>
                  <div className="text-xs text-gray-500">{a.status}</div>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => updateStatus(a.id, 'ARRIVED')}
                  className="bg-blue-500 text-white text-xs px-2 py-1 rounded"
                >Arrived</button>

                <button
                  onClick={() => updateStatus(a.id, 'IN_PROGRESS')}
                  className="bg-yellow-500 text-white text-xs px-2 py-1 rounded"
                >Start</button>

                <button
                  onClick={() => updateStatus(a.id, 'COMPLETED')}
                  className="bg-green-600 text-white text-xs px-2 py-1 rounded"
                >Complete</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
