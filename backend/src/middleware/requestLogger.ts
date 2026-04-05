import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { logRequest, logResponse, logError } from '../config/logger';

// Extend Express Request to include correlation ID
declare global {
  namespace Express {
    interface Request {
      correlationId: string;
      startTime: number;
    }
  }
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  // Generate or extract correlation ID
  const correlationId = req.headers['x-correlation-id'] as string || randomUUID();
  req.correlationId = correlationId;
  req.startTime = Date.now();

  // Add correlation ID to response headers
  res.setHeader('X-Correlation-ID', correlationId);

  // Log incoming request
  logRequest(req.method, req.originalUrl, correlationId, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    query: req.query,
    params: req.params
  });

  // Capture the original send function
  const originalSend = res.send;
  let responseBody: string | object | undefined;

  // Override send to capture response body
  res.send = function (body: string | object | undefined) {
    responseBody = body;
    return originalSend.call(this, body);
  };

  // Log response when it finishes
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    
    // Try to parse response body for logging
    let parsedBody;
    try {
      if (typeof responseBody === 'string') {
        parsedBody = JSON.parse(responseBody);
      } else {
        parsedBody = responseBody;
      }
    } catch (e) {
      parsedBody = responseBody;
    }

    logResponse(req.method, req.originalUrl, res.statusCode, correlationId, {
      duration,
      contentLength: res.get('Content-Length'),
      contentType: res.get('Content-Type'),
      // Only log response body in development and if it's not too large
      ...(process.env.NODE_ENV === 'development' && 
          responseBody && 
          JSON.stringify(responseBody).length < 1000 && 
          { response: parsedBody })
    });
  });

  // Log errors if they occur
  res.on('error', (error) => {
    logError(error, correlationId, {
      method: req.method,
      url: req.originalUrl,
      duration: Date.now() - req.startTime
    });
  });

  next();
}

// Middleware to handle uncaught errors
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  logError(err, req.correlationId, {
    method: req.method,
    url: req.originalUrl,
    duration: req.startTime ? Date.now() - req.startTime : undefined
  });

  res.status(500).json({
    error: 'Internal Server Error',
    correlationId: req.correlationId,
    ...(process.env.NODE_ENV === 'development' && { message: err.message, stack: err.stack })
  });
}

// Middleware to log 404 errors
export function notFoundHandler(req: Request, res: Response) {
  logResponse(req.method, req.originalUrl, 404, req.correlationId, {
    duration: req.startTime ? Date.now() - req.startTime : undefined
  });

  res.status(404).json({
    error: 'Not Found',
    correlationId: req.correlationId,
    path: req.originalUrl
  });
}
