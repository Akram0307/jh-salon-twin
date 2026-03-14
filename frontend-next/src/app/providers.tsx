'use client';

import { Toaster } from '@/components/ui/toast-system';
import { GlobalErrorHandler } from '@/components/error/GlobalErrorHandler';
import { SearchProvider } from '@/contexts/SearchContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SearchProvider>
        <GlobalErrorHandler />
        {children}
        <Toaster />
      </SearchProvider>
    </QueryClientProvider>
  );
}
