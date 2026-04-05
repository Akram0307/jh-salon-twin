import { query } from '../config/db'
import type { UpsellResult } from '../types/serviceTypes';

export class UpsellService {

  static async getUpsells(baseServiceId: string) {

    const res = await query(
      `SELECT upsell_service_id
       FROM service_upsell_rules
       WHERE service_id = $1
       ORDER BY priority DESC`,
      [baseServiceId]
    )

    return res.rows.map((r: { upsell_service_id: string }) => ({ upsell_service_id: r.upsell_service_id } as UpsellResult))
  }

  // Compatibility wrapper used by receptionist agent
  static async sendUpsellOffer(clientId: string, baseServiceId: string) {
    const upsells = await this.getUpsells(baseServiceId)

    return {
      client_id: clientId,
      upsells
    }
  }
}
