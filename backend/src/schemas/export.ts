import { z } from 'zod';

export const exportUploadSchema = z.object({
  type: z.enum(['clients', 'appointments', 'services', 'revenue', 'staff-performance']),
  format: z.enum(['csv', 'json']).optional(),
  salon_id: z.string().uuid().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
}).strict();
