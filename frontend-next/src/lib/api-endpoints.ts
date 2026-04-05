/**
 * SalonOS API Endpoints
 * Centralized endpoint constants for type-safe API calls
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://salonos-backend-rgvcleapsa-uc.a.run.app';

export const API_CONFIG = {
  baseUrl: API_BASE.replace(/\/$/, ''),
  timeout: 15000,
  retries: 2,
} as const;

// ============================================
// Auth Endpoints
// ============================================

export const AUTH_ENDPOINTS = {
  login: '/api/auth/login',
  logout: '/api/auth/logout',
  me: '/api/auth/me',
  refresh: '/api/auth/refresh',
  register: '/api/auth/register',
  forgotPassword: '/api/auth/forgot-password',
  resetPassword: '/api/auth/reset-password',
} as const;

// ============================================
// Dashboard & Analytics Endpoints
// ============================================

export const ANALYTICS_ENDPOINTS = {
  overview: '/api/analytics/overview',
  revenue: '/api/analytics/revenue',
  clientMetrics: '/api/analytics/client-metrics',
  staffPerformance: '/api/analytics/staff-performance',
  servicePerformance: '/api/analytics/service-performance',
} as const;

export const DASHBOARD_ENDPOINTS = {
  alerts: '/api/alerts',
  kpis: '/api/dashboard/kpis',
  activity: '/api/dashboard/activity',
} as const;

// ============================================
// Appointment Endpoints
// ============================================

export const APPOINTMENT_ENDPOINTS = {
  list: '/api/appointments',
  today: '/api/appointments/today',
  upcoming: '/api/appointments/upcoming',
  byId: (id: string) => `/api/appointments/${id}`,
  create: '/api/appointments',
  update: (id: string) => `/api/appointments/${id}`,
  cancel: (id: string) => `/api/appointments/${id}/cancel`,
  checkIn: (id: string) => `/api/appointments/${id}/check-in`,
  complete: (id: string) => `/api/appointments/${id}/complete`,
  reschedule: (id: string) => `/api/appointments/${id}/reschedule`,
} as const;

// ============================================
// Client Endpoints
// ============================================

export const CLIENT_ENDPOINTS = {
  list: '/api/clients',
  byId: (id: string) => `/api/clients/${id}`,
  create: '/api/clients',
  update: (id: string) => `/api/clients/${id}`,
  delete: (id: string) => `/api/clients/${id}`,
  history: (id: string) => `/api/clients/${id}/history`,
  preferences: (id: string) => `/api/clients/${id}/preferences`,
  search: '/api/clients/search',
} as const;

// ============================================
// Staff Endpoints
// ============================================

export const STAFF_ENDPOINTS = {
  list: '/api/staff',
  byId: (id: string) => `/api/staff/${id}`,
  create: '/api/staff',
  update: (id: string) => `/api/staff/${id}`,
  delete: (id: string) => `/api/staff/${id}`,
  schedule: '/api/staff/schedule',
  staffSchedule: (id: string) => `/api/staff/${id}/schedule`,
  performance: (id: string) => `/api/staff/${id}/performance`,
  availability: (id: string) => `/api/staff/${id}/availability`,
} as const;

// ============================================
// Service Endpoints
// ============================================

export const SERVICE_ENDPOINTS = {
  list: '/api/services',
  categories: '/api/services/categories',
  byId: (id: string) => `/api/services/${id}`,
  create: '/api/services',
  update: (id: string) => `/api/services/${id}`,
  delete: (id: string) => `/api/services/${id}`,  
} as const;

// ============================================
// Revenue Endpoints
// ============================================

export const REVENUE_ENDPOINTS = {
  intelligence: '/api/revenue/intelligence',
  forecast: '/api/revenue/forecast',
  breakdown: '/api/revenue/breakdown',
  byStaff: '/api/revenue/by-staff',
  byService: '/api/revenue/by-service',
} as const;

// ============================================
// Owner/Settings Endpoints
// ============================================

export const OWNER_ENDPOINTS = {
  settings: '/api/owner/settings',
  scheduleSummary: '/api/owner/schedule-summary',
  alerts: '/api/owner/alerts',
  systemHealth: '/api/owner/system-health',
} as const;

export const SALON_ENDPOINTS = {
  get: '/api/salon',
  update: '/api/salon',
  businessHours: '/api/salon/business-hours',
} as const;

// ============================================
// Reports Endpoints
// ============================================

export const REPORT_ENDPOINTS = {
  revenue: '/api/reports/revenue',
  staff: '/api/reports/staff',
  services: '/api/reports/services',
  clients: '/api/reports/clients',
  export: (type: string) => `/api/reports/${type}/export`,
} as const;

// ============================================
// Combined Endpoints Object
// ============================================

export const ENDPOINTS = {
  auth: AUTH_ENDPOINTS,
  analytics: ANALYTICS_ENDPOINTS,
  dashboard: DASHBOARD_ENDPOINTS,
  appointments: APPOINTMENT_ENDPOINTS,
  clients: CLIENT_ENDPOINTS,
  staff: STAFF_ENDPOINTS,
  services: SERVICE_ENDPOINTS,
  revenue: REVENUE_ENDPOINTS,
  owner: OWNER_ENDPOINTS,
  salon: SALON_ENDPOINTS,
  reports: REPORT_ENDPOINTS,
} as const;

export type EndpointGroup = keyof typeof ENDPOINTS;
