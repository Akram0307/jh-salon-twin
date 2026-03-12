'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { api } from '@/lib/api';
import { Users, Plus, Mail, Phone, Calendar, DollarSign, Star, Loader2, Scissors, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export default function StaffPage() {
  const [view, setView] = useState<'list' | 'schedule'>('list');

  const { data: staff, isLoading, error: staffError } = useQuery({
    queryKey: ['staff'],
    queryFn: () => api.staff.list(),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const { data: schedule, error: scheduleError } = useQuery({
    queryKey: ['staff', 'schedule'],
    queryFn: () => api.staff.getSchedule(),
    enabled: view === 'schedule',
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const staffList = Array.isArray(staff) ? staff : [];
  const scheduleList = Array.isArray(schedule) ? schedule : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        description="Team management, scheduling, and performance"
        breadcrumbs={[{ label: 'Owner HQ', href: '/owner/dashboard' }, { label: 'Staff' }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('list')}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${view === 'list' ? 'bg-gold-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              List
            </button>
            <button
              onClick={() => setView('schedule')}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${view === 'schedule' ? 'bg-gold-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              Schedule
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-gold-400 transition-colors">
              <Plus className="h-4 w-4" />
              Add Staff
            </button>
          </div>
        }
      />

      {/* Error Banner */}
      {staffError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-300">Unable to load staff data</p>
            <p className="text-xs text-red-400/70">The backend API may be unavailable. Showing empty state.</p>
          </div>
        </div>
      )}

      {/* Staff Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Staff</p>
              <p className="text-xl font-bold text-white font-mono">{staffList.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <Clock className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Available Now</p>
              <p className="text-xl font-bold text-white font-mono">{staffList.filter((s: any) => s?.available).length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gold-500/10 p-2">
              <TrendingUp className="h-5 w-5 text-gold-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Avg. Utilization</p>
              <p className="text-xl font-bold text-white font-mono">0%</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-2">
              <DollarSign className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Revenue</p>
              <p className="text-xl font-bold text-white font-mono">$0</p>
            </div>
          </div>
        </div>
      </div>

      {view === 'list' ? (
        /* Staff List */
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Staff Member</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Services</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Performance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-slate-500 mx-auto" />
                    </td>
                  </tr>
                ) : staffList.length > 0 ? (
                  staffList.map((member: any, i: number) => (
                    <tr key={member?.id || i} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">{member?.name?.charAt(0) || member?.full_name?.charAt(0) || '?'}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{member?.name || member?.full_name || 'Unknown'}</p>
                            <p className="text-xs text-slate-500">{member?.role || 'Stylist'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Mail className="h-3 w-3" />
                            {member?.email || 'No email'}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Phone className="h-3 w-3" />
                            {member?.phone || member?.phone_number || 'No phone'}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {member?.services?.slice(0, 3).map((service: string, j: number) => (
                            <span key={j} className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                              {service}
                            </span>
                          )) || <span className="text-xs text-slate-500">No services assigned</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <DollarSign className="h-3 w-3" />
                            ${(member?.revenue || 0).toLocaleString()} this month
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Star className="h-3 w-3" />
                            {member?.rating || 'N/A'} rating
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={member?.available || member?.is_active ? 'Available' : 'Busy'}
                          variant={member?.available || member?.is_active ? 'success' : 'warning'}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition-colors">
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-12">
                      <EmptyState
                        title="No staff members"
                        description="Add your first staff member to get started"
                        icon={<Users className="h-12 w-12" />}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Staff Schedule View */
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Staff Schedule</h3>
          {scheduleError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 mb-4 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <p className="text-xs text-red-300">Unable to load schedule data</p>
            </div>
          )}
          {scheduleList.length > 0 ? (
            <div className="space-y-4">
              {scheduleList.map((member: any, i: number) => (
                <div key={member?.id || i} className="rounded-lg bg-slate-800/50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">{member?.name?.charAt(0) || '?'}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{member?.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">{member?.role || 'Stylist'}</p>
                      </div>
                    </div>
                    <StatusBadge
                      status={member?.available ? 'Available' : 'Busy'}
                      variant={member?.available ? 'success' : 'warning'}
                    />
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, j) => (
                      <div key={j} className="text-center">
                        <p className="text-xs font-medium text-slate-500 mb-1">{day}</p>
                        <div className={`rounded-lg p-2 ${member?.schedule?.[day] ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-slate-800/50'}`}>
                          <p className="text-xs text-slate-400">{member?.schedule?.[day] || 'Off'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No schedule data"
              description="Staff schedules will appear here once configured"
              icon={<Calendar className="h-12 w-12" />}
            />
          )}
        </div>
      )}
    </div>
  );
}
