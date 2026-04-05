/**
 * TASK-057: Error Aggregation Endpoints
 * SalonOS Sprint 4 Dogfooding Phase
 * Created: 2026-03-14
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { getErrorStats, getErrorById, markErrorResolved, clearOldErrors } from '../middleware/errorTracking';

import logger from '../config/logger';
const log = logger.child({ module: 'admin_errors' });

const router = Router();
router.use(authenticate);

/**
 * GET /api/admin/errors
 * List recent errors with optional filtering
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const stats = getErrorStats();
    
    // Optional query parameters for filtering
    const { severity, resolved, limit } = req.query;
    
    let errors = stats.recentErrors;
    
    // Filter by severity
    if (severity && typeof severity === 'string') {
      errors = errors.filter(e => e.severity === severity);
    }
    
    // Filter by resolved status
    if (resolved !== undefined && typeof resolved === 'string') {
      const isResolved = resolved === 'true';
      errors = errors.filter(e => e.resolved === isResolved);
    }
    
    // Limit results
    if (limit && typeof limit === 'string') {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        errors = errors.slice(0, limitNum);
      }
    }
    
    res.json({
      success: true,
      data: {
        errors,
        total: errors.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    log.error({ err: error }, 'Error fetching error logs:');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch error logs'
    });
  }
});

/**
 * GET /api/admin/errors/stats
 * Get error statistics
 */
router.get('/stats', (req: Request, res: Response) => {
  try {
    const stats = getErrorStats();
    
    // Calculate additional metrics
    const unresolvedCount = stats.recentErrors.filter(e => !e.resolved).length;
    const criticalCount = stats.bySeverity['critical'] || 0;
    const highCount = stats.bySeverity['high'] || 0;
    
    res.json({
      success: true,
      data: {
        total: stats.total,
        unresolved: unresolvedCount,
        bySeverity: stats.bySeverity,
        byPath: stats.byPath,
        alerts: {
          critical: criticalCount,
          high: highCount,
          needsAttention: criticalCount > 0 || highCount > 3
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    log.error({ err: error }, 'Error fetching error stats:');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch error statistics'
    });
  }
});

/**
 * GET /api/admin/errors/:errorId
 * Get specific error by ID
 */
router.get('/:errorId', (req: Request, res: Response) => {
  try {
    const { errorId } = req.params;
    const errorIdStr = Array.isArray(errorId) ? errorId[0] : errorId;
    const error = getErrorById(errorIdStr);
    
    if (!error) {
      res.status(404).json({
        success: false,
        error: 'Error not found'
      });
      return;
    }
    
    res.json({
      success: true,
      data: error,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    log.error({ err: error }, 'Error fetching error details:');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch error details'
    });
  }
});

/**
 * PATCH /api/admin/errors/:errorId/resolve
 * Mark an error as resolved
 */
router.patch('/:errorId/resolve', (req: Request, res: Response) => {
  try {
    const { errorId } = req.params;
    const errorIdStr = Array.isArray(errorId) ? errorId[0] : errorId;
    const resolved = markErrorResolved(errorIdStr);
    
    if (!resolved) {
      res.status(404).json({
        success: false,
        error: 'Error not found'
      });
      return;
    }
    
    res.json({
      success: true,
      message: 'Error marked as resolved',
      errorId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    log.error({ err: error }, 'Error resolving error:');
    res.status(500).json({
      success: false,
      error: 'Failed to mark error as resolved'
    });
  }
});

/**
 * DELETE /api/admin/errors/cleanup
 * Clear old errors (older than specified hours)
 */
router.delete('/cleanup', (req: Request, res: Response) => {
  try {
    const { hours } = req.query;
    const maxAgeHours = hours && typeof hours === 'string' 
      ? parseInt(hours, 10) 
      : 24;
    
    if (isNaN(maxAgeHours) || maxAgeHours < 1) {
      res.status(400).json({
        success: false,
        error: 'Invalid hours parameter'
      });
      return;
    }
    
    const cleared = clearOldErrors(maxAgeHours);
    
    res.json({
      success: true,
      message: `Cleared ${cleared} old errors`,
      cleared,
      maxAgeHours,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    log.error({ err: error }, 'Error cleaning up errors:');
    res.status(500).json({
      success: false,
      error: 'Failed to clean up errors'
    });
  }
});

export default router;
