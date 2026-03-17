import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { logActionSchema, getHistoryQuerySchema } from '../schemas/actionHistory';
import { ActionHistoryService } from '../services/ActionHistoryService';

import logger from '../config/logger';
const log = logger.child({ module: 'action_history_routes' });

const router = Router();
router.use(authenticate);

const actionHistoryService = new ActionHistoryService();

// POST /api/action-history/salons/:salonId/actions - Log an action
router.post('/salons/:salonId/actions', validate(logActionSchema), async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params as { salonId: string };
    const action = await actionHistoryService.logAction({
      ...req.body,
      salon_id: salonId,
    });
    res.status(201).json({ success: true, data: action });
  } catch (error: any) {
    log.error({ err: error }, 'Error logging action:');
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// GET /api/action-history/salons/:salonId/actions - Get action history
router.get('/salons/:salonId/actions', async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params as { salonId: string };
    const filters = getHistoryQuerySchema.parse(req.query);
    const result = await actionHistoryService.getActionHistory(salonId, {
      userId: filters.user_id,
      entityType: filters.entity_type,
      entityId: filters.entity_id,
      actionType: filters.action_type,
      limit: filters.limit ? parseInt(filters.limit) : undefined,
      offset: filters.offset ? parseInt(filters.offset) : undefined,
      startDate: filters.start_date ? new Date(filters.start_date) : undefined,
      endDate: filters.end_date ? new Date(filters.end_date) : undefined,
    });
    res.json({ success: true, data: result });
  } catch (error: any) {
    log.error({ err: error }, 'Error getting action history:');
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, error: 'Invalid query parameters', details: error.errors });
    }
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// POST /api/action-history/salons/:salonId/actions/:actionId/undo - Undo an action
router.post('/salons/:salonId/actions/:actionId/undo', async (req: Request, res: Response) => {
  try {
    const { salonId, actionId } = req.params as { salonId: string; actionId: string };
    const userId = (req as any).user?.id || 'system';
    const userType = (req as any).user?.role || 'system';
    const result = await actionHistoryService.undoAction({ actionId, salonId, userId, userType });
    res.json({ success: true, data: result });
  } catch (error: any) {
    log.error({ err: error }, 'Error undoing action:');
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// POST /api/action-history/salons/:salonId/actions/:actionId/redo - Redo an action
router.post('/salons/:salonId/actions/:actionId/redo', async (req: Request, res: Response) => {
  try {
    const { salonId, actionId } = req.params as { salonId: string; actionId: string };
    const userId = (req as any).user?.id || 'system';
    const userType = (req as any).user?.role || 'system';
    const result = await actionHistoryService.redoAction({ actionId, salonId, userId, userType });
    res.json({ success: true, data: result });
  } catch (error: any) {
    log.error({ err: error }, 'Error redoing action:');
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

export default router;
