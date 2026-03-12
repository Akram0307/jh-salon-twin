import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { radius, glass, transition, typography, padding } from '../../lib/design-tokens';

type Props = HTMLAttributes<HTMLDivElement> & { children?: ReactNode };

export function Card({ className, children, ...props }: Props) {
  return (
    <div
      className={cn(
        radius.xl,
        glass.default,
        transition.default,
        className
      )}
      role="region"
      aria-label="Card container"
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: Props) {
  return (
    <div 
      className={cn(padding.xl, 'pb-2', className)} 
      role="heading"
      aria-level={3}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: Props) {
  return (
    <div 
      className={cn(typography.size.xl, typography.weight.semibold, 'text-white', className)} 
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({ className, children, ...props }: Props) {
  return (
    <div 
      className={cn(padding.xl, 'pt-2', className)} 
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
