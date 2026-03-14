import { Router } from 'express'
import { getClient } from '../config/db'

const router = Router()

router.get('/db', async (_req, res) => {
  const started = Date.now()

  try {
    const connStart = Date.now()
    const client = await getClient()
    const connTime = Date.now() - connStart

    const qStart = Date.now()
    const result = await client.query('SELECT NOW() as db_time')
    const queryTime = Date.now() - qStart

    client.release()

    res.json({
      status: 'ok',
      connection_ms: connTime,
      query_ms: queryTime,
      total_ms: Date.now() - started,
      db_time: result.rows[0].db_time
    })

  } catch (err:any) {
    res.status(500).json({
      status: 'error',
      message: err.message,
      total_ms: Date.now() - started
    })
  }
})

export default router
