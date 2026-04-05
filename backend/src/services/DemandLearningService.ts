import { query } from '../config/db'
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379')

export class DemandLearningService {

  async analyze() {

    const bestServices = await query(`
      SELECT service_id, COUNT(*) as conversions
      FROM ai_campaigns
      WHERE booked=true
      GROUP BY service_id
      ORDER BY conversions DESC
      LIMIT 5
    `)

    await redis.set(
      'demand_engine:best_services',
      JSON.stringify(bestServices.rows)
    )

    const discountRanges = await query(`
      SELECT AVG(offer_discount) as avg_discount
      FROM ai_campaigns
      WHERE booked=true
    `)

    await redis.set(
      'demand_engine:optimal_discount',
      JSON.stringify(discountRanges.rows[0])
    )
  }
}
