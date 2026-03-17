import { z } from 'zod';

// Existing schemas (used by other routes)
export const createStaffSchema = z.object({
  full_name: z.string().min(2).max(120),
  phone_number: z.string().min(7).max(32).optional().nullable(),
  email: z.string().email().optional(),
  role: z.string().min(2).max(60).optional().nullable(),
  services: z.array(z.any()).optional(),
}).strict();

export const updateStaffSchema = z.object({
  full_name: z.string().min(2).max(120).optional(),
  phone_number: z.string().min(7).max(32).optional().nullable(),
  email: z.string().email().optional(),
  role: z.string().min(2).max(60).optional().nullable(),
  services: z.array(z.any()).optional(),
}).strict();

export const staffAvailabilitySchema = z.object({
  availability: z.array(z.object({
    day_of_week: z.number().int().min(0).max(6),
    start_time: z.string(),
    end_time: z.string(),
    is_available: z.boolean().optional(),
  })).min(1),
}).strict();

export const staffTimeOffSchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  reason: z.string().optional().nullable(),
}).strict();

export const staffProfileUpdateSchema = z.object({
  full_name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
}).strict();

// Route-specific schemas for staffRoutes.ts
const normalizeOptionalString = (value: unknown) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const emailSchema = z.string().trim().email('email must be a valid email address').transform((value) => value.toLowerCase());

export const staffCreateRouteSchema = z.object({
  full_name: z.string().trim().min(2, 'full_name must be at least 2 characters').max(120),
  email: emailSchema,
  phone_number: z.preprocess(
    normalizeOptionalString,
    z.string().trim().min(7, 'phone_number must be at least 7 characters').max(32).nullable().optional()
  ),
  role: z.preprocess(
    normalizeOptionalString,
    z.string().trim().min(2, 'role must be at least 2 characters').max(60).nullable().optional()
  ),
  is_active: z.boolean().optional(),
}).strict();

export const staffUpdateRouteSchema = z.object({
  full_name: z.string().trim().min(2, 'full_name must be at least 2 characters').max(120).optional(),
  email: emailSchema.optional(),
  phone_number: z.preprocess(
    normalizeOptionalString,
    z.string().trim().min(7, 'phone_number must be at least 7 characters').max(32).nullable().optional()
  ),
  role: z.preprocess(
    normalizeOptionalString,
    z.string().trim().min(2, 'role must be at least 2 characters').max(60).nullable().optional()
  ),
  is_active: z.boolean().optional(),
}).refine((payload) => Object.keys(payload).length > 0, {
  message: 'At least one field is required to update staff',
});

// Workspace schemas for staffWorkspaceRoutes.ts
export const updateAvailabilitySchema = z.object({
  staffId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  isAvailable: z.boolean(),
}).strict();

export const createTimeoffSchema = z.object({
  staffId: z.string().uuid(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  reason: z.string().min(1).max(500),
}).strict();
