import { Router } from 'express';
import { query, getClient } from '../config/db';

const router = Router();
const SALON_ID = process.env.SALON_ID;

// Owner dashboard overview
router.get('/overview', async (_req, res) => {
  const salonId = SALON_ID;
  const reqStarted = Date.now();

  if (!salonId) {
    return res.status(500).json({ error: 'SALON_ID not configured' });
  }

  const client = await getClient();

  try {
    await client.query('BEGIN');
    await client.query('SET LOCAL statement_timeout = 8000');

    const run = async (label: string, sql: string, params: any[] = []) => {
      const t0 = Date.now();
      const result = await client.query(sql, params);
      console.log('[analytics/overview]', label, Date.now() - t0 + 'ms');
      return result;
    };

    const bookingsToday = await run(
      'bookingsToday',
      `SELECT COUNT(*) AS bookings_today
       FROM appointments
       WHERE appointment_time::date = CURRENT_DATE
         AND salon_id = $1`,
      [salonId]
    );

    const newClients = await run(
      'newClients',
      `SELECT COUNT(*) AS new_clients
       FROM clients
       WHERE created_at::date = CURRENT_DATE
         AND salon_id = $1`,
      [salonId]
    );

    const revenueToday = await run(
      'revenueToday',
      `SELECT COALESCE(SUM(total_amount), 0) AS revenue_today
       FROM transactions
       WHERE salon_id = $1
         AND status = 'completed'
         AND created_at::date = CURRENT_DATE`,
      [salonId]
    );

    const upcoming = await run(
      'upcoming',
      `SELECT a.id, a.appointment_time, a.status
       FROM appointments a
       WHERE a.appointment_time > NOW()
         AND a.salon_id = $1
       ORDER BY a.appointment_time
       LIMIT 10`,
      [salonId]
    );

    const staff = await run(
      'staff',
      `SELECT s.id, s.full_name, COUNT(a.id) AS appointments_today
       FROM staff s
       LEFT JOIN appointments a
         ON a.staff_id = s.id
        AND a.salon_id = $1
        AND a.appointment_time::date = CURRENT_DATE
       WHERE s.salon_id = $1
       GROUP BY s.id, s.full_name
       ORDER BY appointments_today DESC
       LIMIT 5`,
      [salonId]
    );

    await client.query('COMMIT');

    res.json({
      revenue_today: revenueToday.rows[0]?.revenue_today ?? 0,
      bookings_today: Number(bookingsToday.rows[0]?.bookings_today ?? 0),
      new_clients: Number(newClients.rows[0]?.new_clients ?? 0),
      upcoming: upcoming.rows,
      staff: staff.rows
    });

    console.log('[analytics/overview] completed', Date.now() - reqStarted + 'ms');

  } catch (err: any) {
    try { await client.query('ROLLBACK'); } catch {}
    console.error('Overview analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard overview' });
  } finally {
    client.release();
  }
});

// Revenue summary
router.get('/revenue-summary', async (_req, res) => {
  try {
    const result = await query(
      `SELECT 
        (SELECT COUNT(*) FROM appointments WHERE appointment_time::date = CURRENT_DATE AND salon_id = $1) AS total_appointments,
        (SELECT COALESCE(SUM(total_amount), 0) FROM transactions WHERE salon_id = $1 AND status = 'completed' AND created_at::date = CURRENT_DATE) AS total_revenue`,
      [SALON_ID]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch revenue summary' });
  }
});

// Staff performance
router.get('/staff-performance', async (_req, res) => {
  try {
    const result = await query(
      `SELECT s.id, s.full_name, COUNT(a.id) AS appointments_today
       FROM staff s
       LEFT JOIN appointments a
         ON a.staff_id = s.id
        AND a.salon_id = $1
        AND a.appointment_time::date = CURRENT_DATE
       WHERE s.salon_id = $1
       GROUP BY s.id, s.full_name
       ORDER BY appointments_today DESC`,
      [SALON_ID]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch staff performance' });
  }
});

// Upcoming appointments
router.get('/upcoming', async (_req, res) => {
  try {
    const result = await query(
      `SELECT id, appointment_time, status
       FROM appointments
       WHERE appointment_time > NOW()
         AND salon_id = $1
       ORDER BY appointment_time
       LIMIT 20`,
      [SALON_ID]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch upcoming appointments' });
  }
});

// Root analytics status endpoint
router.get('/', async (_req, res) => {
  res.json({
    status: 'analytics_online',
    endpoints: [
      '/api/analytics/overview',
      '/api/analytics/revenue-summary',
      '/api/analytics/staff-performance',
      '/api/analytics/upcoming'
    ]
  });
});


// Revenue by period (week, month, quarter)
router.get('/revenue', async (req, res) => {
  try {
    const period = req.query.period as string || 'week';
    let days = 7;
    if (period === 'month') days = 30;
    if (period === 'quarter') days = 90;

    const currentPeriod = await query(
      `SELECT 
         DATE(created_at) as day,
         SUM(total_amount) as revenue
       FROM transactions
       WHERE salon_id = $1
         AND status = 'completed'
         AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
       GROUP BY day
       ORDER BY day`,
      [SALON_ID]
    );

    const previousPeriod = await query(
      `SELECT 
         DATE(created_at) as day,
         SUM(total_amount) as revenue
       FROM transactions
       WHERE salon_id = $1
         AND status = 'completed'
         AND created_at >= CURRENT_DATE - INTERVAL '${days * 2} days'
         AND created_at < CURRENT_DATE - INTERVAL '${days} days'
       GROUP BY day
       ORDER BY day`,
      [SALON_ID]
    );

    const currentTotal = currentPeriod.rows.reduce((sum, row) => sum + parseFloat(row.revenue || 0), 0);
    const previousTotal = previousPeriod.rows.reduce((sum, row) => sum + parseFloat(row.revenue || 0), 0);

    res.json({
      period,
      current_period: {
        total_revenue: currentTotal,
        daily_revenue: currentPeriod.rows
      },
      previous_period: {
        total_revenue: previousTotal,
        daily_revenue: previousPeriod.rows
      },
      comparison: {
        revenue_change: currentTotal - previousTotal,
        revenue_change_percentage: previousTotal ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch revenue by period' });
  }
});


export default router;
