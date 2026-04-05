import React from 'react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Mail, Phone, Clock, Star, DollarSign, MoreVertical } from 'lucide-react';
import AvailabilityToggle from './AvailabilityToggle';
import ActionOverflowMenu from './ActionOverflowMenu';

interface StaffMobileCardProps {
  member: any;
  index: number;
}

export default function StaffMobileCard({ member, index }: StaffMobileCardProps) {
  const primaryActions = [
    {
      label: 'View Profile',
      onClick: () => console.log('View profile', member?.id),
    },
  ];

  const secondaryActions = [
    {
      label: 'Edit Schedule',
      onClick: () => console.log('Edit schedule', member?.id),
    },
    {
      label: 'Performance',
      onClick: () => console.log('View performance', member?.id),
    },
    {
      label: 'Contact',
      onClick: () => console.log('Contact', member?.id),
    },
  ];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
      {/* Header with name and status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {member?.name?.charAt(0) || member?.full_name?.charAt(0) || '?'}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              {member?.name || member?.full_name || 'Unknown'}
            </p>
            <p className="text-xs text-slate-500">{member?.role || 'Stylist'}</p>
          </div>
        </div>
        <AvailabilityToggle
          staffId={member?.id || index.toString()}
          initialAvailable={member?.available || member?.is_active}
        />
      </div>

      {/* Contact info */}
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

      {/* Services */}
      <div className="flex flex-wrap gap-1">
        {member?.services?.slice(0, 3).map((service: string, j: number) => (
          <span key={j} className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
            {service}
          </span>
        )) || <span className="text-xs text-slate-500">No services assigned</span>}
      </div>

      {/* Performance metrics */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          <DollarSign className="h-3 w-3" />
          ${(member?.revenue || 0).toLocaleString()} this month
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Star className="h-3 w-3" />
          {member?.rating || 'N/A'} rating
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
        <div className="flex gap-2">
          {primaryActions.map((action, i) => (
            <button
              key={i}
              onClick={action.onClick}
              className="flex-1 rounded-lg bg-gold-500 px-3 py-2 text-xs font-medium text-slate-950 hover:bg-gold-400 transition-colors min-h-11"
            >
              {action.label}
            </button>
          ))}
          <ActionOverflowMenu actions={secondaryActions} />
        </div>
      </div>
    </div>
  );
}
