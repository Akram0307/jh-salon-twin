/**
 * Client Query Hooks
 * Hooks for fetching and managing client data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { CLIENT_ENDPOINTS } from '@/lib/api-endpoints';
import { queryKeys } from '@/lib/query-client';

// ============================================
// Types
// ============================================

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  notes?: string;
  preferences?: ClientPreferences;
  beautyProfile?: BeautyProfile;
  loyaltyPoints?: number;
  totalVisits?: number;
  totalSpent?: number;
  lastVisit?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientPreferences {
  preferredStylist?: string;
  preferredServices?: string[];
  communicationPreference?: 'sms' | 'email' | 'both';
  allergies?: string[];
  notes?: string;
}

export interface BeautyProfile {
  hairType?: string;
  hairTexture?: string;
  hairColor?: string;
  skinType?: string;
  skinConcerns?: string[];
  productPreferences?: string[];
}

export interface ClientFilters {
  [key: string]: string | number | boolean | undefined;
  search?: string;
  sortBy?: 'name' | 'lastVisit' | 'totalSpent' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ClientListResponse {
  clients: Client[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateClientInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes?: string;
  preferences?: ClientPreferences;
}

export interface UpdateClientInput extends Partial<CreateClientInput> {
  beautyProfile?: BeautyProfile;
}

export interface ClientHistory {
  appointments: Array<{
    id: string;
    date: string;
    service: string;
    staff: string;
    status: string;
    amount: number;
  }>;
  totalSpent: number;
  totalVisits: number;
  averageTicket: number;
}

// ============================================
// Query Hooks
// ============================================

/**
 * Fetch clients list with optional filters
 */
export function useClients(filters?: ClientFilters) {
  return useQuery({
    queryKey: queryKeys.clients.list(filters || {}),
    queryFn: async (): Promise<ClientListResponse> => {
      const response = await apiClient.get<ClientListResponse>(
        CLIENT_ENDPOINTS.list,
        { params: filters as Record<string, string | number | boolean | undefined | null> }
      );
      return response;
    },
  });
}

/**
 * Fetch single client by ID
 */
export function useClient(id: string) {
  return useQuery({
    queryKey: queryKeys.clients.detail(id),
    queryFn: async (): Promise<Client> => {
      const response = await apiClient.get<Client>(CLIENT_ENDPOINTS.byId(id));
      return response;
    },
    enabled: !!id,
  });
}

/**
 * Search clients
 */
export function useClientSearch(query: string) {
  return useQuery({
    queryKey: queryKeys.clients.search(query),
    queryFn: async (): Promise<Client[]> => {
      const response = await apiClient.get<Client[]>(CLIENT_ENDPOINTS.search, {
        params: { q: query },
      });
      return response;
    },
    enabled: query.length >= 2,
  });
}

/**
 * Fetch client history
 */
export function useClientHistory(id: string) {
  return useQuery({
    queryKey: [...queryKeys.clients.detail(id), 'history'],
    queryFn: async (): Promise<ClientHistory> => {
      const response = await apiClient.get<ClientHistory>(CLIENT_ENDPOINTS.history(id));
      return response;
    },
    enabled: !!id,
  });
}

/**
 * Fetch client preferences
 */
export function useClientPreferences(id: string) {
  return useQuery({
    queryKey: [...queryKeys.clients.detail(id), 'preferences'],
    queryFn: async (): Promise<ClientPreferences> => {
      const response = await apiClient.get<ClientPreferences>(CLIENT_ENDPOINTS.preferences(id));
      return response;
    },
    enabled: !!id,
  });
}

// ============================================
// Mutations
// ============================================

/**
 * Create new client
 */
export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateClientInput): Promise<Client> => {
      const response = await apiClient.post<Client>(CLIENT_ENDPOINTS.create, input);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.lists() });
    },
  });
}

/**
 * Update existing client
 */
export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateClientInput }): Promise<Client> => {
      const response = await apiClient.patch<Client>(CLIENT_ENDPOINTS.update(id), input);
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(data.id) });
    },
  });
}

/**
 * Delete client
 */
export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(CLIENT_ENDPOINTS.delete(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.lists() });
    },
  });
}
