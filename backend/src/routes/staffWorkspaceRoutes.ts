import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateAvailabilitySchema, createTimeoffSchema } from '../schemas/staff';
import { StaffWorkspaceService } from '../services/StaffWorkspaceService';

import logger from '../config/logger';
const log = logger.child({ module: 'staff_workspace_routes' });

const router = Router();
router.use(authenticate);

// GET /api/staff-workspace/:staffId/availability - Get staff availability
router.get('/:staffId/availability', async (req: Request, res: Response) => {
  try {
    const staffId = String(req.params.staffId);
    const availability = await StaffWorkspaceService.getAvailability(staffId);
    res.json({ success: true, data: availability });
  } catch (error: any) {
    log.error({ err: error }, 'Error getting availability:');
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// PUT /api/staff-workspace/availability - Update staff availability
router.put('/availability', validate(updateAvailabilitySchema), async (req: Request, res: Response) => {
  try {
    const { staffId, dayOfWeek, startTime, endTime, isAvailable } = req.body;
    const availability = await StaffWorkspaceService.updateAvailability({
      staffId,
      dayOfWeek,
      startTime,
      endTime,
      isAvailable,
    });
    res.json({ success: true, data: availability });
  } catch (error: any) {
    log.error({ err: error }, 'Error updating availability:');
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// GET /api/staff-workspace/:staffId/timeoff - Get staff time off
router.get('/:staffId/timeoff', async (req: Request, res: Response) => {
  try {
    const staffId = String(req.params.staffId);
    const timeoff = await StaffWorkspaceService.getTimeoff(staffId);
    res.json({ success: true, data: timeoff });
  } catch (error: any) {
    log.error({ err: error }, 'Error getting time off:');
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// POST /api/staff-workspace/timeoff - Create time off request
router.post('/timeoff', validate(createTimeoffSchema), async (req: Request, res: Response) => {
  try {
    const { staffId, startDate, endDate, reason } = req.body;
    const timeoff = await StaffWorkspaceService.createTimeoff({
      staffId,
      startDate,
      endDate,
      reason,
    });
    res.status(201).json({ success: true, data: timeoff });
  } catch (error: any) {
    log.error({ err: error }, 'Error creating time off:');
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

export default router;
