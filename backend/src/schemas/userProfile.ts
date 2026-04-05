import { z } from 'zod';

export const updateSecuritySchema = z.object({
  login_notifications: z.boolean().optional(),
}).strict();
