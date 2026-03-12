import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiFetch } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Loader2, X, CalendarX } from "lucide-react";
import { glass, semantic, component } from '../../lib/design-tokens';

interface Appointment {
  id: string;
  service_name: string;
  start_time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Appointment[]>('/api/appointments/client');
      setAppointments(data);
    } catch (err) {
      setError('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancel = async (id: string) => {
    try {
      await apiFetch(`/api/appointments/${id}/cancel`, { method: 'POST' });
      fetchAppointments();
    } catch (err) {
      alert('Failed to cancel appointment.');
    }
  };

  return (
    <div className="p-4 min-h-screen bg-zinc-950 text-white">
      <h1 className="text-2xl font-bold mb-6">My Appointments</h1>
      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : appointments.length === 0 ? (
        <div className="rounded-[28px] border semantic.border.default bg-zinc-900/70 backdrop-blur-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full glass.subtle p-4">
              <CalendarX className="h-8 w-8 text-white/40" />
            </div>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">No appointments yet</h2>
          <p className="text-white/60 text-sm mb-6">Book your first visit and experience our premium services</p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => navigate('/client/services')}
              className="glass.default hover:bg-white/20 text-white rounded-[16px] px-4 py-3 transition"
            >
              Book Your First Visit
            </button>
            <button
              type="button"
              onClick={() => navigate('/client/stylists')}
              className="border semantic.border.default hover:glass.subtle text-white/80 rounded-[16px] px-4 py-3 transition"
            >
              Browse Stylists
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => (
            <Card key={apt.id} className="rounded-[28px] semantic.border.default bg-zinc-900/70 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{apt.service_name}</span>
                  <Badge variant={apt.status === 'upcoming' ? 'default' : 'secondary'}>{apt.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-400 mb-4">{new Date(apt.start_time).toLocaleString()}</p>
                {apt.status === 'upcoming' && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleCancel(apt.id)}><X className="w-4 h-4 mr-2" /> Cancel</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
