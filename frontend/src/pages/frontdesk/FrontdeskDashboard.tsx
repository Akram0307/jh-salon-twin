import { CalendarClock } from "lucide-react";
import FrontdeskLayout from './FrontdeskLayout'
import OwnerModuleBoundary from '../../components/owner/OwnerModuleBoundary'
import AppointmentBoard from '../../features/dashboard/components/AppointmentBoard'
import ClientList from '../../features/clients/ClientList'
import QuickPOS from '../../features/pos/components/QuickPOS'
import { RoleHero, RoleStatGrid, RoleChipRow } from '../../components/ops/RoleSurface'
import { useEffect, useState } from 'react'
import { apiFetch } from '../../services/api'
import { glass, semantic, component } from '../../lib/design-tokens';

interface ScheduleItem {
  task: string;
  time: string;
  status: string;
}

export default function FrontdeskDashboard() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const data = await apiFetch<ScheduleItem[]>('/api/operations/schedule');
        setSchedule(data);
      } catch (error) {
        console.error('Failed to fetch schedule:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  return (
    <FrontdeskLayout
      title="Frontdesk Command"
      subtitle="Run arrivals, queue flow, walk-ins, and checkout from a premium operational surface."
    >
      <RoleHero
        eyebrow="Reception control"
        title="High-speed frontdesk orchestration."
        description="This surface mirrors the Owner design language but prioritizes immediate action: check-ins, live queue management, and payment completion."
        aside={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[28px] border semantic.border.default bg-zinc-900/70 backdrop-blur-lg px-4 py-3 text-sm text-white">Queue-aware reception shell</div>
            <div className="rounded-[28px] border semantic.border.default bg-zinc-900/70 backdrop-blur-lg px-4 py-3 text-sm text-white">Optimized for rapid cashier flow</div>
          </div>
        }
      >
        <RoleChipRow
          items={[
            { label: 'Mode', value: 'Live desk ops' },
            { label: 'Priority', value: 'Arrivals + checkout' },
            { label: 'Canon', value: 'Owner-aligned shell' },
          ]}
        />
      </RoleHero>

      <RoleStatGrid
        items={[
          { label: 'Today queue', value: 'Live', tone: 'text-emerald-200', hint: 'Monitor check-ins and waiting pressure.' },
          { label: 'Walk-ins', value: 'Active', tone: 'text-sky-200', hint: 'Handle assisted booking and triage quickly.' },
          { label: 'Check-ins', value: 'Ready', tone: 'text-violet-200', hint: 'Keep the floor coordinated in real time.' },
          { label: 'POS', value: 'Connected', tone: 'text-amber-200', hint: 'Checkout remains one tap away.' },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          <OwnerModuleBoundary title="Live Operations Schedule">
            <div className="rounded-[28px] border semantic.border.default bg-zinc-900/70 backdrop-blur-lg p-6">
              {loading ? (
                <div className="text-zinc-400">Loading schedule...</div>
              ) : (
                <div className="space-y-4">
                  {schedule.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0">
                      <div className="flex items-center gap-3">
                        <CalendarClock className="h-5 w-5 text-emerald-400" />
                        <div>
                          <div className="text-sm font-medium text-white">{item.task}</div>
                          <div className="text-xs text-zinc-400">{item.time}</div>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-[10px] uppercase ${item.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-500/20 text-zinc-300'}`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </OwnerModuleBoundary>

          <OwnerModuleBoundary title="Today's queue">
            <AppointmentBoard />
          </OwnerModuleBoundary>

          <OwnerModuleBoundary title="Checkout desk">
            <QuickPOS />
          </OwnerModuleBoundary>
        </div>

        <div className="space-y-6">
          <OwnerModuleBoundary title="Client lookup">
            <ClientList />
          </OwnerModuleBoundary>
        </div>
      </div>
    </FrontdeskLayout>
  )
}
