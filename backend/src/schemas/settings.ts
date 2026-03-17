import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
}).strict();

export const updateNotificationPrefsSchema = z.object({
  email: z.boolean().optional(),
  sms: z.boolean().optional(),
  push: z.boolean().optional(),
}).strict();

export const verify2FASchema = z.object({
  token: z.string().min(1),
}).strict();

export const updateSecuritySettingsSchema = z.object({
  login_notifications: z.boolean().optional(),
}).strict();
