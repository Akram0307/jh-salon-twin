import { Router } from 'express'
import { SmartUpsellEngine } from '../services/SmartUpsellEngine'

const router = Router()

router.post('/upsell-suggestions', async (req, res) => {
  try {

    const { serviceId, salonId } = req.body

    if (!serviceId || !salonId) {
      return res.status(400).json({ error: 'serviceId and salonId required' })
    }

    const suggestions = await SmartUpsellEngine.recommendAddons(
      serviceId,
      salonId
    )

    res.json({
      serviceId,
      suggestions
    })

  } catch (err:any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
