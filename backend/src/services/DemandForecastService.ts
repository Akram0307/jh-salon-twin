import { query } from '../config/db'

export class DemandForecastService {
  async generateSimpleForecast(salonId: string) {
    const services = await query(`SELECT id FROM services WHERE salon_id=$1`, [salonId])

    for (const s of services.rows) {
      const result = await query(`
        SELECT COUNT(*) as bookings
        FROM appointment_services aps
        JOIN appointments a ON a.id = aps.appointment_id
        WHERE aps.service_id=$1
        AND a.appointment_time > NOW() - INTERVAL '30 days'
      `, [s.id])

      const demand = parseInt(result.rows[0].bookings) / 30

      await query(`
        INSERT INTO demand_forecasts (salon_id, service_id, forecast_date, predicted_demand, confidence_score)
        VALUES ($1,$2,CURRENT_DATE + INTERVAL '7 days',$3,0.7)
      `,[salonId,s.id,Math.round(demand)])
    }
  }
}
