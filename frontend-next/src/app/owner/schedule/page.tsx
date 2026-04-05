'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import AppointmentDetailModal from '@/components/schedule/AppointmentDetailModal';
import MobileAgendaView from '@/components/schedule/MobileAgendaView';
import ScheduleFilterBar from '@/components/schedule/ScheduleFilterBar';
import TimelineScrollShell from '@/components/schedule/TimelineScrollShell';
import { DraggableAppointment } from '@/components/schedule/DraggableAppointment';
import { DroppableTimeSlot } from '@/components/schedule/DroppableTimeSlot';
import { api } from '@/lib/api';
import { Calendar, Clock, User, Scissors, Plus, Loader2, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { useState, useCallback } from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week'>('day');
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { data: appointments, isLoading, error: appointmentsError, refetch } = useQuery({
    queryKey: ['schedule', 'appointments', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: () => api.appointments.list({ date: format(selectedDate, 'yyyy-MM-dd') }),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const { data: staff, error: staffError } = useQuery({
    queryKey: ['staff'],
    queryFn: () => api.staff.list(),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.appointments.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', 'appointments'] });
      setConflictWarning(null);
    },
    onError: (error: any) => {
      if (error.message?.includes('conflict') || error.message?.includes('409')) {
        setConflictWarning('This time slot conflicts with an existing appointment.');
      }
    },
  });

  const appointmentsList = Array.isArray(appointments) ? appointments : [];
  const staffList = Array.isArray(staff) ? staff : [];

  const filteredAppointments = appointmentsList.filter((apt: any) => {
    if (selectedStaff === 'all') return true;
    return apt?.staffId === selectedStaff || apt?.staff_id === selectedStaff;
  });

  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 8;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const weekDays = view === 'week'
    ? Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(selectedDate), i))
    : [selectedDate];

  const getAppointmentsForSlot = (time: string) => {
    return filteredAppointments.filter((apt: any) => {
      const aptTime = apt?.time || apt?.start_time || '';
      return aptTime.startsWith(time.substring(0, 2));
    });
  };

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      case 'completed': return 'info';
      default: return 'neutral';
    }
  };

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setConflictWarning(null);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Extract time from droppable id (format: "time-slot-HH:00" or "time-slot-HH:00-day-index")
    const overData = over.data?.current;
    const newTime = overData?.time;

    if (!newTime) return;

    // Find the appointment being dragged
    const draggedAppointment = appointmentsList.find((apt: any) => apt.id === activeId);
    if (!draggedAppointment) return;

    const currentTime = draggedAppointment.time || draggedAppointment.start_time || '';
    
    // Only update if time actually changed
    if (currentTime.startsWith(newTime.substring(0, 2))) return;

    // Check for conflicts
    const conflictingAppointments = getAppointmentsForSlot(newTime).filter(
      (apt: any) => apt.id !== activeId
    );

    if (conflictingAppointments.length > 0) {
      setConflictWarning(`Cannot move appointment: time slot already occupied by ${conflictingAppointments.length} other appointment(s).`);
      return;
    }

    // Update appointment via API
    updateAppointmentMutation.mutate({
      id: activeId,
      data: {
        time: newTime,
        start_time: newTime,
        date: format(selectedDate, 'yyyy-MM-dd'),
      },
    });
  }, [appointmentsList, selectedDate, updateAppointmentMutation, getAppointmentsForSlot]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const activeAppointment = activeId
    ? appointmentsList.find((apt: any) => apt.id === activeId)
    : null;

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 space-y-4 sm:space-y-6">
      <PageHeader
        title="Schedule"
        description="Appointment calendar and time management"
        breadcrumbs={[{ label: 'Owner HQ', href: '/owner/dashboard' }, { label: 'Schedule' }]}
        actions={
          <button className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-gold-400 transition-colors min-h-11">
            <Plus className="h-4 w-4" />
            New Appointment
          </button>
        }
      />

      {/* Error Banner */}
      {(appointmentsError || staffError) && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-300">Unable to load schedule data</p>
            <p className="text-xs text-red-400/70">The backend API may be unavailable. Showing empty state.</p>
          </div>
        </div>
      )}

      {/* Conflict Warning Banner */}
      {conflictWarning && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-300">Scheduling Conflict</p>
            <p className="text-xs text-yellow-400/70">{conflictWarning}</p>
          </div>
          <button
            onClick={() => setConflictWarning(null)}
            className="ml-auto text-yellow-400 hover:text-yellow-300"
          >
            ×
          </button>
        </div>
      )}

      {/* Mobile Filter Bar - visible on mobile, hidden on desktop */}
      <div className="block lg:hidden">
        <ScheduleFilterBar
          staff={staffList}
          selectedStaffId={selectedStaff}
          onStaffSelect={(staffId) => setSelectedStaff(staffId || 'all')}
          view={view}
          onViewChange={setView}
        />
      </div>

      {/* Desktop Date Navigation & View Toggle - hidden on mobile, visible on desktop */}
      <div className="hidden lg:flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, -1))}
            className="rounded-lg p-2 hover:bg-slate-800 transition-colors min-h-11 min-w-11 flex items-center justify-center"
          >
            <ChevronLeft className="h-5 w-5 text-slate-400" />
          </button>
          <div className="text-lg font-semibold text-white">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </div>
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            className="rounded-lg p-2 hover:bg-slate-800 transition-colors min-h-11 min-w-11 flex items-center justify-center"
          >
            <ChevronRight className="h-5 w-5 text-slate-400" />
          </button>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors min-h-11"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('day')}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors min-h-11 ${view === 'day' ? 'bg-gold-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              Day
            </button>
            <button
              onClick={() => setView('week')}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors min-h-11 ${view === 'week' ? 'bg-gold-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Date Navigation - visible on mobile, hidden on desktop */}
      <div className="block lg:hidden">
        <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, -1))}
            className="rounded-lg p-2 hover:bg-slate-800 transition-colors min-h-11 min-w-11 flex items-center justify-center"
          >
            <ChevronLeft className="h-5 w-5 text-slate-400" />
          </button>
          <div className="text-center">
            <div className="text-sm font-medium text-white">
              {format(selectedDate, 'EEE, MMM d')}
            </div>
            <div className="text-xs text-slate-400">
              {format(selectedDate, 'yyyy')}
            </div>
          </div>
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            className="rounded-lg p-2 hover:bg-slate-800 transition-colors min-h-11 min-w-11 flex items-center justify-center"
          >
            <ChevronRight className="h-5 w-5 text-slate-400" />
          </button>
        </div>
        <div className="flex justify-center mt-2">
          <button
            onClick={() => setSelectedDate(new Date())}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors min-h-11"
          >
            Today
          </button>
        </div>
      </div>

      {/* Mobile Agenda View - visible on mobile, hidden on desktop */}
      <div className="block lg:hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
          </div>
        ) : (
          <MobileAgendaView
            appointments={filteredAppointments}
            selectedDate={selectedDate}
            onAppointmentClick={setSelectedAppointment}
          />
        )}
      </div>

      {/* Desktop Calendar Grid - hidden on mobile, visible on desktop */}
      <div className="hidden lg:block rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
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
            <TimelineScrollShell>
              <div className="divide-y divide-slate-800">
                {timeSlots.map((time) => (
                  <div key={time} className="grid" style={{ gridTemplateColumns: `80px repeat(${weekDays.length}, 1fr)` }}>
                    <div className="p-3 text-xs font-medium text-slate-500 border-r border-slate-800 w-16 shrink-0">
                      {time}
                    </div>
                    {weekDays.map((day, dayIndex) => {
                      const slotAppointments = getAppointmentsForSlot(time);
                      return (
                        <DroppableTimeSlot
                          key={dayIndex}
                          id={`time-slot-${time}-${dayIndex}`}
                          time={time}
                          day={format(day, 'yyyy-MM-dd')}
                        >
                          {slotAppointments.map((apt: any, aptIndex: number) => (
                            <DraggableAppointment
                              key={apt?.id || aptIndex}
                              id={apt?.id || `apt-${aptIndex}`}
                              appointment={apt}
                              onClick={() => setSelectedAppointment(apt)}
                            />
                          ))}
                        </DroppableTimeSlot>
                      );
                    })}
                  </div>
                ))}
              </div>
            </TimelineScrollShell>
          )}

          {/* Drag Overlay */}
          <DragOverlay>
            {activeAppointment ? (
              <div className="w-64 rounded-lg bg-slate-800 p-3 shadow-xl border-l-2 border-gold-500 opacity-90">
                <div className="text-sm font-medium text-white truncate">
                  {activeAppointment.clientName || activeAppointment.client_name || 'Client'}
                </div>
                <div className="text-xs text-slate-400 truncate">
                  {activeAppointment.serviceName || activeAppointment.service_name || 'Service'}
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Empty State */}
        {!isLoading && filteredAppointments.length === 0 && (
          <div className="py-12">
            <EmptyState
              title="No appointments scheduled"
              description={selectedStaff !== 'all' ? 'No appointments for selected staff' : 'No appointments for this date'}
              icon={<Calendar className="h-12 w-12" />}
            />
          </div>
        )}
      </div>

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <AppointmentDetailModal
          appointment={{
            id: selectedAppointment?.id,
            clientName: selectedAppointment?.clientName || selectedAppointment?.client_name,
            clientPhone: selectedAppointment?.clientPhone || selectedAppointment?.client_phone,
            clientEmail: selectedAppointment?.clientEmail || selectedAppointment?.client_email,
            serviceName: selectedAppointment?.serviceName || selectedAppointment?.service_name,
            staffName: selectedAppointment?.staffName || selectedAppointment?.staff_name,
            date: selectedAppointment?.date,
            time: selectedAppointment?.time || selectedAppointment?.start_time,
            duration: selectedAppointment?.duration,
            price: selectedAppointment?.price,
            status: selectedAppointment?.status,
            notes: selectedAppointment?.notes,
          }}
          onClose={() => setSelectedAppointment(null)}
          onStatusChange={(status) => {
            console.log('Status changed to:', status);
            setSelectedAppointment(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
