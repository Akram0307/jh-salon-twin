'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { GripVertical, Clock, User, Scissors } from 'lucide-react';

interface DraggableAppointmentProps {
  id: string;
  appointment: {
    id: string;
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
    price?: number;
  };
  onClick?: () => void;
}

export function DraggableAppointment({ id, appointment, onClick }: DraggableAppointmentProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getStatusVariant = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      case 'completed': return 'info';
      default: return 'neutral';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-full text-left rounded-lg bg-slate-800/50 p-2 mb-1 border-l-2 border-gold-500 transition-all cursor-pointer group ${
        isDragging ? 'opacity-50 shadow-lg scale-105 z-50' : 'hover:bg-slate-700/50'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-slate-700/50 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4 text-slate-500" />
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-white truncate">
              {appointment.clientName || appointment.client_name || 'Client'}
            </span>
            <StatusBadge 
              status={appointment.status || 'pending'} 
              variant={getStatusVariant(appointment.status)} 
            />
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <Scissors className="h-3 w-3" />
            <span className="truncate">{appointment.serviceName || appointment.service_name || 'Service'}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <User className="h-3 w-3" />
            <span className="truncate">{appointment.staffName || appointment.staff_name || 'Staff'}</span>
          </div>
          {appointment.duration && (
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <Clock className="h-3 w-3" />
              <span>{appointment.duration} min</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DraggableAppointment;
