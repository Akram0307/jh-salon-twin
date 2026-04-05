'use client';

import React from 'react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import ServiceDialog from '@/components/services/ServiceDialog';
import ServicePerformanceSparklines from '@/components/services/ServicePerformanceSparklines';
import { Clock, DollarSign, Users, Tag } from 'lucide-react';

interface ServiceMobileCardProps {
  service: any;
  onServiceSaved: () => void;
}

export default function ServiceMobileCard({ service, onServiceSaved }: ServiceMobileCardProps) {
  const isActive = service?.active || service?.is_active;
  
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:border-slate-700 transition-colors">
      {/* Header: Name, Category, Status */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-white truncate">
            {service?.name || 'Unnamed Service'}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <Tag className="h-3 w-3 text-slate-500 flex-shrink-0" />
            <span className="text-xs text-slate-500 truncate">
              {service?.category || 'Uncategorized'}
            </span>
          </div>
        </div>
        <StatusBadge
          status={isActive ? 'Active' : 'Inactive'}
          variant={isActive ? 'success' : 'neutral'}
        />
      </div>

      {/* Description (truncated) */}
      {service?.description && (
        <p className="text-sm text-slate-400 mb-3 line-clamp-2">
          {service.description}
        </p>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-blue-500/10 p-1.5">
            <Clock className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Duration</p>
            <p className="text-sm font-medium text-white font-mono">{service?.duration || 0} min</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-emerald-500/10 p-1.5">
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Price</p>
            <p className="text-sm font-medium text-white font-mono">${(service?.price || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/50 mb-3">
        <div className="text-center">
          <p className="text-xs text-slate-500">Bookings</p>
          <p className="text-sm font-medium text-white font-mono">{service?.bookings || 0}</p>
        </div>
        <div className="h-8 w-px bg-slate-700" />
        <div className="text-center">
          <p className="text-xs text-slate-500">Revenue</p>
          <p className="text-sm font-medium text-emerald-400 font-mono">${(service?.revenue || 0).toLocaleString()}</p>
        </div>
        <div className="h-8 w-px bg-slate-700" />
        <div className="text-center">
          <p className="text-xs text-slate-500">Staff</p>
          <p className="text-sm font-medium text-white font-mono">{service?.staffCount || 0}</p>
        </div>
      </div>

      {/* Sparkline & Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800">
        <ServicePerformanceSparklines services={[service]} />
        <ServiceDialog service={service} onServiceSaved={onServiceSaved} />
      </div>
    </div>
  );
}
