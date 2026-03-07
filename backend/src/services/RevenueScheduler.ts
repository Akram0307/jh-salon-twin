import cron from 'node-cron';
import { ClientRevenueOrchestrator } from './ClientRevenueOrchestrator';

export class RevenueScheduler {
  private orchestrator: ClientRevenueOrchestrator;

  constructor() {
    this.orchestrator = new ClientRevenueOrchestrator();
  }

  start(salonId: string) {
    console.log('[RevenueScheduler] Starting autonomous revenue scheduler');

    // Run every day at 09:00
    cron.schedule('0 9 * * *', async () => {
      console.log('[RevenueScheduler] Running scheduled revenue cycle');
      try {
        await this.orchestrator.runDailyRevenueCycle(salonId);
        console.log('[RevenueScheduler] Revenue cycle completed');
      } catch (err) {
        console.error('[RevenueScheduler] Revenue cycle error', err);
      }
    });
  }
}
