/**
 * Dashboard TypeScript Interfaces
 * SalonOS Owner HQ
 */

// Overview data from API
export interface DashboardOverview {
  todayRevenue: number;
  revenueChange?: number;
  todayAppointments: number;
  appointmentsChange?: number;
  activeClients: number;
  clientsChange?: number;
  avgTicket: number;
  ticketChange?: number;
}

// Appointment data
export interface Appointment {
  id?: string;
  clientName?: string;
  serviceName?: string;
  time?: string;
  status?: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  staffName?: string;
  notes?: string;
  clientId?: string;
  staffId?: string;
  serviceId?: string;
  duration?: number;
  price?: number;
}

// Alert data
export interface DashboardAlert {
  id?: string;
  type?: 'warning' | 'info' | 'error' | 'success';
  message?: string;
  time?: string;
  metadata?: Record<string, unknown>;
}

// AI Insight data
export interface AIInsight {
  type: 'opportunity' | 'trend' | 'alert' | 'recommendation';
  title: string;
  description: string;
  action?: string;
  metadata?: string;
}

// KPI Card data
export interface KPICardData {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
}

// Quick Action data
export interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
}
