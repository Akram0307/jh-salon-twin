import { Router } from 'express';
import { pool } from '../config/db';
import { validate } from '../middleware/validate';
import { createOwnerSchema } from '../schemas/owner';
import logger from '../config/logger';
const log = logger.child({ module: 'owner_setup_routes' });

const router = Router();

router.post('/', validate(createOwnerSchema), async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const result = await pool.query(
      `INSERT INTO owners(name,email,phone)
       VALUES($1,$2,$3)
       RETURNING *`,
      [name, email, phone]
    );

    res.json(result.rows[0]);
  } catch (err) {
    log.error(err);
    res.status(500).json({ error: 'Owner creation failed' });
  }
});

export default router;
