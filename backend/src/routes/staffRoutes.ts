import { Router } from 'express';
import { z } from 'zod';
import { StaffRepository } from '../repositories/StaffRepository';
import { query } from '../config/db';

import logger from '../config/logger';

const router = Router();
const SALON_ID = process.env.SALON_ID || 'b0dcbd9e-1ca0-450e-a299-7ad239f848f4';

const ok = (data: unknown, meta: Record<string, unknown> = {}) => ({
  success: true,
  data,
  meta: {
    salon_id: SALON_ID,
    ...meta,
  },
});

const fail = (message: string, details?: unknown, error?: string) => ({
  success: false,
  data: null,
  error: error || message,
  message,
  ...(details !== undefined ? { details } : {}),
});

const normalizeOptionalString = (value: unknown) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const emailSchema = z.string().trim().email('email must be a valid email address').transform((value) => value.toLowerCase());

const staffCreateSchema = z.object({
  full_name: z.string().trim().min(2, 'full_name must be at least 2 characters').max(120),
  email: emailSchema,
  phone_number: z.preprocess(
    normalizeOptionalString,
    z.string().trim().min(7, 'phone_number must be at least 7 characters').max(32).nullable().optional()
  ),
  role: z.preprocess(
    normalizeOptionalString,
    z.string().trim().min(2, 'role must be at least 2 characters').max(60).nullable().optional()
  ),
  is_active: z.boolean().optional(),
});

const staffUpdateSchema = z.object({
  full_name: z.string().trim().min(2, 'full_name must be at least 2 characters').max(120).optional(),
  email: emailSchema.optional(),
  phone_number: z.preprocess(
    normalizeOptionalString,
    z.string().trim().min(7, 'phone_number must be at least 7 characters').max(32).nullable().optional()
  ),
  role: z.preprocess(
    normalizeOptionalString,
    z.string().trim().min(2, 'role must be at least 2 characters').max(60).nullable().optional()
  ),
  is_active: z.boolean().optional(),
}).refine((payload) => Object.keys(payload).length > 0, {
  message: 'At least one field is required to update staff',
});

const normalizeStaffRecord = (staff: any) => {
  if (!staff) return staff;
  return {
    ...staff,
    updated_at: staff.updated_at || null,
  };
};

const detectDuplicateStaff = async (
  payload: { email?: string; phone_number?: string | null },
  excludeId?: string
) => {
  if (payload.email) {
    const params: unknown[] = [SALON_ID, payload.email];
    let sql = 'SELECT id FROM staff WHERE salon_id = $1 AND LOWER(email) = LOWER($2)';
    if (excludeId) {
      params.push(excludeId);
      sql += ' AND id <> $3';
    }
    sql += ' LIMIT 1';
    const emailResult = await query(sql, params);
    if (emailResult.rows[0]) return 'A staff member with this email already exists';
  }

  if (payload.phone_number) {
    const params: unknown[] = [SALON_ID, payload.phone_number];
    let sql = 'SELECT id FROM staff WHERE salon_id = $1 AND phone_number = $2';
    if (excludeId) {
      params.push(excludeId);
      sql += ' AND id <> $3';
    }
    sql += ' LIMIT 1';
    const phoneResult = await query(sql, params);
    if (phoneResult.rows[0]) return 'A staff member with this phone number already exists';
  }

  return null;
};

router.get('/', async (req, res) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : 'active';
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const role = typeof req.query.role === 'string' ? req.query.role : undefined;

    const filters = {
      is_active: status === 'active' ? true : status === 'archived' ? false : undefined,
      search,
      role,
    };

    const staff = await StaffRepository.findAll(SALON_ID, filters);
    res.json(ok(staff.map(normalizeStaffRecord), { count: staff.length, status, search: search || null, role: role || null }));
  } catch (err) {
    logger.error(err);
    res.status(500).json(fail('Failed to fetch staff'));
  }
});

router.post('/', async (req, res) => {
  try {
    const parsed = staffCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(fail('Invalid staff payload', parsed.error.flatten()));
    }

    const duplicateError = await detectDuplicateStaff(parsed.data);
    if (duplicateError) {
      return res.status(409).json(fail(duplicateError));
    }

    const staff = await StaffRepository.create({ ...parsed.data, salon_id: SALON_ID });
    res.status(201).json(ok(normalizeStaffRecord(staff), { updated_at: staff?.updated_at || null }));
  } catch (err) {
    logger.error(err);
    res.status(500).json(fail('Failed to create staff'));
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await StaffRepository.findById(req.params.id, SALON_ID);
    if (!existing) {
      return res.status(404).json(fail('Staff member not found'));
    }

    const parsed = staffUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(fail('Invalid staff payload', parsed.error.flatten()));
    }

    const duplicateError = await detectDuplicateStaff(parsed.data, req.params.id);
    if (duplicateError) {
      return res.status(409).json(fail(duplicateError));
    }

    const staff = await StaffRepository.update(req.params.id, parsed.data, SALON_ID);
    if (!staff) {
      return res.status(404).json(fail('Staff member not found'));
    }

    res.json(ok(normalizeStaffRecord(staff), { updated_at: staff.updated_at || null }));
  } catch (err) {
    logger.error(err);
    res.status(500).json(fail('Failed to update staff'));
  }
});

router.get('/schedule', async (_req, res) => {
  try {
    const result = await query(
      `SELECT
        s.id,
        s.full_name AS name,
        s.role,
        s.is_active,
        CASE
          WHEN EXISTS (
            SELECT 1 FROM appointments a
            WHERE a.staff_id = s.id
              AND a.status IN ('scheduled','arrived','in_progress','SCHEDULED','ARRIVED','IN_PROGRESS')
              AND a.appointment_time <= NOW()
              AND a.appointment_time + interval '1 hour' > NOW()
          ) THEN false
          ELSE true
        END AS is_available,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'weekday', b.weekday,
                'start_time', to_char(b.start_time, 'HH24:MI'),
                'end_time', to_char(b.end_time, 'HH24:MI')
              )
            )
            FROM staff_breaks b
            WHERE b.staff_id = s.id AND b.salon_id = $1
          ),
          '[]'::json
        ) AS break_times
      FROM staff s
      WHERE s.salon_id = $1
      ORDER BY s.full_name`,
      [SALON_ID]
    );

    res.json(ok(result.rows, { count: result.rows.length }));
  } catch (err) {
    logger.error(err);
    res.status(500).json(fail('Failed to fetch staff schedule'));
  }
});

export default router;
