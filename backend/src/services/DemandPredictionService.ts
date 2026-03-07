import { query } from '../config/db'

export interface ClientDemandPrediction {
  clientId: string
  avgSpend: number
  visitFrequencyDays: number
  predictedNextVisit: Date | null
  lifetimeValueScore: number
}

export class DemandPredictionService {
  async predict(clientId: string): Promise<ClientDemandPrediction> {

    const spendRes = await query(`
      SELECT AVG(t.total) as avg_spend,
             MAX(t.created_at) as last_visit,
             MIN(t.created_at) as first_visit,
             COUNT(*) as visits
      FROM transactions t
      WHERE t.client_id=$1
    `,[clientId])

    const row = spendRes.rows[0] || {}

    const avgSpend = parseFloat(row.avg_spend || '0')
    const visits = parseInt(row.visits || '0')

    let visitFrequencyDays = 0

    if (row.first_visit && row.last_visit && visits > 1) {
      const first = new Date(row.first_visit).getTime()
      const last = new Date(row.last_visit).getTime()
      const diffDays = (last - first) / (1000*60*60*24)
      visitFrequencyDays = diffDays / visits
    }

    let predictedNextVisit: Date | null = null

    if (row.last_visit && visitFrequencyDays > 0) {
      predictedNextVisit = new Date(new Date(row.last_visit).getTime() + visitFrequencyDays*24*60*60*1000)
    }

    const lifetimeValueScore = avgSpend * visits

    return {
      clientId,
      avgSpend,
      visitFrequencyDays,
      predictedNextVisit,
      lifetimeValueScore
    }
  }
}
