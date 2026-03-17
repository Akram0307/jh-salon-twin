import { z } from 'zod';

export const onboardingStartSchema = z.object({
  owner_name: z.string().min(1),
  owner_email: z.string().email(),
  salon_name: z.string().min(1),
  men_chairs: z.number().int().min(0).optional(),
  women_chairs: z.number().int().min(0).optional(),
  unisex_chairs: z.number().int().min(0).optional(),
  waiting_seats: z.number().int().min(0).optional(),
}).strict();

export const capacitySchema = z.object({
  salon_id: z.string().uuid(),
  men_chairs: z.number().int().min(0).optional(),
  women_chairs: z.number().int().min(0).optional(),
  unisex_chairs: z.number().int().min(0).optional(),
  waiting_seats: z.number().int().min(0).optional(),
}).strict();
