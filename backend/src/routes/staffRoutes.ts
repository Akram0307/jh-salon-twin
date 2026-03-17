import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { staffCreateRouteSchema, staffUpdateRouteSchema } from '../schemas/staff';
import { StaffRepository } from '../repositories/StaffRepository';
import { query } from '../config/db';

import logger from '../config/logger';

const router = Router();
router.use(authenticate);
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

router.post('/', validate(staffCreateRouteSchema), async (req, res) => {
  try {
    const duplicateError = await detectDuplicateStaff(req.body);
    if (duplicateError) {
      return res.status(409).json(fail(duplicateError));
    }

    const staff = await StaffRepository.create({ ...req.body, salon_id: SALON_ID });
    res.status(201).json(ok(normalizeStaffRecord(staff), { updated_at: staff?.updated_at || null }));
  } catch (err) {
    logger.error(err);
    res.status(500).json(fail('Failed to create staff'));
  }
});

router.put('/:id', validate(staffUpdateRouteSchema), async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const existing = await StaffRepository.findById(id, SALON_ID);
    if (!existing) {
      return res.status(404).json(fail('Staff member not found'));
    }

    const duplicateError = await detectDuplicateStaff(req.body, id);
    if (duplicateError) {
      return res.status(409).json(fail(duplicateError));
    }

    const staff = await StaffRepository.update(id, req.body, SALON_ID);
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
