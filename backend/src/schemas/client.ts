import { z } from 'zod';

export const createClientSchema = z.object({
  full_name: z.string().min(1),
  phone_number: z.string().min(1),
  email: z.string().email().optional().nullable(),
  notes: z.string().optional().nullable(),
  salon_id: z.string().uuid().optional(),
}).strict();

export const updateClientSchema = z.object({
  full_name: z.string().min(1).optional(),
  phone_number: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  notes: z.string().optional().nullable(),
}).strict();

export const createClientProfileSchema = z.object({
  salon_id: z.string().uuid(),
  hair_profile: z.any().optional(),
  skin_profile: z.any().optional(),
  stylist_preferences: z.any().optional(),
  color_formula_history: z.any().optional(),
  photo_references: z.any().optional(),
  allergies: z.any().optional(),
  notes: z.string().optional(),
}).strict();

export const updateClientProfileSchema = createClientProfileSchema.partial().strict();
