import { Request, Response, NextFunction } from 'express'

const uuidRegex = /^[0-9a-fA-F-]{36}$/

function check(value?: string) {
  if (!value) return true
  return uuidRegex.test(value)
}

export function validateUUID(req: Request, res: Response, next: NextFunction) {
  const { salon_id, service_id, client_id } = { ...req.params, ...req.query, ...req.body } as any

  if (!check(salon_id) || !check(service_id) || !check(client_id)) {
    return res.status(400).json({ error: 'Invalid UUID' })
  }

  next()
}
