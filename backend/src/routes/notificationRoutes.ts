import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { NotificationTemplateRepository } from '../repositories/NotificationTemplateRepository';
import { NotificationLogRepository } from '../repositories/NotificationLogRepository';
import { dispatchNotification, sendAppointmentConfirmation, dispatchReminderForAppointment } from '../services/NotificationOrchestrator';
import { query } from '../config/db';
import { validate } from '../middleware/validate';
import { createNotificationSchema, updateNotificationPreferencesSchema, createTemplateSchema, updateTemplateSchema, sendNotificationSchema } from '../schemas/notification';

import logger from '../config/logger';
const log = logger.child({ module: 'notification_routes' });

const router = Router();
router.use(authenticate);

// Helper to safely get string from query param
function getString(val: unknown): string | undefined {
  if (typeof val === 'string') return val;
  if (Array.isArray(val) && val.length > 0) return String(val[0]);
  return undefined;
}

// ============================================
// Notification Templates
// ============================================

// GET /api/notifications/templates - List all templates for a salon
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const salonId = getString(req.query.salon_id);
    if (!salonId) {
      return res.status(400).json({ error: 'salon_id is required' });
    }
    const templates = await NotificationTemplateRepository.findBySalonId(salonId);
    res.json({ success: true, data: templates });
  } catch (error: any) {
    log.error({ err: error }, '[notificationRoutes] GET /templates error:');
    res.status(500).json({ error: error.message });
  }
});

// POST /api/notifications/templates - Create a new template
router.post('/templates', validate(createTemplateSchema), async (req: Request, res: Response) => {
  try {
    const { salon_id, name, type, subject, body, variables } = req.body;
    const template = await NotificationTemplateRepository.create({
      salon_id,
      name,
      type,
      subject,
      body,
      variables
    });
    res.status(201).json({ success: true, data: template });
  } catch (error: any) {
    log.error({ err: error }, '[notificationRoutes] POST /templates error:');
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/notifications/templates/:id - Update a template
router.put('/templates/:id', validate(updateTemplateSchema), async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { name, subject, body, variables, is_active } = req.body;
    const template = await NotificationTemplateRepository.update(id, {
      name,
      subject,
      body,
      variables,
      is_active
    });
    res.json({ success: true, data: template });
  } catch (error: any) {
    log.error({ err: error }, '[notificationRoutes] PUT /templates/:id error:');
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/notifications/templates/:id - Delete a template
router.delete('/templates/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    await NotificationTemplateRepository.delete(id);
    res.json({ success: true, message: 'Template deleted' });
  } catch (error: any) {
    log.error({ err: error }, '[notificationRoutes] DELETE /templates/:id error:');
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Notification Logs
// ============================================

// GET /api/notifications/logs - Get notification logs for a salon
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const salonId = getString(req.query.salon_id);
    const limitStr = getString(req.query.limit);
    const offsetStr = getString(req.query.offset);
    const type = getString(req.query.type);
    const status = getString(req.query.status);

    if (!salonId) {
      return res.status(400).json({ error: 'salon_id is required' });
    }
    const logs = await NotificationLogRepository.findBySalonId(
      salonId,
      limitStr ? parseInt(limitStr) : 50,
      offsetStr ? parseInt(offsetStr) : 0,
      type,
      status
    );
    res.json({ success: true, data: logs });
  } catch (error: any) {
    log.error({ err: error }, '[notificationRoutes] GET /logs error:');
    res.status(500).json({ error: error.message });
  }
});

// GET /api/notifications/logs/stats - Get notification statistics
router.get('/logs/stats', async (req: Request, res: Response) => {
  try {
    const salonId = getString(req.query.salon_id);
    const daysStr = getString(req.query.days);

    if (!salonId) {
      return res.status(400).json({ error: 'salon_id is required' });
    }
    const stats = await NotificationLogRepository.getStats(
      salonId,
      daysStr ? parseInt(daysStr) : 30
    );
    res.json({ success: true, data: stats });
  } catch (error: any) {
    log.error({ err: error }, '[notificationRoutes] GET /logs/stats error:');
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Send Notifications
// ============================================

// POST /api/notifications/send - Send a notification
router.post('/send', validate(sendNotificationSchema), async (req: Request, res: Response) => {
  try {
    const { salon_id, user_id, user_type, type, template_name, subject, content, recipient, dynamic_data } = req.body;
    const result = await dispatchNotification({
      salonId: salon_id,
      userId: user_id,
      userType: user_type,
      type,
      templateName: template_name,
      subject,
      content,
      recipient,
      dynamicData: dynamic_data
    });
    res.json({ success: true, data: result });
  } catch (error: any) {
    log.error({ err: error }, '[notificationRoutes] POST /send error:');
    res.status(500).json({ error: error.message });
  }
});

// POST /api/notifications/appointment/:id/confirm - Send appointment confirmation
router.post('/appointment/:id/confirm', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const result = await sendAppointmentConfirmation(id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    log.error({ err: error }, '[notificationRoutes] POST /appointment/:id/confirm error:');
    res.status(500).json({ error: error.message });
  }
});

// POST /api/notifications/appointment/:id/remind - Send appointment reminder
router.post('/appointment/:id/remind', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const result = await dispatchReminderForAppointment(id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    log.error({ err: error }, '[notificationRoutes] POST /appointment/:id/remind error:');
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// User Notification Preferences
// ============================================

// GET /api/notifications/preferences - Get user notification preferences
router.get('/preferences', async (req: Request, res: Response) => {
  try {
    const userId = getString(req.query.user_id);
    const userType = getString(req.query.user_type);

    if (!userId || !userType) {
      return res.status(400).json({ error: 'user_id and user_type are required' });
    }
    const result = await query(
      'SELECT notification_preferences FROM user_settings WHERE user_id = $1 AND user_type = $2 LIMIT 1',
      [userId, userType]
    );
    const preferences = result.rows.length ? result.rows[0].notification_preferences : { email: true, sms: true, push: true };
    res.json({ success: true, data: preferences });
  } catch (error: any) {
    log.error({ err: error }, '[notificationRoutes] GET /preferences error:');
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/notifications/preferences - Update user notification preferences
router.put('/preferences', validate(updateNotificationPreferencesSchema), async (req: Request, res: Response) => {
  try {
    const { user_id, user_type, preferences } = req.body;
    const result = await query(
      `UPDATE user_settings
       SET notification_preferences = $1, updated_at = NOW()
       WHERE user_id = $2 AND user_type = $3
       RETURNING notification_preferences`,
      [JSON.stringify(preferences), user_id, user_type]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'User settings not found' });
    }
    res.json({ success: true, data: result.rows[0].notification_preferences });
  } catch (error: any) {
    log.error({ err: error }, '[notificationRoutes] PUT /preferences error:');
    res.status(500).json({ error: error.message });
  }
});

export default router;
