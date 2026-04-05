import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
}).strict();

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1),
}).strict();

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
  user_type: z.enum(['owner', 'staff']).optional(),
}).strict();

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
  user_type: z.enum(['owner', 'staff']).optional(),
}).strict();

export const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8),
}).strict();

export const changePasswordAltSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
}).strict();
