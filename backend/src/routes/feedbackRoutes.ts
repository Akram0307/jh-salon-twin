import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import FeedbackAnalyticsService from '../services/FeedbackAnalyticsService';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Validation schemas
const createFeedbackSchema = z.object({
  feedback_type: z.enum(['bug_report', 'feature_request', 'general_feedback']),
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  page_url: z.string().url().optional(),
  browser_info: z.record(z.any()).optional(),
  attachments: z.array(z.string()).optional()
});

const updateFeedbackSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  admin_notes: z.string().optional(),
  resolved_by: z.string().uuid().optional()
});

const feedbackQuerySchema = z.object({
  feedback_type: z.enum(['bug_report', 'feature_request', 'general_feedback']).optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  user_id: z.string().uuid().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional()
});

const trackEventSchema = z.object({
  event_name: z.string().min(1).max(100),
  event_category: z.enum(['navigation', 'interaction', 'conversion', 'error', 'performance', 'custom']),
  event_data: z.record(z.any()).optional(),
  page_url: z.string().optional(),
  session_id: z.string().optional(),
  device_type: z.string().optional(),
  browser: z.string().optional(),
  os: z.string().optional()
});

const analyticsQuerySchema = z.object({
  event_name: z.string().optional(),
  event_category: z.enum(['navigation', 'interaction', 'conversion', 'error', 'performance', 'custom']).optional(),
  user_id: z.string().uuid().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional()
});

const dateRangeSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

// Helper to get salon_id from request
const getSalonId = (req: Request): string => {
  return (req as any).user?.salon_id || req.params.salonId;
};

// Helper to get user_id from request
const getUserId = (req: Request): string => {
  return (req as any).user?.id || req.body.user_id;
};

// ============ FEEDBACK ENDPOINTS ============

/**
 * POST /api/feedback
 * Create new feedback (bug report, feature request, etc.)
 */
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const salon_id = getSalonId(req);
    const user_id = getUserId(req);
    
    const validatedData = createFeedbackSchema.parse(req.body);
    
    const feedback = await FeedbackAnalyticsService.createFeedback({
      salon_id,
      user_id,
      ...validatedData
    });
    
    res.status(201).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/feedback
 * List feedback with filters and pagination
 */
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const salon_id = getSalonId(req);
    
    const filters = feedbackQuerySchema.parse(req.query);
    
    const result = await FeedbackAnalyticsService.getFeedbackByFilters({
      salon_id,
      ...filters
    });
    
    res.json({
      success: true,
      data: result.feedback,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        total_pages: result.total_pages
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/feedback/stats
 * Get feedback statistics
 */
router.get('/stats', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const salon_id = getSalonId(req);
    const { start_date, end_date } = req.query as { start_date?: string; end_date?: string };
    
    const stats = await FeedbackAnalyticsService.getFeedbackStats(salon_id, start_date, end_date);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/feedback/:id
 * Get feedback by ID
 */
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const salon_id = getSalonId(req);
    const { id } = req.params;
    
    const feedback = await FeedbackAnalyticsService.getFeedbackById(id, salon_id);
    
    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/feedback/:id
 * Update feedback (status, priority, admin notes)
 */
router.patch('/:id', authenticate, authorize(['owner', 'manager', 'admin']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const salon_id = getSalonId(req);
    const { id } = req.params;
    
    const updates = updateFeedbackSchema.parse(req.body);
    
    const feedback = await FeedbackAnalyticsService.updateFeedback(id, salon_id, updates);
    
    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/feedback/:id
 * Delete feedback
 */
router.delete('/:id', authenticate, authorize(['owner', 'admin']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const salon_id = getSalonId(req);
    const { id } = req.params;
    
    await FeedbackAnalyticsService.deleteFeedback(id, salon_id);
    
    res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============ ANALYTICS ENDPOINTS ============

/**
 * POST /api/feedback/analytics/track
 * Track an analytics event
 */
router.post('/analytics/track', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const salon_id = getSalonId(req);
    const user_id = getUserId(req);
    
    const validatedData = trackEventSchema.parse(req.body);
    
    const event = await FeedbackAnalyticsService.trackEvent({
      salon_id,
      user_id,
      ...validatedData
    });
    
    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/feedback/analytics/track/batch
 * Track multiple analytics events
 */
router.post('/analytics/track/batch', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const salon_id = getSalonId(req);
    const user_id = getUserId(req);
    const { events } = req.body;
    
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Events array is required and must not be empty'
      });
    }
    
    if (events.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 50 events per batch'
      });
    }
    
    const results = await Promise.all(
      events.map(event =>
        FeedbackAnalyticsService.trackEvent({
          salon_id,
          user_id,
          ...event
        })
      )
    );
    
    res.status(201).json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/feedback/analytics
 * Get analytics events with filters
 */
router.get('/analytics', authenticate, authorize(['owner', 'manager', 'admin']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const salon_id = getSalonId(req);
    
    const filters = analyticsQuerySchema.parse(req.query);
    
    const result = await FeedbackAnalyticsService.getAnalyticsByFilters({
      salon_id,
      ...filters
    });
    
    res.json({
      success: true,
      data: result.events,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        total_pages: result.total_pages
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/feedback/analytics/summary
 * Get analytics summary
 */
router.get('/analytics/summary', authenticate, authorize(['owner', 'manager', 'admin']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const salon_id = getSalonId(req);
    const { start_date, end_date } = req.query as { start_date?: string; end_date?: string };
    
    const summary = await FeedbackAnalyticsService.getAnalyticsSummary(salon_id, start_date, end_date);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/feedback/analytics/daily
 * Get daily analytics summary
 */
router.get('/analytics/daily', authenticate, authorize(['owner', 'manager', 'admin']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const salon_id = getSalonId(req);
    const { start_date, end_date } = dateRangeSchema.parse(req.query);
    
    const summary = await FeedbackAnalyticsService.getDailyAnalyticsSummary(salon_id, start_date, end_date);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/feedback/analytics/pageview
 * Track page view (convenience endpoint)
 */
router.post('/analytics/pageview', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const salon_id = getSalonId(req);
    const user_id = getUserId(req);
    const { page_url, session_id, device_type, browser, os, ip_address, user_agent } = req.body;
    
    if (!page_url) {
      return res.status(400).json({
        success: false,
        error: 'page_url is required'
      });
    }
    
    const event = await FeedbackAnalyticsService.trackPageView(
      salon_id,
      page_url,
      user_id,
      session_id,
      {
        device_type,
        browser,
        os,
        ip_address: ip_address || req.ip,
        user_agent: user_agent || req.headers['user-agent']
      }
    );
    
    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/feedback/analytics/error
 * Track error event (convenience endpoint)
 */
router.post('/analytics/error', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const salon_id = getSalonId(req);
    const user_id = getUserId(req);
    const { error_type, error_message, stack_trace, session_id, page_url } = req.body;
    
    if (!error_type || !error_message) {
      return res.status(400).json({
        success: false,
        error: 'error_type and error_message are required'
      });
    }
    
    const event = await FeedbackAnalyticsService.trackError(
      salon_id,
      error_type,
      error_message,
      stack_trace,
      user_id,
      session_id,
      page_url
    );
    
    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
});

export default router;
