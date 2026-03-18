import { createWorker, registerWorker } from '../config/queue';
import { WaitlistService } from './WaitlistService';
import { SlotEventRepository } from '../repositories/SlotEventRepository';

import logger from '../config/logger';
const log = logger.child({ module: 'waitlist_queue_worker' });

/**
 * BullMQ worker for the 'waitlist-processing' queue.
 * Processes individual slot events (cancellations) to trigger waitlist fulfillment.
 */
export function startWaitlistWorker(): void {
  const worker = createWorker('waitlist-processing', async (job) => {
    switch (job.name) {
      case 'process-slot-event': {
        const { eventId, slotTime } = job.data;
        log.info({ jobId: job.id, eventId, slotTime }, '[WaitlistQueueWorker] Processing slot event');

        await WaitlistService.processCancellation(slotTime);
        await SlotEventRepository.markProcessed(eventId);

        log.info({ jobId: job.id, eventId }, '[WaitlistQueueWorker] Slot event processed and marked done');
        break;
      }

      case 'process-slot-event-batch': {
        const { events } = job.data;
        log.info({ jobId: job.id, count: events.length }, '[WaitlistQueueWorker] Processing batch slot events');

        for (const event of events) {
          try {
            await WaitlistService.processCancellation(event.slot_time);
            await SlotEventRepository.markProcessed(event.id);
          } catch (err) {
            log.error({ eventId: event.id, err }, '[WaitlistQueueWorker] Batch item failed');
            throw err; // Let BullMQ retry the whole batch
          }
        }

        log.info({ jobId: job.id }, '[WaitlistQueueWorker] Batch completed');
        break;
      }

      default:
        log.warn({ jobName: job.name, jobId: job.id }, '[WaitlistQueueWorker] Unknown job type, skipping');
        break;
    }
  }, {
    concurrency: 2,
  });

  if (!worker) {
    log.warn('[WaitlistQueueWorker] Redis not configured - waitlist worker disabled');
    return;
  }

  worker.on('failed', (job, err) => {
    log.error({ jobId: job?.id, jobName: job?.name, err }, '[WaitlistQueueWorker] Job failed');
  });

  worker.on('completed', (job) => {
    log.info({ jobId: job.id, jobName: job.name }, '[WaitlistQueueWorker] Job completed');
  });

  registerWorker(worker);
  log.info('[WaitlistQueueWorker] Waitlist worker started');
}
