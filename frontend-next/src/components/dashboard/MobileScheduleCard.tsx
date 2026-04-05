'use client';

import { StatusBadge } from '@/components/shared/StatusBadge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface Appointment {
  clientName?: string;
  serviceName?: string;
  time?: string;
  status?: string;
  staffName?: string;
  notes?: string;
}

interface MobileScheduleCardProps {
  appointment: Appointment;
}

export function MobileScheduleCard({ appointment }: MobileScheduleCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-mono text-white">
              {appointment.time || '--:--'}
            </span>
            <StatusBadge
              status={appointment.status || 'pending'}
              variant={
                appointment.status === 'confirmed'
                  ? 'success'
                  : appointment.status === 'in-progress'
                  ? 'warning'
                  : 'neutral'
              }
            />
          </div>
          <p className="text-sm font-medium text-white truncate">
            {appointment.clientName || 'Unknown Client'}
          </p>
          <p className="text-xs text-slate-500 truncate">
            {appointment.serviceName || 'Service'}
            {appointment.staffName && ` • ${appointment.staffName}`}
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 text-slate-400 hover:text-white"
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>
      {expanded && appointment.notes && (
        <div className="mt-3 pt-3 border-t border-slate-800">
          <p className="text-xs text-slate-400">{appointment.notes}</p>
        </div>
      )}
    </div>
  );
}
