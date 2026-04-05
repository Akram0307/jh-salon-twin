import { Router } from 'express';
import { query } from '../config/db';
import logger from '../config/logger';
import { getErrorMessage } from '../types/routeTypes';
const log = logger.child({ module: 'owner_schedule_routes' });

const router = Router();
const SALON_ID = process.env.SALON_ID || 'b0dcbd9e-1ca0-450e-a299-7ad239f848f4';

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
      const row = weekdayRows.rows.find((item: Record<string, unknown>) => Number(item.weekday) === weekday);
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
  } catch (err: unknown) {
    log.error({ err: err }, 'Schedule summary error:');
    res.status(500).json({
      success: false,
      error: getErrorMessage(err) || 'Failed to fetch schedule summary',
    });
  }
});

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

    res.json(ok(upcoming.rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      appointment_time: row.appointment_time,
      status: row.status,
      client_name: row.client_name,
      client_phone: row.client_phone,
      service_name: row.service_name,
      duration_minutes: row.duration_minutes,
    })), 'Upcoming appointments loaded successfully'));
  } catch (err: unknown) {
    log.error({ err: err }, 'Upcoming appointments error:');
    res.status(500).json(fail('UPCOMING_APPOINTMENTS_FETCH_FAILED', 'Failed to fetch upcoming appointments'));
  }
});

export default router;
