import { createQueue } from '../config/queue';
import { AutoRebookNotifier } from './AutoRebookNotifier';
import { AutomaticRebookingEngine } from './AutomaticRebookingEngine';
import { ClientRevenueOrchestrator } from './ClientRevenueOrchestrator';
import { query } from '../config/db';

import logger from '../config/logger';
const log = logger.child({ module: 'revenue_scheduler' });

export class RevenueScheduler {
  private orchestrator: ClientRevenueOrchestrator;

  constructor() {
    this.orchestrator = new ClientRevenueOrchestrator();
  }

  /**
 * Enqueue the daily revenue cycle as a BullMQ repeatable job.
 * Replaces the former node-cron '0 9 * * *' schedule.
 */
  start(salonId: string) {
    log.info('[RevenueScheduler] Registering BullMQ repeatable jobs');

    const revenueQueue = createQueue('revenue');
    if (!revenueQueue) return;

    revenueQueue.add(
      'daily-revenue-cycle',
      { salonId },
      {
        jobId: `daily-revenue-cycle:${salonId}`,
        repeat: { pattern: '0 9 * * *' },
      },
    );

    log.info('[RevenueScheduler] Daily revenue cycle scheduled (0 9 * * *)');
  }
}

// Automatic Rebooking AI nightly scan
export async function runAutomaticRebookingScan() {
  try {
    const salons = await query(`SELECT id FROM salons`);
    for (const salon of salons.rows) {
      const reminders = await AutomaticRebookingEngine.scanClientsNeedingRebook(salon.id);
      log.info('Auto-rebook opportunities'  + " " + salon.id  + " " + reminders.length);
    }
  } catch (err) {
    log.error({ err: err }, '[AutoRebook] Scan error:');
  }
}

// Auto-rebooking messaging dispatch
export async function dispatchAutoRebookMessages() {
  try {
    const salons = await query(`SELECT id FROM salons`);
    for (const salon of salons.rows) {
      const count = await AutoRebookNotifier.processSalon(salon.id);
      log.info('Auto rebook reminders sent'  + " " + salon.id  + " " + count);
    }
  } catch (err) {
    log.error({ err: err }, '[AutoRebook] Dispatch error:');
  }
}

/**
 * Schedule background jobs via BullMQ repeatable jobs.
 * Replaces the former setInterval(24h) for auto-rebook scan.
 * Call this AFTER server starts.
 */
export function startBackgroundJobs() {
  const revenueQueue = createQueue('revenue');
    if (!revenueQueue) return;

  revenueQueue.add(
    'auto-rebook-scan',
    {},
    {
      jobId: 'auto-rebook-scan:daily',
      repeat: { every: 24 * 60 * 60 * 1000 },
    },
  );

  log.info('[BackgroundJobs] BullMQ repeatable jobs registered');
}
