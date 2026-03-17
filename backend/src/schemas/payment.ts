import { z } from 'zod';

export const createPaymentSchema = z.object({
  appointment_id: z.string().uuid(),
  amount: z.number().min(0),
  payment_method: z.string(),
  status: z.string().optional(),
  transaction_id: z.string().optional(),
}).strict();

export const updatePaymentSchema = createPaymentSchema.partial().strict();
