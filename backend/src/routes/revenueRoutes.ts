import { Router } from 'express';
import { query } from '../config/db';

const router = Router();

// Daily revenue trend
router.get('/daily', async (_req,res)=>{
  try {
    const result = await query(`
      SELECT
        DATE(created_at) as day,
        SUM(total_amount) as revenue
      FROM transactions
      GROUP BY day
      ORDER BY day DESC
      LIMIT 30
    `);

    res.json(result.rows);
  } catch(err){
    console.error(err);
    res.status(500).json({error:'Failed to fetch revenue trend'});
  }
});

// Staff revenue leaderboard
router.get('/staff-leaderboard', async (_req,res)=>{
  try {
    const result = await query(`
      SELECT
        s.id,
        s.full_name,
        COALESCE(SUM(t.total_amount),0) as revenue
      FROM staff s
      LEFT JOIN transactions t ON t.staff_id = s.id
      GROUP BY s.id
      ORDER BY revenue DESC
    `);

    res.json(result.rows);
  } catch(err){
    console.error(err);
    res.status(500).json({error:'Failed to fetch staff revenue'});
  }
});

// Top selling services/products
router.get('/top-items', async (_req,res)=>{
  try {
    const result = await query(`
      SELECT
        name,
        item_type,
        SUM(quantity) as sold,
        SUM(price * quantity) as revenue
      FROM transaction_items
      GROUP BY name,item_type
      ORDER BY revenue DESC
      LIMIT 10
    `);

    res.json(result.rows);
  } catch(err){
    console.error(err);
    res.status(500).json({error:'Failed to fetch top items'});
  }
});

// Revenue Intelligence Control Tower
router.get('/intelligence', async (_req, res) => {
  try {

    const revenueTrend = await query(`
      SELECT DATE(created_at) as day, SUM(total_amount) as revenue
      FROM transactions
      GROUP BY day
      ORDER BY day DESC
      LIMIT 14
    `);

    const posStats = await query(`
      SELECT COUNT(*)::int AS transactions_count,
             COALESCE(SUM(total_amount),0)::float AS gross_sales,
             COALESCE(AVG(total_amount),0)::float AS avg_ticket
      FROM transactions
    `);

    const emptySlots = await query(`
      SELECT COUNT(*)::int AS empty_slots
      FROM appointments
      WHERE appointment_time::date >= CURRENT_DATE
      AND appointment_time::date < CURRENT_DATE + INTERVAL '7 days'
    `);

    const rebookableClients = await query(`
      SELECT COUNT(*)::int AS clients
      FROM clients
      WHERE last_visit IS NOT NULL
      AND last_visit < NOW() - INTERVAL '6 weeks'
    `);

    res.json({
      generated_at: new Date().toISOString(),
      pos: posStats.rows?.[0] || {},
      revenue_trend: revenueTrend.rows,
      opportunities: {
        empty_slots_next_7_days: emptySlots.rows?.[0]?.empty_slots || 0,
        rebookable_clients: rebookableClients.rows?.[0]?.clients || 0
      }
    });

  } catch(err) {
    console.error('Revenue intelligence error', err);
    res.status(500).json({error:'Failed to generate revenue intelligence'});
  }
});

export default router;
