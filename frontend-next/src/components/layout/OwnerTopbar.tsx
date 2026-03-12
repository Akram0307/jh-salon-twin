'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Search,
  Bell,
  Menu,
  ChevronRight,
  Activity,
  User,
  Settings,
  LogOut,
} from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

const routeLabels: Record<string, string> = {
  owner: 'Owner HQ',
  dashboard: 'Dashboard',
  schedule: 'Schedule',
  clients: 'Clients',
  staff: 'Staff',
  services: 'Services',
  reports: 'Reports',
  settings: 'Settings',
};

function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];
  let currentPath = '';

  for (const segment of segments) {
    currentPath += `/${segment}`;
    breadcrumbs.push({
      label: routeLabels[segment] || segment,
      href: currentPath,
    });
  }

  return breadcrumbs;
}

interface OwnerTopbarProps {
  onMenuClick?: () => void;
  sidebarCollapsed?: boolean;
}

export function OwnerTopbar({ onMenuClick, sidebarCollapsed = false }: OwnerTopbarProps) {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);
  const pageTitle = breadcrumbs[breadcrumbs.length - 1]?.label || 'Owner HQ';

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-16 items-center justify-between border-b px-4 lg:px-6',
        // Glass morphism styling
        'bg-[rgba(18,18,24,0.85)] backdrop-blur-[30px] saturate-[200%] border-[rgba(255,255,255,0.06)]'
      )}
    >
      {/* Left section: Menu button + Breadcrumbs */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-[oklch(0.70_0.008_264)] hover:bg-[oklch(0.16_0.010_264)] hover:text-[oklch(0.95_0.005_264)] transition-colors focus-ring lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="h-3 w-3 text-[oklch(0.50_0.005_264)]" />
              )}
              {crumb.href && index < breadcrumbs.length - 1 ? (
                <Link
                  href={crumb.href}
                  className="text-sm text-[oklch(0.70_0.008_264)] hover:text-[oklch(0.95_0.005_264)] transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-sm font-medium text-[oklch(0.95_0.005_264)]">
                  {crumb.label}
                </span>
              )}
            </div>
          ))}
        </nav>

        {/* Mobile page title */}
        <h1 className="text-sm font-semibold text-[oklch(0.95_0.005_264)] sm:hidden">
          {pageTitle}
        </h1>
      </div>

      {/* Center section: Search */}
      <div className="hidden md:flex flex-1 max-w-md mx-8">
        <button
          className="flex w-full items-center gap-2 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[oklch(0.12_0.008_264)] px-3 py-2 text-sm text-[oklch(0.50_0.005_264)] hover:bg-[oklch(0.16_0.010_264)] transition-colors focus-ring"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search clients, staff, services...</span>
          <kbd className="rounded bg-[oklch(0.08_0.005_264)] px-1.5 py-0.5 text-[10px] font-medium">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right section: Actions */}
      <div className="flex items-center gap-1">
        {/* System pulse indicator */}
        <div
          className="hidden sm:flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
          title="System status: All systems operational"
          role="status"
          aria-label="System status: Online"
        >
          <Activity className="h-4 w-4 text-[oklch(0.70_0.18_145)]" />
          <span className="text-[oklch(0.70_0.008_264)]">Online</span>
          <div className="h-1.5 w-1.5 rounded-full bg-[oklch(0.70_0.18_145)] animate-pulse" />
        </div>

        {/* Notifications */}
        <button
          className="relative rounded-lg p-2 text-[oklch(0.70_0.008_264)] hover:bg-[oklch(0.16_0.010_264)] hover:text-[oklch(0.95_0.005_264)] transition-colors focus-ring"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {/* Notification badge */}
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[oklch(0.60_0.22_25)]" />
        </button>

        {/* Profile menu placeholder */}
        <button
          className="flex items-center gap-2 rounded-lg p-2 text-[oklch(0.70_0.008_264)] hover:bg-[oklch(0.16_0.010_264)] hover:text-[oklch(0.95_0.005_264)] transition-colors focus-ring"
          aria-label="User menu"
        >
          <div className="h-7 w-7 rounded-full bg-[oklch(0.20_0.012_264)] border border-[rgba(255,255,255,0.06)] flex items-center justify-center">
            <User className="h-4 w-4" />
          </div>
        </button>
      </div>
    </header>
  );
}
