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
