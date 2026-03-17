import { z } from 'zod';

export const createStaffSchema = z.object({
  full_name: z.string().min(2).max(120),
  phone_number: z.string().min(7).max(32).optional().nullable(),
  email: z.string().email().optional(),
  role: z.string().min(2).max(60).optional().nullable(),
  services: z.array(z.any()).optional(),
}).strict();

export const updateStaffSchema = z.object({
  full_name: z.string().min(2).max(120).optional(),
  phone_number: z.string().min(7).max(32).optional().nullable(),
  email: z.string().email().optional(),
  role: z.string().min(2).max(60).optional().nullable(),
  services: z.array(z.any()).optional(),
}).strict();

export const staffAvailabilitySchema = z.object({
  availability: z.array(z.object({
    day_of_week: z.number().int().min(0).max(6),
    start_time: z.string(),
    end_time: z.string(),
    is_available: z.boolean().optional(),
  })).min(1),
}).strict();

export const staffTimeOffSchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  reason: z.string().optional().nullable(),
}).strict();

export const staffProfileUpdateSchema = z.object({
  full_name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
}).strict();
