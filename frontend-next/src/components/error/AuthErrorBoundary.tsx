'use client';

import { ErrorBoundary } from './ErrorBoundary';
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface AuthErrorBoundaryProps {
  children: ReactNode;
}

/**
 * Error Boundary for the auth section with custom fallback UI
 */
export function AuthErrorBoundary({ children }: AuthErrorBoundaryProps) {
  const fallback = (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
        <p className="text-slate-400 mb-6">
          We encountered an error while loading the authentication page. Please try refreshing the page.
        </p>
        <Button 
          onClick={() => window.location.reload()} 
          className="bg-slate-800 hover:bg-slate-700 text-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Page
        </Button>
      </div>
    </div>
  );

  return <ErrorBoundary fallback={fallback}>{children}</ErrorBoundary>;
}
