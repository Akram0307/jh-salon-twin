import { z } from 'zod';

export const createAppointmentSchema = z.object({
  salon_id: z.string().uuid(),
  client_id: z.string().uuid(),
  staff_id: z.string().uuid().optional(),
  appointment_time: z.string(),
  status: z.string().optional(),
  services: z.array(z.object({
    service_id: z.string().uuid(),
    base_price: z.number().min(0),
    charged_price: z.number().min(0).optional(),
  })).optional(),
}).strict();

export const updateAppointmentStatusSchema = z.object({
  status: z.string(),
}).strict();

export const addAppointmentServiceSchema = z.object({
  service_id: z.string().uuid(),
  base_price: z.number().min(0),
  charged_price: z.number().min(0).optional(),
}).strict();

export const updateServicePriceSchema = z.object({
  charged_price: z.number().min(0),
}).strict();

export const rescheduleAppointmentSchema = z.object({
  newDate: z.string().optional(),
  newStartTime: z.string(),
  newEndTime: z.string().optional(),
}).strict();

export const bulkStatusUpdateSchema = z.object({
  salon_id: z.string().uuid(),
  appointment_ids: z.array(z.string().uuid()).min(1).max(100),
  status: z.string(),
  staff_id: z.string().uuid().optional(),
  reason: z.string().optional(),
}).strict();

export const appointmentStatusUpdateSchema = z.object({
  salon_id: z.string().uuid(),
  status: z.string(),
  staff_id: z.string().uuid().optional(),
  reason: z.string().optional(),
}).strict();
