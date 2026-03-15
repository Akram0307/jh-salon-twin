/**
 * TASK-057: Error Tracking & Alerting Middleware
 * SalonOS Sprint 4 Dogfooding Phase
 * Created: 2026-03-14
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// In-memory error store (in production, use database or external service)
interface ErrorRecord {
  errorId: string;
  message: string;
  stack?: string;
  path: string;
  method: string;
  ip: string;
  userAgent?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

const errorStore: ErrorRecord[] = [];
const MAX_STORED_ERRORS = 1000;

// Error severity classification
function classifySeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
  const message = error.message.toLowerCase();
  const stack = error.stack || '';
  
  // Critical: Database, authentication, payment related
  if (message.includes('database') || message.includes('connection') || 
      message.includes('auth') || message.includes('payment')) {
    return 'critical';
  }
  
  // High: API failures, validation errors
  if (message.includes('validation') || message.includes('timeout') ||
      stack.includes('at routes/')) {
    return 'high';
  }
  
  // Medium: Business logic errors
  if (message.includes('not found') || message.includes('already exists')) {
    return 'medium';
  }
  
  // Low: Everything else
  return 'low';
}

// Log error to console with structured format
function logError(errorId: string, err: Error, req: Request): void {
  const logEntry = {
    level: 'ERROR',
    errorId,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString()
  };
  
  console.error(JSON.stringify(logEntry));
}

// Store error for aggregation
function storeError(errorId: string, err: Error, req: Request, severity: 'low' | 'medium' | 'high' | 'critical'): void {
  const record: ErrorRecord = {
    errorId,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString(),
    severity,
    resolved: false
  };
  
  errorStore.unshift(record);
  
  // Trim store if it exceeds max size
  if (errorStore.length > MAX_STORED_ERRORS) {
    errorStore.pop();
  }
}

// Main error tracking middleware
export const errorTracking = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  const errorId = randomUUID();
  const severity = classifySeverity(err);
  
  // Log the error
  logError(errorId, err, req);
  
  // Store for aggregation
  storeError(errorId, err, req, severity);
  
  // Send response
  res.status(500).json({
    error: 'Internal server error',
    errorId,
    support: 'Contact support with error ID',
    timestamp: new Date().toISOString()
  });
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response): void => {
  const errorId = randomUUID();
  
  const logEntry = {
    level: 'WARN',
    errorId,
    message: 'Route not found',
    path: req.path,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  };
  
  console.warn(JSON.stringify(logEntry));
  
  res.status(404).json({
    error: 'Route not found',
    errorId,
    path: req.path,
    method: req.method
  });
};

// Get error statistics
export function getErrorStats(): {
  total: number;
  bySeverity: Record<string, number>;
  byPath: Record<string, number>;
  recentErrors: ErrorRecord[];
} {
  const bySeverity: Record<string, number> = {};
  const byPath: Record<string, number> = {};
  
  for (const error of errorStore) {
    // Count by severity
    bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
    
    // Count by path
    byPath[error.path] = (byPath[error.path] || 0) + 1;
  }
  
  return {
    total: errorStore.length,
    bySeverity,
    byPath,
    recentErrors: errorStore.slice(0, 50)
  };
}

// Get error by ID
export function getErrorById(errorId: string): ErrorRecord | undefined {
  return errorStore.find(e => e.errorId === errorId);
}

// Mark error as resolved
export function markErrorResolved(errorId: string): boolean {
  const error = errorStore.find(e => e.errorId === errorId);
  if (error) {
    error.resolved = true;
    return true;
  }
  return false;
}

// Clear old errors (called periodically)
export function clearOldErrors(maxAgeHours: number = 24): number {
  const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();
  const initialLength = errorStore.length;
  
  for (let i = errorStore.length - 1; i >= 0; i--) {
    if (errorStore[i].timestamp < cutoff && !errorStore[i].resolved) {
      errorStore.splice(i, 1);
    }
  }
  
  return initialLength - errorStore.length;
}
