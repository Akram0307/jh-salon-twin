import { z } from 'zod';

// Existing schemas (used by other routes)
export const createServiceSchema = z.object({
  name: z.string().min(2).max(120),
  base_price: z.number().min(0),
  duration_minutes: z.number().int().min(5).max(480).optional(),
  description: z.string().max(1000).optional().nullable(),
  category: z.string().min(2).max(80).optional().nullable(),
});

export const updateServiceSchema = createServiceSchema.partial();

// Route-specific schemas for serviceRoutes.ts
export const serviceCreateRouteSchema = z.object({
  name: z.string().trim().min(2, 'Service name must be at least 2 characters').max(120, 'Service name must be at most 120 characters'),
  description: z.string().trim().max(1000, 'Description must be at most 1000 characters').optional().nullable(),
  duration_minutes: z.coerce.number().int('Duration must be a whole number').min(5, 'Duration must be at least 5 minutes').max(480, 'Duration must be 480 minutes or less'),
  price: z.coerce.number().min(0, 'Price cannot be negative').max(100000, 'Price is too high'),
  category: z.string().trim().min(2, 'Category must be at least 2 characters').max(80, 'Category must be at most 80 characters').optional().nullable(),
  is_active: z.boolean().optional(),
});

export const serviceUpdateRouteSchema = serviceCreateRouteSchema.partial().refine((payload) => Object.keys(payload).length > 0, {
  message: 'At least one field is required to update a service',
});
