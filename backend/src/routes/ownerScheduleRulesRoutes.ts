import { Router } from 'express';
import { query } from '../config/db';
import { validate } from '../middleware/validate';
import { createScheduleRuleSchema } from '../schemas/owner';
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
const log = logger.child({ module: 'owner_schedule_rules_routes' });

const router = Router();

router.get('/schedule-rules', async (_req, res) => {
  try {
    const result = await query(
      `SELECT
         wh.id,
         wh.staff_id,
         wh.weekday,
         wh.start_time,
         wh.end_time,
         wh.capacity,
         wh.is_active,
         wh.created_at,
         wh.updated_at,
         s.full_name AS staff_name,
         s.role AS staff_role,
         s.is_active AS staff_is_active
       FROM staff_working_hours wh
       INNER JOIN staff s
         ON s.id = wh.staff_id
        AND s.salon_id = wh.salon_id
       WHERE wh.salon_id = $1
       ORDER BY s.full_name ASC, wh.weekday ASC, wh.start_time ASC`,
      [SALON_ID]
    );

    res.json({
      success: true,
      data: result.rows.map((row: Record<string, unknown>) => formatScheduleRule(row)),
      meta: {
        salon_id: SALON_ID,
        count: result.rows.length,
      },
    });
  } catch (err: unknown) {
    log.error({ err: err }, 'Schedule rules fetch error:');
    res.status(500).json({
      success: false,
      error: getErrorMessage(err) || 'Failed to fetch schedule rules',
    });
  }
});

router.post('/schedule-rules', validate(createScheduleRuleSchema), async (req, res) => {
  try {
    const staffId = String(req.body?.staff_id || '').trim();
    const weekday = normalizeWeekday(req.body?.weekday);
    const startTime = normalizeTime(req.body?.start_time);
    const endTime = normalizeTime(req.body?.end_time);
    const capacity = Math.max(1, Number(req.body?.capacity || 1));
    const isActive = asBool(req.body?.is_active, true);

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
    });
    if (overlappingRule) {
      return res.status(409).json({
        success: false,
        error: `Schedule rule overlaps existing range ${String(overlappingRule.start_time).slice(0, 5)}-${String(overlappingRule.end_time).slice(0, 5)}`,
      });
    }

    const result = await query(
      `INSERT INTO staff_working_hours (salon_id, staff_id, weekday, start_time, end_time, capacity, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [SALON_ID, staffId, weekday, startTime, endTime, capacity, isActive]
    );

    const row = result.rows[0];
    res.status(201).json({
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
    log.error({ err: err }, 'Schedule rule create error:');
    res.status(500).json({
      success: false,
      error: getErrorMessage(err) || 'Failed to create schedule rule',
    });
  }
});

export default router;
