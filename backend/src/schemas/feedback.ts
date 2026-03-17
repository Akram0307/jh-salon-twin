import { z } from 'zod';

export const createFeedbackSchema = z.object({
  appointment_id: z.string().uuid(),
  client_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
}).strict();
