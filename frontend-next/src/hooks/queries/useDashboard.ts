/**
 * Dashboard Query Hooks
 * Hooks for fetching dashboard KPIs, alerts, and activity data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { DASHBOARD_ENDPOINTS, ANALYTICS_ENDPOINTS, OWNER_ENDPOINTS } from '@/lib/api-endpoints';
import { queryKeys } from '@/lib/query-client';
import type { ApiResponse } from '@/types/api';

// ============================================
// Types
// ============================================

export interface DashboardKPIs {
  todayRevenue: number;
  todayBookings: number;
  todayClients: number;
  avgTicketSize: number;
  rebookingRate: number;
  clientSatisfaction: number;
  staffUtilization: number;
  aiConciergeInteractions: number;
  revenueChange: number;
  bookingsChange: number;
  clientsChange: number;
  ticketSizeChange: number;
}

export interface DashboardAlert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface ActivityItem {
  id: string;
  type: 'booking' | 'payment' | 'client' | 'staff' | 'ai' | 'system';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface DashboardOverview {
  kpis: DashboardKPIs;
  alerts: DashboardAlert[];
  recentActivity: ActivityItem[];
  todaySchedule: {
    total: number;
    completed: number;
    upcoming: number;
    cancelled: number;
  };
}

export interface RevenueAnalytics {
  period: string;
  totalRevenue: number;
  revenueByService: Array<{ service: string; revenue: number; count: number }>;
  revenueByStaff: Array<{ staff: string; revenue: number; count: number }>;
  revenueByDay: Array<{ date: string; revenue: number }>;
  forecast: {
    nextWeek: number;
    nextMonth: number;
    confidence: number;
  };
}

// ============================================
// Query Hooks
// ============================================

/**
 * Fetch dashboard KPIs
 */
export function useDashboardKPIs() {
  return useQuery({
    queryKey: queryKeys.dashboard.kpis(),
    queryFn: async (): Promise<DashboardKPIs> => {
      const response = await apiClient.get<DashboardKPIs>(DASHBOARD_ENDPOINTS.kpis);
      return response;
    },
  });
}

/**
 * Fetch dashboard alerts
 */
export function useDashboardAlerts() {
  return useQuery({
    queryKey: queryKeys.dashboard.alerts(),
    queryFn: async (): Promise<DashboardAlert[]> => {
      const response = await apiClient.get<DashboardAlert[]>(DASHBOARD_ENDPOINTS.alerts);
      return response;
    },
  });
}

/**
 * Fetch recent activity feed
 */
export function useDashboardActivity() {
  return useQuery({
    queryKey: queryKeys.dashboard.activity(),
    queryFn: async (): Promise<ActivityItem[]> => {
      const response = await apiClient.get<ActivityItem[]>(DASHBOARD_ENDPOINTS.activity);
      return response;
    },
  });
}

/**
 * Fetch complete dashboard overview
 */
export function useDashboardOverview() {
  return useQuery({
    queryKey: queryKeys.dashboard.overview(),
    queryFn: async (): Promise<DashboardOverview> => {
      const response = await apiClient.get<DashboardOverview>(ANALYTICS_ENDPOINTS.overview);
      return response;
    },
  });
}

/**
 * Fetch revenue analytics
 */
export function useRevenueAnalytics(params?: { period?: string; startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: queryKeys.revenue.breakdown(params || {}),
    queryFn: async (): Promise<RevenueAnalytics> => {
      const response = await apiClient.get<RevenueAnalytics>(ANALYTICS_ENDPOINTS.revenue, {
        params: params as Record<string, string | number | boolean | undefined | null>,
      });
      return response;
    },
  });
}

/**
 * Fetch revenue intelligence
 */
export function useRevenueIntelligence() {
  return useQuery({
    queryKey: queryKeys.revenue.intelligence(),
    queryFn: async () => {
      const response = await apiClient.get(OWNER_ENDPOINTS.alerts);
      return response;
    },
  });
}

/**
 * Fetch system health status
 */
export function useSystemHealth() {
  return useQuery({
    queryKey: ['system', 'health'],
    queryFn: async () => {
      const response = await apiClient.get(OWNER_ENDPOINTS.systemHealth);
      return response;
    },
    refetchInterval: 60000, // Refetch every minute
  });
}

// ============================================
// Mutations
// ============================================

/**
 * Mark alert as read
 */
export function useMarkAlertRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      return apiClient.patch(`/api/alerts/${alertId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.alerts() });
    },
  });
}

/**
 * Dismiss alert
 */
export function useDismissAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      return apiClient.delete(`/api/alerts/${alertId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.alerts() });
    },
  });
}
