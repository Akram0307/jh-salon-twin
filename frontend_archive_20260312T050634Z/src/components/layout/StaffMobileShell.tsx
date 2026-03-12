import { Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { glass, semantic, component } from '../../lib/design-tokens';

interface StaffMobileShellProps {
  children: ReactNode;
  title?: string;
}

export function StaffMobileShell({ children, title }: StaffMobileShellProps) {
  const location = useLocation();

  const navItems = [
    { path: '/staff/dashboard', label: 'Dashboard' },
    { path: '/staff/schedule', label: 'Schedule' },
    { path: '/staff/pos', label: 'POS' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {title ? (
        <header className="sticky top-0 z-10 border-b semantic.border.default bg-slate-900/90 px-4 py-3 backdrop-blur">
          <h1 className="text-lg font-semibold">{title}</h1>
        </header>
      ) : null}
      <main className="flex-1 overflow-y-auto p-4">{children}</main>
      <nav className="sticky bottom-0 flex justify-around border-t semantic.border.default glass.default p-4 backdrop-blur-lg">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`rounded-xl px-4 py-2 transition-all ${
              location.pathname === item.path ? 'bg-white/20' : 'hover:glass.subtle'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export default StaffMobileShell;
