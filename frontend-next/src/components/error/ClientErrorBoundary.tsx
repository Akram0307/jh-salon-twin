'use client';

import { ErrorBoundary } from './ErrorBoundary';
import { ReactNode } from 'react';

interface ClientErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Client-side Error Boundary wrapper for use in server components
 * Wraps the existing ErrorBoundary component for use in layouts
 */
export function ClientErrorBoundary({ children, fallback }: ClientErrorBoundaryProps) {
  return <ErrorBoundary fallback={fallback}>{children}</ErrorBoundary>;
}
