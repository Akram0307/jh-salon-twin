import { Router } from 'express';
import os from 'os';
import { pool, query } from '../config/db';
import { auditLogger, attachAuditContext } from '../middleware/auditLogger';
import { AuditLogRepository } from '../repositories/AuditLogRepository';
import { ConfigService } from '../services/ConfigService';
import { validate } from '../middleware/validate';
import { createOwnerSchema, createScheduleRuleSchema, updateScheduleRuleSchema, updateOwnerSettingsSchema } from '../schemas/owner';

import logger from '../config/logger';
const log = logger.child({ module: 'owner_routes' });

const router = Router();
router.use(auditLogger);
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

const ok = (data: unknown, message?: string, meta: Record<string, unknown> = {}) => ({
  success: true,
  data,
  message: message || null,
  error: null,
  meta: { salon_id: SALON_ID, ...meta },
});

const fail = (error: string, message?: string, details?: unknown) => ({
  success: false,
  data: null,
  message: message || error,
  error,
  ...(details !== undefined ? { details } : {}),
});

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

router.post('/', validate(createOwnerSchema), async (req, res) => {
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
    log.error(err);
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
    log.error({ err: err }, 'System health error:');
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
    log.error({ err: err }, 'Schedule summary error:');
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
    log.error({ err: err }, 'Schedule rules fetch error:');
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to fetch schedule rules',
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
    log.error({ err: err }, 'Schedule rule create error:');
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to create schedule rule',
    });
  }
});

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
    log.error({ err: err }, 'Schedule rule update error:');
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
    log.error({ err: err }, 'Schedule rule delete error:');
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to delete schedule rule',
    });
  }
});


router.get('/settings', async (_req, res) => {
  try {
    const config = await ConfigService.getConfig(SALON_ID);
    res.json(ok(config, 'Owner settings loaded successfully'));
  } catch (err: any) {
    log.error({ err: err }, 'Owner settings fetch error:');
    res.status(500).json(fail('OWNER_SETTINGS_FETCH_FAILED', 'Failed to fetch owner settings'));
  }
});

router.put('/settings', validate(updateOwnerSettingsSchema), async (req, res) => {
  try {
    const before = await ConfigService.getConfig(SALON_ID);
    const updated = await ConfigService.updateConfig(SALON_ID, req.body || {});
    attachAuditContext(req as any, {
      salonId: SALON_ID,
      entityType: 'owner_settings',
      entityId: SALON_ID,
      action: 'update',
      actorId: (req.header('x-user-id') || req.body?.user_id || null) as string | null,
      actorType: 'owner',
      before,
      after: updated,
    });
    res.json(ok(updated, 'Owner settings updated successfully'));
  } catch (err: any) {
    log.error({ err: err }, 'Owner settings update error:');
    res.status(500).json(fail('OWNER_SETTINGS_UPDATE_FAILED', 'Failed to update owner settings'));
  }
});

router.get('/health', async (_req, res) => {
  try {
    const [activeStaff, activeServices, recentAuditCount, recentAudit] = await Promise.all([
      query('SELECT COUNT(*)::int AS count FROM staff WHERE salon_id = $1 AND is_active = true', [SALON_ID]),
      query('SELECT COUNT(*)::int AS count FROM services WHERE salon_id = $1 AND is_active = true', [SALON_ID]),
      AuditLogRepository.countRecentBySalon(SALON_ID, 24),
      AuditLogRepository.findRecentBySalon(SALON_ID, 5),
    ]);

    res.json(ok({
      total_active_staff: Number(activeStaff.rows[0]?.count || 0),
      active_services: Number(activeServices.rows[0]?.count || 0),
      recent_audit_activity_24h: recentAuditCount,
      recent_audit_logs: recentAudit.map((row: any) => ({
        id: row.id,
        action: row.action,
        entity_type: row.entity_type,
        entity_id: row.entity_id,
        actor_id: row.actor_id,
        created_at: row.created_at,
      })),
    }, 'Owner operational health loaded successfully'));
  } catch (err: any) {
    log.error({ err: err }, 'Owner health error:');
    res.status(500).json(fail('OWNER_HEALTH_FETCH_FAILED', 'Failed to fetch owner operational health'));
  }
});

export default router;
// Dashboard stats endpoint
router.get('/dashboard/stats', async (_req, res) => {
  try {
    const [todayAppointments, totalClients, totalStaff, todayRevenue] = await Promise.all([
      query('SELECT COUNT(*)::int AS count FROM appointments WHERE salon_id = $1 AND appointment_time::date = CURRENT_DATE', [SALON_ID]),
      query('SELECT COUNT(*)::int AS count FROM clients WHERE salon_id = $1', [SALON_ID]),
      query('SELECT COUNT(*)::int AS count FROM staff WHERE salon_id = $1 AND is_active = true', [SALON_ID]),
      query(
        `SELECT COALESCE(SUM(asv.charged_price), 0)::float AS total
         FROM appointment_services asv
         INNER JOIN appointments a ON a.id = asv.appointment_id
         WHERE a.salon_id = $1 AND a.appointment_time::date = CURRENT_DATE`,
        [SALON_ID]
      ),
    ]);

    res.json(ok({
      today_appointments: todayAppointments.rows[0]?.count || 0,
      total_clients: totalClients.rows[0]?.count || 0,
      total_staff: totalStaff.rows[0]?.count || 0,
      today_revenue: todayRevenue.rows[0]?.total || 0,
    }, 'Dashboard stats loaded successfully'));
  } catch (err: any) {
    log.error({ err: err }, 'Dashboard stats error:');
    res.status(500).json(fail('DASHBOARD_STATS_FETCH_FAILED', 'Failed to fetch dashboard stats'));
  }
});

// Recent activity endpoint
router.get('/dashboard/recent-activity', async (_req, res) => {
  try {
    const activities = await AuditLogRepository.findRecentBySalon(SALON_ID, 20);
    res.json(ok(activities.map((row: any) => ({
      id: row.id,
      action: row.action,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      actor_id: row.actor_id,
      created_at: row.created_at,
    })), 'Recent activity loaded successfully'));
  } catch (err: any) {
    log.error({ err: err }, 'Recent activity error:');
    res.status(500).json(fail('RECENT_ACTIVITY_FETCH_FAILED', 'Failed to fetch recent activity'));
  }
});

// Revenue summary endpoint
router.get('/revenue/summary', async (_req, res) => {
  try {
    const [todayRevenue, thisMonthRevenue, lastMonthRevenue] = await Promise.all([
      query(
        `SELECT COALESCE(SUM(asv.charged_price), 0)::float AS total
         FROM appointment_services asv
         INNER JOIN appointments a ON a.id = asv.appointment_id
         WHERE a.salon_id = $1 AND a.appointment_time::date = CURRENT_DATE`,
        [SALON_ID]
      ),
      query(
        `SELECT COALESCE(SUM(asv.charged_price), 0)::float AS total
         FROM appointment_services asv
         INNER JOIN appointments a ON a.id = asv.appointment_id
         WHERE a.salon_id = $1 AND DATE_TRUNC('month', a.appointment_time) = DATE_TRUNC('month', CURRENT_DATE)`,
        [SALON_ID]
      ),
      query(
        `SELECT COALESCE(SUM(asv.charged_price), 0)::float AS total
         FROM appointment_services asv
         INNER JOIN appointments a ON a.id = asv.appointment_id
         WHERE a.salon_id = $1 AND DATE_TRUNC('month', a.appointment_time) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')`,
        [SALON_ID]
      ),
    ]);

    res.json(ok({
      today: todayRevenue.rows[0]?.total || 0,
      this_month: thisMonthRevenue.rows[0]?.total || 0,
      last_month: lastMonthRevenue.rows[0]?.total || 0,
    }, 'Revenue summary loaded successfully'));
  } catch (err: any) {
    log.error({ err: err }, 'Revenue summary error:');
    res.status(500).json(fail('REVENUE_SUMMARY_FETCH_FAILED', 'Failed to fetch revenue summary'));
  }
});

// Revenue trends endpoint
router.get('/revenue/trends', async (_req, res) => {
  try {
    const trends = await query(
      `SELECT 
         a.appointment_time::date AS date,
         COALESCE(SUM(asv.charged_price), 0)::float AS total
       FROM appointments a
       LEFT JOIN appointment_services asv ON asv.appointment_id = a.id
       WHERE a.salon_id = $1 
         AND a.appointment_time >= CURRENT_DATE - INTERVAL '7 days'
         AND a.appointment_time < CURRENT_DATE + INTERVAL '1 day'
       GROUP BY a.appointment_time::date
       ORDER BY a.appointment_time::date ASC`,
      [SALON_ID]
    );

    res.json(ok(trends.rows.map((row: any) => ({
      date: row.date,
      total: row.total,
    })), 'Revenue trends loaded successfully'));
  } catch (err: any) {
    log.error({ err: err }, 'Revenue trends error:');
    res.status(500).json(fail('REVENUE_TRENDS_FETCH_FAILED', 'Failed to fetch revenue trends'));
  }
});

// Staff performance endpoint
router.get('/staff/performance', async (_req, res) => {
  try {
    const performance = await query(
      `SELECT 
         s.id AS staff_id,
         s.full_name,
         s.role,
         COUNT(a.id)::int AS appointment_count,
         COALESCE(SUM(asv.charged_price), 0)::float AS total_revenue
       FROM staff s
       LEFT JOIN appointments a ON a.staff_id = s.id AND a.salon_id = s.salon_id
       LEFT JOIN appointment_services asv ON asv.appointment_id = a.id
       WHERE s.salon_id = $1 AND s.is_active = true
       GROUP BY s.id, s.full_name, s.role
       ORDER BY total_revenue DESC`,
      [SALON_ID]
    );

    res.json(ok(performance.rows.map((row: any) => ({
      staff_id: row.staff_id,
      full_name: row.full_name,
      role: row.role,
      appointment_count: row.appointment_count,
      total_revenue: row.total_revenue,
    })), 'Staff performance loaded successfully'));
  } catch (err: any) {
    log.error({ err: err }, 'Staff performance error:');
    res.status(500).json(fail('STAFF_PERFORMANCE_FETCH_FAILED', 'Failed to fetch staff performance'));
  }
});

// Upcoming appointments endpoint
router.get('/appointments/upcoming', async (_req, res) => {
  try {
    const upcoming = await query(
      `SELECT 
         a.id,
         a.appointment_time,
         a.status,
         c.full_name AS client_name,
         c.phone_number AS client_phone,
         s.name AS service_name,
         s.duration_minutes
       FROM appointments a
       INNER JOIN clients c ON c.id = a.client_id
       INNER JOIN appointment_services asv ON asv.appointment_id = a.id
       INNER JOIN services s ON s.id = asv.service_id
       WHERE a.salon_id = $1 
         AND a.appointment_time >= NOW()
         AND a.status IN ('booked', 'arrived', 'in_progress')
       ORDER BY a.appointment_time ASC
       LIMIT 10`,
      [SALON_ID]
    );

    res.json(ok(upcoming.rows.map((row: any) => ({
      id: row.id,
      appointment_time: row.appointment_time,
      status: row.status,
      client_name: row.client_name,
      client_phone: row.client_phone,
      service_name: row.service_name,
      duration_minutes: row.duration_minutes,
    })), 'Upcoming appointments loaded successfully'));
  } catch (err: any) {
    log.error({ err: err }, 'Upcoming appointments error:');
    res.status(500).json(fail('UPCOMING_APPOINTMENTS_FETCH_FAILED', 'Failed to fetch upcoming appointments'));
  }
});

// Alerts endpoint
router.get('/alerts', async (_req, res) => {
  try {
    const alerts = [];

    // Check for staff time off today
    const timeOffToday = await query(
      `SELECT COUNT(*)::int AS count 
       FROM staff_time_off 
       WHERE salon_id = $1 
         AND start_datetime::date <= CURRENT_DATE 
         AND end_datetime::date >= CURRENT_DATE`,
      [SALON_ID]
    );
    if (timeOffToday.rows[0]?.count > 0) {
      alerts.push({
        type: 'staff_time_off',
        message: `${timeOffToday.rows[0].count} staff member(s) have time off today`,
        severity: 'warning',
      });
    }

    // Check for low capacity today (less than 2 staff available)
    const availableStaffToday = await query(
      `SELECT COUNT(DISTINCT s.id)::int AS count
       FROM staff s
       LEFT JOIN staff_time_off sto ON sto.staff_id = s.id 
         AND sto.salon_id = s.salon_id 
         AND sto.start_datetime::date <= CURRENT_DATE 
         AND sto.end_datetime::date >= CURRENT_DATE
       WHERE s.salon_id = $1 
         AND s.is_active = true 
         AND sto.id IS NULL`,
      [SALON_ID]
    );
    if (availableStaffToday.rows[0]?.count < 2) {
      alerts.push({
        type: 'low_staff_capacity',
        message: `Only ${availableStaffToday.rows[0].count} staff available today`,
        severity: 'critical',
      });
    }

    // Check for appointments without staff assigned (if staff_id is nullable and we have such appointments)
    const unassignedAppointments = await query(
      `SELECT COUNT(*)::int AS count
       FROM appointments
       WHERE salon_id = $1 
         AND staff_id IS NULL 
         AND appointment_time::date = CURRENT_DATE`,
      [SALON_ID]
    );
    if (unassignedAppointments.rows[0]?.count > 0) {
      alerts.push({
        type: 'unassigned_appointments',
        message: `${unassignedAppointments.rows[0].count} appointment(s) without staff assigned today`,
        severity: 'warning',
      });
    }

    res.json(ok(alerts, 'Alerts loaded successfully'));
  } catch (err: any) {
    log.error({ err: err }, 'Alerts error:');
    res.status(500).json(fail('ALERTS_FETCH_FAILED', 'Failed to fetch alerts'));
  }
});

