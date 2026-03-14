'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { queryClient } from '@/lib/query-client';
import { AuthProvider } from '@/contexts/AuthContext';
import { SearchProvider } from '@/contexts/SearchContext';
import { Toaster } from '@/components/ui/toast-system';
import { GlobalErrorHandler } from '@/components/error/GlobalErrorHandler';

export function Providers({ children }: { children: React.ReactNode }) {
  // Use stable query client instance from our configuration
  const [client] = useState(() => queryClient);

  return (
    <AuthProvider>
      <SearchProvider>
        <QueryClientProvider client={client}>
          {children}
          {/* Global error handler for offline detection and unhandled errors */}
          <GlobalErrorHandler />
          {/* Toast notifications */}
          <Toaster />
          {/* Devtools only in development */}
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools
              initialIsOpen={false}
              buttonPosition="bottom-right"
            />
          )}
        </QueryClientProvider>
      </SearchProvider>
    </AuthProvider>
  );
}
