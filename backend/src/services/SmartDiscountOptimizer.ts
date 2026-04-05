import { query } from '../config/db'

export interface OptimizedOffer {
  serviceId: string
  discount: number
  finalPrice: number
  confidenceScore: number
}

export class SmartDiscountOptimizer {

  async optimize(serviceId: string, clientValueScore: number): Promise<OptimizedOffer | null> {

    const serviceRes = await query(`
      SELECT price FROM services WHERE id=$1
    `,[serviceId])

    if(serviceRes.rows.length === 0) return null

    const price = parseFloat(serviceRes.rows[0].price)

    let discount = 10

    if(clientValueScore > 5000) discount = 5
    if(clientValueScore < 500) discount = 20

    const finalPrice = price - (price * discount/100)

    const confidenceScore = Math.min(0.95, 0.5 + (clientValueScore/10000))

    return {
      serviceId,
      discount,
      finalPrice,
      confidenceScore
    }
  }
}
