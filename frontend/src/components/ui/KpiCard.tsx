import React from 'react';
import { cn } from '../../lib/utils';
import { radius, glass, transition, shadow, typography } from '../../lib/design-tokens';

interface KpiCardProps {
  title: string;
  value: string | number;
  hint?: string;
  ariaLabel?: string;
  className?: string;
}

export default function KpiCard({
  title,
  value,
  hint,
  ariaLabel,
  className
}: KpiCardProps) {
  return (
    <div
      className={cn(
        radius.xl,
        glass.default,
        glass.gradient,
        shadow.md,
        transition.default,
        'group relative overflow-hidden semantic.border.default',
        'px-4 py-4 sm:px-5 sm:py-5 xl:px-5 xl:py-5',
        'hover:-translate-y-0.5 hover:shadow-[0_24px_80px_rgba(0,0,0,0.3)]',
        'hover:border-emerald-300/20 hover:glass.strong',
        className
      )}
      role="article"
      aria-label={ariaLabel || `${title}: ${value}`}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.08),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.05),transparent_45%)] opacity-95"
        aria-hidden="true"
      />

      <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" aria-hidden="true" />

      <div className="relative flex min-h-[126px] flex-col justify-between gap-3 sm:min-h-[132px] xl:min-h-[140px]">
        <div>
          <p className={cn(
            typography.size.xs,
            typography.weight.semibold,
            typography.tracking.wider,
            'uppercase text-zinc-500'
          )}>
            {title}
          </p>
          <p className="mt-3 text-[1.75rem] font-semibold tracking-tight text-white sm:text-[2rem] xl:text-[2.15rem]">
            {value}
          </p>
        </div>
        {hint ? (
          <p className="max-w-[30ch] text-sm leading-6 text-zinc-400">{hint}</p>
        ) : (
          <div className="h-6" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
