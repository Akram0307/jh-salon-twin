'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { OwnerSidebar } from './OwnerSidebar';
import { OwnerTopbar } from './OwnerTopbar';

interface OwnerShellProps {
  children: React.ReactNode;
}

export function OwnerShell({ children }: OwnerShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleMobileMenuClick = () => {
    setMobileOpen(true);
  };

  const handleMobileClose = () => {
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-[oklch(0.08_0.005_264)] custom-scrollbar">
      {/* Sidebar */}
      <OwnerSidebar
        collapsed={sidebarCollapsed}
        onToggle={handleToggleSidebar}
        mobileOpen={mobileOpen}
        onMobileClose={handleMobileClose}
      />

      {/* Main content area */}
      <div
        className={cn(
          'transition-all duration-300',
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}
      >
        {/* Topbar */}
        <OwnerTopbar
          onMenuClick={handleMobileMenuClick}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)] p-4 lg:p-6 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
