import { z } from 'zod';

export const updateBrandingSchema = z.object({
  primary_color: z.string().optional(),
  secondary_color: z.string().optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  social_links: z.record(z.string()).optional(),
}).strict();

export const updateBusinessHoursSchema = z.object({
  hours: z.array(z.object({
    day_of_week: z.number().int().min(0).max(6),
    is_open: z.boolean(),
    open_time: z.string().optional(),
    close_time: z.string().optional(),
  })).optional(),
  timezone: z.string().optional(),
}).strict();

export const updateNotificationsSchema = z.object({
  appointment_reminders: z.boolean().optional(),
  reminder_lead_time: z.number().optional(),
  cancellation_notifications: z.boolean().optional(),
  no_show_alerts: z.boolean().optional(),
}).strict();

export const updateServicesConfigSchema = z.object({
  default_duration: z.number().optional(),
  buffer_time: z.number().optional(),
  allow_overlapping: z.boolean().optional(),
}).strict();

export const updateSalonServiceSchema = z.object({
  name: z.string().min(1).optional(),
  base_price: z.number().min(0).optional(),
  duration_minutes: z.number().int().min(5).max(480).optional(),
  description: z.string().max(1000).optional().nullable(),
  category: z.string().min(1).optional().nullable(),
  is_active: z.boolean().optional(),
}).strict();
