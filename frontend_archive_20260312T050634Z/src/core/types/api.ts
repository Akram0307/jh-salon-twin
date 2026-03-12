// API Response Types

export interface Client {
  id: string;
  name?: string;
  full_name?: string;
  phone?: string;
  email?: string;
  total_visits?: number;
  total_spent?: number;
  created_at?: string;
}

export interface Appointment {
  id: string;
  client_id?: string;
  client_name?: string;
  service_name?: string;
  staff_name?: string;
  start_time: string;
  end_time?: string;
  status?: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  price?: number;
}

export interface ActivityItem {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  client_id?: string;
  appointment_id?: string;
}

export interface RevenueTrend {
  day: string;
  revenue: number;
}

export interface RevenueMetrics {
  revenue_today: string | number;
  bookings_today: number;
  new_clients: number;
}

export interface RevenueIntelligence {
  pos_metrics?: RevenueMetrics;
  revenue_trends?: RevenueTrend[];
  empty_slots?: { id: string; start_time: string }[];
  rebookable_clients?: { id: string; name: string; risk: string }[];
}

export interface StaffPerformance {
  staff_id: string;
  staff_name: string;
  revenue: number;
  appointments: number;
  utilization: number;
}

export interface UtilizationHeatmapSlot {
  hour: number;
  day: string;
  utilization: number;
}

export interface ForecastData {
  date: string;
  predicted_revenue: number;
  confidence: number;
}

export interface ApiError {
  message?: string;
  error?: string;
  status?: number;
}

// Dashboard fallback data
export const fallbackDashboard = {
  revenue_today: '₹48,260',
  bookings_today: 27,
  new_clients: 6,
  upcoming: [
    { id: 'u1', start_time: new Date().toISOString() },
    { id: 'u2', start_time: new Date(Date.now() + 45 * 60 * 1000).toISOString() },
    { id: 'u3', start_time: new Date(Date.now() + 90 * 60 * 1000).toISOString() },
    { id: 'u4', start_time: new Date(Date.now() + 120 * 60 * 1000).toISOString() },
    { id: 'u5', start_time: new Date(Date.now() + 150 * 60 * 1000).toISOString() },
  ],
  trends: [
    { day: 'Mon', revenue: 38200 },
    { day: 'Tue', revenue: 40100 },
    { day: 'Wed', revenue: 43650 },
    { day: 'Thu', revenue: 45220 },
    { day: 'Fri', revenue: 48260 },
  ],
  rebookable_clients: [
    { id: 'c1', name: 'Aarushi', risk: 'high' },
    { id: 'c2', name: 'Meera', risk: 'medium' },
  ],
};
