import { query } from '../config/db';

const uuidRegex = /^[0-9a-fA-F-]{36}$/;

export class SlotGenerator {

  static async getAvailableSlots(
    salon_id: string,
    service_id: string,
    date: string
  ) {

    if (!uuidRegex.test(salon_id) || !uuidRegex.test(service_id)) {
      console.warn('Invalid UUID passed to SlotGenerator');
      return [];
    }

    const serviceRes = await query(
      `SELECT id, duration_minutes FROM services WHERE id = $1 AND salon_id = $2`,
      [service_id, salon_id]
    );

    if (serviceRes.rows.length === 0) return [];

    const duration = serviceRes.rows[0].duration_minutes;

    const capacityRes = await query(
      `SELECT men_chairs, women_chairs, unisex_chairs
       FROM salon_capacity
       WHERE salon_id = $1`,
      [salon_id]
    );

    const cap = capacityRes.rows[0];
    const totalChairs = (cap?.men_chairs || 0) + (cap?.women_chairs || 0) + (cap?.unisex_chairs || 0);

    const staffRes = await query(
      `SELECT s.id, s.full_name
       FROM staff s
       JOIN service_staff ss ON ss.staff_id = s.id
       WHERE ss.service_id = $1 AND ss.salon_id = $2`,
      [service_id, salon_id]
    );

    const staffList = staffRes.rows;
    const slots: any[] = [];

    const apptRes = await query(
      `SELECT appointment_time, end_time, staff_id
       FROM appointments
       WHERE salon_id = $1
       AND DATE(appointment_time) = $2
       AND status IN ('SCHEDULED','IN_PROGRESS')`,
      [salon_id, date]
    );

    for (const staff of staffList) {

      const hoursRes = await query(
        `SELECT start_time, end_time
         FROM staff_working_hours
         WHERE staff_id = $1
         AND salon_id = $2
         AND weekday = EXTRACT(DOW FROM $3::date)
         AND is_active = TRUE`,
        [staff.id, salon_id, date]
      );

      if (hoursRes.rows.length === 0) continue;

      const start = new Date(`${date}T${hoursRes.rows[0].start_time}`);
      const end = new Date(`${date}T${hoursRes.rows[0].end_time}`);

      let current = new Date(start);

      while (current.getTime() + duration * 60000 <= end.getTime()) {

        const slotStart = current.getTime();
        const slotEnd = slotStart + duration * 60000;

        let concurrent = 0;

        for (const a of apptRes.rows) {
          const aStart = new Date(a.appointment_time).getTime();
          const aEnd = new Date(a.end_time).getTime();

          if (slotStart < aEnd && slotEnd > aStart) {
            concurrent++;
          }
        }

        if (concurrent < totalChairs) {
          slots.push({
            staff_id: staff.id,
            staff_name: staff.full_name,
            time: current.toISOString()
          });
        }

        current = new Date(current.getTime() + 10 * 60000);
      }
    }

    return slots.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }
}
