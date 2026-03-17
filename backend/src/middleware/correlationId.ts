import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { createChildLogger } from '../config/logger';

const CORRELATION_HEADER = 'x-correlation-id';

/**
 * Middleware that ensures every request has a correlation ID for traceability.
 * - Uses upstream x-correlation-id if present (e.g., from a load balancer or gateway)
 * - Otherwise generates a new UUID v4
 * - Attaches correlationId and a child logger to the request object
 */
export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const correlationId = (req.headers[CORRELATION_HEADER] as string) || randomUUID();

  res.setHeader(CORRELATION_HEADER, correlationId);

  const childLogger = createChildLogger(correlationId);

  (req as any).correlationId = correlationId;
  (req as any).log = childLogger;

  next();
}
