import express from 'express'
import { ClientRevenueOrchestrator } from '../services/ClientRevenueOrchestrator'

const router = express.Router()

router.post('/', async (req, res) => {
  try {
    const { salonId, action } = req.body

    if (!salonId) {
      return res.status(400).json({ error: 'SALON_ID_REQUIRED' })
    }

    const orchestrator = new ClientRevenueOrchestrator()

    if (action === 'scan_opportunities') {
      const result = await orchestrator.runDailyRevenueCycle(salonId)
      return res.json({ status: 'ok', result })
    }

    return res.status(400).json({ error: 'UNKNOWN_ACTION' })
  } catch (err: any) {
    console.error('[RevenueAction]', err)
    res.status(500).json({ error: 'REVENUE_AUTOMATION_FAILED', message: err?.message })
  }
})

export default router
