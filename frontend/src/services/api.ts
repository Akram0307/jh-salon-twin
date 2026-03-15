import { apiFetch } from '../core/api/client'

export interface ApiEnvelope<T> {
  success: boolean
  data: T
  meta?: Record<string, unknown>
  error?: string
}

export interface ChatResponse {
  success:boolean
  message:string
  ui?:{
    type:string
    data?:any
  }
}

export interface StaffRecord {
  id: string
  full_name: string
  email: string
  phone_number?: string | null
  role?: string | null
  is_active?: boolean
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

export function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  if (value && typeof value === 'object' && Array.isArray((value as { data?: unknown[] }).data)) {
    return ((value as { data: unknown[] }).data ?? []) as T[]
  }
  return []
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

export async function getStaff(){
  return apiFetch<ApiEnvelope<StaffRecord[]>>('/api/staff')
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
  return apiFetch(`/api/appointments/slots?salon_id=${salon_id}&service_id=${service_id}&date=${date}`)
}
