import { z } from 'zod';

export const createNotificationSchema = z.object({
  user_id: z.string().uuid(),
  user_type: z.string(),
  title: z.string().min(1),
  message: z.string().min(1),
  type: z.string().optional(),
  appointment_id: z.string().uuid().optional(),
}).strict();

export const updateNotificationPreferencesSchema = z.object({
  user_id: z.string().uuid(),
  user_type: z.string(),
  preferences: z.any(),
}).strict();

export const createTemplateSchema = z.object({
  salon_id: z.string().min(1),
  name: z.string().min(1),
  type: z.string().min(1),
  subject: z.string().optional(),
  body: z.string().min(1),
  variables: z.any().optional(),
}).strict();

export const updateTemplateSchema = z.object({
  name: z.string().optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
  variables: z.any().optional(),
  is_active: z.boolean().optional(),
}).strict();

export const sendNotificationSchema = z.object({
  salon_id: z.string().min(1),
  user_id: z.string().min(1),
  user_type: z.string().min(1),
  type: z.string().min(1),
  recipient: z.string().min(1),
  template_name: z.string().optional(),
  subject: z.string().optional(),
  content: z.string().optional(),
  dynamic_data: z.any().optional(),
}).strict();
