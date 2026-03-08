import { Router } from 'express';
import os from 'os';
import { pool, query } from '../config/db';

const router = Router();
const SALON_ID = process.env.SALON_ID || 'b0dcbd9e-1ca0-450e-a299-7ad239f848f4';

const asBool = (value: unknown, fallback = true) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return fallback;
};

const normalizeTime = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{2}:\d{2})(?::\d{2})?$/);
  return match ? match[1] : null;
};

const normalizeWeekday = (value: unknown) => {
  const weekday = Number(value);
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) return null;
  return weekday;
};

const findOverlappingScheduleRule = async ({
  staffId,
  weekday,
  startTime,
  endTime,
  excludeId,
}: {
  staffId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  excludeId?: string;
}) => {
  const params: any[] = [SALON_ID, staffId, weekday, startTime, endTime];
  let sql = `SELECT id, start_time, end_time
             FROM staff_working_hours
             WHERE salon_id = $1
               AND staff_id = $2
               AND weekday = $3
               AND start_time < $5
               AND end_time > $4`;

  if (excludeId) {
    params.push(excludeId);
    sql += ' AND id <> $6';
  }

  sql += ' ORDER BY start_time ASC LIMIT 1';
  const result = await query(sql, params);
  return result.rows[0] || null;
};

router.post('/', async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const result = await pool.query(
      `INSERT INTO owners(name,email,phone)
       VALUES($1,$2,$3)
       RETURNING *`,
      [name, email, phone]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Owner creation failed' });
  }
});

router.get('/system-health', async (_req, res) => {
  try {
    const [dbCheck, staffCount, serviceCount] = await Promise.all([
      query('SELECT NOW() AS now'),
      query('SELECT COUNT(*)::int AS count FROM staff WHERE salon_id = $1', [SALON_ID]),
      query('SELECT COUNT(*)::int AS count FROM services WHERE salon_id = $1', [SALON_ID]),
    ]);

    res.json({
      status: 'healthy',
      database: 'online',
      checked_at: dbCheck.rows[0]?.now || new Date().toISOString(),
      salon_id: SALON_ID,
      metrics: {
        staff_count: Number(staffCount.rows[0]?.count || 0),
        service_count: Number(serviceCount.rows[0]?.count || 0),
        uptime_seconds: Math.round(process.uptime()),
        memory_rss: process.memoryUsage().rss,
        hostname: os.hostname(),
      },
    });
  } catch (err: any) {
    console.error('System health error:', err);
    res.status(500).json({
      status: 'degraded',
      error: err?.message || 'System health failed',
      checked_at: new Date().toISOString(),
    });
  }
});

router.get('/schedule-summary', async (_req, res) => {
  try {
    const [staffCount, activeHours, breaks, timeOff, todayAppointments] = await Promise.all([
      query('SELECT COUNT(*)::int AS count FROM staff WHERE salon_id = $1 AND is_active = true', [SALON_ID]),
      query(
        `SELECT COUNT(*)::int AS count
         FROM staff_working_hours
         WHERE salon_id = $1 AND is_active = true`,
        [SALON_ID]
      ),
      query('SELECT COUNT(*)::int AS count FROM staff_breaks WHERE salon_id = $1', [SALON_ID]),
      query(
        `SELECT COUNT(*)::int AS count
         FROM staff_time_off
         WHERE salon_id = $1 AND start_datetime::date <= CURRENT_DATE AND end_datetime::date >= CURRENT_DATE`,
        [SALON_ID]
      ),
      query(
        `SELECT COUNT(*)::int AS count
         FROM appointments
         WHERE salon_id = $1 AND appointment_time::date = CURRENT_DATE`,
        [SALON_ID]
      ),
    ]);

    const weekdayRows = await query(
      `SELECT
         wh.weekday,
         COUNT(DISTINCT wh.staff_id)::int AS staffed_count,
         MIN(wh.start_time) AS day_start,
         MAX(wh.end_time) AS day_end
       FROM staff_working_hours wh
       WHERE wh.salon_id = $1 AND wh.is_active = true
       GROUP BY wh.weekday
       ORDER BY wh.weekday`,
      [SALON_ID]
    );

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const coverage = Array.from({ length: 7 }, (_, weekday) => {
      const row = weekdayRows.rows.find((item: any) => Number(item.weekday) === weekday);
      return {
        weekday,
        day_label: days[weekday],
        staffed_count: Number(row?.staffed_count || 0),
        start_time: row?.day_start ? String(row.day_start).slice(0, 5) : null,
        end_time: row?.day_end ? String(row.day_end).slice(0, 5) : null,
      };
    });

    res.json({
      success: true,
      data: {
        staff_count: Number(staffCount.rows[0]?.count || 0),
        active_hour_rules: Number(activeHours.rows[0]?.count || 0),
        break_rules: Number(breaks.rows[0]?.count || 0),
        staff_time_off_today: Number(timeOff.rows[0]?.count || 0),
        appointments_today: Number(todayAppointments.rows[0]?.count || 0),
        coverage,
      },
      meta: {
        salon_id: SALON_ID,
        generated_at: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('Schedule summary error:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to fetch schedule summary',
    });
  }
});

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

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    res.json({
      success: true,
      data: result.rows.map((row: any) => ({
        id: row.id,
        staff_id: row.staff_id,
        staff_name: row.staff_name,
        staff_role: row.staff_role,
        staff_is_active: row.staff_is_active,
        weekday: Number(row.weekday),
        day_label: days[Number(row.weekday)] || `Day ${row.weekday}`,
        start_time: row.start_time ? String(row.start_time).slice(0, 5) : null,
        end_time: row.end_time ? String(row.end_time).slice(0, 5) : null,
        capacity: Number(row.capacity || 1),
        is_active: Boolean(row.is_active),
        created_at: row.created_at,
        updated_at: row.updated_at,
      })),
      meta: {
        salon_id: SALON_ID,
        count: result.rows.length,
      },
    });
  } catch (err: any) {
    console.error('Schedule rules fetch error:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to fetch schedule rules',
    });
  }
});

router.post('/schedule-rules', async (req, res) => {
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
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    res.status(201).json({
      success: true,
      data: {
        id: row.id,
        staff_id: row.staff_id,
        staff_name: staff.full_name,
        staff_role: staff.role,
        staff_is_active: staff.is_active,
        weekday: Number(row.weekday),
        day_label: days[Number(row.weekday)] || `Day ${row.weekday}`,
        start_time: row.start_time ? String(row.start_time).slice(0, 5) : null,
        end_time: row.end_time ? String(row.end_time).slice(0, 5) : null,
        capacity: Number(row.capacity || 1),
        is_active: Boolean(row.is_active),
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
      meta: { salon_id: SALON_ID },
    });
  } catch (err: any) {
    console.error('Schedule rule create error:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to create schedule rule',
    });
  }
});

router.put('/schedule-rules/:id', async (req, res) => {
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
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    res.json({
      success: true,
      data: {
        id: row.id,
        staff_id: row.staff_id,
        staff_name: staff.full_name,
        staff_role: staff.role,
        staff_is_active: staff.is_active,
        weekday: Number(row.weekday),
        day_label: days[Number(row.weekday)] || `Day ${row.weekday}`,
        start_time: row.start_time ? String(row.start_time).slice(0, 5) : null,
        end_time: row.end_time ? String(row.end_time).slice(0, 5) : null,
        capacity: Number(row.capacity || 1),
        is_active: Boolean(row.is_active),
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
      meta: { salon_id: SALON_ID },
    });
  } catch (err: any) {
    console.error('Schedule rule update error:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to update schedule rule',
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
  } catch (err: any) {
    console.error('Schedule rule delete error:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to delete schedule rule',
    });
  }
});

export default router;
