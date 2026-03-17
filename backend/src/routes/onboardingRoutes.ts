import { Router } from 'express';
import { pool } from '../config/db';
import { validate } from '../middleware/validate';
import { onboardingStartSchema, capacitySchema } from '../schemas/onboarding';

import logger from '../config/logger';

const router = Router();

// Unified onboarding start
router.post('/start', validate(onboardingStartSchema), async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      owner_name,
      owner_email,
      salon_name,
      men_chairs,
      women_chairs,
      unisex_chairs,
      waiting_seats
    } = req.body;

    if (!owner_name || !owner_email || !salon_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await client.query('BEGIN');

    const ownerResult = await client.query(
      `INSERT INTO owners(name,email)
       VALUES($1,$2)
       RETURNING id`,
      [owner_name, owner_email]
    );

    const owner_id = ownerResult.rows[0].id;

    const salonResult = await client.query(
      `INSERT INTO salons(owner_id,name)
       VALUES($1,$2)
       RETURNING id`,
      [owner_id, salon_name]
    );

    const salon_id = salonResult.rows[0].id;

    await client.query(
      `INSERT INTO salon_capacity(
        salon_id, men_chairs, women_chairs, unisex_chairs, waiting_seats
      ) VALUES ($1,$2,$3,$4,$5)`,
      [salon_id, men_chairs || 0, women_chairs || 0, unisex_chairs || 0, waiting_seats || 0]
    );

    await client.query('COMMIT');

    const qr_url = `/api/qr/${salon_id}`;

    res.json({
      success: true,
      owner_id,
      salon_id,
      qr_url
    });

  } catch (err) {
    await client.query('ROLLBACK');
    logger.error(err);
    res.status(500).json({ error: 'Onboarding failed' });
  } finally {
    client.release();
  }
});

// Capacity only endpoint
router.post('/capacity', validate(capacitySchema), async (req, res) => {
  try {
    const { salon_id, men_chairs, women_chairs, unisex_chairs, waiting_seats } = req.body;

    const result = await pool.query(
      `INSERT INTO salon_capacity(salon_id,men_chairs,women_chairs,unisex_chairs,waiting_seats)
       VALUES($1,$2,$3,$4,$5)
       RETURNING *`,
      [salon_id, men_chairs, women_chairs, unisex_chairs, waiting_seats]
    );

    res.json(result.rows[0]);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: 'Capacity setup failed' });
  }
});

export default router;
