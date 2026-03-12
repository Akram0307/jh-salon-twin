import React from 'react';
import { cn } from '../../lib/utils';
import { glass, radius, transition } from '../../lib/design-tokens';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Variant determines the skeleton shape */
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  /** Animation speed */
  animation?: 'fast' | 'default' | 'slow' | 'none';
}

export const Skeleton = ({ 
  className, 
  variant = 'rectangular',
  animation = 'default',
  ...props 
}: SkeletonProps) => {
  const variantClasses = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: radius.md,
    card: `${radius.xl} h-32 w-full`,
  };

  const animationClasses = {
    fast: 'animate-pulse duration-500',
    default: 'animate-pulse',
    slow: 'animate-pulse duration-700',
    none: '',
  };

  return (
    <div
      className={cn(
        glass.default,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      role="status"
      aria-label="Loading content"
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Pre-built skeleton patterns for common use cases

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div 
      className={cn(radius.xl, 'bg-zinc-900/70 p-5', className)}
      role="status"
      aria-label="Loading card"
    >
      <div className="space-y-3">
        <Skeleton variant="text" className="w-1/3" />
        <Skeleton variant="text" className="w-2/3" />
        <Skeleton variant="text" className="w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonKpiCard({ className }: { className?: string }) {
  return (
    <div 
      className={cn(
        radius.xl,
        'bg-zinc-900/70 p-4 sm:p-4.5 xl:p-5',
        'min-h-[118px] sm:min-h-[128px] xl:min-h-[140px]',
        className
      )}
      role="status"
      aria-label="Loading KPI card"
    >
      <div className="flex flex-col justify-between gap-3 h-full">
        <Skeleton variant="text" className="w-16 h-3" />
        <Skeleton variant="text" className="w-24 h-8" />
        <Skeleton variant="text" className="w-20 h-4" />
      </div>
    </div>
  );
}

export function SkeletonList({ 
  items = 3, 
  className 
}: { 
  items?: number; 
  className?: string 
}) {
  return (
    <div 
      className={cn('space-y-2', className)}
      role="status"
      aria-label={`Loading ${items} items`}
    >
      {Array.from({ length: items }).map((_, i) => (
        <Skeleton key={i} variant="text" className="w-full" />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ className }: { className?: string }) {
  return (
    <Skeleton 
      variant="circular" 
      className={cn('h-10 w-10', className)}
      role="status"
      aria-label="Loading avatar"
    />
  );
}

export function SkeletonButton({ className }: { className?: string }) {
  return (
    <Skeleton 
      variant="rectangular" 
      className={cn(radius.md, 'h-10 w-24', className)}
      role="status"
      aria-label="Loading button"
    />
  );
}

export default Skeleton;
