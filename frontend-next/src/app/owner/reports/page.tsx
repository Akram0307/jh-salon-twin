'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import RevenueChart from '@/components/reports/RevenueChart';
import ClientGrowthChart from '@/components/reports/ClientGrowthChart';
import ExportButton from '@/components/reports/ExportButton';
import { api } from '@/lib/api';
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Loader2, AlertCircle, Download } from 'lucide-react';
import { useState } from 'react';
import { ResponsiveStatGrid } from '@/components/shared/responsive/ResponsiveStatGrid';
import { ResponsiveChartCard } from '@/components/shared/responsive/ResponsiveChartCard';
import { ResponsiveSegmentedControl } from '@/components/schedule/ResponsiveSegmentedControl';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter'>('month');

  const { data: revenueData, isLoading: revenueLoading, error: revenueError } = useQuery({
    queryKey: ['reports', 'revenue', dateRange],
    queryFn: () => api.reports.getRevenue({ period: dateRange }),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const { data: clientData, isLoading: clientLoading, error: clientError } = useQuery({
    queryKey: ['reports', 'clients', dateRange],
    queryFn: () => api.reports.getClientGrowth({ period: dateRange }),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['reports', 'summary', dateRange],
    queryFn: () => api.reports.getSummary({ period: dateRange }),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const summary = summaryData || {
    totalRevenue: 0,
    totalBookings: 0,
    newClients: 0,
    avgTicket: 0,
    topService: 'N/A',
    topStaff: 'N/A'
  };

  const isLoading = revenueLoading || clientLoading || summaryLoading;
  const hasError = revenueError || clientError;

  const periodOptions = [
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'quarter', label: 'Quarter' }
  ];

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 space-y-4 sm:space-y-6 lg:space-y-8">
      <PageHeader
        title="Reports & Analytics"
        description="Business insights, trends, and performance metrics"
        breadcrumbs={[{ label: 'Owner HQ', href: '/owner/dashboard' }, { label: 'Reports' }]}
        actions={
          <div className="flex items-center gap-2">
            <ExportButton
              data={revenueData || []}
              filename={`salon-report-${dateRange}`}
            />
          </div>
        }
      />

      {/* Error Banner */}
      {hasError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-300">Unable to load reports data</p>
            <p className="text-xs text-red-400/70">The backend API may be unavailable. Showing demo data.</p>
          </div>
        </div>
      )}

      {/* Date Range Selector - Mobile Responsive */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-slate-500" />
          <span className="text-sm text-slate-400">Period:</span>
        </div>
        <ResponsiveSegmentedControl
          options={periodOptions}
          value={dateRange}
          onChange={(value) => setDateRange(value as 'week' | 'month' | 'quarter')}
          className="w-full sm:w-auto"
        />
      </div>

      {/* KPI Summary Cards - Mobile Responsive */}
      <ResponsiveStatGrid>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <DollarSign className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="text-sm text-slate-500">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold text-white font-mono">${(summary.totalRevenue || 0).toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <BarChart3 className="h-5 w-5 text-blue-400" />
            </div>
            <span className="text-sm text-slate-500">Total Bookings</span>
          </div>
          <p className="text-2xl font-bold text-white font-mono">{(summary.totalBookings || 0).toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-lg bg-purple-500/10 p-2">
              <Users className="h-5 w-5 text-purple-400" />
            </div>
            <span className="text-sm text-slate-500">New Clients</span>
          </div>
          <p className="text-2xl font-bold text-white font-mono">{(summary.newClients || 0).toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-lg bg-gold-500/10 p-2">
              <TrendingUp className="h-5 w-5 text-gold-400" />
            </div>
            <span className="text-sm text-slate-500">Avg Ticket</span>
          </div>
          <p className="text-2xl font-bold text-white font-mono">${(summary.avgTicket || 0).toLocaleString()}</p>
        </div>
      </ResponsiveStatGrid>

      {/* Charts Grid - Mobile Responsive */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          <ResponsiveChartCard title="Revenue Overview">
            <RevenueChart
              data={revenueData || []}
              period={dateRange}
              hideControls={true}
            />
          </ResponsiveChartCard>
          <ResponsiveChartCard title="Client Growth">
            <ClientGrowthChart
              data={clientData || []}
              period={dateRange}
              hideControls={true}
            />
          </ResponsiveChartCard>
        </div>
      )}

      {/* Top Performers - Mobile Responsive */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5">
          <h3 className="text-sm font-medium text-slate-400 mb-3">Top Service</h3>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-3">
              <BarChart3 className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">{summary.topService || 'N/A'}</p>
              <p className="text-xs text-slate-500">Most booked service</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5">
          <h3 className="text-sm font-medium text-slate-400 mb-3">Top Performer</h3>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gold-500/10 p-3">
              <Users className="h-6 w-6 text-gold-400" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">{summary.topStaff || 'N/A'}</p>
              <p className="text-xs text-slate-500">Highest revenue generator</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
