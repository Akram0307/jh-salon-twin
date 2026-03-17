import { Job } from 'bullmq'
import { AppointmentRepository } from '../repositories/AppointmentRepository'
import { ClientRepository } from '../repositories/ClientRepository'
import { DemandPredictionService } from './DemandPredictionService'
import { SmartDiscountOptimizer } from './SmartDiscountOptimizer'
import { CampaignThrottleService } from './CampaignThrottleService'
import { CampaignTrackingService } from './CampaignTrackingService'
import { sendWaitlistOffer } from './TwilioWhatsAppService'
import { broadcastActivity } from '../routes/activityRoutes'
import { createQueue, createWorker, registerWorker } from '../config/queue'
import type { IdleSlot, RecentClient } from '../types/serviceTypes';
import { ActivityEvent } from '../types/routeTypes'

const queue = createQueue('demand-engine')

export async function startDemandEngine(salonId: string) {
  await queue.add(
    'demand-scan',
    { salonId },
    {
      repeat: { every: 900000 },
      jobId: 'demand-scan-repeatable',
    }
  )
}

const worker = createWorker(
  'demand-engine',
  async (job: Job) => {
    const { salonId } = job.data as { salonId: string }

    const appointmentRepo = new AppointmentRepository()
    const clientRepo = new ClientRepository()

    const predictionService = new DemandPredictionService()
    const optimizer = new SmartDiscountOptimizer()
    const throttle = new CampaignThrottleService()
    const tracking = new CampaignTrackingService()

    const idleSlots = ((await (appointmentRepo as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>).findIdleSlots?.(salonId)) ?? []) as IdleSlot[]

    let sent = 0

    for (const slot of idleSlots) {
      if (sent >= 50) break

      const clients = ((await (clientRepo as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>).getRecentClients?.(salonId)) ?? []) as RecentClient[]

      for (const client of clients) {
        if (sent >= 50) break

        const allowed = await throttle.canSend(client.id)
        if (!allowed) continue

        const prediction = await predictionService.predict(client.id)

        const offer = await optimizer.optimize(
          slot.service_id,
          prediction.lifetimeValueScore
        )

        if (!offer) continue

        const offerId = crypto.randomUUID()

        await sendWaitlistOffer(
          salonId,
          client.phone,
          'Premium Service',
          new Date(slot.start_time).toISOString(),
          offerId
        )

        await throttle.markSent(client.id)

        await tracking.recordOffer(
          salonId,
          client.id,
          offer.serviceId,
          offer.discount
        )

        broadcastActivity({
          type: 'demand_engine_offer',
          message: `AI Demand Engine sent premium offer to client ${client.name}`
        })

        sent++
      }
    }
  },
  { concurrency: 5 }
)

registerWorker(worker)
