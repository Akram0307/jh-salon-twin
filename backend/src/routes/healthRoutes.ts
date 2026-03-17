import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import pool from '../config/db';
import os from 'os';
import redis from '../config/redis';
import { QUEUE_NAMES, createQueue } from '../config/queue';

const router = Router();

// Application start time for uptime calculation
const startTime = Date.now();

// Get application version from package.json
const getAppVersion = (): string => {
  try {
    const packageJson = require('../../package.json');
    return packageJson.version || '1.0.0';
  } catch {
    return '1.0.0';
  }
};

/**
 * GET /api/health
 * Returns system status including uptime, memory usage, and version
 * This endpoint is lightweight and doesn't check database connectivity
 */
router.get('/', async (req: Request, res: Response) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000); // Uptime in seconds
  const memoryUsage = process.memoryUsage();
  
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: uptime,
      human: formatUptime(uptime)
    },
    version: getAppVersion(),
    environment: process.env.NODE_ENV || 'development',
    memory: {
      rss: formatBytes(memoryUsage.rss),
      heapTotal: formatBytes(memoryUsage.heapTotal),
      heapUsed: formatBytes(memoryUsage.heapUsed),
      external: formatBytes(memoryUsage.external),
      arrayBuffers: formatBytes(memoryUsage.arrayBuffers)
    },
    system: {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      loadAverage: os.loadavg(),
      freeMemory: formatBytes(os.freemem()),
      totalMemory: formatBytes(os.totalmem())
    }
  };
  
  res.json(healthStatus);
});

/**
 * GET /api/ready
 * Returns readiness status including database connectivity
 * Used by load balancers and orchestrators to determine if the service is ready
 */
router.get('/ready', async (req: Request, res: Response) => {
  const checks = {
    database: false,
    redis: false,
    timestamp: new Date().toISOString()
  };

  try {
    // Check database connectivity
    const dbResult = await pool.query('SELECT 1 as connected');
    checks.database = dbResult.rows[0].connected === 1;
  } catch (error) {
    checks.database = false;
  }

  try {
    // Check Redis connectivity
    await redis.ping();
    checks.redis = true;
  } catch (error) {
    checks.redis = false;
  }

  const isReady = checks.database && checks.redis;
  
  const readinessStatus = {
    status: isReady ? 'ready' : 'not_ready',
    ready: isReady,
    checks,
    timestamp: new Date().toISOString()
  };
  
  res.status(isReady ? 200 : 503).json(readinessStatus);
});

/**
 * GET /api/ready/live
 * Liveness probe - simple check that the process is running
 */
router.get('/live', async (req: Request, res: Response) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/health/detailed
 * Returns detailed health information including all subsystems
 * Requires authentication for security
 */
router.get('/detailed', authenticate, async (req: Request, res: Response) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const memoryUsage = process.memoryUsage();
  
  const checks: Record<string, any> = {
    database: { status: 'unknown', latency: null },
    memory: { status: 'unknown', details: null },
    cpu: { status: 'unknown', details: null }
  };
  
  // Database check with latency
  const dbStart = Date.now();
  try {
    await pool.query('SELECT 1 as connected');
    checks.database = {
      status: 'healthy',
      latency: Date.now() - dbStart,
      connected: true
    };
  } catch (error) {
    checks.database = {
      status: 'unhealthy',
      latency: Date.now() - dbStart,
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
  
  // Memory check
  const heapUsedPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
  checks.memory = {
    status: heapUsedPercent < 90 ? 'healthy' : 'warning',
    details: {
      heapUsedPercent: Math.round(heapUsedPercent * 100) / 100,
      rss: formatBytes(memoryUsage.rss),
      heapTotal: formatBytes(memoryUsage.heapTotal),
      heapUsed: formatBytes(memoryUsage.heapUsed)
    }
  };
  
  // CPU check (load average)
  const loadAvg = os.loadavg()[0]; // 1-minute average
  const cpuCount = os.cpus().length;
  const loadPercent = (loadAvg / cpuCount) * 100;
  checks.cpu = {
    status: loadPercent < 80 ? 'healthy' : 'warning',
    details: {
      loadAverage1m: Math.round(loadAvg * 100) / 100,
      loadPercent: Math.round(loadPercent * 100) / 100,
      cpuCount
    }
  };
  

  // Redis & Queue check (BullMQ uses Redis)
  let redisConnected = false;
  try {
    await redis.ping();
    redisConnected = true;
  } catch (error) {
    redisConnected = false;
  }
  checks.redis = {
    status: redisConnected ? 'healthy' : 'unhealthy',
    connected: redisConnected
  };
  checks.queues = {
    status: redisConnected ? 'healthy' : 'unhealthy',
    names: [...QUEUE_NAMES],
    connected: redisConnected
  };

  // Determine overall status
  const allHealthy = Object.values(checks).every(c => c.status === 'healthy');
  const hasWarning = Object.values(checks).some(c => c.status === 'warning');
  const overallStatus = allHealthy ? 'healthy' : hasWarning ? 'degraded' : 'unhealthy';
  
  res.status(overallStatus === 'unhealthy' ? 503 : 200).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: uptime,
      human: formatUptime(uptime)
    },
    version: getAppVersion(),
    environment: process.env.NODE_ENV || 'development',
    checks
  });
});


/**
 * GET /api/health/queues
 * Returns BullMQ queue job counts (waiting, active, completed, failed, delayed)
 */
router.get('/queues', authenticate, async (req: Request, res: Response) => {
  try {
    const queues: Record<string, { waiting: number; active: number; completed: number; failed: number; delayed: number }> = {};

    for (const name of QUEUE_NAMES) {
      const queue = createQueue(name);
      const counts = await queue.getJobCounts();
      await queue.close();
      queues[name] = {
        waiting: counts.waiting,
        active: counts.active,
        completed: counts.completed,
        failed: counts.failed,
        delayed: counts.delayed,
      };
    }

    res.json({ status: 'ok', queues });
  } catch (error) {
    res.status(503).json({
      status: 'unavailable',
      queues: {},
      error: error instanceof Error ? error.message : 'Redis unavailable',
    });
  }
});

// Helper functions
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);
  
  return parts.join(' ');
}

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;
  
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  
  return `${Math.round(value * 100) / 100} ${units[unitIndex]}`;
}

export default router;
