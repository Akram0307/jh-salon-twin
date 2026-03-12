import React from 'react';
import { cn } from '../../lib/utils';
import { radius, transition, typography, glass, semantic } from '../../lib/design-tokens';

type BadgeVariant = 'default' | 'secondary' | 'emerald' | 'amber' | 'violet' | 'sky' | 'rose' | 'ghost';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: `${semantic.border.default} ${glass.subtle} text-zinc-300`,
  secondary: `${semantic.border.default} bg-zinc-800/50 text-zinc-400`,
  emerald: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200',
  amber: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
  violet: 'border-violet-500/20 bg-violet-500/10 text-violet-200',
  sky: 'border-sky-500/20 bg-sky-500/10 text-sky-200',
  rose: 'border-rose-500/20 bg-rose-500/10 text-rose-200',
  ghost: 'border-transparent bg-transparent text-zinc-400',
};

export function Badge({
  variant = 'default',
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center',
        radius.full,
        'border px-2 py-0.5',
        typography.size.xs,
        typography.weight.medium,
        typography.tracking.wider,
        'uppercase',
        variantClasses[variant],
        transition.default,
        className
      )}
      role="status"
      aria-label={typeof children === 'string' ? children : 'Badge'}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;
