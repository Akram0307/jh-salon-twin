import { Queue, Worker, Processor, JobsOptions, WorkerOptions } from 'bullmq';

const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

if (!REDIS_HOST) {
  throw new Error('FATAL: REDIS_HOST environment variable is required for queue connections');
}

/**
 * Shared BullMQ connection config.
 * maxRetriesPerRequest: null is REQUIRED by BullMQ for worker connections.
 */
export const QueueConnection = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  maxRetriesPerRequest: null,
};

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
 */
export function createQueue(name: string, opts?: JobsOptions): Queue {
  return new Queue(name, {
    connection: QueueConnection,
    defaultJobOptions: { ...defaultJobOptions, ...opts },
  });
}

/**
 * Create a BullMQ Worker with the shared connection.
 */
export function createWorker(
  name: string,
  handler: Processor,
  opts?: Omit<WorkerOptions, 'connection'>,
): Worker {
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
