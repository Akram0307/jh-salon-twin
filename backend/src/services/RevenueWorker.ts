import { createWorker, registerWorker } from '../config/queue';
import { ClientRevenueOrchestrator } from './ClientRevenueOrchestrator';
import { AutomaticRebookingEngine } from './AutomaticRebookingEngine';
import { AutoRebookNotifier } from './AutoRebookNotifier';
import { query } from '../config/db';

import logger from '../config/logger';
const log = logger.child({ module: 'revenue_worker' });

const orchestrator = new ClientRevenueOrchestrator();

/**
 * BullMQ worker for the 'revenue' queue.
 * Handles two job types:
 *   - 'daily-revenue-cycle': runs the daily revenue orchestration for a salon
 *   - 'auto-rebook-scan': scans all salons for auto-rebook opportunities
 */
export function startRevenueWorker(): void {
  const worker = createWorker('revenue', async (job) => {
    switch (job.name) {
      case 'daily-revenue-cycle': {
        const { salonId } = job.data;
        log.info({ jobId: job.id, salonId }, '[RevenueWorker] Processing daily-revenue-cycle');
        await orchestrator.runDailyRevenueCycle(salonId);
        log.info({ jobId: job.id, salonId }, '[RevenueWorker] daily-revenue-cycle completed');
        break;
      }

      case 'auto-rebook-scan': {
        log.info({ jobId: job.id }, '[RevenueWorker] Processing auto-rebook-scan');
        const salons = await query(`SELECT id FROM salons`);
        for (const salon of salons.rows) {
          const reminders = await AutomaticRebookingEngine.scanClientsNeedingRebook(salon.id);
          log.info({ salonId: salon.id, count: reminders.length }, '[RevenueWorker] Auto-rebook opportunities');
        }
        log.info({ jobId: job.id }, '[RevenueWorker] auto-rebook-scan completed');
        break;
      }

      default:
        log.warn({ jobName: job.name, jobId: job.id }, '[RevenueWorker] Unknown job type, skipping');
        break;
    }
  }, {
    concurrency: 1,
  });

  worker.on('failed', (job, err) => {
    log.error({ jobId: job?.id, jobName: job?.name, err }, '[RevenueWorker] Job failed');
  });

  worker.on('completed', (job) => {
    log.info({ jobId: job.id, jobName: job.name }, '[RevenueWorker] Job completed');
  });

  registerWorker(worker);
  log.info('[RevenueWorker] Revenue worker started');
}
