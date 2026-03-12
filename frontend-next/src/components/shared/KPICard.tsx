'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function KPICard({ title, value, change, changeLabel, icon, className }: KPICardProps) {
  const trendDirection = change && change > 0 ? 'up' : change && change < 0 ? 'down' : 'neutral';
  
  return (
    <div className={cn(
      'rounded-xl border border-slate-800 bg-slate-900/50 p-5',
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="mt-2 text-2xl font-bold text-white font-mono">{value}</p>
        </div>
        {icon && <div className="text-slate-500">{icon}</div>}
      </div>
      {change !== undefined && (
        <div className="mt-3 flex items-center gap-1.5">
          {trendDirection === 'up' && <TrendingUp className="h-4 w-4 text-emerald-400" />}
          {trendDirection === 'down' && <TrendingDown className="h-4 w-4 text-rose-400" />}
          {trendDirection === 'neutral' && <Minus className="h-4 w-4 text-slate-500" />}
          <span className={cn(
            'text-sm font-medium',
            trendDirection === 'up' && 'text-emerald-400',
            trendDirection === 'down' && 'text-rose-400',
            trendDirection === 'neutral' && 'text-slate-500'
          )}>
            {change > 0 ? '+' : ''}{change}%
          </span>
          {changeLabel && <span className="text-xs text-slate-500">{changeLabel}</span>}
        </div>
      )}
    </div>
  );
}
