import { SlotEventRepository } from '../repositories/SlotEventRepository';
import { WaitlistService } from './WaitlistService';

export class WaitlistWorker {

    static async processEvents() {
        const events = await SlotEventRepository.getUnprocessedEvents(20);

        for (const event of events) {
            try {
                // Trigger waitlist logic using existing service
                await WaitlistService.processCancellation(event.slot_time);

                // Mark event as processed
                await SlotEventRepository.markProcessed(event.id);

            } catch (err) {
                console.error('WaitlistWorker error processing event:', event.id, err);
            }
        }
    }
}
