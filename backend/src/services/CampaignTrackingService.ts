import { query } from '../config/db'

export class CampaignTrackingService {

  async recordOffer(
    salonId: string,
    clientId: string,
    serviceId: string,
    discount: number
  ) {

    await query(`
      INSERT INTO ai_campaigns (salon_id, client_id, service_id, offer_discount, sent_at)
      VALUES ($1,$2,$3,$4,NOW())
    `,[salonId, clientId, serviceId, discount])

  }

  async markConverted(bookingId: string) {

    await query(`
      UPDATE ai_campaigns
      SET booked=true, booking_id=$1
      WHERE booking_id IS NULL
    `,[bookingId])

  }

  async getConversionRate() {

    const res = await query(`
      SELECT
      COUNT(*) FILTER (WHERE booked=true)::float /
      NULLIF(COUNT(*),0) as rate
      FROM ai_campaigns
    `)

    return parseFloat(res.rows[0]?.rate || '0')
  }
}
