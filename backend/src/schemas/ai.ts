import { z } from 'zod';

export const forecastSchema = z.object({
  salonId: z.string().optional(),
}).strict();

export const recomputePopularitySchema = z.object({
  salonId: z.string().optional(),
}).strict();

export const generateOfferSchema = z.object({
  salonId: z.string().min(1),
  clientId: z.string().min(1),
  serviceId: z.string().min(1),
}).strict();
