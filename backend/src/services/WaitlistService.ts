import { WaitlistRepository } from '../repositories/WaitlistRepository';

export class WaitlistService {
    static async processCancellation(appointmentTime: string | Date) {
        try {
            const dateObj = new Date(appointmentTime);
            const dateStr = dateObj.toISOString().split('T')[0];

            console.log(`[WaitlistService] Checking waitlist for date: ${dateStr}`);
            const pendingEntries = await WaitlistRepository.getPendingByDate(dateStr);

            if (pendingEntries && pendingEntries.length > 0) {
                for (const entry of pendingEntries) {
                    console.log(`[WaitlistService] Notifying client ${entry.client_id} about new availability on ${dateStr} (Prefers: ${entry.preferred_time_range})`);

                    // TODO: Integrate Twilio WhatsApp API here to send the actual message

                    // Update status to notified to prevent spamming
                    await WaitlistRepository.updateStatus(entry.id, 'notified');
                }
            } else {
                console.log(`[WaitlistService] No pending waitlist entries for ${dateStr}`);
            }
        } catch (error) {
            console.error('[WaitlistService] Error processing cancellation:', error);
        }
    }
}
