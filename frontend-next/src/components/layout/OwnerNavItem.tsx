'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { component } from '@/lib/design-tokens';

interface OwnerNavItemProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
  collapsed?: boolean;
}

export function OwnerNavItem({
  href,
  icon: Icon,
  label,
  badge,
  collapsed = false,
}: OwnerNavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-ring',
        isActive
          ? 'bg-[var(--nav-item-active)] text-foreground'
          : 'text-muted-foreground hover:bg-[var(--nav-item-hover)] hover:text-foreground',
        collapsed && 'justify-center px-2'
      )}
      title={collapsed ? label : undefined}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && (
        <span className="flex-1">{label}</span>
      )}
      {!collapsed && badge && (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
          {badge}
        </span>
      )}
    </Link>
  );
}
