import { query } from '../config/db'
import { AutoRebookNotifier } from './AutoRebookNotifier'
import { AutomaticRebookingEngine } from './AutomaticRebookingEngine'
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

// Automatic Rebooking AI nightly scan
async function runAutomaticRebookingScan() {
  const salons = await query(`SELECT id FROM salons`)

  for (const salon of salons.rows) {
    const reminders = await AutomaticRebookingEngine.scanClientsNeedingRebook(salon.id)

    console.log('Auto‑rebook opportunities', salon.id, reminders.length)

    // TODO: publish reminders to messaging pipeline
  }
}

// schedule at 3AM
setInterval(() => {
  runAutomaticRebookingScan().catch(console.error)
}, 24 * 60 * 60 * 1000)


// Auto‑rebooking messaging dispatch
async function dispatchAutoRebookMessages(){

  const salons = await query(`SELECT id FROM salons`)

  for(const salon of salons.rows){

    const count = await AutoRebookNotifier.processSalon(salon.id)

    console.log('Auto rebook reminders sent', salon.id, count)

  }

}

