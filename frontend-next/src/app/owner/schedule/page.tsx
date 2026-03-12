'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { api } from '@/lib/api';
import { Calendar, Clock, User, Scissors, Plus, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { format, addDays, startOfWeek } from 'date-fns';

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week'>('day');

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['schedule', 'appointments', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: () => api.appointments.list({ date: format(selectedDate, 'yyyy-MM-dd') }),
  });

  const { data: staff } = useQuery({
    queryKey: ['staff'],
    queryFn: () => api.staff.list(),
  });

  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 8;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const weekDays = view === 'week' 
    ? Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(selectedDate), i))
    : [selectedDate];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedule"
        description="Appointment calendar and time management"
        breadcrumbs={[{ label: 'Owner HQ', href: '/owner/dashboard' }, { label: 'Schedule' }]}
        actions={
          <button className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-gold-400 transition-colors">
            <Plus className="h-4 w-4" />
            New Appointment
          </button>
        }
      />

      {/* Date Navigation & View Toggle */}
      <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSelectedDate(addDays(selectedDate, -1))}
            className="rounded-lg p-2 hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-slate-400" />
          </button>
          <div className="text-lg font-semibold text-white">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </div>
          <button 
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            className="rounded-lg p-2 hover:bg-slate-800 transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-slate-400" />
          </button>
          <button 
            onClick={() => setSelectedDate(new Date())}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('day')}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${view === 'day' ? 'bg-gold-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            Day
          </button>
          <button
            onClick={() => setView('week')}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${view === 'week' ? 'bg-gold-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            Week
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        {/* Header Row */}
        <div className="grid border-b border-slate-800" style={{ gridTemplateColumns: `80px repeat(${weekDays.length}, 1fr)` }}>
          <div className="p-3 text-xs font-medium text-slate-500 border-r border-slate-800">Time</div>
          {weekDays.map((day, i) => (
            <div key={i} className={`p-3 text-center border-r border-slate-800 last:border-r-0 ${format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'bg-gold-500/10' : ''}`}>
              <div className="text-xs font-medium text-slate-400">{format(day, 'EEE')}</div>
              <div className={`text-lg font-semibold ${format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'text-gold-400' : 'text-white'}`}>{format(day, 'd')}</div>
            </div>
          ))}
        </div>

        {/* Time Slots */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {timeSlots.map((time) => (
              <div key={time} className="grid" style={{ gridTemplateColumns: `80px repeat(${weekDays.length}, 1fr)` }}>
                <div className="p-3 text-xs font-mono text-slate-500 border-r border-slate-800 flex items-start">
                  {time}
                </div>
                {weekDays.map((day, dayIndex) => {
                  const dayAppointments = appointments?.filter((apt: any) => 
                    apt.startTime?.startsWith(time.slice(0, 2)) && 
                    format(new Date(apt.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
                  ) || [];
                  
                  return (
                    <div key={dayIndex} className={`p-2 border-r border-slate-800 last:border-r-0 min-h-[80px] ${format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'bg-gold-500/5' : ''}`}>
                      {dayAppointments.map((apt: any, i: number) => (
                        <div key={i} className="rounded-lg bg-slate-800/80 p-2 mb-1 hover:bg-slate-700/80 transition-colors cursor-pointer">
                          <div className="flex items-center gap-1.5">
                            <User className="h-3 w-3 text-gold-400" />
                            <span className="text-xs font-medium text-white truncate">{apt.clientName || 'Client'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Scissors className="h-3 w-3 text-slate-500" />
                            <span className="text-xs text-slate-400 truncate">{apt.serviceName || 'Service'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Staff Availability Sidebar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Staff Availability</h3>
        {staff && staff.length > 0 ? (
          <div className="space-y-3">
            {staff.map((member: any, i: number) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{member.name}</p>
                    <p className="text-xs text-slate-500">{member.role || 'Stylist'}</p>
                  </div>
                </div>
                <StatusBadge
                  status={member.available ? 'Available' : 'Busy'}
                  variant={member.available ? 'success' : 'warning'}
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No staff members"
            description="Add staff members to see their availability"
            icon={<User className="h-12 w-12" />}
          />
        )}
      </div>
    </div>
  );
}
