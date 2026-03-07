import { Router } from 'express';
import { StaffRepository } from '../repositories/StaffRepository';
import { query } from '../config/db';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const staff = await StaffRepository.findAll();
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

router.post('/', async (req, res) => {
  try {
    const staff = await StaffRepository.create(req.body);
    res.status(201).json(staff);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create staff' });
  }
});

// Mission Control: Today's staff schedule with availability
router.get('/schedule', async (req, res) => {
  try {
    const result = await query(`
      SELECT
        s.id,
        s.full_name AS name,
        s.role,
        CASE
          WHEN EXISTS (
            SELECT 1 FROM appointments a
            WHERE a.staff_id = s.id
            AND a.status IN ('scheduled','arrived','in_progress')
            AND a.appointment_time <= NOW()
            AND a.appointment_time + interval '1 hour' > NOW()
          ) THEN false
          ELSE true
        END AS is_available,
        '[]'::json AS break_times
      FROM staff s
      ORDER BY s.full_name
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch staff schedule' });
  }
});

export default router;
