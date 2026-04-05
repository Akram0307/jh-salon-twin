/**
 * TanStack Query Client Configuration
 * Optimized for SalonOS real-time salon management
 */

import { QueryClient, DefaultOptions } from '@tanstack/react-query';
import { ApiError } from '@/types/api';

// ============================================
// Query Configuration
// ============================================

const queryConfig: DefaultOptions = {
  queries: {
    // Data considered fresh for 30 seconds
    staleTime: 30 * 1000,
    // Cache kept in memory for 5 minutes
    gcTime: 5 * 60 * 1000,
    // Retry configuration
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof ApiError) {
        if (error.status >= 400 && error.status < 500) {
          return false;
        }
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    // Exponential backoff for retries
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Refetch on window focus and reconnect
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    // Don't refetch on mount if data is fresh
    refetchOnMount: 'always',
  },
  mutations: {
    // Retry mutations once on failure
    retry: 1,
    // Network mode for mutations
    networkMode: 'always',
  },
};

// ============================================
// Query Client Instance
// ============================================

export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});

// ============================================
// Query Key Factories
// ============================================

export const queryKeys = {
  // Dashboard queries
  dashboard: {
    all: ['dashboard'] as const,
    overview: () => [...queryKeys.dashboard.all, 'overview'] as const,
    kpis: () => [...queryKeys.dashboard.all, 'kpis'] as const,
    alerts: () => [...queryKeys.dashboard.all, 'alerts'] as const,
    activity: () => [...queryKeys.dashboard.all, 'activity'] as const,
  },
  
  // Appointment queries
  appointments: {
    all: ['appointments'] as const,
    lists: () => [...queryKeys.appointments.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => 
      [...queryKeys.appointments.lists(), filters] as const,
    details: () => [...queryKeys.appointments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.appointments.details(), id] as const,
    today: () => [...queryKeys.appointments.all, 'today'] as const,
    upcoming: () => [...queryKeys.appointments.all, 'upcoming'] as const,
  },
  
  // Client queries
  clients: {
    all: ['clients'] as const,
    lists: () => [...queryKeys.clients.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => 
      [...queryKeys.clients.lists(), filters] as const,
    details: () => [...queryKeys.clients.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.clients.details(), id] as const,
    search: (query: string) => [...queryKeys.clients.all, 'search', query] as const,
  },
  
  // Staff queries
  staff: {
    all: ['staff'] as const,
    lists: () => [...queryKeys.staff.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => 
      [...queryKeys.staff.lists(), filters] as const,
    details: () => [...queryKeys.staff.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.staff.details(), id] as const,
    schedule: () => [...queryKeys.staff.all, 'schedule'] as const,
    performance: (id: string) => [...queryKeys.staff.all, 'performance', id] as const,
  },
  
  // Service queries
  services: {
    all: ['services'] as const,
    lists: () => [...queryKeys.services.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => 
      [...queryKeys.services.lists(), filters] as const,
    details: () => [...queryKeys.services.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.services.details(), id] as const,
    categories: () => [...queryKeys.services.all, 'categories'] as const,
  },
  
  // Revenue queries
  revenue: {
    all: ['revenue'] as const,
    intelligence: () => [...queryKeys.revenue.all, 'intelligence'] as const,
    forecast: () => [...queryKeys.revenue.all, 'forecast'] as const,
    breakdown: (params: Record<string, unknown>) => 
      [...queryKeys.revenue.all, 'breakdown', params] as const,
  },
  
  // Settings queries
  settings: {
    all: ['settings'] as const,
    owner: () => [...queryKeys.settings.all, 'owner'] as const,
    salon: () => [...queryKeys.settings.all, 'salon'] as const,
  },
} as const;

// ============================================
// Utility Functions
// ============================================

/**
 * Invalidate all queries for a specific entity
 */
export function invalidateEntity(entity: keyof typeof queryKeys) {
  return queryClient.invalidateQueries({
    queryKey: queryKeys[entity].all,
  });
}

/**
 * Prefetch a query
 */
export async function prefetchQuery<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>
) {
  return queryClient.prefetchQuery({
    queryKey,
    queryFn,
  });
}

export default queryClient;
