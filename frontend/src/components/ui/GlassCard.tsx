import React from 'react';
import { cn } from '../../lib/utils';
import { radius, glass, transition } from '../../lib/design-tokens';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Variant determines the glass effect intensity */
  variant?: 'default' | 'prominent' | 'subtle';
}

export const GlassCard = ({ 
  className, 
  children, 
  variant = 'default',
  ...props 
}: GlassCardProps) => {
  const glassClasses = {
    default: glass.default,
    prominent: glass.prominent,
    subtle: glass.subtle,
  };

  return (
    <div
      className={cn(
        radius.xl,
        glassClasses[variant],
        transition.default,
        className
      )}
      role="region"
      aria-label="Glass card container"
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
