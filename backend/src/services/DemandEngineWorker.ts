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

    const appointmentRepo: any = new AppointmentRepository()
    const clientRepo: any = new ClientRepository()

    const predictionService = new DemandPredictionService()
    const optimizer = new SmartDiscountOptimizer()
    const throttle = new CampaignThrottleService()
    const tracking = new CampaignTrackingService()

    const idleSlots = (await appointmentRepo.findIdleSlots?.(salonId)) || []

    let sent = 0

    for (const slot of idleSlots) {
      if (sent >= 50) break

      const clients = (await clientRepo.getRecentClients?.(salonId)) || []

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

        broadcastActivity(
          `AI Demand Engine sent premium offer to client ${client.name}`
        )

        sent++
      }
    }
  },
  { concurrency: 5 }
)

registerWorker(worker)
