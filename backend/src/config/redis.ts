import Redis from 'ioredis';

const redisHost = process.env.REDIS_HOST || '10.215.7.43';
const redisPort = Number(process.env.REDIS_PORT) || 6379;

export const redis = new Redis({
  host: redisHost,
  port: redisPort,
  lazyConnect: true,
  maxRetriesPerRequest: null,
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('Redis error:', err);
});

export default redis;
