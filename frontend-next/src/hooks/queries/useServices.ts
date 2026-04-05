/**
 * Service Query Hooks
 * Hooks for fetching and managing service data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { SERVICE_ENDPOINTS } from '@/lib/api-endpoints';
import { queryKeys } from '@/lib/query-client';

// ============================================
// Types
// ============================================

export interface Service {
  id: string;
  name: string;
  description?: string;
  category: string;
  duration: number; // in minutes
  price: number;
  isActive: boolean;
  imageUrl?: string;
  staffIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  serviceCount: number;
}

export interface ServiceFilters {
  search?: string;
  category?: string;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  minDuration?: number;
  maxDuration?: number;
  sortBy?: 'name' | 'price' | 'duration' | 'category';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface ServiceListResponse {
  services: Service[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateServiceInput {
  name: string;
  description?: string;
  category: string;
  duration: number;
  price: number;
  isActive?: boolean;
  imageUrl?: string;
  staffIds?: string[];
}

export interface UpdateServiceInput extends Partial<CreateServiceInput> {}

// ============================================
// Query Hooks
// ============================================

/**
 * Fetch services list with optional filters
 */
export function useServices(filters?: ServiceFilters) {
  return useQuery({
    queryKey: queryKeys.services.list(filters || {}),
    queryFn: async (): Promise<ServiceListResponse> => {
      const response = await apiClient.get<ServiceListResponse>(
        SERVICE_ENDPOINTS.list,
        { params: filters }
      );
      return response;
    },
  });
}

/**
 * Fetch single service by ID
 */
export function useService(id: string) {
  return useQuery({
    queryKey: queryKeys.services.detail(id),
    queryFn: async (): Promise<Service> => {
      const response = await apiClient.get<Service>(SERVICE_ENDPOINTS.byId(id));
      return response;
    },
    enabled: !!id,
  });
}

/**
 * Fetch service categories
 */
export function useServiceCategories() {
  return useQuery({
    queryKey: queryKeys.services.categories(),
    queryFn: async (): Promise<ServiceCategory[]> => {
      const response = await apiClient.get<ServiceCategory[]>(SERVICE_ENDPOINTS.categories);
      return response;
    },
  });
}

// ============================================
// Mutations
// ============================================

/**
 * Create new service
 */
export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateServiceInput): Promise<Service> => {
      const response = await apiClient.post<Service>(SERVICE_ENDPOINTS.create, input);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.services.categories() });
    },
  });
}

/**
 * Update existing service
 */
export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateServiceInput }): Promise<Service> => {
      const response = await apiClient.patch<Service>(SERVICE_ENDPOINTS.update(id), input);
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.services.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.services.categories() });
    },
  });
}

/**
 * Delete service
 */
export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(SERVICE_ENDPOINTS.delete(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.services.categories() });
    },
  });
}
