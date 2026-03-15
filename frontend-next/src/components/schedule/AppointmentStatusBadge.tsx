'use client';

import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  CheckCircle, 
  UserCheck, 
  Scissors, 
  CheckSquare,
  Clock
} from 'lucide-react';

// Status configuration
const STATUS_CONFIG = {
  SCHEDULED: {
    label: 'Scheduled',
    color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    icon: Calendar,
    nextStatuses: ['CONFIRMED', 'ARRIVED']
  },
  CONFIRMED: {
    label: 'Confirmed',
    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    icon: CheckCircle,
    nextStatuses: ['ARRIVED', 'IN_PROGRESS']
  },
  ARRIVED: {
    label: 'Arrived',
    color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    icon: UserCheck,
    nextStatuses: ['IN_PROGRESS']
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    icon: Scissors,
    nextStatuses: ['COMPLETED']
  },
  COMPLETED: {
    label: 'Completed',
    color: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    icon: CheckSquare,
    nextStatuses: []
  }
};

interface AppointmentStatusBadgeProps {
  status: keyof typeof STATUS_CONFIG;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function AppointmentStatusBadge({ 
  status, 
  showIcon = true, 
  size = 'md' 
}: AppointmentStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  if (!config) return null;

  const Icon = config.icon;
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <Badge className={`${config.color} ${sizeClasses[size]} border`}>
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {config.label}
    </Badge>
  );
}

// Export status config for use in other components
export { STATUS_CONFIG };
