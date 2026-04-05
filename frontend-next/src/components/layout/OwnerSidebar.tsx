'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { component, primitive } from '@/lib/design-tokens';
import { OwnerNavItem } from './OwnerNavItem';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  UserCog,
  Scissors,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/owner/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Schedule', href: '/owner/schedule', icon: CalendarDays },
      { label: 'Clients', href: '/owner/clients', icon: Users },
      { label: 'Staff', href: '/owner/staff', icon: UserCog },
      { label: 'Services', href: '/owner/services', icon: Scissors },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { label: 'Reports', href: '/owner/reports', icon: BarChart3 },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Settings', href: '/owner/settings', icon: Settings },
    ],
  },
];

interface OwnerSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function OwnerSidebar({
  collapsed,
  onToggle,
  mobileOpen = false,
  onMobileClose,
}: OwnerSidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen border-r transition-all duration-300',
          // Glass morphism styling using component tokens
          'bg-[rgba(12,12,18,0.95)] backdrop-blur-[40px] border-[rgba(255,255,255,0.04)]',
          // Width states
          collapsed ? 'w-16' : 'w-64',
          // Mobile behavior
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        role="navigation"
        aria-label="Owner navigation sidebar"
      >
        {/* Logo Area */}
        <div className="flex h-16 items-center justify-between border-b border-[rgba(255,255,255,0.04)] px-4">
          {!collapsed && (
            <Link href="/owner/dashboard" className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[oklch(0.65_0.22_264)]" />
              <span className="text-lg font-semibold text-[oklch(0.95_0.005_264)]">
                SalonOS
              </span>
            </Link>
          )}
          {collapsed && (
            <Link href="/owner/dashboard" className="mx-auto">
              <Sparkles className="h-5 w-5 text-[oklch(0.65_0.22_264)]" />
            </Link>
          )}
          <button
            onClick={onToggle}
            className={cn(
              'rounded-lg p-2 text-[oklch(0.50_0.005_264)] hover:bg-[oklch(0.16_0.010_264)] hover:text-[oklch(0.95_0.005_264)] transition-colors focus-ring',
              collapsed && 'hidden lg:block mx-auto'
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
          {/* Mobile close button */}
          {mobileOpen && onMobileClose && (
            <button
              onClick={onMobileClose}
              className="rounded-lg p-2 text-[oklch(0.50_0.005_264)] hover:bg-[oklch(0.16_0.010_264)] hover:text-[oklch(0.95_0.005_264)] transition-colors focus-ring lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <nav className="flex flex-col gap-4 p-3 overflow-y-auto custom-scrollbar" aria-label="Main navigation">
          {navSections.map((section) => (
            <div key={section.title} className="flex flex-col gap-1">
              {!collapsed && (
                <span className="px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[oklch(0.50_0.005_264)]">
                  {section.title}
                </span>
              )}
              {section.items.map((item) => (
                <OwnerNavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  badge={item.badge}
                  collapsed={collapsed}
                />
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom section - salon status */}
        {!collapsed && (
          <div className="absolute bottom-0 left-0 right-0 border-t border-[rgba(255,255,255,0.04)] p-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[oklch(0.70_0.18_145)] animate-pulse" />
              <span className="text-xs text-[oklch(0.70_0.008_264)]">System Online</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
