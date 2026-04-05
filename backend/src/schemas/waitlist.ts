import { z } from 'zod';

export const createWaitlistEntrySchema = z.object({
  clientId: z.string().uuid(),
  preferredDate: z.string(),
  preferredTimeRange: z.string().optional(),
  notes: z.string().optional(),
}).strict();

export const updateWaitlistStatusSchema = z.object({
  status: z.string(),
}).strict();
