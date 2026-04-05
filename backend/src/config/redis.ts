import Redis from 'ioredis';

import logger from './logger';

const redisHost = process.env.REDIS_HOST;
const redisPort = Number(process.env.REDIS_PORT) || 6379;

let _redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (_redis) return _redis;
  if (!redisHost) {
    logger.warn('[REDIS] REDIS_HOST not set - Redis features disabled');
    return null;
  }
  _redis = new Redis({
    host: redisHost,
    port: redisPort,
    lazyConnect: true,
    maxRetriesPerRequest: null,
  });
  _redis.on('connect', () => {
    logger.info('✅ Redis connected');
  });
  _redis.on('error', (err) => {
    logger.error({ err: err }, 'Redis error:');
  });
  return _redis;
}

// Lazy singleton for backward compatibility
export const redis = new Proxy({} as Redis, {
  get(_target, prop) {
    const instance = getRedis();
    if (!instance) return () => { throw new Error('Redis not configured'); };
    return (instance as any)[prop];
  }
});

export default redis;
