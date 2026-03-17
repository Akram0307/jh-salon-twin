/**
 * Shared type definitions for the repository layer.
 * Eliminates the need for `any` in repository files.
 */

/** Dynamic SQL query parameter array (pg pool.query accepts unknown[]). */
export type QueryParams = unknown[];

/** JSON object stored in a PostgreSQL JSON/JSONB column. */
export type JsonData = Record<string, unknown>;

/** JSON array stored in a PostgreSQL JSON/JSONB column. */
export type JsonArray = unknown[];

/** Row returned by `SELECT COUNT(*) as count`. */
export interface CountRow {
  count: string;
}

/** Row from `SELECT appointment_time FROM appointments`. */
export interface BookedSlotRow {
  appointment_time: Date | string;
}

/** Raw action_history DB row (JSON columns may be serialized strings). */
export interface ActionHistoryDbRow {
  id: string;
  salon_id: string;
  user_id: string;
  user_type: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  action_data: string | JsonData | null;
  previous_state: string | JsonData | null;
  new_state: string | JsonData | null;
  is_undoable: boolean;
  is_redoable: boolean;
  undone_at: Date | string | null;
  redone_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

/** Appointment row with transient slot-event metadata (internal use during cancellation). */
export interface AppointmentWithSlotMeta {
  id: string;
  salon_id: string;
  client_id: string;
  staff_id: string | null;
  appointment_time: Date | string;
  status: string;
  qr_token: string;
  created_at: Date | string;
  updated_at: Date | string;
  /** Transient – not a DB column. Set during cancellation to enqueue waitlist processing. */
  _slotEventId?: string;
  /** Transient – not a DB column. */
  _slotTime?: Date | string;
  [key: string]: unknown;
}
