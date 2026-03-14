'use client';

import { useEffect } from 'react';
import { setupOfflineDetection, logErrorToBackend, showErrorToast } from '@/lib/error-handler';

/**
 * Global Error Handler component
 * Sets up offline detection and global error handlers
 */
export function GlobalErrorHandler() {
  useEffect(() => {
    // Set up offline detection
    setupOfflineDetection();

    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Log to backend
      if (event.reason instanceof Error) {
        logErrorToBackend(event.reason, {
          type: 'unhandledRejection',
          promise: event.promise,
        });
      }
      
      // Show toast notification
      showErrorToast(event.reason, 'Unexpected Error');
    };

    // Handle uncaught errors
    const handleError = (event: ErrorEvent) => {
      console.error('Uncaught error:', event.error);
      
      // Log to backend
      if (event.error instanceof Error) {
        logErrorToBackend(event.error, {
          type: 'uncaughtError',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        });
      }
      
      // Show toast notification
      showErrorToast(event.error, 'Unexpected Error');
    };

    // Add event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return null;
}
