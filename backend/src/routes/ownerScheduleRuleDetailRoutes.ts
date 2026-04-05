import { Router } from 'express';
import { query } from '../config/db';
import { validate } from '../middleware/validate';
import { updateScheduleRuleSchema } from '../schemas/owner';
import logger from '../config/logger';
import { getErrorMessage } from '../types/routeTypes';
import {
  SALON_ID,
  asBool,
  normalizeTime,
  normalizeWeekday,
  findOverlappingScheduleRule,
  formatScheduleRule,
} from './ownerScheduleRuleHelpers';
const log = logger.child({ module: 'owner_schedule_rule_detail_routes' });

const router = Router();

router.put('/schedule-rules/:id', validate(updateScheduleRuleSchema), async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const existingRes = await query(
      `SELECT *
       FROM staff_working_hours
       WHERE id = $1 AND salon_id = $2`,
      [id, SALON_ID]
    );
    const existing = existingRes.rows[0];
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Schedule rule not found' });
    }

    const staffId = String(req.body?.staff_id || existing.staff_id).trim();
    const weekday = req.body?.weekday !== undefined ? normalizeWeekday(req.body?.weekday) : Number(existing.weekday);
    const startTime = req.body?.start_time !== undefined ? normalizeTime(req.body?.start_time) : String(existing.start_time).slice(0, 5);
    const endTime = req.body?.end_time !== undefined ? normalizeTime(req.body?.end_time) : String(existing.end_time).slice(0, 5);
    const capacity = req.body?.capacity !== undefined ? Math.max(1, Number(req.body.capacity || 1)) : Number(existing.capacity || 1);
    const isActive = req.body?.is_active !== undefined ? asBool(req.body.is_active, Boolean(existing.is_active)) : Boolean(existing.is_active);

    if (!staffId || weekday === null || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: 'staff_id, weekday, start_time, and end_time are required',
      });
    }

    if (startTime >= endTime) {
      return res.status(400).json({ success: false, error: 'start_time must be earlier than end_time' });
    }

    const staffCheck = await query(
      'SELECT id, full_name, role, is_active FROM staff WHERE id = $1 AND salon_id = $2',
      [staffId, SALON_ID]
    );
    const staff = staffCheck.rows[0];
    if (!staff) {
      return res.status(404).json({ success: false, error: 'Staff member not found for this salon' });
    }

    const overlappingRule = await findOverlappingScheduleRule({
      staffId,
      weekday,
      startTime,
      endTime,
      excludeId: id,
    });
    if (overlappingRule) {
      return res.status(409).json({
        success: false,
        error: `Schedule rule overlaps existing range ${String(overlappingRule.start_time).slice(0, 5)}-${String(overlappingRule.end_time).slice(0, 5)}`,
      });
    }

    const result = await query(
      `UPDATE staff_working_hours
       SET staff_id = $1,
           weekday = $2,
           start_time = $3,
           end_time = $4,
           capacity = $5,
           is_active = $6,
           updated_at = NOW()
       WHERE id = $7 AND salon_id = $8
       RETURNING *`,
      [staffId, weekday, startTime, endTime, capacity, isActive, id, SALON_ID]
    );

    const row = result.rows[0];
    res.json({
      success: true,
      data: formatScheduleRule({
        ...row,
        staff_name: staff.full_name,
        staff_role: staff.role,
        staff_is_active: staff.is_active,
      }),
      meta: { salon_id: SALON_ID },
    });
  } catch (err: unknown) {
    log.error({ err: err }, 'Schedule rule update error:');
    res.status(500).json({
      success: false,
      error: getErrorMessage(err) || 'Failed to update schedule rule',
    });
  }
});

router.delete('/schedule-rules/:id', async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const result = await query(
      `DELETE FROM staff_working_hours
       WHERE id = $1 AND salon_id = $2
       RETURNING id`,
      [id, SALON_ID]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ success: false, error: 'Schedule rule not found' });
    }

    res.json({
      success: true,
      data: { id: result.rows[0].id },
      meta: { salon_id: SALON_ID },
    });
  } catch (err: unknown) {
    log.error({ err: err }, 'Schedule rule delete error:');
    res.status(500).json({
      success: false,
      error: getErrorMessage(err) || 'Failed to delete schedule rule',
    });
  }
});

export default router;
