import { z } from 'zod';

export const createPaymentSchema = z.object({
  appointment_id: z.string().uuid().optional(),
  client_id: z.string().uuid().optional(),
  staff_id: z.string().uuid().optional(),
  amount: z.number().positive(),
  payment_method: z.enum(['cash', 'phonepe', 'upi', 'card', 'other']),
  reference_number: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
}).strict();

export const updatePaymentSchema = z.object({
  amount: z.number().positive().optional(),
  payment_method: z.enum(['cash', 'phonepe', 'upi', 'card', 'other']).optional(),
  payment_status: z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
  reference_number: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
}).strict();

export const refundSchema = z.object({
  notes: z.string().max(500).optional(),
}).strict();

export const generateZReportSchema = z.object({
  report_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).strict();

export const updateZReportNotesSchema = z.object({
  notes: z.string().max(1000),
}).strict();

export const paymentFiltersSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  payment_method: z.enum(['cash', 'phonepe', 'upi', 'card', 'other']).optional(),
  payment_status: z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
  client_id: z.string().uuid().optional(),
  staff_id: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
});
