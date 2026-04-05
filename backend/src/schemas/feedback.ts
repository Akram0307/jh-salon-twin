import { z } from 'zod';

// Existing schema (used by other routes)
export const createFeedbackSchema = z.object({
  appointment_id: z.string().uuid(),
  client_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
}).strict();

// Route-specific schemas for feedbackRoutes.ts
export const createFeedbackRouteSchema = z.object({
  feedback_type: z.enum(['bug_report', 'feature_request', 'general_feedback']),
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  page_url: z.string().url().optional(),
  browser_info: z.record(z.any()).optional(),
  attachments: z.array(z.string()).optional(),
}).strict();

export const updateFeedbackRouteSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  admin_notes: z.string().optional(),
  resolved_by: z.string().uuid().optional(),
}).strict();

export const trackEventSchema = z.object({
  event_name: z.string().min(1).max(100),
  event_category: z.enum(['navigation', 'interaction', 'conversion', 'error', 'performance', 'custom']),
  event_data: z.record(z.any()).optional(),
  page_url: z.string().optional(),
  session_id: z.string().optional(),
  device_type: z.string().optional(),
  browser: z.string().optional(),
  os: z.string().optional(),
}).strict();

export const batchTrackSchema = z.object({
  events: z.array(trackEventSchema).min(1).max(50),
}).strict();

export const pageviewSchema = z.object({
  page_url: z.string().min(1),
  session_id: z.string().optional(),
  device_type: z.string().optional(),
  browser: z.string().optional(),
  os: z.string().optional(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
}).strict();

export const errorTrackSchema = z.object({
  error_type: z.string().min(1),
  error_message: z.string().min(1),
  stack_trace: z.string().optional(),
  session_id: z.string().optional(),
  page_url: z.string().optional(),
}).strict();

// Query schemas (used by GET routes, not for validate middleware)
export const feedbackQuerySchema = z.object({
  feedback_type: z.enum(['bug_report', 'feature_request', 'general_feedback']).optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  user_id: z.string().uuid().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const analyticsQuerySchema = z.object({
  event_name: z.string().optional(),
  event_category: z.enum(['navigation', 'interaction', 'conversion', 'error', 'performance', 'custom']).optional(),
  user_id: z.string().uuid().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const dateRangeSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
