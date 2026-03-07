import { query } from '../config/db'
import { UpsellService } from './UpsellService'

interface DynamicOffer {
  type: 'upsell' | 'discount' | 'bundle'
  message: string
  discount?: number
  suggestedServiceId?: string
}

export class DynamicOfferGenerator {

  async generateOffer(
    salonId: string,
    clientId: string,
    baseServiceId?: string
  ): Promise<DynamicOffer | null> {

    // Get average predicted demand for today
    const demandResult = await query(`
      SELECT AVG(predicted_demand) as demand
      FROM demand_forecasts
      WHERE salon_id=$1
    `,[salonId])

    const demand = parseFloat(demandResult.rows[0]?.demand || '0')

    // Get client segment
    const clientResult = await query(`
      SELECT segments
      FROM clients
      WHERE id=$1
    `,[clientId])

    const segment = clientResult.rows[0]?.segments || 'NEW'

    // LOW DEMAND → trigger discount
    if (demand < 5) {
      const discount = segment === 'VIP' ? 10 : 15

      return {
        type: 'discount',
        discount,
        message: `We have availability today ✨ Enjoy ${discount}% off your next visit if you book today.`
      }
    }

    // NORMAL DEMAND → upsell opportunity
    if (baseServiceId) {
      const upsells = await UpsellService.getUpsells(baseServiceId)

      if (upsells && upsells.length > 0) {
        const upsell = upsells[0]

        return {
          type: 'upsell',
          suggestedServiceId: upsell.upsell_service_id,
          message: `Add a ${upsell.name} to your appointment for an enhanced experience ✨`
        }
      }
    }

    // HIGH DEMAND → premium bundle
    if (demand > 20 && segment === 'VIP') {
      return {
        type: 'bundle',
        message: 'Upgrade to our premium treatment package for a luxury experience during your visit 💎'
      }
    }

    return null
  }
}
