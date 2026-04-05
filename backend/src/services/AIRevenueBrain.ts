import { query } from '../config/db'

export class AIRevenueBrain {

 static async forecastDemand(salonId:string){

  const stats = await query(`
   SELECT DATE(appointment_date) d, COUNT(*) c
   FROM appointments
   WHERE salon_id=$1
   GROUP BY d
   ORDER BY d DESC
   LIMIT 30
  `,[salonId])

  const avg = stats.rows.reduce((a,b)=>a+Number(b.c),0) / (stats.rows.length || 1)

  return {
   averageDailyBookings: avg,
   recommendation: avg < 10 ? 'Run promotion or rebooking campaign' : 'Demand healthy'
  }

 }

}
