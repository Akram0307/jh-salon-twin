// KPI Data Structure
export interface KPIData {
  label: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  target?: number;
  unit?: string;
}

// Alert/Notification Types
export type AlertType = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface Alert {
  id: string;
  type: AlertType;
  message: string;
  time: string;
  read?: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
}

export interface Notification extends Alert {
  title?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  expiresAt?: string;
}

// Staff Types
export interface Staff {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'owner' | 'manager' | 'stylist' | 'assistant' | 'receptionist';
  status: 'active' | 'inactive' | 'on_leave';
  avatarUrl?: string;
  specialties?: string[];
  schedule?: StaffSchedule;
  performance?: StaffPerformance;
  createdAt: string;
  updatedAt: string;
}

export interface StaffSchedule {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

export interface TimeSlot {
  start: string; // HH:mm format
  end: string;   // HH:mm format
  available: boolean;
}

export interface StaffPerformance {
  utilization: number; // percentage
  revenue: number;
  clientRetention: number; // percentage
  averageRating: number;
  totalAppointments: number;
}

// Service Types
export interface Service {
  id: string;
  name: string;
  description?: string;
  category: ServiceCategory;
  duration: number; // in minutes
  price: number;
  isActive: boolean;
  staffIds?: string[];
  imageUrl?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export type ServiceCategory = 
  | 'haircut'
  | 'coloring'
  | 'styling'
  | 'treatment'
  | 'nails'
  | 'skincare'
  | 'massage'
  | 'other';

// Client Types
export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  status: 'active' | 'inactive' | 'vip';
  preferences?: ClientPreferences;
  history?: ClientHistory;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ClientPreferences {
  preferredStaff?: string[];
  preferredServices?: string[];
  communicationPreference: 'email' | 'sms' | 'both' | 'none';
  allergies?: string[];
  notes?: string;
}

export interface ClientHistory {
  totalVisits: number;
  totalSpent: number;
  lastVisit?: string;
  averageSpend: number;
  favoriteServices?: string[];
  favoriteStaff?: string[];
}

// Appointment Types
export interface Appointment {
  id: string;
  clientId: string;
  staffId: string;
  serviceId: string;
  startTime: string; // ISO datetime
  endTime: string;   // ISO datetime
  status: AppointmentStatus;
  notes?: string;
  price: number;
  discount?: number;
  total: number;
  paymentStatus: PaymentStatus;
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

export type PaymentStatus = 
  | 'pending'
  | 'paid'
  | 'partial'
  | 'refunded'
  | 'failed';

// API Response Wrappers
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

// Dashboard Specific Types
export interface DashboardData {
  kpis: KPIData[];
  alerts: Alert[];
  todaySchedule: Appointment[];
  revenueOverview: RevenueOverview;
  staffUtilization: StaffUtilization[];
  recentActivity: ActivityItem[];
}

export interface RevenueOverview {
  today: number;
  thisWeek: number;
  thisMonth: number;
  growth: number; // percentage
  chartData: ChartDataPoint[];
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface StaffUtilization {
  staffId: string;
  staffName: string;
  utilization: number; // percentage
  appointments: number;
  revenue: number;
}

export interface ActivityItem {
  id: string;
  type: 'appointment' | 'payment' | 'client' | 'staff' | 'system';
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'date' | 'time';
  required?: boolean;
  placeholder?: string;
  options?: SelectOption[];
  validation?: ValidationRule[];
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ValidationRule {
  type: 'required' | 'email' | 'phone' | 'min' | 'max' | 'pattern' | 'custom';
  value?: unknown;
  message: string;
}

// Utility Types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface InteractiveComponentProps extends BaseComponentProps {
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}
