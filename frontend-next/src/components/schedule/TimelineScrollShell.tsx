'use client';

import { ReactNode } from 'react';

interface TimelineScrollShellProps {
  children: ReactNode;
  className?: string;
}

export function TimelineScrollShell({ children, className = '' }: TimelineScrollShellProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <div className="min-w-max">
        {children}
      </div>
    </div>
  );
}

export default TimelineScrollShell;
