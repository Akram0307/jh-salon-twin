import { useQuery } from '@tanstack/react-query';
import { Calendar, ClipboardList, User } from 'lucide-react';
import { StaffMobileShell } from '../../components/layout/StaffMobileShell';
import { GlassCard } from '../../components/ui/GlassCard';
import { apiFetch } from '../../core/api/client';

interface StaffTodayData {
  appointments: { id: string; client_name: string; service_name: string; start_time: string }[];
  tasks: { id: string; title: string; status: string }[];
  clientNotes: { id: string; client_name: string; note: string }[];
}

const fallbackData: StaffTodayData = {
  appointments: [
    { id: 'a1', client_name: 'Priya Sharma', service_name: 'Haircut & Styling', start_time: '10:00 AM' },
    { id: 'a2', client_name: 'Anjali Mehta', service_name: 'Keratin Treatment', start_time: '12:30 PM' },
    { id: 'a3', client_name: 'Sara Khan', service_name: 'Color & Highlights', start_time: '3:00 PM' },
    { id: 'a4', client_name: 'Riya Patel', service_name: 'Deep Conditioning', start_time: '5:30 PM' },
  ],
  tasks: [
    { id: 't1', title: 'Inventory check - Hair products', status: 'pending' },
    { id: 't2', title: 'Update client preferences', status: 'pending' },
  ],
  clientNotes: [
    { id: 'n1', client_name: 'Priya Sharma', note: 'Prefers organic products' },
    { id: 'n2', client_name: 'Anjali Mehta', note: 'Allergic to sulfates' },
    { id: 'n3', client_name: 'Sara Khan', note: 'Bring portfolio of styles' },
  ],
};

async function fetchStaffToday(): Promise<StaffTodayData> {
  try {
    const data = await apiFetch<StaffTodayData>('/api/staff/today');
    return data;
  } catch {
    return fallbackData;
  }
}

export default function StaffTodayPage() {
  const { data } = useQuery<StaffTodayData>({
    queryKey: ['staff-today'],
    queryFn: fetchStaffToday,
    staleTime: 5 * 60 * 1000,
    initialData: fallbackData,
  });

  return (
    <StaffMobileShell>
      <main id="main-content" className="p-4 space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-white">Today's Flow</h1>
          <p className="text-zinc-400">Manage your service schedule and client needs.</p>
        </header>

        <div className="grid grid-cols-1 gap-4">
          <GlassCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-400">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Appointments</h2>
                <p className="text-sm text-zinc-400">{data.appointments.length} upcoming services today</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-sky-500/20 text-sky-400">
                <ClipboardList className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Tasks</h2>
                <p className="text-sm text-zinc-400">{data.tasks.filter(t => t.status === 'pending').length} pending operational tasks</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-violet-500/20 text-violet-400">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Client Notes</h2>
                <p className="text-sm text-zinc-400">{data.clientNotes.length} updates for your next clients</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </main>
    </StaffMobileShell>
  );
}
