/**
 * TASK-056: Performance Monitoring Configuration
 * SalonOS Sprint 4 Dogfooding Phase
 * Created: 2026-03-14
 */

import { Request, Response, NextFunction } from 'express';
import logger from './logger';

// Performance metrics storage
interface PerformanceMetric {
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
}

const performanceMetrics: PerformanceMetric[] = [];
const MAX_METRICS = 10000;

// Request timing middleware
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const start = process.hrtime();
  const startCpu = process.cpuUsage();
  const startMemory = process.memoryUsage();

  // Capture the original end function
  const originalEnd = res.end;
  
  res.end = function(chunk?: any, encoding?: string | (() => void), callback?: () => void): Response {
    // Calculate response time
    const diff = process.hrtime(start);
    const responseTime = diff[0] * 1e3 + diff[1] * 1e6; // Convert to milliseconds
    
    // Calculate CPU usage
    const cpuUsage = process.cpuUsage(startCpu);
    
    // Create metric
    const metric: PerformanceMetric = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime,
      memoryUsage: process.memoryUsage(),
      cpuUsage
    };
    
    // Store metric
    performanceMetrics.unshift(metric);
    
    // Trim if exceeds max
    if (performanceMetrics.length > MAX_METRICS) {
      performanceMetrics.pop();
    }
    
    // Log slow requests (> 1 second)
    if (responseTime > 1000) {
      logger.warn({ msg: 'Slow request detected',
        method: req.method,
        path: req.path,
        responseTime: `${responseTime.toFixed(2)}ms`,
        statusCode: res.statusCode
      });
    }
    
    // Call original end
    return originalEnd.call(this, chunk, encoding as BufferEncoding, callback);
  };
  
  next();
};

// Get performance statistics
export function getPerformanceStats(): {
  totalRequests: number;
  averageResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsByMethod: Record<string, number>;
  requestsByStatus: Record<string, number>;
  slowRequests: number;
  currentMemory: NodeJS.MemoryUsage;
  currentCpu: NodeJS.CpuUsage;
} {
  if (performanceMetrics.length === 0) {
    return {
      totalRequests: 0,
      averageResponseTime: 0,
      p50ResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      requestsByMethod: {},
      requestsByStatus: {},
      slowRequests: 0,
      currentMemory: process.memoryUsage(),
      currentCpu: process.cpuUsage()
    };
  }
  
  // Calculate response time percentiles
  const responseTimes = performanceMetrics.map(m => m.responseTime).sort((a, b) => a - b);
  const p50Index = Math.floor(responseTimes.length * 0.5);
  const p95Index = Math.floor(responseTimes.length * 0.95);
  const p99Index = Math.floor(responseTimes.length * 0.99);
  
  // Count by method and status
  const requestsByMethod: Record<string, number> = {};
  const requestsByStatus: Record<string, number> = {};
  let slowRequests = 0;
  
  for (const metric of performanceMetrics) {
    // Count by method
    requestsByMethod[metric.method] = (requestsByMethod[metric.method] || 0) + 1;
    
    // Count by status
    const statusGroup = `${Math.floor(metric.statusCode / 100)}xx`;
    requestsByStatus[statusGroup] = (requestsByStatus[statusGroup] || 0) + 1;
    
    // Count slow requests
    if (metric.responseTime > 1000) {
      slowRequests++;
    }
  }
  
  // Calculate average
  const totalResponseTime = responseTimes.reduce((sum, time) => sum + time, 0);
  const averageResponseTime = totalResponseTime / responseTimes.length;
  
  return {
    totalRequests: performanceMetrics.length,
    averageResponseTime,
    p50ResponseTime: responseTimes[p50Index] || 0,
    p95ResponseTime: responseTimes[p95Index] || 0,
    p99ResponseTime: responseTimes[p99Index] || 0,
    requestsByMethod,
    requestsByStatus,
    slowRequests,
    currentMemory: process.memoryUsage(),
    currentCpu: process.cpuUsage()
  };
}

// Health check endpoint data
export function getHealthStatus(): {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  timestamp: string;
  services: {
    database: 'connected' | 'disconnected';
    memory: 'ok' | 'warning' | 'critical';
    cpu: 'ok' | 'warning' | 'critical';
  };
  metrics: {
    memoryUsagePercent: number;
    cpuUsagePercent: number;
    responseTimeP95: number;
  };
} {
  const memoryUsage = process.memoryUsage();
  const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
  
  const cpuUsage = process.cpuUsage();
  const cpuUsagePercent = ((cpuUsage.user + cpuUsage.system) / 1000000) * 100; // Convert to percentage
  
  const stats = getPerformanceStats();
  
  // Determine status
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  if (memoryUsagePercent > 90 || cpuUsagePercent > 90 || stats.p95ResponseTime > 5000) {
    status = 'unhealthy';
  } else if (memoryUsagePercent > 80 || cpuUsagePercent > 80 || stats.p95ResponseTime > 2000) {
    status = 'degraded';
  }
  
  return {
    status,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected', // This would be checked in a real implementation
      memory: memoryUsagePercent > 90 ? 'critical' : memoryUsagePercent > 80 ? 'warning' : 'ok',
      cpu: cpuUsagePercent > 90 ? 'critical' : cpuUsagePercent > 80 ? 'warning' : 'ok'
    },
    metrics: {
      memoryUsagePercent,
      cpuUsagePercent,
      responseTimeP95: stats.p95ResponseTime
    }
  };
}

// Clear old metrics (called periodically)
export function clearOldMetrics(maxAgeHours: number = 24): number {
  const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();
  const initialLength = performanceMetrics.length;
  
  for (let i = performanceMetrics.length - 1; i >= 0; i--) {
    if (performanceMetrics[i].timestamp < cutoff) {
      performanceMetrics.splice(i, 1);
    }
  }
  
  return initialLength - performanceMetrics.length;
}
