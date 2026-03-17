import { Router } from 'express';
import { query } from '../config/db';

import logger from '../config/logger';

const router = Router();
const SALON_ID = process.env.SALON_ID || 'b0dcbd9e-1ca0-450e-a299-7ad239f848f4';

router.get('/', async (_req, res) => {
  try {
    const result = await query(
      `
        SELECT
          id,
          name,
          description,
          price,
          category,
          COALESCE(duration_minutes, 0) AS duration_minutes,
          salon_id,
          true AS is_active,
          'service'::text AS product_type
        FROM services
        WHERE salon_id = $1
        ORDER BY category NULLS LAST, name ASC
      `,
      [SALON_ID]
    );

    res.json(result.rows);
  } catch (err) {
    logger.error({ err: err }, 'Products fetch error:');
    res.json([]);
  }
});

export default router;
