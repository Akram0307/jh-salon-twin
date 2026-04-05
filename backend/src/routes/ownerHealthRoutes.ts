import { Router } from 'express';
import os from 'os';
import { query } from '../config/db';
import { AuditLogRepository } from '../repositories/AuditLogRepository';
import logger from '../config/logger';
import { getErrorMessage } from '../types/routeTypes';
const log = logger.child({ module: 'owner_health_routes' });

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
  } catch (err: unknown) {
    log.error({ err: err }, 'System health error:');
    res.status(500).json({
      status: 'degraded',
      error: getErrorMessage(err) || 'System health failed',
      checked_at: new Date().toISOString(),
    });
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
      recent_audit_logs: recentAudit.map((row: Record<string, unknown>) => ({
        id: row.id,
        action: row.action,
        entity_type: row.entity_type,
        entity_id: row.entity_id,
        actor_id: row.actor_id,
        created_at: row.created_at,
      })),
    }, 'Owner operational health loaded successfully'));
  } catch (err: unknown) {
    log.error({ err: err }, 'Owner health error:');
    res.status(500).json(fail('OWNER_HEALTH_FETCH_FAILED', 'Failed to fetch owner operational health'));
  }
});

export default router;
