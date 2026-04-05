import { Router } from 'express';
import { query } from '../config/db';
import logger from '../config/logger';
const log = logger.child({ module: 'owner_report_routes' });

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
  } catch (err: unknown) {
    log.error({ err: err }, 'Revenue summary error:');
    res.status(500).json(fail('REVENUE_SUMMARY_FETCH_FAILED', 'Failed to fetch revenue summary'));
  }
});

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

    res.json(ok(trends.rows.map((row: Record<string, unknown>) => ({
      date: row.date,
      total: row.total,
    })), 'Revenue trends loaded successfully'));
  } catch (err: unknown) {
    log.error({ err: err }, 'Revenue trends error:');
    res.status(500).json(fail('REVENUE_TRENDS_FETCH_FAILED', 'Failed to fetch revenue trends'));
  }
});

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

    res.json(ok(performance.rows.map((row: Record<string, unknown>) => ({
      staff_id: row.staff_id,
      full_name: row.full_name,
      role: row.role,
      appointment_count: row.appointment_count,
      total_revenue: row.total_revenue,
    })), 'Staff performance loaded successfully'));
  } catch (err: unknown) {
    log.error({ err: err }, 'Staff performance error:');
    res.status(500).json(fail('STAFF_PERFORMANCE_FETCH_FAILED', 'Failed to fetch staff performance'));
  }
});

export default router;
