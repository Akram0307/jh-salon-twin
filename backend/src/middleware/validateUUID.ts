import { Request, Response, NextFunction } from 'express'

const uuidRegex = /^[0-9a-fA-F-]{36}$/

function check(value?: string) {
  if (!value) return true
  return uuidRegex.test(value)
}

export function validateUUID(req: Request, res: Response, next: NextFunction) {
  const merged = { ...req.params, ...req.query, ...req.body } as Record<string, string | string[] | undefined>;
  const salon_id = typeof merged.salon_id === 'string' ? merged.salon_id : undefined;
  const service_id = typeof merged.service_id === 'string' ? merged.service_id : undefined;
  const client_id = typeof merged.client_id === 'string' ? merged.client_id : undefined;

  if (!check(salon_id) || !check(service_id) || !check(client_id)) {
    return res.status(400).json({ error: 'Invalid UUID' })
  }

  next()
}
