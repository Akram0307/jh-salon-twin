'use client';

import { format } from 'date-fns';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Clock, User, Scissors } from 'lucide-react';

interface Appointment {
  id?: string;
  clientName?: string;
  client_name?: string;
  serviceName?: string;
  service_name?: string;
  staffName?: string;
  staff_name?: string;
  time?: string;
  start_time?: string;
  duration?: number;
  status?: string;
  notes?: string;
}

interface MobileAgendaViewProps {
  appointments: Appointment[];
  selectedDate: Date;
  onAppointmentClick: (appointment: Appointment) => void;
}

export function MobileAgendaView({ appointments, selectedDate, onAppointmentClick }: MobileAgendaViewProps) {
  const getStatusVariant = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      case 'completed': return 'info';
      default: return 'neutral';
    }
  };

  // Group appointments by time
  const groupedAppointments = appointments.reduce((groups, appointment) => {
    const time = appointment.time || appointment.start_time || '00:00';
    const hour = time.substring(0, 2);
    if (!groups[hour]) {
      groups[hour] = [];
    }
    groups[hour].push(appointment);
    return groups;
  }, {} as Record<string, Appointment[]>);

  // Sort hours
  const sortedHours = Object.keys(groupedAppointments).sort();

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-slate-400">
        {format(selectedDate, 'EEEE, MMMM d')}
      </div>
      
      {sortedHours.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-center">
          <p className="text-slate-400">No appointments scheduled</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedHours.map((hour) => (
            <div key={hour} className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <Clock className="h-4 w-4 text-slate-500" />
                <span>{hour}:00</span>
              </div>
              
              <div className="space-y-2 pl-6">
                {groupedAppointments[hour].map((appointment, index) => (
                  <button
                    key={appointment.id || index}
                    onClick={() => onAppointmentClick(appointment)}
                    className="w-full text-left rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-slate-500 flex-shrink-0" />
                          <span className="font-medium text-white truncate">
                            {appointment.clientName || appointment.client_name || 'Client'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                          <Scissors className="h-3 w-3 text-slate-500 flex-shrink-0" />
                          <span className="truncate">
                            {appointment.serviceName || appointment.service_name || 'Service'}
                          </span>
                        </div>
                        
                        <div className="text-xs text-slate-500">
                          {appointment.staffName || appointment.staff_name || 'Staff'}
                          {appointment.duration && ` • ${appointment.duration} min`}
                        </div>
                      </div>
                      
                      <StatusBadge 
                        status={appointment.status || 'pending'} 
                        variant={getStatusVariant(appointment.status)} 
                      />
                    </div>
                    
                    {appointment.notes && (
                      <div className="mt-2 text-xs text-slate-500 line-clamp-2">
                        {appointment.notes}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MobileAgendaView;
