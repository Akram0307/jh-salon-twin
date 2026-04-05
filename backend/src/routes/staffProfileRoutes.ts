import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { pool } from '../config/db';
import { validate } from '../middleware/validate';
import { staffAvailabilitySchema, staffTimeOffSchema, staffProfileUpdateSchema } from '../schemas/staff';

import logger from '../config/logger';
const log = logger.child({ module: 'staff_profile_routes' });

const router = Router();
router.use(authenticate);

// GET /api/staff-profile/availability
router.get('/availability', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.user_type;
    if (!userId || !userType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (userType !== 'staff') {
      return res.status(403).json({ error: 'Only staff can access availability' });
    }
    
    const result = await pool.query(
      `SELECT id, day_of_week, start_time, end_time, is_available 
       FROM staff_availability 
       WHERE staff_id = $1 
       ORDER BY day_of_week`,
      [userId]
    );
    
    res.json({ success: true, data: result.rows });
  } catch (err) {
    log.error({ err: err }, 'Error fetching staff availability:');
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// PUT /api/staff-profile/availability
router.put('/availability', validate(staffAvailabilitySchema), async (req: AuthRequest, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user?.id;
    const userType = req.user?.user_type;
    if (!userId || !userType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (userType !== 'staff') {
      return res.status(403).json({ error: 'Only staff can update availability' });
    }
    
    const { availability } = req.body;
    if (!Array.isArray(availability)) {
      return res.status(400).json({ error: 'Availability must be an array' });
    }
    
    await client.query('BEGIN');
    
    // Delete existing availability
    await client.query('DELETE FROM staff_availability WHERE staff_id = $1', [userId]);
    
    // Insert new availability
    for (const slot of availability) {
      await client.query(
        `INSERT INTO staff_availability (staff_id, day_of_week, start_time, end_time, is_available, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [userId, slot.day_of_week, slot.start_time, slot.end_time, slot.is_available ?? true]
      );
    }
    
    await client.query('COMMIT');
    res.json({ success: true, message: 'Availability updated' });
  } catch (err) {
    await client.query('ROLLBACK');
    log.error({ err: err }, 'Error updating staff availability:');
    res.status(500).json({ error: 'Failed to update availability' });
  } finally {
    client.release();
  }
});

// GET /api/staff-profile/time-off
router.get('/time-off', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.user_type;
    if (!userId || !userType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (userType !== 'staff') {
      return res.status(403).json({ error: 'Only staff can access time-off' });
    }
    
    const result = await pool.query(
      `SELECT id, start_date, end_date, reason, status, created_at 
       FROM staff_time_off 
       WHERE staff_id = $1 
       ORDER BY start_date DESC`,
      [userId]
    );
    
    res.json({ success: true, data: result.rows });
  } catch (err) {
    log.error({ err: err }, 'Error fetching time-off requests:');
    res.status(500).json({ error: 'Failed to fetch time-off requests' });
  }
});

// POST /api/staff-profile/time-off
router.post('/time-off', validate(staffTimeOffSchema), async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.user_type;
    if (!userId || !userType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (userType !== 'staff') {
      return res.status(403).json({ error: 'Only staff can request time-off' });
    }
    
    const { start_date, end_date, reason } = req.body;
    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }
    
    const result = await pool.query(
      `INSERT INTO staff_time_off (staff_id, start_date, end_date, reason, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'pending', NOW(), NOW())
       RETURNING *`,
      [userId, start_date, end_date, reason || null]
    );
    
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    log.error({ err: err }, 'Error creating time-off request:');
    res.status(500).json({ error: 'Failed to create time-off request' });
  }
});

// DELETE /api/staff-profile/time-off/:id
router.delete('/time-off/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.user_type;
    if (!userId || !userType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    
    // Only allow deleting own pending requests
    const result = await pool.query(
      `DELETE FROM staff_time_off 
       WHERE id = $1 AND staff_id = $2 AND status = 'pending'
       RETURNING id`,
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Time-off request not found or cannot be deleted' });
    }
    
    res.json({ success: true, message: 'Time-off request deleted' });
  } catch (err) {
    log.error({ err: err }, 'Error deleting time-off request:');
    res.status(500).json({ error: 'Failed to delete time-off request' });
  }
});

// GET /api/staff-profile/profile
router.get('/profile', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.user_type;
    if (!userId || !userType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (userType !== 'staff') {
      return res.status(403).json({ error: 'Only staff can access this endpoint' });
    }
    
    const result = await pool.query(
      `SELECT s.id, s.full_name, s.email, s.phone, s.role, s.salon_id, s.avatar_url,
              sal.name as salon_name
       FROM staff s
       LEFT JOIN salons sal ON s.salon_id = sal.id
       WHERE s.id = $1`,
      [userId]
    );
    
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Staff not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    log.error({ err: err }, 'Error fetching staff profile:');
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /api/staff-profile/profile
router.put('/profile', validate(staffProfileUpdateSchema), async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.user_type;
    if (!userId || !userType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (userType !== 'staff') {
      return res.status(403).json({ error: 'Only staff can update profile' });
    }
    
    const { full_name, email, phone } = req.body;
    
    await pool.query(
      `UPDATE staff SET 
        full_name = COALESCE($1, full_name),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        updated_at = NOW()
       WHERE id = $4`,
      [full_name, email, phone, userId]
    );
    
    res.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    log.error({ err: err }, 'Error updating staff profile:');
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
