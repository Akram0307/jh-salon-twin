import { z } from 'zod';

export const upsellSuggestionsSchema = z.object({
  serviceId: z.string().uuid(),
  salonId: z.string().uuid(),
}).strict();
