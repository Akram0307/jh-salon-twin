import React from 'react';
import { cn } from '@/lib/utils';

interface FormStackProps {
  children: React.ReactNode;
  className?: string;
}

export function FormStack({ children, className }: FormStackProps) {
  return (
    <div className={cn(
      'grid grid-cols-1 gap-2 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6',
      className
    )}>
      {children}
    </div>
  );
}

interface FormStackItemProps {
  label?: string;
  helperText?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormStackItem({ label, helperText, children, className }: FormStackItemProps) {
  return (
    <div className={cn('min-w-0 space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-slate-300 lg:text-right lg:pt-2">
          {label}
        </label>
      )}
      <div className="min-w-0">
        {children}
        {helperText && (
          <p className="mt-1 text-xs text-slate-500">{helperText}</p>
        )}
      </div>
    </div>
  );
}

export default FormStack;
