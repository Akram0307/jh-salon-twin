import { z } from 'zod';

export const createServiceSchema = z.object({
  name: z.string().min(2).max(120),
  base_price: z.number().min(0),
  duration_minutes: z.number().int().min(5).max(480).optional(),
  description: z.string().max(1000).optional().nullable(),
  category: z.string().min(2).max(80).optional().nullable(),
}).strict();

export const updateServiceSchema = createServiceSchema.partial().strict();
