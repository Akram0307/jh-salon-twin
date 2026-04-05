
import logger from '../config/logger';
import { UpsellService } from './UpsellService'
import { query } from '../config/db'

export default class RevenueActivationAgent {

  /**
   * Proactive upsell after booking confirmation
   */
  async triggerUpsell(clientId: string, serviceId: string, phone: string) {

    const upsells = await UpsellService.getUpsells(serviceId)

    if (!upsells || upsells.length === 0) return

    const upsellServiceId = upsells[0]

    const service = await query(
      `SELECT name FROM services WHERE id = $1`,
      [upsellServiceId]
    )

    const serviceName = service.rows[0]?.name

    logger.info({
      clientId,
      phone,
      suggestedService: serviceName
    }, '💰 Upsell opportunity detected')
  }


  /**
   * Rebooking reminder based on last appointment
   */
  async triggerRebookingReminder(clientId: string, phone: string) {

    const res = await query(`
      SELECT s.name, a.start_time
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      WHERE a.client_id = $1
      ORDER BY a.start_time DESC
      LIMIT 1
    `,[clientId])

    if(res.rows.length === 0) return

    const lastService = res.rows[0].name

    logger.info({
      clientId,
      phone,
      lastService
    }, '📅 Rebooking reminder candidate')
  }


  /**
   * Recover cancelled appointments
   */
  async triggerCancellationRecovery(phone: string, serviceName: string) {

    logger.info({
      phone,
      serviceName
    }, '♻️ Cancellation recovery opportunity')
  }


  /**
   * Demand‑based promotion
   */
  async triggerDemandPromotion(serviceName: string) {

    const res = await query(`
      SELECT COUNT(*) as bookings
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      WHERE s.name = $1
      AND a.start_time > NOW() - INTERVAL '7 days'
    `,[serviceName])

    const bookings = Number(res.rows[0].bookings)

    if(bookings < 3){
      logger.info({
        serviceName,
        bookings
      }, '📉 Low demand detected — promotion candidate')
    }
  }
}
