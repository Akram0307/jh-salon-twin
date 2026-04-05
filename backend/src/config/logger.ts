import pino from 'pino';
import { randomUUID } from 'crypto';

// Define log levels
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Create logger instance
const logger = pino({
  level: LOG_LEVEL,
  // Use pretty printing in development
  transport: NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  } : undefined,
  // Base context that will be added to every log
  base: {
    service: 'salonos-backend',
    version: process.env.npm_package_version || '1.0.0',
    environment: NODE_ENV
  },
  // Custom serializers for common objects
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err
  },
  // Redact sensitive information
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'token'],
    censor: '[REDACTED]'
  }
});

// Create a child logger with correlation ID
export function createChildLogger(correlationId?: string) {
  const id = correlationId || randomUUID();
  return logger.child({ correlationId: id });
}

// Export the main logger
export default logger;

// Helper functions for structured logging
export function logRequest(method: string, url: string, correlationId: string, metadata?: Record<string, any>) {
  logger.info({
    type: 'request',
    method,
    url,
    correlationId,
    ...metadata
  }, `Incoming ${method} ${url}`);
}

export function logResponse(method: string, url: string, statusCode: number, correlationId: string, metadata?: Record<string, any>) {
  const level = statusCode >= 400 ? 'warn' : 'info';
  logger[level]({
    type: 'response',
    method,
    url,
    statusCode,
    correlationId,
    ...metadata
  }, `Outgoing ${method} ${url} - ${statusCode}`);
}

export function logError(error: Error, correlationId: string, context?: Record<string, any>) {
  logger.error({
    type: 'error',
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    correlationId,
    ...context
  }, `Error: ${error.message}`);
}

export function logInfo(message: string, metadata?: Record<string, any>) {
  logger.info(metadata, message);
}

export function logWarn(message: string, metadata?: Record<string, any>) {
  logger.warn(metadata, message);
}

export function logDebug(message: string, metadata?: Record<string, any>) {
  logger.debug(metadata, message);
}
