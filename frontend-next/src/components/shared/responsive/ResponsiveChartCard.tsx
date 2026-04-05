'use client';

import { ReactNode } from 'react';

interface ResponsiveChartCardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function ResponsiveChartCard({ title, children, className = '' }: ResponsiveChartCardProps) {
  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5 ${className}`}>
      <h3 className="text-white font-semibold mb-4">{title}</h3>
      <div className="h-[240px] sm:h-[280px] lg:h-[320px]">
        {children}
      </div>
    </div>
  );
}
