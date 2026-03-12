'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { EmptyState } from '@/components/shared/EmptyState';
import { api } from '@/lib/api';
import { BarChart3, TrendingUp, DollarSign, Users, Calendar, Download, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useState } from 'react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [reportType, setReportType] = useState<'revenue' | 'clients' | 'staff' | 'services'>('revenue');

  const getDateRange = () => {
    const end = new Date();
    let start;
    switch (dateRange) {
      case '7d': start = subDays(end, 7); break;
      case '30d': start = subDays(end, 30); break;
      case '90d': start = subDays(end, 90); break;
      default: start = subDays(end, 30);
    }
    return { start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') };
  };

  const { start, end } = getDateRange();

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['reports', 'revenue', start, end],
    queryFn: () => api.analytics.getRevenue({ start, end }),
    enabled: reportType === 'revenue',
  });

  const { data: clientData, isLoading: clientLoading } = useQuery({
    queryKey: ['reports', 'clients', start, end],
    queryFn: () => api.analytics.getClientMetrics({ start, end }),
    enabled: reportType === 'clients',
  });

  const { data: staffData, isLoading: staffLoading } = useQuery({
    queryKey: ['reports', 'staff', start, end],
    queryFn: () => api.analytics.getStaffPerformance({ start, end }),
    enabled: reportType === 'staff',
  });

  const { data: serviceData, isLoading: serviceLoading } = useQuery({
    queryKey: ['reports', 'services', start, end],
    queryFn: () => api.analytics.getServicePerformance({ start, end }),
    enabled: reportType === 'services',
  });

  const isLoading = revenueLoading || clientLoading || staffLoading || serviceLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Business intelligence and performance analytics"
        breadcrumbs={[{ label: 'Owner HQ', href: '/owner/dashboard' }, { label: 'Reports' }]}
        actions={
          <button className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors">
            <Download className="h-4 w-4" />
            Export
          </button>
        }
      />

      {/* Report Controls */}
      <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Report Type:</span>
          {(['revenue', 'clients', 'staff', 'services'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setReportType(type)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors capitalize ${reportType === type ? 'bg-gold-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              {type}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Period:</span>
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${dateRange === range ? 'bg-gold-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
        </div>
      ) : reportType === 'revenue' ? (
        <div className="space-y-6">
          {/* Revenue KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <KPICard
              title="Total Revenue"
              value={`$${(revenueData?.total || 0).toLocaleString()}`}
              change={revenueData?.change}
              changeLabel="vs previous period"
              icon={<DollarSign className="h-5 w-5" />}
            />
            <KPICard
              title="Appointments"
              value={revenueData?.appointments || 0}
              change={revenueData?.appointmentsChange}
              changeLabel="vs previous period"
              icon={<Calendar className="h-5 w-5" />}
            />
            <KPICard
              title="Avg. Ticket"
              value={`$${(revenueData?.avgTicket || 0).toLocaleString()}`}
              change={revenueData?.avgTicketChange}
              changeLabel="vs previous period"
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <KPICard
              title="New Clients"
              value={revenueData?.newClients || 0}
              change={revenueData?.newClientsChange}
              changeLabel="vs previous period"
              icon={<Users className="h-5 w-5" />}
            />
          </div>

          {/* Revenue Chart Placeholder */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Revenue Trend</h3>
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Revenue chart visualization</p>
                <p className="text-xs text-slate-600 mt-1">Chart integration pending</p>
              </div>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <h3 className="text-lg font-semibold text-white mb-4">Top Services by Revenue</h3>
              {revenueData?.topServices && revenueData.topServices.length > 0 ? (
                <div className="space-y-3">
                  {revenueData.topServices.map((service: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3">
                      <div>
                        <p className="text-sm font-medium text-white">{service.name}</p>
                        <p className="text-xs text-slate-500">{service.bookings} bookings</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono text-white">${(service.revenue || 0).toLocaleString()}</p>
                        <p className={`text-xs flex items-center justify-end gap-1 ${service.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {service.change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {Math.abs(service.change || 0)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No service data"
                  description="Service revenue data will appear here"
                  icon={<BarChart3 className="h-12 w-12" />}
                />
              )}
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <h3 className="text-lg font-semibold text-white mb-4">Top Staff by Revenue</h3>
              {revenueData?.topStaff && revenueData.topStaff.length > 0 ? (
                <div className="space-y-3">
                  {revenueData.topStaff.map((staff: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">{staff.name?.charAt(0) || '?'}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{staff.name}</p>
                          <p className="text-xs text-slate-500">{staff.appointments} appointments</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono text-white">${(staff.revenue || 0).toLocaleString()}</p>
                        <p className={`text-xs flex items-center justify-end gap-1 ${staff.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {staff.change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {Math.abs(staff.change || 0)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No staff data"
                  description="Staff revenue data will appear here"
                  icon={<Users className="h-12 w-12" />}
                />
              )}
            </div>
          </div>
        </div>
      ) : reportType === 'clients' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <KPICard
              title="Total Clients"
              value={clientData?.total || 0}
              change={clientData?.change}
              changeLabel="vs previous period"
              icon={<Users className="h-5 w-5" />}
            />
            <KPICard
              title="New Clients"
              value={clientData?.new || 0}
              change={clientData?.newChange}
              changeLabel="vs previous period"
              icon={<Users className="h-5 w-5" />}
            />
            <KPICard
              title="Retention Rate"
              value={`${clientData?.retention || 0}%`}
              change={clientData?.retentionChange}
              changeLabel="vs previous period"
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <KPICard
              title="Avg. LTV"
              value={`$${(clientData?.avgLTV || 0).toLocaleString()}`}
              change={clientData?.ltvChange}
              changeLabel="vs previous period"
              icon={<DollarSign className="h-5 w-5" />}
            />
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Client Acquisition</h3>
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Client acquisition chart</p>
                <p className="text-xs text-slate-600 mt-1">Chart integration pending</p>
              </div>
            </div>
          </div>
        </div>
      ) : reportType === 'staff' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <KPICard
              title="Total Staff"
              value={staffData?.total || 0}
              icon={<Users className="h-5 w-5" />}
            />
            <KPICard
              title="Avg. Utilization"
              value={`${staffData?.avgUtilization || 0}%`}
              change={staffData?.utilizationChange}
              changeLabel="vs previous period"
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <KPICard
              title="Avg. Revenue/Staff"
              value={`$${(staffData?.avgRevenue || 0).toLocaleString()}`}
              change={staffData?.revenueChange}
              changeLabel="vs previous period"
              icon={<DollarSign className="h-5 w-5" />}
            />
            <KPICard
              title="Avg. Rating"
              value={staffData?.avgRating || 'N/A'}
              icon={<TrendingUp className="h-5 w-5" />}
            />
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Staff Performance</h3>
            {staffData?.performance && staffData.performance.length > 0 ? (
              <div className="space-y-3">
                {staffData.performance.map((staff: any, i: number) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">{staff.name?.charAt(0) || '?'}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{staff.name}</p>
                        <p className="text-xs text-slate-500">{staff.role || 'Stylist'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Utilization</p>
                        <p className="text-sm font-mono text-white">{staff.utilization || 0}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Revenue</p>
                        <p className="text-sm font-mono text-white">${(staff.revenue || 0).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Rating</p>
                        <p className="text-sm font-mono text-white">{staff.rating || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No staff performance data"
                description="Staff performance metrics will appear here"
                icon={<Users className="h-12 w-12" />}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <KPICard
              title="Total Services"
              value={serviceData?.total || 0}
              icon={<BarChart3 className="h-5 w-5" />}
            />
            <KPICard
              title="Most Popular"
              value={serviceData?.mostPopular || 'N/A'}
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <KPICard
              title="Avg. Price"
              value={`$${(serviceData?.avgPrice || 0).toLocaleString()}`}
              change={serviceData?.priceChange}
              changeLabel="vs previous period"
              icon={<DollarSign className="h-5 w-5" />}
            />
            <KPICard
              title="Total Bookings"
              value={serviceData?.totalBookings || 0}
              change={serviceData?.bookingsChange}
              changeLabel="vs previous period"
              icon={<Calendar className="h-5 w-5" />}
            />
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Service Performance</h3>
            {serviceData?.performance && serviceData.performance.length > 0 ? (
              <div className="space-y-3">
                {serviceData.performance.map((service: any, i: number) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3">
                    <div>
                      <p className="text-sm font-medium text-white">{service.name}</p>
                      <p className="text-xs text-slate-500">{service.category || 'Uncategorized'}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Bookings</p>
                        <p className="text-sm font-mono text-white">{service.bookings || 0}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Revenue</p>
                        <p className="text-sm font-mono text-white">${(service.revenue || 0).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Avg. Duration</p>
                        <p className="text-sm font-mono text-white">{service.avgDuration || 0} min</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No service performance data"
                description="Service performance metrics will appear here"
                icon={<BarChart3 className="h-12 w-12" />}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
