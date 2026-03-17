import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from '../config/redis';
import logger from '../config/logger';

// S5-C5: Redis-backed rate limiter store for distributed rate limiting across Cloud Run instances
let redisStore: RedisStore | undefined;

try {
  redisStore = new RedisStore({
    sendCommand: (cmd: string, ...args: (string | Buffer)[]) => redis.call(cmd, ...args) as any,
  });
} catch (err) {
  logger.warn({ err }, 'Failed to create Redis rate limit store, falling back to MemoryStore');
}

// Rate limiter for auth routes: 10 requests per 15 minutes
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore,
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
  store: redisStore,
  message: {
    error: 'Too many requests. Please slow down.',
  },
});
