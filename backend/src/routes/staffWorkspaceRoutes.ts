import { Router } from 'express';
import { z } from 'zod';
import { query } from '../config/db';
import { validateUUID } from '../middleware/validateUUID';

import { AppointmentRepository } from '../repositories/AppointmentRepository';
import { StaffRepository } from '../repositories/StaffRepository';

import logger from '../config/logger';
const log = logger.child({ module: 'staff_workspace_routes' });

const router = Router();
const SALON_ID = process.env.SALON_ID || 'b0dcbd9e-1ca0-450e-a299-7ad239f848f4';

// Apply UUID validation middleware
router.use(validateUUID);

// Helper function for consistent response format
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

// 1. GET /api/staff/schedule - Get staff's daily schedule with client details
router.get('/schedule', async (req, res) => {
  try {
    const staffId = req.query.staffId as string;
    const date = req.query.date as string;
    
    if (!staffId || !date) {
      return res.status(400).json(fail('staffId and date are required'));
    }
    
    const result = await query(
      `SELECT 
        a.id,
        a.appointment_time,
        a.status,
        c.full_name as client_name,
        c.phone_number as client_phone,
        c.photo_url as client_photo,
        c.preferences as client_preferences,
        s.name as service_name,
        s.duration_minutes,
        s.price
       FROM appointments a
       JOIN clients c ON a.client_id = c.id
       LEFT JOIN appointment_services aps ON a.id = aps.appointment_id
       LEFT JOIN services s ON aps.service_id = s.id
       WHERE a.staff_id = $1 
         AND DATE(a.appointment_time) = $2
         AND a.salon_id = $3
       ORDER BY a.appointment_time ASC`,
      [staffId, date, SALON_ID]
    );
    
    res.json(ok(result.rows, { count: result.rows.length, date, staff_id: staffId }));
  } catch (err) {
    log.error(err);
    res.status(500).json(fail('Failed to fetch staff schedule'));
  }
});

// 2. GET /api/staff/earnings - Get earnings breakdown (daily/weekly/monthly)
router.get('/earnings', async (req, res) => {
  try {
    const staffId = req.query.staffId as string;
    const period = req.query.period as 'daily' | 'weekly' | 'monthly' || 'weekly';
    
    if (!staffId) {
      return res.status(400).json(fail('staffId is required'));
    }
    
    let dateFilter = '';
    let groupBy = '';
    let selectDate = '';
    
    switch (period) {
      case 'daily':
        dateFilter = "DATE(a.appointment_time) = CURRENT_DATE";
        groupBy = "DATE(a.appointment_time)";
        selectDate = "TO_CHAR(DATE(a.appointment_time), 'YYYY-MM-DD') as period";
        break;
      case 'weekly':
        dateFilter = "a.appointment_time >= DATE_TRUNC('week', CURRENT_DATE)";
        groupBy = "DATE_TRUNC('week', a.appointment_time)";
        selectDate = "TO_CHAR(DATE_TRUNC('week', a.appointment_time), 'YYYY-MM-DD') as period";
        break;
      case 'monthly':
        dateFilter = "a.appointment_time >= DATE_TRUNC('month', CURRENT_DATE)";
        groupBy = "DATE_TRUNC('month', a.appointment_time)";
        selectDate = "TO_CHAR(DATE_TRUNC('month', a.appointment_time), 'YYYY-MM-DD') as period";
        break;
      default:
        return res.status(400).json(fail('Invalid period. Use daily, weekly, or monthly'));
    }
    
    const result = await query(
      `SELECT 
        ${selectDate},
        COUNT(DISTINCT a.id) as total_appointments,
        SUM(s.price) as gross_revenue,
        SUM(s.price * 0.6) as net_earnings, -- Assuming 60% commission rate
        AVG(s.price) as average_ticket
       FROM appointments a
       JOIN appointment_services aps ON a.id = aps.appointment_id
       JOIN services s ON aps.service_id = s.id
       WHERE a.staff_id = $1 
         AND ${dateFilter}
         AND a.salon_id = $2
         AND a.status IN ('completed', 'COMPLETED')
       GROUP BY ${groupBy}
       ORDER BY period DESC`,
      [staffId, SALON_ID]
    );
    
    // Calculate week-over-week comparison for weekly period
    let comparison = null;
    if (period === 'weekly' && result.rows.length > 0) {
      const currentWeek = result.rows[0];
      const previousWeekResult = await query(
        `SELECT 
          SUM(s.price) as gross_revenue,
          SUM(s.price * 0.6) as net_earnings
         FROM appointments a
         JOIN appointment_services aps ON a.id = aps.appointment_id
         JOIN services s ON aps.service_id = s.id
         WHERE a.staff_id = $1 
           AND a.appointment_time >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '7 days'
           AND a.appointment_time < DATE_TRUNC('week', CURRENT_DATE)
           AND a.salon_id = $2
           AND a.status IN ('completed', 'COMPLETED')`,
        [staffId, SALON_ID]
      );
      
      if (previousWeekResult.rows.length > 0) {
        const previousWeek = previousWeekResult.rows[0];
        comparison = {
          gross_revenue_change: currentWeek.gross_revenue - (previousWeek.gross_revenue || 0),
          net_earnings_change: currentWeek.net_earnings - (previousWeek.net_earnings || 0),
        };
      }
    }
    
    res.json(ok({
      earnings: result.rows,
      period,
      staff_id: staffId,
      comparison,
    }));
  } catch (err) {
    log.error(err);
    res.status(500).json(fail('Failed to fetch earnings'));
  }
});

// Validation schema for availability update
const availabilitySchema = z.object({
  staffId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  isAvailable: z.boolean(),
});

// 3. PUT /api/staff/availability - Update availability slots
router.put('/availability', async (req, res) => {
  try {
    const parsed = availabilitySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(fail('Invalid availability data', parsed.error.flatten()));
    }
    
    const { staffId, dayOfWeek, startTime, endTime, isAvailable } = parsed.data;
    
    // Check if staff exists
    const staff = await StaffRepository.findById(staffId, SALON_ID);
    if (!staff) {
      return res.status(404).json(fail('Staff member not found'));
    }
    
    // Update or create availability
    const result = await query(
      `INSERT INTO staff_working_hours (staff_id, salon_id, weekday, start_time, end_time, capacity)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (staff_id, salon_id, weekday) 
       DO UPDATE SET start_time = $4, end_time = $5, capacity = $6
       RETURNING *`,
      [staffId, SALON_ID, dayOfWeek, startTime, endTime, isAvailable ? 1 : 0]
    );
    
    res.json(ok(result.rows[0], { message: 'Availability updated successfully' }));
  } catch (err) {
    log.error(err);
    res.status(500).json(fail('Failed to update availability'));
  }
});

// 4. GET /api/staff/availability - Get current availability
router.get('/availability', async (req, res) => {
  try {
    const staffId = req.query.staffId as string;
    
    if (!staffId) {
      return res.status(400).json(fail('staffId is required'));
    }
    
    const result = await query(
      `SELECT 
        weekday,
        TO_CHAR(start_time, 'HH24:MI') as start_time,
        TO_CHAR(end_time, 'HH24:MI') as end_time,
        capacity > 0 as is_available
       FROM staff_working_hours
       WHERE staff_id = $1 AND salon_id = $2
       ORDER BY weekday`,
      [staffId, SALON_ID]
    );
    
    res.json(ok(result.rows, { count: result.rows.length, staff_id: staffId }));
  } catch (err) {
    log.error(err);
    res.status(500).json(fail('Failed to fetch availability'));
  }
});

// Validation schema for time-off request
const timeoffSchema = z.object({
  staffId: z.string().uuid(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  reason: z.string().min(1).max(500),
});

// 5. POST /api/staff/timeoff - Submit time-off request
router.post('/timeoff', async (req, res) => {
  try {
    const parsed = timeoffSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(fail('Invalid time-off request', parsed.error.flatten()));
    }
    
    const { staffId, startDate, endDate, reason } = parsed.data;
    
    // Check if staff exists
    const staff = await StaffRepository.findById(staffId, SALON_ID);
    if (!staff) {
      return res.status(404).json(fail('Staff member not found'));
    }
    
    // Create time-off request
    const result = await query(
      `INSERT INTO staff_timeoff_requests (staff_id, salon_id, start_date, end_date, reason, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [staffId, SALON_ID, startDate, endDate, reason]
    );
    
    res.status(201).json(ok(result.rows[0], { message: 'Time-off request submitted successfully' }));
  } catch (err) {
    log.error(err);
    res.status(500).json(fail('Failed to submit time-off request'));
  }
});

// 6. GET /api/staff/timeoff - Get time-off request history
router.get('/timeoff', async (req, res) => {
  try {
    const staffId = req.query.staffId as string;
    
    if (!staffId) {
      return res.status(400).json(fail('staffId is required'));
    }
    
    const result = await query(
      `SELECT 
        id,
        start_date,
        end_date,
        reason,
        status,
        created_at,
        updated_at
       FROM staff_timeoff_requests
       WHERE staff_id = $1 AND salon_id = $2
       ORDER BY created_at DESC`,
      [staffId, SALON_ID]
    );
    
    res.json(ok(result.rows, { count: result.rows.length, staff_id: staffId }));
  } catch (err) {
    log.error(err);
    res.status(500).json(fail('Failed to fetch time-off requests'));
  }
});

// 7. GET /api/staff/performance - Get performance stats (utilization, avg ticket)
router.get('/performance', async (req, res) => {
  try {
    const staffId = req.query.staffId as string;
    const period = req.query.period as 'weekly' | 'monthly' || 'weekly';
    
    if (!staffId) {
      return res.status(400).json(fail('staffId is required'));
    }
    
    let dateFilter = '';
    if (period === 'weekly') {
      dateFilter = "a.appointment_time >= DATE_TRUNC('week', CURRENT_DATE)";
    } else if (period === 'monthly') {
      dateFilter = "a.appointment_time >= DATE_TRUNC('month', CURRENT_DATE)";
    }
    
    // Calculate utilization (booked hours / available hours)
    const utilizationResult = await query(
      `SELECT 
        COALESCE(SUM(EXTRACT(EPOCH FROM (a.appointment_time + (s.duration_minutes || ' minutes')::interval - a.appointment_time)) / 3600), 0) as booked_hours,
        COALESCE(
          (SELECT SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600)
           FROM staff_working_hours
           WHERE staff_id = $1 AND salon_id = $2 AND capacity > 0), 0
        ) as available_hours
       FROM appointments a
       JOIN appointment_services aps ON a.id = aps.appointment_id
       JOIN services s ON aps.service_id = s.id
       WHERE a.staff_id = $1 
         AND ${dateFilter}
         AND a.salon_id = $2
         AND a.status IN ('completed', 'COMPLETED')`,
      [staffId, SALON_ID]
    );
    
    const utilization = utilizationResult.rows[0];
    const utilizationRate = utilization.available_hours > 0 
      ? (utilization.booked_hours / utilization.available_hours) * 100 
      : 0;
    
    // Calculate average ticket
    const avgTicketResult = await query(
      `SELECT 
        AVG(s.price) as average_ticket,
        COUNT(DISTINCT a.id) as total_appointments
       FROM appointments a
       JOIN appointment_services aps ON a.id = aps.appointment_id
       JOIN services s ON aps.service_id = s.id
       WHERE a.staff_id = $1 
         AND ${dateFilter}
         AND a.salon_id = $2
         AND a.status IN ('completed', 'COMPLETED')`,
      [staffId, SALON_ID]
    );
    
    const avgTicket = avgTicketResult.rows[0];
    
    res.json(ok({
      utilization_rate: Math.round(utilizationRate * 100) / 100,
      booked_hours: Math.round(utilization.booked_hours * 100) / 100,
      available_hours: Math.round(utilization.available_hours * 100) / 100,
      average_ticket: Math.round((avgTicket.average_ticket || 0) * 100) / 100,
      total_appointments: parseInt(avgTicket.total_appointments) || 0,
      period,
      staff_id: staffId,
    }));
  } catch (err) {
    log.error(err);
    res.status(500).json(fail('Failed to fetch performance stats'));
  }
});

export default router;
