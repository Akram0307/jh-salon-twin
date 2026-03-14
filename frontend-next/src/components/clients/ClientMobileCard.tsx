import React from 'react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Mail, Phone, Calendar, DollarSign } from 'lucide-react';

interface ClientMobileCardProps {
  client: {
    name?: string;
    email?: string;
    phone?: string;
    lastVisit?: string;
    totalSpent?: number;
    segment?: string;
    totalVisits?: number;
  };
  onViewProfile?: () => void;
}

export function ClientMobileCard({ client, onViewProfile }: ClientMobileCardProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center">
            <span className="text-sm font-medium text-white">{client.name?.charAt(0) || '?'}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-white">{client.name || 'Unknown'}</p>
            <p className="text-xs text-slate-500">{client.totalVisits || 0} visits</p>
          </div>
        </div>
        <StatusBadge
          status={client.segment || 'Regular'}
          variant={
            client.segment === 'vip' ? 'success' :
            client.segment === 'new' ? 'info' :
            client.segment === 'at-risk' ? 'warning' : 'neutral'
          }
        />
      </div>
      
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Mail className="h-3 w-3" />
          <span className="truncate">{client.email || 'No email'}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Phone className="h-3 w-3" />
          <span>{client.phone || 'No phone'}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Calendar className="h-3 w-3" />
          <span>{client.lastVisit ? new Date(client.lastVisit).toLocaleDateString() : 'Never'}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <DollarSign className="h-3 w-3" />
          <span className="font-mono">${(client.totalSpent || 0).toLocaleString()}</span>
        </div>
      </div>
      
      <div className="mt-4">
        <button
          onClick={onViewProfile}
          className="w-full rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
        >
          View Profile
        </button>
      </div>
    </div>
  );
}
