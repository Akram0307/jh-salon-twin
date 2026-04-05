import { Router } from 'express';
import { query } from '../config/db';
import { AuditLogRepository } from '../repositories/AuditLogRepository';
import logger from '../config/logger';
const log = logger.child({ module: 'owner_dashboard_routes' });

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
  } catch (err: unknown) {
    log.error({ err: err }, 'Dashboard stats error:');
    res.status(500).json(fail('DASHBOARD_STATS_FETCH_FAILED', 'Failed to fetch dashboard stats'));
  }
});

router.get('/dashboard/recent-activity', async (_req, res) => {
  try {
    const activities = await AuditLogRepository.findRecentBySalon(SALON_ID, 20);
    res.json(ok(activities.map((row: Record<string, unknown>) => ({
      id: row.id,
      action: row.action,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      actor_id: row.actor_id,
      created_at: row.created_at,
    })), 'Recent activity loaded successfully'));
  } catch (err: unknown) {
    log.error({ err: err }, 'Recent activity error:');
    res.status(500).json(fail('RECENT_ACTIVITY_FETCH_FAILED', 'Failed to fetch recent activity'));
  }
});

router.get('/alerts', async (_req, res) => {
  try {
    const alerts = [];

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
  } catch (err: unknown) {
    log.error({ err: err }, 'Alerts error:');
    res.status(500).json(fail('ALERTS_FETCH_FAILED', 'Failed to fetch alerts'));
  }
});

export default router;
