import { Router, Request, Response } from 'express';
import { ActionHistoryService } from '../services/ActionHistoryService';
import { authenticate } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const actionHistoryService = new ActionHistoryService();

const logActionSchema = z.object({
  user_id: z.string().uuid(),
  user_type: z.enum(['owner', 'staff', 'manager', 'system']),
  action_type: z.string().min(1),
  entity_type: z.string().min(1),
  entity_id: z.string().uuid(),
  action_data: z.any(),
  previous_state: z.any().optional(),
  new_state: z.any().optional(),
  is_undoable: z.boolean().optional()
});

const getHistoryQuerySchema = z.object({
  user_id: z.string().uuid().optional(),
  entity_type: z.string().optional(),
  entity_id: z.string().uuid().optional(),
  action_type: z.string().optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional()
});

router.post('/salons/:salonId/actions', authenticate, async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params as any;
    const validation = logActionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid request body', details: validation.error.errors });
    }
    const action = await actionHistoryService.logAction({ salon_id: salonId, ...validation.data });
    res.status(201).json(action);
  } catch (error) {
    console.error('Error logging action:', error);
    res.status(500).json({ error: 'Failed to log action' });
  }
});

router.get('/salons/:salonId/actions', authenticate, async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params as any;
    const queryValidation = getHistoryQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      return res.status(400).json({ error: 'Invalid query parameters', details: queryValidation.error.errors });
    }
    const { start_date, end_date, limit, offset, ...rest } = queryValidation.data;
    const options = {
      ...rest,
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
      startDate: start_date ? new Date(start_date) : undefined,
      endDate: end_date ? new Date(end_date) : undefined
    };
    const result = await actionHistoryService.getActionHistory(salonId, options);
    res.json(result);
  } catch (error) {
    console.error('Error getting action history:', error);
    res.status(500).json({ error: 'Failed to get action history' });
  }
});

router.get('/salons/:salonId/actions/undoable', authenticate, async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params as any;
    const userId = req.query.user_id as string | undefined;
    const actions = await actionHistoryService.getUndoableActions(salonId, userId);
    res.json(actions);
  } catch (error) {
    console.error('Error getting undoable actions:', error);
    res.status(500).json({ error: 'Failed to get undoable actions' });
  }
});

router.get('/salons/:salonId/actions/redoable', authenticate, async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params as any;
    const userId = req.query.user_id as string | undefined;
    const actions = await actionHistoryService.getRedoableActions(salonId, userId);
    res.json(actions);
  } catch (error) {
    console.error('Error getting redoable actions:', error);
    res.status(500).json({ error: 'Failed to get redoable actions' });
  }
});

router.post('/salons/:salonId/actions/:actionId/undo', authenticate, async (req: Request, res: Response) => {
  try {
    const { salonId, actionId } = req.params as any;
    const userId = (req as any).user?.id;
    const userType = (req as any).user?.role || 'staff';
    const result = await actionHistoryService.undoAction({ actionId, salonId, userId, userType });
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.json(result);
  } catch (error) {
    console.error('Error undoing action:', error);
    res.status(500).json({ error: 'Failed to undo action' });
  }
});

router.post('/salons/:salonId/actions/:actionId/redo', authenticate, async (req: Request, res: Response) => {
  try {
    const { salonId, actionId } = req.params as any;
    const userId = (req as any).user?.id;
    const userType = (req as any).user?.role || 'staff';
    const result = await actionHistoryService.redoAction({ actionId, salonId, userId, userType });
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.json(result);
  } catch (error) {
    console.error('Error redoing action:', error);
    res.status(500).json({ error: 'Failed to redo action' });
  }
});

router.get('/actions/:actionId', authenticate, async (req: Request, res: Response) => {
  try {
    const { actionId } = req.params as any;
    const action = await actionHistoryService.getActionById(actionId);
    if (!action) {
      return res.status(404).json({ error: 'Action not found' });
    }
    res.json(action);
  } catch (error) {
    console.error('Error getting action:', error);
    res.status(500).json({ error: 'Failed to get action' });
  }
});

export default router;
