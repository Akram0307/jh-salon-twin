import { pool } from '../config/db';
import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { SalonSettingsService } from '../services/SalonSettingsService';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { validate } from '../middleware/validate';
import { updateBrandingSchema, updateBusinessHoursSchema } from '../schemas/salonSettings';

import logger from '../config/logger';
const log = logger.child({ module: 'salon_settings_routes' });

const router = Router();
router.use(authenticate);

const salonSettingsService = new SalonSettingsService();

// Configure multer for logo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/logos'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Helper to get salon_id from user
const getSalonId = async (userId: string, userType: string): Promise<string | null> => {
  if (userType === 'owner') {
    const res = await pool.query('SELECT id FROM salons WHERE owner_id = $1 LIMIT 1', [userId]);
    return res.rows[0]?.id || null;
  } else if (userType === 'staff') {
    const res = await pool.query('SELECT salon_id FROM staff WHERE id = $1', [userId]);
    return res.rows[0]?.salon_id || null;
  }
  return null;
};

// GET /api/salon-settings/branding
router.get('/branding', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.user_type;
    if (!userId || !userType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const salonId = await getSalonId(userId, userType);
    if (!salonId) {
      return res.status(404).json({ error: 'Salon not found' });
    }
    const branding = await salonSettingsService.getBranding(salonId);
    res.json({ success: true, data: branding });
  } catch (err) {
    log.error({ err: err }, 'Error fetching salon branding:');
    res.status(500).json({ error: 'Failed to fetch salon branding' });
  }
});

// PUT /api/salon-settings/branding
router.put('/branding', validate(updateBrandingSchema), async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.user_type;
    if (!userId || !userType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const salonId = await getSalonId(userId, userType);
    if (!salonId) {
      return res.status(404).json({ error: 'Salon not found' });
    }
    const { primary_color, secondary_color, tagline, description, social_links } = req.body;
    await salonSettingsService.updateBranding(salonId, {
      primary_color,
      secondary_color,
      tagline,
      description,
      social_links
    });
    res.json({ success: true, message: 'Branding updated' });
  } catch (err) {
    log.error({ err: err }, 'Error updating salon branding:');
    res.status(500).json({ error: 'Failed to update salon branding' });
  }
});

// POST /api/salon-settings/logo
router.post('/logo', upload.single('logo'), async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.user_type;
    if (!userId || !userType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const salonId = await getSalonId(userId, userType);
    if (!salonId) {
      return res.status(404).json({ error: 'Salon not found' });
    }
    const logoUrl = `/uploads/logos/${req.file.filename}`;
    await salonSettingsService.updateBranding(salonId, { logo_url: logoUrl });
    res.json({ success: true, data: { logo_url: logoUrl } });
  } catch (err) {
    log.error({ err: err }, 'Error uploading logo:');
    res.status(500).json({ error: 'Failed to upload logo' });
  }
});

// GET /api/salon-settings/business-hours
router.get('/business-hours', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.user_type;
    if (!userId || !userType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const salonId = await getSalonId(userId, userType);
    if (!salonId) {
      return res.status(404).json({ error: 'Salon not found' });
    }
    const hours = await salonSettingsService.getBusinessHours(salonId);
    res.json({ success: true, data: hours });
  } catch (err) {
    log.error({ err: err }, 'Error fetching business hours:');
    res.status(500).json({ error: 'Failed to fetch business hours' });
  }
});

// PUT /api/salon-settings/business-hours
router.put('/business-hours', validate(updateBusinessHoursSchema), async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.user_type;
    if (!userId || !userType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const salonId = await getSalonId(userId, userType);
    if (!salonId) {
      return res.status(404).json({ error: 'Salon not found' });
    }
    const { hours } = req.body;
    if (!Array.isArray(hours)) {
      return res.status(400).json({ error: 'Hours must be an array' });
    }
    await salonSettingsService.updateBusinessHours(salonId, hours);
    res.json({ success: true, message: 'Business hours updated' });
  } catch (err) {
    log.error({ err: err }, 'Error updating business hours:');
    res.status(500).json({ error: 'Failed to update business hours' });
  }
});

// GET /api/salon-settings/service-categories
router.get('/service-categories', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.user_type;
    if (!userId || !userType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const salonId = await getSalonId(userId, userType);
    if (!salonId) {
      return res.status(404).json({ error: 'Salon not found' });
    }
    const categories = await salonSettingsService.getServiceCategories(salonId);
    res.json({ success: true, data: categories });
  } catch (err) {
    log.error({ err: err }, 'Error fetching service categories:');
    res.status(500).json({ error: 'Failed to fetch service categories' });
  }
});

// GET /api/salon-settings/services-catalog
router.get('/services-catalog', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.user_type;
    if (!userId || !userType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const salonId = await getSalonId(userId, userType);
    if (!salonId) {
      return res.status(404).json({ error: 'Salon not found' });
    }
    const categoryId = req.query.category_id as string;
    const services = await salonSettingsService.getServicesCatalog(salonId, categoryId);
    res.json({ success: true, data: services });
  } catch (err) {
    log.error({ err: err }, 'Error fetching services catalog:');
    res.status(500).json({ error: 'Failed to fetch services catalog' });
  }
});

// PUT /api/salon-settings/services/:serviceId
router.put('/services/:serviceId', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.user_type;
    if (!userId || !userType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { serviceId } = req.params as any;
    const updates = req.body;
    await salonSettingsService.updateService(serviceId, updates);
    res.json({ success: true, message: 'Service updated' });
  } catch (err) {
    log.error({ err: err }, 'Error updating service:');
    res.status(500).json({ error: 'Failed to update service' });
  }
});

export default router;
