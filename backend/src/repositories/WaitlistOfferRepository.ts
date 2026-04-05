import { query } from '../config/db'

export class WaitlistOfferRepository {

  static async createOffer(
    salonId: string,
    waitlistId: string,
    serviceId: string,
    slotTime: string
  ) {
    const result = await query(
      `INSERT INTO waitlist_offers
       (salon_id, waitlist_id, service_id, appointment_slot, expires_at)
       VALUES ($1,$2,$3,$4, NOW() + interval '30 minutes')
       RETURNING *`,
      [salonId, waitlistId, serviceId, slotTime]
    )

    return result.rows[0]
  }

  static async markClaimed(offerId: string) {
    await query(
      `UPDATE waitlist_offers
       SET offer_status='claimed', claimed_at=NOW()
       WHERE id=$1`,
      [offerId]
    )
  }

  static async expireOffers() {
    await query(
      `UPDATE waitlist_offers
       SET offer_status='expired'
       WHERE offer_status='pending'
       AND expires_at < NOW()`
    )
  }

  static async countOffersSent() {
    const result = await query(`SELECT COUNT(*) FROM waitlist_offers`)
    return parseInt(result.rows[0].count,10)
  }

  static async countRecoveredBookings() {
    const result = await query(
      `SELECT COUNT(*) FROM waitlist_offers WHERE offer_status='claimed'`
    )
    return parseInt(result.rows[0].count,10)
  }
}

export const markClaimed = WaitlistOfferRepository.markClaimed;
