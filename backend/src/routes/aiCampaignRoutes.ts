import { Router } from 'express'
import { authenticate } from '../middleware/auth';

const router = Router()
router.use(authenticate);

router.get('/', async (_req, res) => {
  res.json({
    success: true,
    data: {
      campaigns: [],
      status: 'idle'
    }
  })
})

router.post('/toggle', async (_req, res) => {
  res.json({ success: true, message: 'Campaign toggle acknowledged' })
})

export default router
