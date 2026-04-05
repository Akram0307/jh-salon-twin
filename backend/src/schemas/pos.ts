import { z } from 'zod';

export const createDraftSchema = z.object({
  items: z.array(z.object({
    name: z.string(),
    price: z.number(),
    quantity: z.number().int().min(1).optional(),
    item_type: z.string().optional(),
  })).min(1),
}).strict();

export const completeTransactionSchema = z.object({
  items: z.array(z.object({
    name: z.string(),
    price: z.number(),
    quantity: z.number().int().min(1).optional(),
    item_type: z.string().optional(),
  })).min(1),
  subtotal: z.number().optional(),
  tip: z.number().optional(),
  total: z.number().optional(),
  paymentMethod: z.string().optional(),
  clientId: z.string().uuid().optional(),
  staffId: z.string().uuid().optional(),
  salonId: z.string().uuid().optional(),
}).strict();
