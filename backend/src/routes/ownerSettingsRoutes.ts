import { Router } from 'express';
import { ConfigService } from '../services/ConfigService';
import { auditLogger, attachAuditContext } from '../middleware/auditLogger';
import { validate } from '../middleware/validate';
import { updateOwnerSettingsSchema } from '../schemas/owner';
import logger from '../config/logger';
import { AuditRequest } from '../types/routeTypes';
const log = logger.child({ module: 'owner_settings_routes' });

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

router.get('/settings', async (_req, res) => {
  try {
    const config = await ConfigService.getConfig(SALON_ID);
    res.json(ok(config, 'Owner settings loaded successfully'));
  } catch (err: unknown) {
    log.error({ err: err }, 'Owner settings fetch error:');
    res.status(500).json(fail('OWNER_SETTINGS_FETCH_FAILED', 'Failed to fetch owner settings'));
  }
});

router.put('/settings', validate(updateOwnerSettingsSchema), async (req, res) => {
  try {
    const before = await ConfigService.getConfig(SALON_ID);
    const updated = await ConfigService.updateConfig(SALON_ID, req.body || {});
    attachAuditContext(req as AuditRequest, {
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
  } catch (err: unknown) {
    log.error({ err: err }, 'Owner settings update error:');
    res.status(500).json(fail('OWNER_SETTINGS_UPDATE_FAILED', 'Failed to update owner settings'));
  }
});

export default router;
