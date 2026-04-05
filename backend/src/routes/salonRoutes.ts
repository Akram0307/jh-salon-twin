import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createSalonSchema } from '../schemas/salon';
import { pool } from '../config/db';

import logger from '../config/logger';

const router = Router();
router.use(authenticate);

router.post('/', validate(createSalonSchema), async (req, res) => {
  try {
    const { owner_id, name, city, address, phone, whatsapp_number } = req.body;

    const result = await pool.query(
      `INSERT INTO salons(owner_id,name,city,address,phone,whatsapp_number)
       VALUES($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [owner_id, name, city, address, phone, whatsapp_number]
    );

    res.json(result.rows[0]);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: 'Salon creation failed' });
  }
});

export default router;
