
import logger from '../config/logger';
import { Router } from 'express'
import { authenticate } from '../middleware/auth';
import { pool } from '../config/db'

const router = Router()
router.use(authenticate);

// --- In-memory SSE clients ---
const clients: any[] = []

export function broadcastActivity(event: any) {
  const data = `data: ${JSON.stringify(event)}\n\n`
  clients.forEach(res => res.write(data))
}

// --- Historical feed ---
router.get('/feed', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, created_at, type, payload
      FROM slot_events
      ORDER BY created_at DESC
      LIMIT 50
    `)

    res.json(result.rows || [])
  } catch (err) {
    logger.error({ err: err }, 'Activity feed error:')
    res.json([])
  }
})

// --- Live SSE stream ---
router.get('/live', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  res.write('retry: 10000\n\n')

  clients.push(res)

  req.on('close', () => {
    const index = clients.indexOf(res)
    if (index !== -1) clients.splice(index, 1)
  })
})

export default router
