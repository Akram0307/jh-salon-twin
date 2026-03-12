'use client';

import { useQuery } from '@tanstack/react-query';
import { KPICard } from '@/components/shared/KPICard';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { api } from '@/lib/api';
import { DollarSign, Calendar, Users, TrendingUp, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => api.analytics.getOverview(),
  });

  const { data: todaySchedule, isLoading: scheduleLoading } = useQuery({
    queryKey: ['dashboard', 'today-schedule'],
    queryFn: () => api.appointments.getToday(),
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['dashboard', 'alerts'],
    queryFn: () => api.owner.getAlerts(),
  });

  const isLoading = overviewLoading || scheduleLoading || alertsLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Revenue command center and operational overview"
        breadcrumbs={[{ label: 'Owner HQ', href: '/owner/dashboard' }, { label: 'Dashboard' }]}
      />

      {/* KPI Pulse Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Today's Revenue"
          value={`$${(overview?.todayRevenue || 0).toLocaleString()}`}
          change={overview?.revenueChange}
          changeLabel="vs yesterday"
          icon={<DollarSign className="h-5 w-5" />}
        />
        <KPICard
          title="Appointments"
          value={overview?.todayAppointments || 0}
          change={overview?.appointmentsChange}
          changeLabel="vs yesterday"
          icon={<Calendar className="h-5 w-5" />}
        />
        <KPICard
          title="Active Clients"
          value={overview?.activeClients || 0}
          change={overview?.clientsChange}
          changeLabel="this month"
          icon={<Users className="h-5 w-5" />}
        />
        <KPICard
          title="Avg. Ticket"
          value={`$${(overview?.avgTicket || 0).toLocaleString()}`}
          change={overview?.ticketChange}
          changeLabel="vs last week"
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Today's Schedule</h3>
            <Link href="/owner/schedule" className="text-sm text-gold-400 hover:text-gold-300">
              View all
            </Link>
          </div>
          {scheduleLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
            </div>
          ) : todaySchedule && todaySchedule.length > 0 ? (
            <div className="space-y-3">
              {todaySchedule.slice(0, 5).map((apt: any, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">{apt.clientName?.charAt(0) || '?'}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{apt.clientName || 'Unknown Client'}</p>
                      <p className="text-xs text-slate-500">{apt.serviceName || 'Service'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-white">{apt.time || '--:--'}</p>
                    <StatusBadge
                      status={apt.status || 'pending'}
                      variant={apt.status === 'confirmed' ? 'success' : apt.status === 'in-progress' ? 'warning' : 'neutral'}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No appointments today"
              description="Your schedule is clear for today"
              icon={<Calendar className="h-12 w-12" />}
            />
          )}
        </div>

        {/* Alerts & Quick Actions */}
        <div className="space-y-6">
          {/* Alerts */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Alerts</h3>
            {alertsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
              </div>
            ) : alerts && alerts.length > 0 ? (
              <div className="space-y-2">
                {alerts.slice(0, 3).map((alert: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg bg-slate-800/50 p-3">
                    <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-white">{alert.message || 'Alert'}</p>
                      <p className="text-xs text-slate-500">{alert.time || 'Just now'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No alerts at this time</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link href="/owner/schedule" className="flex items-center gap-2 rounded-lg bg-slate-800/50 p-3 hover:bg-slate-800 transition-colors">
                <Calendar className="h-5 w-5 text-gold-400" />
                <span className="text-sm text-white">New Appointment</span>
              </Link>
              <Link href="/owner/clients" className="flex items-center gap-2 rounded-lg bg-slate-800/50 p-3 hover:bg-slate-800 transition-colors">
                <Users className="h-5 w-5 text-blue-400" />
                <span className="text-sm text-white">Add Client</span>
              </Link>
              <Link href="/owner/staff" className="flex items-center gap-2 rounded-lg bg-slate-800/50 p-3 hover:bg-slate-800 transition-colors">
                <Users className="h-5 w-5 text-emerald-400" />
                <span className="text-sm text-white">Manage Staff</span>
              </Link>
              <Link href="/owner/reports" className="flex items-center gap-2 rounded-lg bg-slate-800/50 p-3 hover:bg-slate-800 transition-colors">
                <TrendingUp className="h-5 w-5 text-purple-400" />
                <span className="text-sm text-white">View Reports</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
