import { z } from 'zod';

export const createSalonSchema = z.object({
  owner_id: z.string().min(1),
  name: z.string().min(1),
  city: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().min(1),
  whatsapp_number: z.string().optional(),
}).strict();
