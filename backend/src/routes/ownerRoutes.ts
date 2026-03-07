import { Router } from 'express';
import os from 'os';
import { pool, query } from '../config/db';

const router = Router();
const SALON_ID = process.env.SALON_ID || 'b0dcbd9e-1ca0-450e-a299-7ad239f848f4';

router.post('/', async (req, res) => {
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
    console.error(err);
    res.status(500).json({ error: 'Owner creation failed' });
  }
});

router.get('/system-health', async (_req, res) => {
  try {
    const [dbCheck, staffCount, serviceCount] = await Promise.all([
      query('SELECT NOW() AS now'),
      query('SELECT COUNT(*)::int AS count FROM staff WHERE salon_id = $1', [SALON_ID]),
      query('SELECT COUNT(*)::int AS count FROM services WHERE salon_id = $1', [SALON_ID]),
    ]);

    res.json({
      status: 'healthy',
      database: 'online',
      checked_at: dbCheck.rows[0]?.now || new Date().toISOString(),
      salon_id: SALON_ID,
      metrics: {
        staff_count: Number(staffCount.rows[0]?.count || 0),
        service_count: Number(serviceCount.rows[0]?.count || 0),
        uptime_seconds: Math.round(process.uptime()),
        memory_rss: process.memoryUsage().rss,
        hostname: os.hostname(),
      },
    });
  } catch (err: any) {
    console.error('System health error:', err);
    res.status(500).json({
      status: 'degraded',
      error: err?.message || 'System health failed',
      checked_at: new Date().toISOString(),
    });
  }
});

export default router;
