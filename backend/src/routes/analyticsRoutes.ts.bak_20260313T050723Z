import { Router } from 'express';
import { query } from '../config/db';

const router = Router();
const SALON_ID = process.env.SALON_ID;

// Owner dashboard overview
router.get("/overview", async (req, res) => {
  try {

    const bookingsToday = await query(`
      SELECT COUNT(*) AS bookings_today
      FROM appointments
      WHERE appointment_time::date = CURRENT_DATE
      AND salon_id = '${SALON_ID}'
    `);

    const newClients = await query(`
      SELECT COUNT(*) AS new_clients
      FROM clients
      WHERE created_at::date = CURRENT_DATE
      AND salon_id = '${SALON_ID}'
    `);

    const revenueToday = await query(`
      SELECT 0 AS revenue_today
    `);

    const upcoming = await query(`
      SELECT a.id, NULL AS client_name, NULL AS staff_name, a.appointment_time, a.status
      FROM appointments a
      WHERE a.appointment_time > NOW() AND a.salon_id = '${SALON_ID}'
      ORDER BY a.appointment_time
      LIMIT 10
    `);

    const staff = await query(`
      SELECT s.id, s.full_name, COUNT(a.id) AS appointments_today
      FROM staff s
      LEFT JOIN appointments a ON a.staff_id = s.id AND a.salon_id = '${SALON_ID}'
        AND a.appointment_time::date = CURRENT_DATE
      GROUP BY s.id
      ORDER BY appointments_today DESC
      LIMIT 5
    `);

    res.json({
      revenue_today: revenueToday.rows[0].revenue_today,
      bookings_today: bookingsToday.rows[0].bookings_today,
      new_clients: newClients.rows[0].new_clients,
      upcoming: upcoming.rows,
      staff: staff.rows
    });

  } catch (err) {
    console.error("Overview analytics error:", err);
    res.status(500).json({ error: "Failed to fetch dashboard overview" });
  }
});

// Revenue summary
router.get('/revenue-summary', async (req, res) => {
  try {
    const result = await query(`
      SELECT
        COUNT(*) AS total_appointments,
        0 AS total_revenue
      FROM appointments
      WHERE appointment_time::date = CURRENT_DATE AND salon_id = '${SALON_ID}'
    `);

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch revenue summary' });
  }
});

// Staff performance
router.get('/staff-performance', async (req, res) => {
  try {
    const result = await query(`
      SELECT
        s.id,
        s.full_name,
        COUNT(a.id) AS appointments_today
      FROM staff s
      LEFT JOIN appointments a ON a.staff_id = s.id AND a.salon_id = '${SALON_ID}'
        AND a.appointment_time::date = CURRENT_DATE
      GROUP BY s.id
      ORDER BY appointments_today DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch staff performance' });
  }
});

// Upcoming appointments
router.get('/upcoming', async (req, res) => {
  try {
    const result = await query(`
      SELECT
        a.id,
        NULL AS client_name,
        NULL AS staff_name,
        a.appointment_time,
        a.status
      FROM appointments a
      WHERE a.appointment_time > NOW() AND a.salon_id = '${SALON_ID}'
      ORDER BY a.appointment_time
      LIMIT 20
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch upcoming appointments' });
  }
});

// Root analytics status endpoint
router.get("/", async (req, res) => {
  try {
    res.json({
      status: "analytics_online",
      endpoints: [
        "/api/analytics/overview",
        "/api/analytics/revenue-summary",
        "/api/analytics/staff-performance",
        "/api/analytics/upcoming"
      ]
    });
  } catch (err) {
    console.error("Analytics root error:", err);
    res.status(500).json({ error: "Analytics failure" });
  }
});

// Staff utilization heatmap + revenue opportunity detector
router.get("/utilization-heatmap", async (_req, res) => {
  try {
    const salonId = SALON_ID || 'b0dcbd9e-1ca0-450e-a299-7ad239f848f4';

    const heatmap = await query(
      `
        SELECT s.id AS staff_id, s.full_name, EXTRACT(HOUR FROM a.appointment_time) AS hour, COUNT(a.id) AS appointments
        FROM staff s
        LEFT JOIN appointments a
          ON a.staff_id = s.id
         AND a.salon_id = $1
         AND a.appointment_time::date = CURRENT_DATE
        WHERE s.salon_id = $1
        GROUP BY s.id, s.full_name, hour
        ORDER BY s.full_name, hour
      `,
      [salonId]
    );

    const avgService = await query(
      `SELECT COALESCE(AVG(price),0) AS avg_price FROM services WHERE salon_id = $1 AND is_active = true`,
      [salonId]
    );

    const gaps = await query(
      `
        SELECT s.id AS staff_id, s.full_name, generate_series(8,20) AS hour
        FROM staff s
        WHERE s.salon_id = $1
      `,
      [salonId]
    );

    const booked = new Set(heatmap.rows.map((r:any) => `${r.staff_id}-${r.hour}`));
    const opportunities:any[] = [];
    const avg = Number(avgService.rows[0]?.avg_price || 0);

    gaps.rows.forEach((slot:any) => {
      const key = `${slot.staff_id}-${slot.hour}`;
      if (!booked.has(key)) {
        opportunities.push({
          staff_id: slot.staff_id,
          staff_name: slot.full_name,
          hour: slot.hour,
          estimated_revenue: avg
        });
      }
    });

    res.json({ heatmap: heatmap.rows, opportunities, avg_service_value: avg });
  } catch (err) {
    console.error("Utilization heatmap error:", err);
    res.status(500).json({ error: "Failed to compute utilization heatmap" });
  }
});


router.get('/pos-stats', async (_req, res) => {
  try {
    const salonId = SALON_ID || 'b0dcbd9e-1ca0-450e-a299-7ad239f848f4';

    const totals = await query(
      `
        SELECT
          COUNT(*)::int AS transactions_count,
          COALESCE(SUM(total_amount), 0)::float AS gross_sales,
          COALESCE(AVG(total_amount), 0)::float AS avg_ticket
        FROM transactions
        WHERE salon_id = $1
      `,
      [salonId]
    );

    const recent = await query(
      `
        SELECT created_at, total_amount, payment_method
        FROM transactions
        WHERE salon_id = $1
        ORDER BY created_at DESC
        LIMIT 10
      `,
      [salonId]
    );

    res.json({
      transactions_count: Number(totals.rows[0]?.transactions_count || 0),
      gross_sales: Number(totals.rows[0]?.gross_sales || 0),
      avg_ticket: Number(totals.rows[0]?.avg_ticket || 0),
      recent: recent.rows,
    });
  } catch (err) {
    console.error('POS stats error:', err);
    res.json({
      transactions_count: 0,
      gross_sales: 0,
      avg_ticket: 0,
      recent: [],
    });
  }
});

router.get('/revenue-opportunities', async (_req, res) => {
  try {
    const salonId = SALON_ID || 'b0dcbd9e-1ca0-450e-a299-7ad239f848f4';

    const emptySlotsResult = await query(
      `
        SELECT COUNT(*)::int AS empty_slots
        FROM appointments
        WHERE salon_id = $1
          AND appointment_time::date >= CURRENT_DATE
          AND appointment_time::date < CURRENT_DATE + INTERVAL '7 days'
          AND status IN ('pending', 'confirmed')
      `,
      [salonId]
    );

    const rebookableClientsResult = await query(
      `
        SELECT COUNT(*)::int AS rebookable_clients
        FROM clients
        WHERE salon_id = $1
          AND last_visit IS NOT NULL
          AND last_visit < NOW() - INTERVAL '6 weeks'
      `,
      [salonId]
    );

    const promoCandidatesResult = await query(
      `
        SELECT COUNT(*)::int AS suggested_promotions
        FROM services
        WHERE salon_id = $1
          AND is_active = true
      `,
      [salonId]
    );

    const recoverableRevenueResult = await query(
      `
        SELECT COALESCE(ROUND(AVG(price), 2), 0)::float AS avg_ticket
        FROM services
        WHERE salon_id = $1
          AND is_active = true
      `,
      [salonId]
    );

    const emptySlots = Number(emptySlotsResult.rows?.[0]?.empty_slots ?? 0);
    const rebookableClients = Number(rebookableClientsResult.rows?.[0]?.rebookable_clients ?? 0);
    const suggestedPromotions = Number(promoCandidatesResult.rows?.[0]?.suggested_promotions ?? 0);
    const avgTicket = Number(recoverableRevenueResult.rows?.[0]?.avg_ticket ?? 0);
    const estimatedRecoverableRevenue = Number((emptySlots * avgTicket).toFixed(2));

    res.json({
      salon_id: salonId,
      empty_slots: emptySlots,
      rebookable_clients: rebookableClients,
      suggested_promotions: suggestedPromotions,
      estimated_recoverable_revenue: estimatedRecoverableRevenue,
      avg_ticket: avgTicket,
      window_days: 7,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Revenue opportunities error:', err);
    res.status(500).json({ error: 'Failed to fetch revenue opportunities' });
  }
});

export default router;
