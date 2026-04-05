import { z } from 'zod';

export const revenueActionSchema = z.object({
  salonId: z.string().min(1),
  action: z.enum(['scan_opportunities']),
}).strict();
