import type { NextFunction, Request, Response } from 'express';
import { AuditLogRepository } from '../repositories/AuditLogRepository';

import logger from '../config/logger';

export type AuditContext = {
  salonId: string;
  entityType: string;
  action: string;
  actorId?: string | null;
  actorType?: string | null;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
};

type AuditRequest = Request & {
  auditContext?: AuditContext;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function computeDiff(before: unknown, after: unknown) {
  if (!isPlainObject(before) || !isPlainObject(after)) {
    return { before, after };
  }

  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const diff: Record<string, { before: unknown; after: unknown }> = {};

  for (const key of keys) {
    const prev = before[key];
    const next = after[key];
    if (JSON.stringify(prev) !== JSON.stringify(next)) {
      diff[key] = { before: prev, after: next };
    }
  }

  return diff;
}

export function attachAuditContext(req: AuditRequest, context: AuditContext) {
  req.auditContext = context;
}

export function auditLogger(req: AuditRequest, res: Response, next: NextFunction) {
  res.on('finish', () => {
    if (res.statusCode >= 400) return;
    const ctx = req.auditContext;
    if (!ctx) return;

    const payload = {
      salon_id: ctx.salonId,
      actor_id: ctx.actorId || (typeof req.header('x-user-id') === 'string' ? req.header('x-user-id') : null),
      actor_type: ctx.actorType || 'owner',
      entity_type: ctx.entityType,
      entity_id: ctx.entityId || null,
      action: ctx.action,
      before_state: ctx.before,
      after_state: ctx.after,
      diff: computeDiff(ctx.before, ctx.after),
      request_path: req.originalUrl,
      request_method: req.method,
    };

    setImmediate(() => {
      AuditLogRepository.create(payload).catch((err) => {
        logger.warn('[auditLogger] failed to persist audit log:', err?.message || err);
      });
    });
  });

  next();
}
