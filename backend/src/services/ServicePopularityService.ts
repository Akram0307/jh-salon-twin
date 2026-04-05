import { query } from '../config/db'

export class ServicePopularityService {
  async recomputePopularity(salonId: string) {
    const sql = `
      UPDATE services s
      SET popularity_score = sub.count
      FROM (
        SELECT service_id, COUNT(*) as count
        FROM appointment_services aps
        JOIN appointments a ON a.id = aps.appointment_id
        WHERE a.salon_id = $1
        GROUP BY service_id
      ) sub
      WHERE s.id = sub.service_id
    `

    await query(sql, [salonId])
  }
}
