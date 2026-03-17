import { query, pool } from '../config/db';
import { WaitlistWorker } from '../services/WaitlistWorker';
import * as crypto from 'crypto';

export class AppointmentRepository {


  static async findAll() {
    const res = await query(`
      SELECT
        a.*,
        c.full_name as client_name,
        st.full_name as staff_name,
        COALESCE(
          json_agg(
            json_build_object(
              'service_id', s.id,
              'service_name', s.name,
              'base_price', aps.base_price,
              'charged_price', aps.charged_price
            )
          ) FILTER (WHERE s.id IS NOT NULL), '[]'
        ) as services
      FROM appointments a
      JOIN clients c ON a.client_id = c.id
      LEFT JOIN staff st ON a.staff_id = st.id
      LEFT JOIN appointment_services aps ON a.id = aps.appointment_id
      LEFT JOIN services s ON aps.service_id = s.id
      GROUP BY a.id, c.full_name, st.full_name
      ORDER BY a.appointment_time DESC
    `);

    return res.rows;
  }

  static async create(appointment: {
    salon_id: string;
    client_id: string;
    staff_id?: string;
    appointment_time: string;
    status?: string;
    services: { service_id: string; base_price: number; charged_price?: number }[];
  }) {

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const qrToken = crypto.randomUUID();
      const status = appointment.status || 'SCHEDULED';

      const apptRes = await client.query(
        `INSERT INTO appointments
        (salon_id, client_id, staff_id, appointment_time, status, qr_token)
        VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING *`,
        [
          appointment.salon_id,
          appointment.client_id,
          appointment.staff_id || null,
          appointment.appointment_time,
          status,
          qrToken
        ]
      );

      const appointmentRow = apptRes.rows[0];

      for (const service of appointment.services) {
        await client.query(
          `INSERT INTO appointment_services
           (appointment_id, service_id, base_price, charged_price)
           VALUES ($1,$2,$3,$4)`,
          [
            appointmentRow.id,
            service.service_id,
            service.base_price,
            service.charged_price || service.base_price
          ]
        );
      }

      await client.query('COMMIT');

      return appointmentRow;

    } catch (err: any) {
      await client.query('ROLLBACK');
      // S5-C3: Catch double-booking unique violation (23505)
      if (err?.code === '23505') {
        const conflictErr = new Error('Time slot is already booked for this staff member') as any;
        conflictErr.statusCode = 409;
        conflictErr.code = 'DOUBLE_BOOKING';
        throw conflictErr;
      }
      throw err;
    } finally {
      client.release();
    }
  }

  static async updateStatus(id: string, status: string) {
    // S5-C4: Wrap UPDATE + slot_event INSERT in a single transaction
    const normalized = status.toUpperCase();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const res = await client.query(
        `UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *`,
        [normalized, id]
      );

      const appointment = res.rows[0];

      if (normalized === 'CANCELLED' && appointment) {
        const slotEventRes = await client.query(
          `INSERT INTO slot_events (salon_id, event_type, slot_time, processed)
           SELECT salon_id, 'CANCELLED', appointment_time, false
           FROM appointments WHERE id = $1 RETURNING id`,
          [id]
        );
        const slotEventId = slotEventRes.rows[0]?.id;
        const slotTime = appointment.appointment_time;
        // Store for enqueue after commit
        (appointment as any)._slotEventId = slotEventId;
        (appointment as any)._slotTime = slotTime;
      }

      await client.query('COMMIT');

      // Enqueue waitlist processing after successful commit
      if ((appointment as any)._slotEventId) {
        WaitlistWorker.enqueueSlotEvent(
          (appointment as any)._slotEventId,
          (appointment as any)._slotTime,
        );
      }

      return appointment;

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async updateServicePrice(
    appointment_id: string,
    service_id: string,
    charged_price: number
  ) {

    const res = await query(
      `UPDATE appointment_services
       SET charged_price = $1
       WHERE appointment_id = $2 AND service_id = $3
       RETURNING *`,
      [charged_price, appointment_id, service_id]
    );

    return res.rows[0];
  }

  static async rescheduleAppointment(id: string, newStartTime: string) {

    const res = await query(
      `UPDATE appointments
       SET appointment_time = $1
       WHERE id = $2
       RETURNING *`,
      [newStartTime, id]
    );

    return res.rows[0];
  }

  static async findUpcomingByClient(client_id: string) {

    const res = await query(
      `SELECT * FROM appointments
       WHERE client_id = $1
       AND status = 'SCHEDULED'
       AND appointment_time > NOW()
       ORDER BY appointment_time ASC
       LIMIT 1`,
      [client_id]
    );

    return res.rows[0] || null;
  }

  static async checkAvailability(opts: { staff_id: string; date: string }) {
    const { staff_id, date } = opts;

    const res = await query(
      `SELECT appointment_time
       FROM appointments
       WHERE staff_id = $1
       AND DATE(appointment_time) = $2
       AND status = 'SCHEDULED'`,
      [staff_id, date]
    );

    const booked = res.rows.map((r: any) => new Date(r.appointment_time).toISOString());

    const slots = ["11:00","13:00","16:00"];

    const available = slots.filter((s) => !booked.find((b: string) => b.includes(s)));

    // S5-M2: Fix broken Date constructor - properly combine date + slot time
    return available.map((t) => ({
      start_time: new Date(`${date}T${t}:00`).toISOString()
    }));
  }

  static async findByQrToken(token: string) {
    const res = await query(
      `SELECT * FROM appointments WHERE qr_token = $1 LIMIT 1`,
      [token]
    );

    return res.rows[0] || null;
  }

  static async addService(
    appointment_id: string,
    service_id: string,
    base_price: number,
    charged_price: number
  ) {
    const res = await query(
      `INSERT INTO appointment_services (appointment_id, service_id, base_price, charged_price)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [appointment_id, service_id, base_price, charged_price]
    );

    return res.rows[0];
  }

  // Client service history for AI rebooking + revenue brain
  static async getClientServiceHistory(clientId: string, salonId: string) {

    const result = await query(`
      SELECT appointment_date, service_id
      FROM appointments
      WHERE client_id = $1
      AND salon_id = $2
      AND status = 'completed'
      ORDER BY appointment_date ASC
    `, [clientId, salonId])

    return result.rows
  }

  // Added for client booking routes - find appointment by ID and salon
  static async findById(id: string, salonId: string) {
    const res = await query(
      `SELECT
        a.*,
        c.full_name as client_name,
        c.phone_number as client_phone,
        st.full_name as staff_name
       FROM appointments a
       JOIN clients c ON a.client_id = c.id
       LEFT JOIN staff st ON a.staff_id = st.id
       WHERE a.id = $1 AND a.salon_id = $2
       LIMIT 1`,
      [id, salonId]
    );
    return res.rows[0] || null;
  }

  static async getAppointmentRevenue(appointmentId: string) {
    const res = await query(
      `SELECT id, appointment_id, base_price, charged_price
       FROM appointment_services
       WHERE appointment_id = $1
       LIMIT 1`,
      [appointmentId]
    );
    return res.rows[0] || null;
  }

  static async getTotalRevenue(startDate: string, endDate: string) {
    const res = await query(
      `SELECT 
          COALESCE(SUM(aps.charged_price), 0) as total,
          COUNT(DISTINCT a.id) as count
       FROM appointments a
       JOIN appointment_services aps ON a.id = aps.appointment_id
       WHERE a.appointment_time BETWEEN $1 AND $2`,
      [startDate, endDate]
    );
    return res.rows[0];
  }

  static async getRevenueByService(startDate: string, endDate: string) {
    const res = await query(
      `SELECT 
          s.name as service_name,
          SUM(aps.charged_price) as total,
          COUNT(aps.id) as count
       FROM appointment_services aps
       JOIN appointments a ON aps.appointment_id = a.id
       JOIN services s ON aps.service_id = s.id
       WHERE a.appointment_time BETWEEN $1 AND $2
       GROUP BY s.name`,
      [startDate, endDate]
    );
    return res.rows;
  }
}
