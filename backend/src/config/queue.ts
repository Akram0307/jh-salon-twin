import { Queue, Worker, Processor, JobsOptions, WorkerOptions } from 'bullmq';
import logger from './logger';

const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

if (!REDIS_HOST) {
  logger.warn('[QUEUE] REDIS_HOST not set - BullMQ queue features disabled');
}

/**
 * Shared BullMQ connection config.
 * Returns undefined if Redis is not configured, allowing callers to bail out.
 * maxRetriesPerRequest: null is REQUIRED by BullMQ for worker connections.
 */
export const QueueConnection = REDIS_HOST
  ? {
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: REDIS_PASSWORD,
      maxRetriesPerRequest: null,
    }
  : undefined;

/** All known queue names in the system */
export const QUEUE_NAMES = [
  'demand-engine',
  'revenue',
  'waitlist-processing',
  'slot-events',
] as const;

export type QueueName = (typeof QUEUE_NAMES)[number];

/** Default job options applied to every queue */
const defaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
};

/**
 * Create a BullMQ Queue with standard defaults.
 * Returns null if Redis is not configured.
 */
export function createQueue(name: string, opts?: JobsOptions): Queue | null {
  if (!QueueConnection) {
    logger.warn(`[QUEUE] Skipping queue creation for "${name}" - Redis not configured`);
    return null;
  }
  return new Queue(name, {
    connection: QueueConnection,
    defaultJobOptions: { ...defaultJobOptions, ...opts },
  });
}

/**
 * Create a BullMQ Worker with the shared connection.
 * Returns null if Redis is not configured.
 */
export function createWorker(
  name: string,
  handler: Processor,
  opts?: Omit<WorkerOptions, 'connection'>,
): Worker | null {
  if (!QueueConnection) {
    logger.warn(`[QUEUE] Skipping worker creation for "${name}" - Redis not configured`);
    return null;
  }
  return new Worker(name, handler, {
    connection: QueueConnection,
    ...opts,
  });
}

// --- Worker lifecycle tracking for graceful shutdown ---

const trackedWorkers: Worker[] = [];

/**
 * Register a worker for graceful shutdown tracking.
 */
export function registerWorker(worker: Worker): void {
  trackedWorkers.push(worker);
}

/**
 * Gracefully close all tracked workers.
 * Returns a promise that resolves when all workers are closed or timeout is reached.
 */
export async function shutdownAllWorkers(timeoutMs: number = 10000): Promise<void> {
  const closePromises = trackedWorkers.map((w) =>
    w.close().catch((err) => {
      console.error(`Error closing worker: ${err}`);
    }),
  );

  const timeoutPromise = new Promise<void>((resolve) =>
    setTimeout(resolve, timeoutMs),
  );

  await Promise.race([Promise.all(closePromises), timeoutPromise]);
  trackedWorkers.length = 0;
}
