/**
 * Shared type definitions for route handlers.
 * Eliminates the need for `any` in route files.
 */
import type { Request, Response } from 'express';

/** Safely extract an error message from an unknown caught value. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return String(error);
}

/** JWT token payload shape. */
export interface JwtTokenPayload {
  id: string;
  email: string;
  role: string;
  user_type: 'owner' | 'staff';
  salon_id?: string;
}

/** Generic untyped database row from pg query results. */
export type DbRow = Record<string, unknown>;

/** SSE activity event. */
export interface ActivityEvent {
  type: string;
  payload?: unknown;
  [key: string]: unknown;
}

/** POS line item. */
export interface PosItem {
  price: number | string;
  quantity?: number;
  [key: string]: unknown;
}

/** Feedback tracking event. */
export interface FeedbackTrackEvent {
  [key: string]: unknown;
}

/** Audit context (mirrors middleware/auditLogger shape). */
export interface AuditContext {
  salonId: string;
  entityType: string;
  action: string;
  actorId?: string | null;
  actorType?: string | null;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
}

/** Request augmented with audit context. */
export type AuditRequest = Request & {
  auditContext?: AuditContext;
};

/** Request augmented with multer file. */
export type MulterRequest = Request & {
  file?: Express.Multer.File;
};
