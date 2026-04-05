'use client';

import { useQuery } from '@tanstack/react-query';
import { KPICard } from '@/components/shared/KPICard';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { api } from '@/lib/api';
import { Appointment, DashboardAlert } from '@/types/dashboard';
import { CollapsibleSection } from '@/components/shared/CollapsibleSection';

import RevenueChart from '@/components/dashboard/RevenueChart';
import AIInsightsPanel from '@/components/dashboard/AIInsightsPanel';
import QuickActions from '@/components/dashboard/QuickActions';
import { ResponsiveChartCard } from '@/components/shared/responsive/ResponsiveChartCard';
import { MobileScheduleCard } from '@/components/dashboard/MobileScheduleCard';
import { InsightCardStack } from '@/components/dashboard/InsightCardStack';

import { DollarSign, Calendar, Users, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';

const insights = [
  {
    type: 'opportunity' as const,
    title: 'Revenue Opportunity',
    description: '3 open slots tomorrow could generate ~$420 if filled.',
    action: 'View slots',
    metadata: 'Based on historical booking patterns and current staff availability.'
  },
  {
    type: 'trend' as const,
    title: 'Client Trend',
    description: 'Returning clients increased 12% this week.',
    action: 'See details',
    metadata: 'Compared to the same period last month. 45 clients returned.'
  },
  {
    type: 'alert' as const,
    title: 'Retention Alert',
    description: '5 VIP clients have not visited in 45+ days.',
    action: 'Send reminder',
    metadata: 'Clients with lifetime value > $1000. Last visit dates range from 45-60 days ago.'
  }
];

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

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        <PageHeader
          title="Dashboard"
          description="Revenue command center and operational overview"
          breadcrumbs={[{ label: 'Owner HQ', href: '/owner/dashboard' }, { label: 'Dashboard' }]}
        />

        {/* KPI Pulse Strip */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KPICard
            title="Today's Revenue"
            value={`$${(overview?.todayRevenue || 0).toLocaleString()}`}
            change={overview?.revenueChange}
            changeLabel="vs yesterday"
            icon={<DollarSign className="h-5 w-5" />}
            className="min-w-0 rounded-xl p-4 sm:p-5"
          />

          <KPICard
            title="Appointments"
            value={overview?.todayAppointments || 0}
            change={overview?.appointmentsChange}
            changeLabel="vs yesterday"
            icon={<Calendar className="h-5 w-5" />}
            className="min-w-0 rounded-xl p-4 sm:p-5"
          />

          <KPICard
            title="Active Clients"
            value={overview?.activeClients || 0}
            change={overview?.clientsChange}
            changeLabel="this month"
            icon={<Users className="h-5 w-5" />}
            className="min-w-0 rounded-xl p-4 sm:p-5"
          />

          <KPICard
            title="Avg. Ticket"
            value={`$${(overview?.avgTicket || 0).toLocaleString()}`}
            change={overview?.ticketChange}
            changeLabel="vs last week"
            icon={<TrendingUp className="h-5 w-5" />}
            className="min-w-0 rounded-xl p-4 sm:p-5"
          />
        </div>

        {/* Analytics Row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 xl:gap-6">
          <div className="lg:col-span-2">
            <ResponsiveChartCard title="Weekly Revenue">
              <RevenueChart />
            </ResponsiveChartCard>
          </div>

          {/* AI Insights - Desktop */}
          <div className="hidden xl:block">
            <AIInsightsPanel />
          </div>
          
          {/* AI Insights - Mobile */}
          <div className="xl:hidden">
            <InsightCardStack insights={insights} />
          </div>
        </div>

        {/* Main Operations Grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 xl:gap-6">
          {/* Today's Schedule */}
          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5">
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
              <>
                {/* Mobile Schedule Cards */}
                <div className="space-y-3 lg:hidden">
                  {todaySchedule.slice(0, 5).map((apt: Appointment, i: number) => (
                    <MobileScheduleCard key={i} appointment={apt} />
                  ))}
                </div>
                
                {/* Desktop Schedule List */}
                <div className="hidden lg:block space-y-3">
                  {todaySchedule.slice(0, 5).map((apt: Appointment, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {apt.clientName?.charAt(0) || '?'}
                          </span>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-white">
                            {apt.clientName || 'Unknown Client'}
                          </p>

                          <p className="text-xs text-slate-500">
                            {apt.serviceName || 'Service'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-mono text-white">
                          {apt.time || '--:--'}
                        </p>

                        <StatusBadge
                          status={apt.status || 'pending'}
                          variant={
                            apt.status === 'confirmed'
                              ? 'success'
                              : apt.status === 'in-progress'
                              ? 'warning'
                              : 'neutral'
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                title="No appointments today"
                description="Your schedule is clear for today"
                icon={<Calendar className="h-12 w-12" />}
              />
            )}
          </div>

          {/* Alerts + Quick Actions */}
          <div className="space-y-4 sm:space-y-6">
            {/* Alerts - Collapsible on mobile */}
            <CollapsibleSection title="Alerts" defaultOpen={true} className="lg:hidden">
              {alertsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                </div>
              ) : alerts && alerts.length > 0 ? (
                <div className="space-y-2">
                  {alerts.slice(0, 3).map((alert: DashboardAlert, i: number) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg bg-slate-800/50 p-3">
                      <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5" />

                      <div>
                        <p className="text-sm text-white">
                          {alert.message || 'Alert'}
                        </p>

                        <p className="text-xs text-slate-500">
                          {alert.time || 'Just now'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No alerts at this time</p>
              )}
            </CollapsibleSection>

            {/* Alerts - Desktop (non-collapsible) */}
            <div className="hidden lg:block rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5">
              <h3 className="text-lg font-semibold text-white mb-4">Alerts</h3>

              {alertsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                </div>
              ) : alerts && alerts.length > 0 ? (
                <div className="space-y-2">
                  {alerts.slice(0, 3).map((alert: DashboardAlert, i: number) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg bg-slate-800/50 p-3">
                      <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5" />

                      <div>
                        <p className="text-sm text-white">
                          {alert.message || 'Alert'}
                        </p>

                        <p className="text-xs text-slate-500">
                          {alert.time || 'Just now'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No alerts at this time</p>
              )}
            </div>

            {/* Quick Actions - Collapsible on mobile */}
            <CollapsibleSection title="Quick Actions" defaultOpen={true} className="lg:hidden">
              <QuickActions />
            </CollapsibleSection>

            {/* Quick Actions - Desktop (non-collapsible) */}
            <div className="hidden lg:block">
              <QuickActions />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
