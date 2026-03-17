import Redis from 'ioredis';

import logger from './logger';

// Fail-fast: no fallback to production IP allowed
const redisHost = process.env.REDIS_HOST;
const redisPort = Number(process.env.REDIS_PORT) || 6379;

if (!redisHost) {
  throw new Error('FATAL: REDIS_HOST environment variable is required');
}

export const redis = new Redis({
  host: redisHost,
  port: redisPort,
  lazyConnect: true,
  maxRetriesPerRequest: null,
});

redis.on('connect', () => {
  logger.info('✅ Redis connected');
});

redis.on('error', (err) => {
  logger.error({ err: err }, 'Redis error:');
});

export default redis;
