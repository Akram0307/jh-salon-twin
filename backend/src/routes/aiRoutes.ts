import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { forecastSchema, recomputePopularitySchema, generateOfferSchema } from '../schemas/ai';
import { AIService } from '../services/AIService';

import logger from '../config/logger';
const log = logger.child({ module: 'ai_routes' });

const router = Router();
router.use(authenticate);

// POST /api/ai/campaigns/:id/pause - Pause a campaign (no body)
router.post('/campaigns/:id/pause', async (req: Request, res: Response) => {
  try {
    const result = await AIService.pauseCampaign(String(req.params.id));
    res.json({ success: true, data: result });
  } catch (error: any) {
    log.error({ err: error }, 'Error pausing campaign:');
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// POST /api/ai/campaigns/:id/resume - Resume a campaign (no body)
router.post('/campaigns/:id/resume', async (req: Request, res: Response) => {
  try {
    const result = await AIService.resumeCampaign(String(req.params.id));
    res.json({ success: true, data: result });
  } catch (error: any) {
    log.error({ err: error }, 'Error resuming campaign:');
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// POST /api/ai/forecast - Generate forecast
router.post('/forecast', validate(forecastSchema), async (req: Request, res: Response) => {
  try {
    const salonId = req.body.salonId || req.headers['x-salon-id'] as string;
    const result = await AIService.generateForecast(salonId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    log.error({ err: error }, 'Error generating forecast:');
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// POST /api/ai/recompute-popularity - Recompute service popularity
router.post('/recompute-popularity', validate(recomputePopularitySchema), async (req: Request, res: Response) => {
  try {
    const salonId = req.body.salonId || req.headers['x-salon-id'] as string;
    const result = await AIService.recomputePopularity(salonId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    log.error({ err: error }, 'Error recomputing popularity:');
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// POST /api/ai/generate-offer - Generate an offer
router.post('/generate-offer', validate(generateOfferSchema), async (req: Request, res: Response) => {
  try {
    const { salonId, clientId, serviceId } = req.body;
    const result = await AIService.generateOffer({ salonId, clientId, serviceId });
    res.json({ success: true, data: result });
  } catch (error: any) {
    log.error({ err: error }, 'Error generating offer:');
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

export default router;
