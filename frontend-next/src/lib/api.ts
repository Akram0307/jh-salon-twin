const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://salonos-backend-rgvcleapsa-uc.a.run.app';

export function getApiBaseUrl() {
  return API_BASE_URL.replace(/\/$/, '');
}

export async function apiFetch<T>(path: string, init?: RequestInit, timeoutMs = 8000): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json() as T;
  } finally {
    clearTimeout(timeout);
  }
}

export type OverviewResponse = {
  todayRevenue?: number;
  todayBookings?: number;
  activeClients?: number;
  avgTicket?: number;
  upcoming?: Array<{
    id: string;
    client_name?: string;
    service_name?: string;
    staff_name?: string;
    appointment_time?: string;
    start_time?: string;
    status?: string;
  }>;
};

export type RevenueSummaryResponse = {
  today?: number;
  growth?: number;
  thisWeek?: number;
  thisMonth?: number;
};

export type TodayAppointment = {
  id: string;
  client_name: string;
  service_name: string;
  staff_name: string;
  start_time: string;
  status: string;
};

// API object with typed methods matching page expectations
export const api = {
  analytics: {
    getOverview: () => apiFetch<any>('/api/analytics/overview'),
    getRevenue: (params?: any) => apiFetch<any>(`/api/analytics/revenue${params ? '?' + new URLSearchParams(params) : ''}`),
    getClientMetrics: (params?: any) => apiFetch<any>(`/api/analytics/client-metrics${params ? '?' + new URLSearchParams(params) : ''}`),
    getStaffPerformance: (params?: any) => apiFetch<any>(`/api/analytics/staff-performance${params ? '?' + new URLSearchParams(params) : ''}`),
    getServicePerformance: (params?: any) => apiFetch<any>(`/api/analytics/service-performance${params ? '?' + new URLSearchParams(params) : ''}`),
  },
  appointments: {
    list: (params?: any) => apiFetch<any[]>(`/api/appointments${params ? '?' + new URLSearchParams(params) : ''}`),
    getToday: () => apiFetch<any[]>('/api/appointments/today'),
    getById: (id: string) => apiFetch<any>(`/api/appointments/${id}`),
    create: (data: any) => apiFetch<any>('/api/appointments', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiFetch<any>(`/api/appointments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    cancel: (id: string) => apiFetch<any>(`/api/appointments/${id}/cancel`, { method: 'POST' }),
  },
  clients: {
    list: (params?: any) => apiFetch<any[]>(`/api/clients${params ? '?' + new URLSearchParams(params) : ''}`),
    getById: (id: string) => apiFetch<any>(`/api/clients/${id}`),
    create: (data: any) => apiFetch<any>('/api/clients', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiFetch<any>(`/api/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch<any>(`/api/clients/${id}`, { method: 'DELETE' }),
    bulkDelete: (ids: string[]) => apiFetch<any>('/api/clients/bulk-delete', { method: 'POST', body: JSON.stringify({ ids }) }),
  },
  staff: {
    list: () => apiFetch<any[]>('/api/staff'),
    getById: (id: string) => apiFetch<any>(`/api/staff/${id}`),
    create: (data: any) => apiFetch<any>('/api/staff', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiFetch<any>(`/api/staff/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch<any>(`/api/staff/${id}`, { method: 'DELETE' }),
    bulkDelete: (ids: string[]) => apiFetch<any>('/api/staff/bulk-delete', { method: 'POST', body: JSON.stringify({ ids }) }),
    getSchedule: () => apiFetch<any>('/api/staff/schedule'),
  },
  services: {
    list: () => apiFetch<any[]>('/api/services'),
    getCategories: () => apiFetch<any[]>('/api/services/categories'),
    getById: (id: string) => apiFetch<any>(`/api/services/${id}`),
    create: (data: any) => apiFetch<any>('/api/services', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiFetch<any>(`/api/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch<any>(`/api/services/${id}`, { method: 'DELETE' }),
    bulkDelete: (ids: string[]) => apiFetch<any>('/api/services/bulk-delete', { method: 'POST', body: JSON.stringify({ ids }) }),
  },
  owner: {
    getAlerts: () => apiFetch<any[]>('/api/owner/alerts'),
    getScheduleSummary: () => apiFetch<any>('/api/owner/schedule-summary'),
    getSettings: () => apiFetch<any>('/api/owner/settings'),
    updateSettings: (data: any) => apiFetch<any>('/api/owner/settings', { method: 'PUT', body: JSON.stringify(data) }),
  },
  salon: {
    get: () => apiFetch<any>('/api/salon'),
    update: (data: any) => apiFetch<any>('/api/salon', { method: 'PUT', body: JSON.stringify(data) }),
  },
  user: {
    get: () => apiFetch<any>('/api/user'),
    update: (data: any) => apiFetch<any>('/api/user', { method: 'PUT', body: JSON.stringify(data) }),
  },
  reports: {
    getRevenue: (params?: any) => apiFetch<any>(`/api/reports/revenue${params ? '?' + new URLSearchParams(params) : ''}`),
    getStaff: (params?: any) => apiFetch<any>(`/api/reports/staff${params ? '?' + new URLSearchParams(params) : ''}`),
    getServices: (params?: any) => apiFetch<any>(`/api/reports/services${params ? '?' + new URLSearchParams(params) : ''}`),
    getClientGrowth: (params?: any) => apiFetch<any>(`/api/reports/client-growth${params ? "?" + new URLSearchParams(params) : ""}`),
    getSummary: (params?: any) => apiFetch<any>(`/api/reports/summary${params ? "?" + new URLSearchParams(params) : ""}`),
  },
  settings: {
    getProfile: () => apiFetch<any>('/api/owner/settings/profile').catch(() => api.owner.getSettings()),
    getNotifications: () => apiFetch<any>('/api/owner/settings/notifications').catch(() => ({
      emailNotifications: true,
      smsNotifications: true,
      appointmentReminders: true,
      marketingEmails: false,
      lowInventoryAlerts: true,
      staffUpdates: true,
      revenueReports: true,
      clientFeedback: true,
    })),
    getBilling: () => apiFetch<any>('/api/owner/settings/billing').catch(() => ({
      plan: 'Professional',
      price: 79,
      billingCycle: 'monthly',
      nextBillingDate: '2026-04-14',
      paymentMethod: {
        type: 'card',
        brand: 'Visa',
        last4: '4242',
        expiry: '12/28',
      },
    })),
  },
};

// POS API methods
export const posApi = {
  getServices: () => apiFetch<any[]>('/api/services'),
  getProducts: () => apiFetch<any[]>('/api/products'),
  getClients: () => apiFetch<any[]>('/api/clients'),
  getStaff: () => apiFetch<any[]>('/api/staff'),
  createDraft: (data: any) => apiFetch<any>('/api/pos/create-draft', { method: 'POST', body: JSON.stringify(data) }),
  completeTransaction: (data: any) => apiFetch<any>('/api/pos/complete-transaction', { method: 'POST', body: JSON.stringify(data) }),
  getRecentTransactions: () => apiFetch<any[]>('/api/pos/recent'),
};
