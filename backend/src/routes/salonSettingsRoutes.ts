import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateBrandingSchema, updateBusinessHoursSchema, updateSalonServiceSchema } from '../schemas/salonSettings';
import { SalonSettingsService } from '../services/SalonSettingsService';

import logger from '../config/logger';
import { getErrorMessage } from '../types/routeTypes'
const log = logger.child({ module: 'salon_settings_routes' });

const router = Router();
router.use(authenticate);

const salonSettingsService = new SalonSettingsService();

// GET /api/salon-settings - Get all salon settings
router.get('/', async (req: Request, res: Response) => {
  try {
    const salonId = req.headers['x-salon-id'] as string;
    if (!salonId) {
      return res.status(400).json({ error: 'Salon ID is required' });
    }
    const [branding, businessHours, categories, services] = await Promise.all([
      salonSettingsService.getBranding(salonId),
      salonSettingsService.getBusinessHours(salonId),
      salonSettingsService.getServiceCategories(salonId),
      salonSettingsService.getServicesCatalog(salonId),
    ]);
    res.json({ success: true, data: { branding, businessHours, categories, services } });
  } catch (error: unknown) {
    log.error({ err: error }, 'Error getting salon settings:');
    res.status(500).json({ success: false, error: getErrorMessage(error) || 'Internal server error' });
  }
});

// PUT /api/salon-settings/branding - Update branding
router.put('/branding', validate(updateBrandingSchema), async (req: Request, res: Response) => {
  try {
    const salonId = req.headers['x-salon-id'] as string;
    if (!salonId) {
      return res.status(400).json({ error: 'Salon ID is required' });
    }
    const result = await salonSettingsService.updateBranding(salonId, req.body);
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    log.error({ err: error }, 'Error updating branding:');
    res.status(500).json({ success: false, error: getErrorMessage(error) || 'Internal server error' });
  }
});

// PUT /api/salon-settings/business-hours - Update business hours
router.put('/business-hours', validate(updateBusinessHoursSchema), async (req: Request, res: Response) => {
  try {
    const salonId = req.headers['x-salon-id'] as string;
    if (!salonId) {
      return res.status(400).json({ error: 'Salon ID is required' });
    }
    const hours = req.body.hours || [];
    const result = await salonSettingsService.updateBusinessHours(salonId, hours);
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    log.error({ err: error }, 'Error updating business hours:');
    res.status(500).json({ success: false, error: getErrorMessage(error) || 'Internal server error' });
  }
});

// PUT /api/salon-settings/services/:serviceId - Update a specific salon service
router.put('/services/:serviceId', validate(updateSalonServiceSchema), async (req: Request, res: Response) => {
  try {
    const salonId = req.headers['x-salon-id'] as string;
    if (!salonId) {
      return res.status(400).json({ error: 'Salon ID is required' });
    }
    const { serviceId } = req.params as { serviceId: string };
    const result = await salonSettingsService.updateService(serviceId, req.body);
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    log.error({ err: error }, 'Error updating salon service:');
    res.status(500).json({ success: false, error: getErrorMessage(error) || 'Internal server error' });
  }
});

export default router;
