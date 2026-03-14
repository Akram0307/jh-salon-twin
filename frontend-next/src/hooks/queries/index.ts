/**
 * Query Hooks Barrel Export
 * Central export point for all TanStack Query hooks
 */

// Dashboard hooks
export * from './useDashboard';

// Client hooks
export * from './useClients';

// Staff hooks
export * from './useStaff';

// Service hooks
export * from './useServices';

// Re-export query client and keys for convenience
export { queryClient, queryKeys, invalidateEntity, prefetchQuery } from '@/lib/query-client';
