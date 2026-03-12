import { apiFetch } from '../core/api/client'

export { apiFetch } from '../core/api/client'

export interface ApiEnvelope<T> {
  success: boolean
  data: T
  meta?: Record<string, unknown>
  error?: string
  message?: string
  details?: unknown
}

export interface ApiErrorLike extends Error {
  status?: number
  data?: {
    success?: boolean
    error?: string
    message?: string
    details?: unknown
  }
}

export interface ChatResponse {
  success:boolean
  message:string
  ui?:{
    type:string
    data?:unknown
  }
}

export interface StaffRecord {
  id: string
  full_name: string
  email: string
  phone_number?: string | null
  role?: string | null
  is_active?: boolean
  updated_at?: string
}

export interface StaffListParams {
  status?: 'active' | 'archived' | 'all'
  search?: string
  role?: string
}

export interface ServiceRecord {
  id: string
  name: string
  description?: string | null
  duration_minutes: number
  price: number | string
  category?: string | null
  is_active?: boolean
}

export interface ScheduleCoverageDay {
  weekday: number
  day_label: string
  staffed_count: number
  start_time: string | null
  end_time: string | null
}

export interface ScheduleSummary {
  staff_count: number
  active_hour_rules: number
  break_rules: number
  staff_time_off_today: number
  appointments_today: number
  coverage: ScheduleCoverageDay[]
}

export interface ScheduleRuleRecord {
  id: string
  staff_id: string
  staff_name: string
  staff_role?: string | null
  staff_is_active?: boolean
  weekday: number
  day_label: string
  start_time: string | null
  end_time: string | null
  capacity: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface ScheduleRuleInput {
  staff_id: string
  weekday: number
  start_time: string
  end_time: string
  capacity?: number
  is_active?: boolean
}

// Activity Feed Types
export interface ActivityItem {
  id: string
  type: string
  message: string
  timestamp: string
  client_name?: string
  staff_name?: string
  service_name?: string
}

export interface ActivityFeedResponse {
  activities: ActivityItem[]
  total: number
}

// Appointment Types
export interface AppointmentRecord {
  id: string
  client_id: string
  client_name?: string
  service_id: string
  service_name?: string
  staff_id: string
  staff_name?: string
  slot_start: string
  slot_end?: string
  status: string
  price?: number
  notes?: string
}

export interface AppointmentsTodayResponse {
  appointments: AppointmentRecord[]
  total: number
}

// Revenue Forecast Types
export interface RevenueForecastData {
  predicted_revenue: number
  confidence: number
  period: string
  factors?: string[]
}

export interface RevenueForecastResponse {
  forecast: RevenueForecastData
}

// Staff Performance Types
export interface StaffPerformanceMetrics {
  staff_id: string
  staff_name: string
  appointments_completed: number
  revenue_generated: number
  avg_appointment_duration: number
  client_satisfaction?: number
}

export interface StaffPerformanceResponse {
  staff_performance: StaffPerformanceMetrics[]
}

// Staff Utilization Types
export interface UtilizationCell {
  staff_id: string
  staff_name: string
  utilization_rate: number
  appointments_count: number
}

export interface UtilizationHeatmapResponse {
  heatmap: UtilizationCell[][]
  date_range: {
    start: string
    end: string
  }
}

export function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  if (value && typeof value === 'object' && Array.isArray((value as { data?: unknown[] }).data)) {
    return ((value as { data: unknown[] }).data ?? []) as T[]
  }
  return []
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const err = error as ApiErrorLike | undefined
  return err?.data?.message || err?.data?.error || err?.message || fallback
}

export async function sendChatMessage(sender:string,message:string){
  return apiFetch<ChatResponse>('/api/chat',{
    method:'POST',
    body:JSON.stringify({ sender, message })
  })
}

export async function getServices(){
  return apiFetch<ApiEnvelope<ServiceRecord[]>>('/api/services')
}

export async function createService(payload: Omit<ServiceRecord, 'id'>){
  return apiFetch<ApiEnvelope<ServiceRecord>>('/api/services', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateService(id: string, payload: Partial<Omit<ServiceRecord, 'id'>>){
  return apiFetch<ApiEnvelope<ServiceRecord>>(`/api/services/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function archiveService(id: string){
  return updateService(id, { is_active: false })
}

export async function restoreService(id: string){
  return updateService(id, { is_active: true })
}

export async function getStaff(params: StaffListParams = {}){
  const query = new URLSearchParams()
  if (params.status) query.set('status', params.status)
  if (params.search) query.set('search', params.search)
  if (params.role) query.set('role', params.role)
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return apiFetch<ApiEnvelope<StaffRecord[]>>(`/api/staff${suffix}`)
}

export async function createStaff(payload: Omit<StaffRecord, 'id'>){
  return apiFetch<ApiEnvelope<StaffRecord>>('/api/staff', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateStaff(id: string, payload: Partial<Omit<StaffRecord, 'id'>>){
  return apiFetch<ApiEnvelope<StaffRecord>>(`/api/staff/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function getScheduleSummary(){
  return apiFetch<ApiEnvelope<ScheduleSummary>>('/api/owner/schedule-summary')
}

export async function getScheduleRules(){
  return apiFetch<ApiEnvelope<ScheduleRuleRecord[]>>('/api/owner/schedule-rules')
}

export async function createScheduleRule(payload: ScheduleRuleInput){
  return apiFetch<ApiEnvelope<ScheduleRuleRecord>>('/api/owner/schedule-rules', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateScheduleRule(id: string, payload: Partial<ScheduleRuleInput>){
  return apiFetch<ApiEnvelope<ScheduleRuleRecord>>(`/api/owner/schedule-rules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteScheduleRule(id: string){
  return apiFetch<ApiEnvelope<{ id: string }>>(`/api/owner/schedule-rules/${id}`, {
    method: 'DELETE',
  })
}

export async function getSlots(salon_id:string,service_id:string,date:string){
  if (!salon_id || !service_id || !date) {
    throw new Error('Missing required slot params: salon_id, service_id, and date are required')
  }

  const query = new URLSearchParams({
    salon_id: salon_id.trim(),
    service_id: service_id.trim(),
    date: date.trim(),
  })

  return apiFetch<{ slots?: unknown[]; data?: { slots?: unknown[] } }>(`/api/appointments/slots?${query.toString()}`)
}

export async function createAppointment(payload:unknown){
  return apiFetch('/api/appointments',{
    method:'POST',
    body:JSON.stringify(payload)
  })
}

// Activity Feed - exported function
export async function getActivityFeed() {
  return apiFetch<ActivityFeedResponse>('/api/activity/feed')
}

// Appointments Today - exported function
export async function getAppointmentsToday() {
  return apiFetch<AppointmentsTodayResponse>('/api/appointments/today')
}

// Revenue Forecast - exported function
export async function getRevenueForecast() {
  return apiFetch<RevenueForecastResponse>('/api/ai/forecast')
}

// Staff Performance - exported function
export async function getStaffPerformance() {
  return apiFetch<StaffPerformanceResponse>('/api/analytics/staff-performance')
}

// Utilization Heatmap - exported function
export async function getUtilizationHeatmap() {
  return apiFetch<UtilizationHeatmapResponse>('/api/analytics/utilization-heatmap')
}
