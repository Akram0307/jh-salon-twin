import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { radius, glass, transition, typography, roleAccents } from '../../lib/design-tokens';

// Glassmorphism surface for role-based UI
// premium_v4 spec: rounded-[28px], bg-zinc-900/70, backdrop-blur-lg, semantic.border.default

type Role = 'owner' | 'manager' | 'staff' | 'client';

interface RoleSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  role: Role;
  children: ReactNode;
}

export function RoleSurface({ role, className, children, ...props }: RoleSurfaceProps) {
  return (
    <div
      className={cn(
        radius.xl,
        glass.default,
        'border-l-4',
        roleAccents[role].border,
        transition.default,
        className
      )}
      role="region"
      aria-label={`${role} role surface`}
      {...props}
    >
      {children}
    </div>
  );
}

interface RoleHeroProps extends HTMLAttributes<HTMLDivElement> {
  role: Role;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export function RoleHero({ role, title, subtitle, className, children, ...props }: RoleHeroProps) {
  return (
    <div
      className={cn(
        radius.xl,
        glass.default,
        'relative overflow-hidden',
        transition.default,
        className
      )}
      role="banner"
      aria-label={`${role} hero section`}
      {...props}
    >
      <div 
        className={cn('absolute inset-0 bg-gradient-to-br', roleAccents[role].gradient)} 
        aria-hidden="true"
      />
      <div className="relative px-6 py-8 sm:px-8 sm:py-10">
        <h1 className={cn(typography.size['2xl'], typography.weight.semibold, 'text-white')}>
          {title}
        </h1>
        {subtitle && (
          <p className={cn('mt-2', 'text-zinc-400')}>{subtitle}</p>
        )}
        {children}
      </div>
    </div>
  );
}

interface RoleStatGridProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function RoleStatGrid({ className, children, ...props }: RoleStatGridProps) {
  return (
    <div
      className={cn(
        'grid gap-4 sm:grid-cols-2 lg:grid-cols-4',
        className
      )}
      role="grid"
      aria-label="Statistics grid"
      {...props}
    >
      {children}
    </div>
  );
}

interface RoleSectionProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  children: ReactNode;
}

export function RoleSection({ title, className, children, ...props }: RoleSectionProps) {
  return (
    <section
      className={cn(
        radius.xl,
        glass.default,
        'p-5',
        transition.default,
        className
      )}
      aria-labelledby={title ? `section-title-${title.toLowerCase().replace(/\s/g, '-')}` : undefined}
      {...props}
    >
      {title && (
        <h2 
          id={`section-title-${title.toLowerCase().replace(/\s/g, '-')}`}
          className={cn(typography.size.xl, typography.weight.medium, 'text-white', 'mb-4')}
        >
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

export default RoleSurface;
