import { z } from 'zod';

export const createOwnerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
}).strict();

export const createScheduleRuleSchema = z.object({
  staff_id: z.string().uuid(),
  weekday: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  capacity: z.number().int().min(1).optional(),
  is_active: z.boolean().optional(),
}).strict();

export const updateScheduleRuleSchema = createScheduleRuleSchema.partial().strict();

export const updateOwnerSettingsSchema = z.object({
  salon_name: z.string().optional(),
  default_currency: z.string().optional(),
  timezone: z.string().optional(),
  appointment_buffer_minutes: z.number().optional(),
  auto_confirm_appointments: z.boolean().optional(),
  allow_client_cancellation: z.boolean().optional(),
  cancellation_cutoff_hours: z.number().optional(),
}).strict();
