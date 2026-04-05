import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379')

export class CampaignThrottleService {

  async canSend(clientId: string): Promise<boolean> {

    const key = `demand_engine:last_sent:${clientId}`

    const last = await redis.get(key)

    if(!last) return true

    const diff = Date.now() - parseInt(last)

    const hours = diff / (1000*60*60)

    return hours >= 48
  }

  async markSent(clientId: string) {
    const key = `demand_engine:last_sent:${clientId}`
    await redis.set(key, Date.now().toString())
  }
}
