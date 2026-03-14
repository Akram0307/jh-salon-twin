import React from 'react';

interface ResponsiveStatGridProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveStatGrid({ children, className = '' }: ResponsiveStatGridProps) {
  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 ${className}`}>
      {children}
    </div>
  );
}
