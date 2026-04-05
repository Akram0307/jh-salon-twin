import { z } from 'zod';

export const rankSlotsSchema = z.object({
  clientId: z.string().min(1),
  salonId: z.string().min(1),
  serviceId: z.string().min(1),
  serviceDurationMinutes: z.number(),
  servicePrice: z.number(),
  date: z.string().min(1),
  slots: z.array(z.object({
    time: z.string(),
    staffId: z.string(),
    staffName: z.string().optional(),
  })).min(1),
  context: z.any().optional(),
}).strict();

export const naturalLanguageQuerySchema = z.object({
  query: z.string().min(1),
  clientId: z.string().min(1),
  salonId: z.string().min(1),
  serviceId: z.string().optional(),
}).strict();

export const compareSlotsSchema = z.object({
  clientId: z.string().min(1),
  salonId: z.string().min(1),
  serviceId: z.string().min(1),
  serviceDurationMinutes: z.number(),
  servicePrice: z.number(),
  dates: z.array(z.string().min(1)).min(1),
  slotsPerDate: z.number().int().min(1).optional(),
}).strict();

export const recordInteractionSchema = z.object({
  clientId: z.string().min(1),
  salonId: z.string().min(1),
  slotTime: z.string().min(1),
  accepted: z.boolean(),
}).strict();
