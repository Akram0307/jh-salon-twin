/**
 * Staff Query Hooks
 * Hooks for fetching and managing staff data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { STAFF_ENDPOINTS } from '@/lib/api-endpoints';
import { queryKeys } from '@/lib/query-client';

// ============================================
// Types
// ============================================

export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'stylist' | 'manager' | 'receptionist' | 'owner';
  avatar?: string;
  bio?: string;
  specialties?: string[];
  isActive: boolean;
  hireDate?: string;
  commission?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StaffFilters {
  search?: string;
  role?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'role' | 'hireDate';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface StaffListResponse {
  staff: Staff[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateStaffInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: Staff['role'];
  bio?: string;
  specialties?: string[];
  commission?: number;
}

export interface UpdateStaffInput extends Partial<CreateStaffInput> {
  isActive?: boolean;
}

export interface StaffPerformance {
  staffId: string;
  period: string;
  totalRevenue: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  averageTicket: number;
  clientRetention: number;
  rebookingRate: number;
  topServices: Array<{ service: string; count: number; revenue: number }>;
  clientSatisfaction: number;
}

export interface StaffSchedule {
  staffId: string;
  date: string;
  shifts: Array<{
    start: string;
    end: string;
    breakStart?: string;
    breakEnd?: string;
  }>;
  appointments: Array<{
    id: string;
    time: string;
    duration: number;
    client: string;
    service: string;
    status: string;
  }>;
}

export interface StaffAvailability {
  staffId: string;
  date: string;
  availableSlots: Array<{
    start: string;
    end: string;
    duration: number;
  }>;
}

// ============================================
// Query Hooks
// ============================================

/**
 * Fetch staff list with optional filters
 */
export function useStaff(filters?: StaffFilters) {
  return useQuery({
    queryKey: queryKeys.staff.list(filters || {}),
    queryFn: async (): Promise<StaffListResponse> => {
      const response = await apiClient.get<StaffListResponse>(
        STAFF_ENDPOINTS.list,
        { params: filters }
      );
      return response;
    },
  });
}

/**
 * Fetch single staff member by ID
 */
export function useStaffMember(id: string) {
  return useQuery({
    queryKey: queryKeys.staff.detail(id),
    queryFn: async (): Promise<Staff> => {
      const response = await apiClient.get<Staff>(STAFF_ENDPOINTS.byId(id));
      return response;
    },
    enabled: !!id,
  });
}

/**
 * Fetch staff performance metrics
 */
export function useStaffPerformance(id: string, period?: string) {
  return useQuery({
    queryKey: queryKeys.staff.performance(id),
    queryFn: async (): Promise<StaffPerformance> => {
      const response = await apiClient.get<StaffPerformance>(
        STAFF_ENDPOINTS.performance(id),
        { params: period ? { period } : undefined }
      );
      return response;
    },
    enabled: !!id,
  });
}

/**
 * Fetch staff schedule
 */
export function useStaffSchedule(id?: string, date?: string) {
  const endpoint = id ? STAFF_ENDPOINTS.staffSchedule(id) : STAFF_ENDPOINTS.schedule;
  
  return useQuery({
    queryKey: [...queryKeys.staff.schedule(), id, date],
    queryFn: async (): Promise<StaffSchedule | StaffSchedule[]> => {
      const response = await apiClient.get<StaffSchedule | StaffSchedule[]>(endpoint, {
        params: date ? { date } : undefined,
      });
      return response;
    },
  });
}

/**
 * Fetch staff availability for a specific date
 */
export function useStaffAvailability(id: string, date: string) {
  return useQuery({
    queryKey: [...queryKeys.staff.detail(id), 'availability', date],
    queryFn: async (): Promise<StaffAvailability> => {
      const response = await apiClient.get<StaffAvailability>(
        STAFF_ENDPOINTS.availability(id),
        { params: { date } }
      );
      return response;
    },
    enabled: !!id && !!date,
  });
}

// ============================================
// Mutations
// ============================================

/**
 * Create new staff member
 */
export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateStaffInput): Promise<Staff> => {
      const response = await apiClient.post<Staff>(STAFF_ENDPOINTS.create, input);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.lists() });
    },
  });
}

/**
 * Update existing staff member
 */
export function useUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateStaffInput }): Promise<Staff> => {
      const response = await apiClient.patch<Staff>(STAFF_ENDPOINTS.update(id), input);
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.detail(data.id) });
    },
  });
}

/**
 * Delete staff member
 */
export function useDeleteStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(STAFF_ENDPOINTS.delete(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.lists() });
    },
  });
}
