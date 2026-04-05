import React from 'react';

interface MobileDataCardListProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileDataCardList({ children, className = '' }: MobileDataCardListProps) {
  return (
    <div className={`space-y-3 lg:hidden ${className}`}>
      {children}
    </div>
  );
}
