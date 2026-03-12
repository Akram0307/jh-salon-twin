import { Router } from 'express';
import { query } from '../config/db';

const router = Router();

// Daily revenue trend
router.get('/daily', async (req,res)=>{
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
router.get('/staff-leaderboard', async (req,res)=>{
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
router.get('/top-items', async (req,res)=>{
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

export default router;
