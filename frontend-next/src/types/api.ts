/**
 * SalonOS API Types
 * Comprehensive type definitions for all API entities
 */

// ============================================
// Core Entity Types
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'manager' | 'staff';
  salonId: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Salon {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  timezone: string;
  businessHours: BusinessHours;
  settings: SalonSettings;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  isOpen: boolean;
  openTime?: string; // HH:mm format
  closeTime?: string; // HH:mm format
}

export interface SalonSettings {
  currency: string;
  taxRate: number;
  bookingBuffer: number; // minutes between appointments
  allowOnlineBooking: boolean;
  requireDeposit: boolean;
  depositPercentage: number;
  cancellationPolicy: string;
  notificationPreferences: NotificationPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  reminderHours: number[]; // hours before appointment
}

// ============================================
// KPI & Analytics Types
// ============================================

export interface KpiData {
  label: string;
  value: number;
  change: number; // percentage change
  trend: 'up' | 'down' | 'neutral';
  target?: number;
  unit?: string;
}

export interface RevenueIntelligence {
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  revenueGrowth: number;
  averageTicket: number;
  rebookingRate: number;
  forecast: RevenueForecast[];
  topServices: ServiceRevenue[];
  staffPerformance: StaffRevenue[];
}

export interface RevenueForecast {
  date: string;
  predicted: number;
  confidence: number;
}

export interface ServiceRevenue {
  serviceId: string;
  serviceName: string;
  revenue: number;
  bookings: number;
}

export interface StaffRevenue {
  staffId: string;
  staffName: string;
  revenue: number;
  appointments: number;
  utilization: number;
}

// ============================================
// Appointment Types
// ============================================

export interface Appointment {
  id: string;
  salonId: string;
  clientId: string;
  clientName: string;
  staffId: string;
  staffName: string;
  serviceId: string;
  serviceName: string;
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  status: AppointmentStatus;
  price: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type AppointmentStatus = 
  | 'scheduled' 
  | 'confirmed' 
  | 'checked_in' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'no_show';

// ============================================
// Client Types
// ============================================

export interface Client {
  id: string;
  salonId: string;
  name: string;
  email?: string;
  phone: string;
  avatarUrl?: string;
  status: 'active' | 'inactive' | 'vip';
  totalVisits: number;
  totalSpent: number;
  lastVisit?: string;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Staff Types
// ============================================

export interface Staff {
  id: string;
  salonId: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  role: 'owner' | 'manager' | 'stylist' | 'assistant' | 'receptionist';
  status: 'active' | 'inactive' | 'on_leave';
  avatarUrl?: string;
  specialties?: string[];
  commissionRate?: number;
  schedule?: StaffSchedule;
  performance?: StaffPerformance;
  createdAt: string;
  updatedAt: string;
}

export interface StaffSchedule {
  staffId: string;
  weeklySchedule: WeeklySchedule;
  timeOff: TimeOffRequest[];
}

export interface WeeklySchedule {
  monday: Shift[];
  tuesday: Shift[];
  wednesday: Shift[];
  thursday: Shift[];
  friday: Shift[];
  saturday: Shift[];
  sunday: Shift[];
}

export interface Shift {
  start: string; // HH:mm
  end: string; // HH:mm
  type: 'regular' | 'break';
}

export interface TimeOffRequest {
  id: string;
  startDate: string;
  endDate: string;
  reason?: string;
  status: 'pending' | 'approved' | 'denied';
}

export interface StaffPerformance {
  staffId: string;
  period: 'week' | 'month' | 'quarter';
  revenue: number;
  appointments: number;
  utilization: number; // percentage
  clientRetention: number; // percentage
  averageRating: number;
  rebookingRate: number;
}

// ============================================
// Service Types
// ============================================

export interface Service {
  id: string;
  salonId: string;
  name: string;
  description?: string;
  category: string;
  duration: number; // minutes
  price: number;
  isActive: boolean;
  staffIds?: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Alert Types
// ============================================

export interface Alert {
  id: string;
  salonId: string;
  type: AlertType;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  read: boolean;
  createdAt: string;
}

export type AlertType = 
  | 'appointment' 
  | 'payment' 
  | 'staff' 
  | 'client' 
  | 'system' 
  | 'ai_insight';

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
  success: boolean;
  timestamp: string;
}

export class ApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: string;

  constructor(
    message: string,
    code: string,
    status: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  static fromResponse(response: Response, body?: unknown): ApiError {
    const status = response.status;
    let code = 'UNKNOWN_ERROR';
    let message = `HTTP ${status}`;
    let details: Record<string, unknown> | undefined;

    if (body && typeof body === 'object') {
      const errorBody = body as Record<string, unknown>;
      code = (errorBody.code as string) || code;
      message = (errorBody.message as string) || message;
      details = errorBody.details as Record<string, unknown> | undefined;
    }

    return new ApiError(message, code, status, details);
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }
}

// ============================================
// Query Parameter Types
// ============================================

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

export interface AppointmentQueryParams extends PaginationParams, DateRangeParams {
  status?: AppointmentStatus;
  staffId?: string;
  clientId?: string;
}

export interface ClientQueryParams extends PaginationParams {
  search?: string;
  status?: 'active' | 'inactive' | 'vip';
  tags?: string[];
}

export interface StaffQueryParams extends PaginationParams {
  role?: Staff['role'];
  status?: Staff['status'];
}

export interface RevenueQueryParams extends DateRangeParams {
  groupBy?: 'day' | 'week' | 'month';
}
