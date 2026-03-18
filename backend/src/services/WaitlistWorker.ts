import { SlotEventRepository } from '../repositories/SlotEventRepository';
import { WaitlistService } from './WaitlistService';
import { createQueue } from '../config/queue';

import logger from '../config/logger';
const log = logger.child({ module: 'waitlist_worker' });

export class WaitlistWorker {

  /**
   * Legacy batch processor - kept as a bridge for backlog migration.
   * Enqueues unprocessed events individually to the BullMQ queue.
   */
  static async processEvents() {
    const events = await SlotEventRepository.getUnprocessedEvents(20);

    for (const event of events) {
      try {
        WaitlistWorker.enqueueSlotEvent(event.id, event.slot_time);
      } catch (err) {
        logger.error('WaitlistWorker error enqueueing event:', event.id, err);
      }
    }
  }

  /**
   * Enqueue a single slot event for waitlist processing via BullMQ.
   */
  static enqueueSlotEvent(eventId: string, slotTime: string): void {
    const queue = createQueue('waitlist-processing');
    if (!queue) return;
    queue.add(
      'process-slot-event',
      { eventId, slotTime },
      { jobId: `slot-event:${eventId}` },
    );
    log.info({ eventId, slotTime }, '[WaitlistWorker] Enqueued slot event');
  }

  /**
   * Query all unprocessed slot events and enqueue them individually.
   * Useful for migration/backlog processing.
   */
  static async enqueueBacklog(): Promise<number> {
    const events = await SlotEventRepository.getUnprocessedEvents(1000);
    const queue = createQueue('waitlist-processing');
    if (!queue) return 0;

    for (const event of events) {
      queue.add(
        'process-slot-event',
        { eventId: event.id, slotTime: event.slot_time },
        { jobId: `slot-event:${event.id}` },
      );
    }

    log.info({ count: events.length }, '[WaitlistWorker] Enqueued backlog events');
    return events.length;
  }
}
