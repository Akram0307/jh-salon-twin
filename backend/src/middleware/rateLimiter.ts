import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from '../config/redis';
import logger from '../config/logger';

/**
 * Each rate limiter MUST get its own store instance.
 * express-rate-limit v7+ throws ERR_ERL_STORE_REUSE if a store is shared.
 * Falls back to MemoryStore (undefined) when Redis is not configured.
 */
function createRedisStore(): RedisStore | undefined {
  if (!process.env.REDIS_HOST) return undefined;
  try {
    return new RedisStore({
      sendCommand: (cmd: string, ...args: (string | Buffer)[]) => redis.call(cmd, ...args) as any,
    });
  } catch (err) {
    logger.warn({ err }, 'Failed to create Redis rate limit store, falling back to MemoryStore');
    return undefined;
  }
}

// Rate limiter for auth routes: 10 requests per 15 minutes
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore(),
  message: {
    error: 'Too many authentication attempts. Please try again later.',
  },
});

// Rate limiter for general API: 100 requests per 15 minutes
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore(),
  message: {
    error: 'Too many requests. Please slow down.',
  },
});
