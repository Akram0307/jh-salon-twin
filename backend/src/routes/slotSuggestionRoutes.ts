import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { rankSlotsSchema, naturalLanguageQuerySchema, compareSlotsSchema, recordInteractionSchema } from '../schemas/slotSuggestion';
import { SlotSuggestionService } from '../services/SlotSuggestionService';

import logger from '../config/logger';
import { getErrorMessage } from '../types/routeTypes'
const log = logger.child({ module: 'slot_suggestion_routes' });

const router = Router();
router.use(authenticate);

const slotService = SlotSuggestionService.getInstance();

// POST /api/slot-suggestions/rank - Rank available slots
router.post('/rank', validate(rankSlotsSchema), async (req: Request, res: Response) => {
  try {
    const ranked = await slotService.getSmartSuggestions(req.body);
    res.json({ success: true, data: ranked });
  } catch (error: unknown) {
    log.error({ err: error }, 'Error ranking slots:');
    res.status(500).json({ success: false, error: getErrorMessage(error) || 'Internal server error' });
  }
});

// POST /api/slot-suggestions/natural-language - Natural language slot query
router.post('/natural-language', validate(naturalLanguageQuerySchema), async (req: Request, res: Response) => {
  try {
    const result = await slotService.getSlotsFromNaturalLanguage(req.body);
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    log.error({ err: error }, 'Error processing natural language query:');
    res.status(500).json({ success: false, error: getErrorMessage(error) || 'Internal server error' });
  }
});

// POST /api/slot-suggestions/compare - Compare slots across dates
router.post('/compare', validate(compareSlotsSchema), async (req: Request, res: Response) => {
  try {
    const { clientId, salonId, serviceId, serviceDurationMinutes, servicePrice, dates, slotsPerDate } = req.body;
    const result = await slotService.getMultiSlotComparison(
      clientId, salonId, serviceId, serviceDurationMinutes, servicePrice, dates, slotsPerDate
    );
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    log.error({ err: error }, 'Error comparing slots:');
    res.status(500).json({ success: false, error: getErrorMessage(error) || 'Internal server error' });
  }
});

// POST /api/slot-suggestions/interaction - Record slot interaction
router.post('/interaction', validate(recordInteractionSchema), async (req: Request, res: Response) => {
  try {
    const { clientId, salonId, slotTime, accepted, algorithmVersion } = req.body;
    await slotService.recordInteraction(clientId, salonId, new Date(slotTime), accepted, algorithmVersion);
    res.json({ success: true, data: { recorded: true } });
  } catch (error: unknown) {
    log.error({ err: error }, 'Error recording interaction:');
    res.status(500).json({ success: false, error: getErrorMessage(error) || 'Internal server error' });
  }
});

export default router;
