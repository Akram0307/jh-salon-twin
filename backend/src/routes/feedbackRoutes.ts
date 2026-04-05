import { Router, Request, Response } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createFeedbackRouteSchema, updateFeedbackRouteSchema, trackEventSchema, batchTrackSchema, pageviewSchema, errorTrackSchema, feedbackQuerySchema, analyticsQuerySchema, dateRangeSchema } from '../schemas/feedback';
import { FeedbackRepository } from '../repositories/FeedbackRepository';
import { AnalyticsRepository } from '../repositories/AnalyticsRepository';

import logger from '../config/logger';
import { FeedbackTrackEvent, getErrorMessage } from '../types/routeTypes'
import { ZodError } from 'zod';
const log = logger.child({ module: 'feedback_routes' });

const router = Router();
router.use(authenticate);

// ============================================
// Feedback CRUD
// ============================================

// GET /api/feedback - List feedback with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const filters = feedbackQuerySchema.parse(req.query);
    const result = await FeedbackRepository.findAll(filters);
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    log.error({ err: error }, 'Error listing feedback:');
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: 'Invalid query parameters', details: error.errors });
    }
    res.status(500).json({ success: false, error: getErrorMessage(error) || 'Internal server error' });
  }
});

// POST /api/feedback - Create feedback
router.post('/', validate(createFeedbackRouteSchema), async (req: Request, res: Response) => {
  try {
    const salon_id = req.headers['x-salon-id'] as string;
    const user_id = (req as AuthRequest).user?.id;
    const feedback = await FeedbackRepository.create({
      ...req.body,
      salon_id,
      user_id,
    });
    res.status(201).json({ success: true, data: feedback });
  } catch (error: unknown) {
    log.error({ err: error }, 'Error creating feedback:');
    res.status(500).json({ success: false, error: getErrorMessage(error) || 'Internal server error' });
  }
});

// GET /api/feedback/:id - Get feedback by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const feedback = await FeedbackRepository.findById(String(req.params.id));
    if (!feedback) {
      return res.status(404).json({ success: false, error: 'Feedback not found' });
    }
    res.json({ success: true, data: feedback });
  } catch (error: unknown) {
    log.error({ err: error }, 'Error getting feedback:');
    res.status(500).json({ success: false, error: getErrorMessage(error) || 'Internal server error' });
  }
});

// PATCH /api/feedback/:id - Update feedback
router.patch('/:id', validate(updateFeedbackRouteSchema), async (req: Request, res: Response) => {
  try {
    const feedback = await FeedbackRepository.update(String(req.params.id), req.body);
    if (!feedback) {
      return res.status(404).json({ success: false, error: 'Feedback not found' });
    }
    res.json({ success: true, data: feedback });
  } catch (error: unknown) {
    log.error({ err: error }, 'Error updating feedback:');
    res.status(500).json({ success: false, error: getErrorMessage(error) || 'Internal server error' });
  }
});

// ============================================
// Analytics Tracking
// ============================================

// POST /api/feedback/track - Track a single event
router.post('/track', validate(trackEventSchema), async (req: Request, res: Response) => {
  try {
    const salon_id = req.headers['x-salon-id'] as string;
    const user_id = (req as AuthRequest).user?.id;
    const event = await AnalyticsRepository.trackEvent({
      ...req.body,
      salon_id,
      user_id,
    });
    res.status(201).json({ success: true, data: event });
  } catch (error: unknown) {
    log.error({ err: error }, 'Error tracking event:');
    res.status(500).json({ success: false, error: getErrorMessage(error) || 'Internal server error' });
  }
});

// POST /api/feedback/batch-track - Track multiple events
router.post('/batch-track', validate(batchTrackSchema), async (req: Request, res: Response) => {
  try {
    const salon_id = req.headers['x-salon-id'] as string;
    const user_id = (req as AuthRequest).user?.id;
    const results = await AnalyticsRepository.batchTrackEvents(
      req.body.events.map((e: FeedbackTrackEvent) => ({ ...e, salon_id, user_id }))
    );
    res.status(201).json({ success: true, data: results });
  } catch (error: unknown) {
    log.error({ err: error }, 'Error batch tracking events:');
    res.status(500).json({ success: false, error: getErrorMessage(error) || 'Internal server error' });
  }
});

// POST /api/feedback/pageview - Track page view
router.post('/pageview', validate(pageviewSchema), async (req: Request, res: Response) => {
  try {
    const salon_id = req.headers['x-salon-id'] as string;
    const user_id = (req as AuthRequest).user?.id;
    const pageview = await AnalyticsRepository.trackPageview({
      ...req.body,
      salon_id,
      user_id,
    });
    res.status(201).json({ success: true, data: pageview });
  } catch (error: unknown) {
    log.error({ err: error }, 'Error tracking pageview:');
    res.status(500).json({ success: false, error: getErrorMessage(error) || 'Internal server error' });
  }
});

// POST /api/feedback/error - Track error
router.post('/error', validate(errorTrackSchema), async (req: Request, res: Response) => {
  try {
    const salon_id = req.headers['x-salon-id'] as string;
    const user_id = (req as AuthRequest).user?.id;
    const error = await AnalyticsRepository.trackError({
      ...req.body,
      salon_id,
      user_id,
    });
    res.status(201).json({ success: true, data: error });
  } catch (error: unknown) {
    log.error({ err: error }, 'Error tracking error:');
    res.status(500).json({ success: false, error: getErrorMessage(error) || 'Internal server error' });
  }
});

// ============================================
// Analytics Queries
// ============================================

// GET /api/feedback/analytics/events - Get event analytics
router.get('/analytics/events', async (req: Request, res: Response) => {
  try {
    const filters = analyticsQuerySchema.parse(req.query);
    const result = await AnalyticsRepository.getEventAnalytics(filters);
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    log.error({ err: error }, 'Error getting event analytics:');
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: 'Invalid query parameters', details: error.errors });
    }
    res.status(500).json({ success: false, error: getErrorMessage(error) || 'Internal server error' });
  }
});

// GET /api/feedback/analytics/pageviews - Get pageview analytics
router.get('/analytics/pageviews', async (req: Request, res: Response) => {
  try {
    const filters = dateRangeSchema.parse(req.query);
    const result = await AnalyticsRepository.getPageviewAnalytics(filters);
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    log.error({ err: error }, 'Error getting pageview analytics:');
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: 'Invalid query parameters', details: error.errors });
    }
    res.status(500).json({ success: false, error: getErrorMessage(error) || 'Internal server error' });
  }
});

// GET /api/feedback/analytics/errors - Get error analytics
router.get('/analytics/errors', async (req: Request, res: Response) => {
  try {
    const filters = dateRangeSchema.parse(req.query);
    const result = await AnalyticsRepository.getErrorAnalytics(filters);
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    log.error({ err: error }, 'Error getting error analytics:');
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: 'Invalid query parameters', details: error.errors });
    }
    res.status(500).json({ success: false, error: getErrorMessage(error) || 'Internal server error' });
  }
});

export default router;
