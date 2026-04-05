/**
 * Shared type definitions for the service layer.
 * Eliminates the need for `any` in service files.
 */
import type { QueryParams } from './repositoryTypes';
import type { JwtTokenPayload } from './routeTypes';

// ─── Demand Engine ───────────────────────────────────────────────
export interface DemandScanJobData {
  salonId: string;
}

export interface IdleSlot {
  service_id: string;
  start_time: Date | string;
  [key: string]: unknown;
}

export interface RecentClient {
  id: string;
  name: string;
  phone: string;
  [key: string]: unknown;
}

// ─── Message State ───────────────────────────────────────────────
export interface MessageStateRow {
  id: string;
  salon_id: string;
  client_id: string;
  message_type: string;
  engine_context: unknown;
  state: string;
  created_at: Date | string;
  updated_at: Date | string;
  [key: string]: unknown;
}

// ─── Conversation Context ────────────────────────────────────────
export interface ConversationContextUpdateData {
  salon_id?: string;
  last_intent?: string | null;
  pending_action?: string | null;
  last_service_id?: string | null;
  last_staff_id?: string | null;
  conversation_state?: string | null;
}

// ─── Slot Suggestion ─────────────────────────────────────────────
export interface ClientPreferenceCacheEntry {
  [key: string]: unknown;
}

export interface BookedSlotKeyRow {
  staff_id: string;
  appointment_time: Date | string;
}

export interface SlotInteractionRow {
  slot_time: Date | string;
  accepted: boolean;
}

// ─── A/B Testing ─────────────────────────────────────────────────
export interface ExperimentResultDbRow {
  experiment_id: string;
  algorithm: string;
  total_suggestions: string;
  accepted_suggestions: string;
  acceptance_rate: string;
}

export interface ExperimentSummaryResult {
  experiment_id: string;
  results: {
    experiment_id: string;
    algorithm: string;
    total_suggestions: number;
    accepted_suggestions: number;
    acceptance_rate: number;
  }[];
  significant: boolean;
  control_acceptance_rate?: number;
  variant_acceptance_rate?: number;
  improvement?: string;
  z_score?: string;
}

// ─── Rebooking ───────────────────────────────────────────────────
export interface ServiceHistoryEntry {
  appointment_date: Date | string;
  [key: string]: unknown;
}

export interface RebookingSuggestion {
  clientId: string;
  salonId: string;
  suggestedDate: Date;
  daysUntilVisit: number;
  type: string;
}

// ─── Beauty Profile ──────────────────────────────────────────────
export interface BeautyProfilePayload {
  [key: string]: unknown;
}

// ─── Config ──────────────────────────────────────────────────────
export interface ConfigDbRow {
  salon_id?: string | null;
  ai_name?: string | null;
  ai_tone?: string | null;
  operating_hours?: unknown;
  buffer_time_minutes?: number | null;
  deposit_required?: boolean | null;
  updated_at?: string | null;
  [key: string]: unknown;
}

// ─── Domain Events ───────────────────────────────────────────────
export interface DomainEvent {
  type: string;
  payload?: unknown;
  timestamp?: Date;
}

// ─── Messaging Events ────────────────────────────────────────────
export interface MessagingEvent {
  type: string;
  salon_id: string;
  payload: unknown;
}

// ─── WebSocket ───────────────────────────────────────────────────
export interface WsMessage {
  type: string;
  payload?: unknown;
  [key: string]: unknown;
}

export interface WsConnectionReq {
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
  [key: string]: unknown;
}

export interface AppointmentBroadcastData {
  id: string;
  salon_id: string;
  client_id: string;
  staff_id: string | null;
  appointment_time: Date | string;
  status: string;
  [key: string]: unknown;
}

export interface StaffAvailabilityBroadcastData {
  staff_id: string;
  date: string;
  is_available: boolean;
  [key: string]: unknown;
}

export interface BookingBroadcastData {
  id: string;
  salon_id: string;
  client_id: string;
  [key: string]: unknown;
}

export interface DashboardRefreshData {
  trigger?: string;
  [key: string]: unknown;
}

export interface NotificationBroadcastData {
  id?: string;
  type: string;
  title?: string;
  message?: string;
  [key: string]: unknown;
}

// ─── PWA Concierge ───────────────────────────────────────────────
export interface RichMediaAction {
  type: string;
  label?: string;
  value?: string;
  [key: string]: unknown;
}

export interface PwaIncomingMessage {
  sessionId: string;
  message: string;
  context?: {
    salonId?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// ─── Feedback Analytics ──────────────────────────────────────────
export interface FeedbackBrowserInfo {
  userAgent?: string;
  language?: string;
  screenSize?: string;
  [key: string]: unknown;
}

export interface FeedbackEventData {
  [key: string]: unknown;
}

// ─── Email ───────────────────────────────────────────────────────
export interface SendGridMailData {
  to: string;
  from: { email: string; name: string };
  subject: string;
  html: string;
  text?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, unknown>;
}

// ─── Staff Workspace ─────────────────────────────────────────────
export interface StaffWorkspaceResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// ─── Slot Generator ──────────────────────────────────────────────
export interface GeneratedSlot {
  staff_id: string;
  staff_name: string;
  time: string;
  duration_minutes: number;
  price: number;
}

// ─── Metrics ─────────────────────────────────────────────────────
export interface TopPerformingSlotRow {
  slot_time: Date | string;
  staff_id: string;
  acceptance_count: string;
}

export interface MetricsByAlgorithmRow {
  algorithm_version: string;
  total: string;
  accepted: string;
  rate: string;
}

// ─── Gap Fill ────────────────────────────────────────────────────
export interface AppointmentTimeRow {
  appointment_time: Date | string;
  end_time: Date | string;
}

// ─── Twilio ──────────────────────────────────────────────────────
export interface TwilioContentMessageParams {
  to: string;
  from: string;
  contentSid: string;
  contentVariables: string;
}


// ─── PWA JWT ────────────────────────────────────────────────────
export interface PwaJwtPayload {
  id?: string;
  userId?: string;
  sub?: string;
  email?: string;
  role?: string;
  salon_id?: string;
  [key: string]: unknown;
}

// ─── Extended Repo (for non-standard methods) ───────────────────
export type ExtendedRepo<T> = T & Record<string, (...args: unknown[]) => Promise<unknown>>;

// ─── Upsell Result ──────────────────────────────────────────────
export interface UpsellResult {
  upsell_service_id: string;
  name?: string;
}
