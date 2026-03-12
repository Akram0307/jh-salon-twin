import { query } from '../config/db';

export type WorkingHoursInput = {
  salon_id: string;
  staff_id: string;
  weekday: number; // 0-6 (Sunday-Saturday)
  start_time: string; // HH:MM format
  end_time: string;   // HH:MM format
  is_active?: boolean;
};

export type StaffAvailabilitySummary = {
  staff_id: string;
  staff_name: string;
  weekday_count: number;
  missing_weekdays: number[];
};

/**
 * Repository for staff availability management
 * Handles working hours, breaks, and time-off
 */
export class StaffAvailabilityRepository {
  
  // Default salon operating hours (9 AM - 9 PM)
  static readonly DEFAULT_START_TIME = '09:00';
  static readonly DEFAULT_END_TIME = '21:00';
  static readonly WEEKDAYS = [0, 1, 2, 3, 4, 5, 6]; // Sunday-Saturday

  /**
   * Get working hours for a specific staff member on a specific weekday
   */
  static async getWorkingHours(
    salonId: string,
    staffId: string,
    weekday: number
  ) {
    const res = await query(
      `SELECT id, start_time, end_time, is_active, created_at, updated_at
       FROM staff_working_hours
       WHERE salon_id = $1 AND staff_id = $2 AND weekday = $3
       LIMIT 1`,
      [salonId, staffId, weekday]
    );
    return res.rows[0] || null;
  }

  /**
   * Get all working hours for a staff member
   */
  static async getAllWorkingHours(salonId: string, staffId: string) {
    const res = await query(
      `SELECT id, weekday, start_time, end_time, is_active, created_at, updated_at
       FROM staff_working_hours
       WHERE salon_id = $1 AND staff_id = $2
       ORDER BY weekday`,
      [salonId, staffId]
    );
    return res.rows;
  }

  /**
   * Create or update working hours for a specific weekday
   */
  static async upsertWorkingHours(data: WorkingHoursInput) {
    const res = await query(
      `INSERT INTO staff_working_hours 
       (salon_id, staff_id, weekday, start_time, end_time, is_active)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, true))
       ON CONFLICT (salon_id, staff_id, weekday) 
       DO UPDATE SET 
         start_time = EXCLUDED.start_time,
         end_time = EXCLUDED.end_time,
         is_active = EXCLUDED.is_active,
         updated_at = NOW()
       RETURNING *`,
      [data.salon_id, data.staff_id, data.weekday, data.start_time, data.end_time, data.is_active]
    );
    return res.rows[0];
  }

  /**
   * Seed default working hours for a staff member (all 7 days)
   * Uses salon default hours or provided defaults
   */
  static async seedDefaultWorkingHours(
    salonId: string,
    staffId: string,
    options?: {
      startTime?: string;
      endTime?: string;
      weekdays?: number[];
    }
  ) {
    const startTime = options?.startTime || this.DEFAULT_START_TIME;
    const endTime = options?.endTime || this.DEFAULT_END_TIME;
    const weekdays = options?.weekdays || this.WEEKDAYS;

    const results = [];
    for (const weekday of weekdays) {
      const result = await this.upsertWorkingHours({
        salon_id: salonId,
        staff_id: staffId,
        weekday,
        start_time: startTime,
        end_time: endTime,
        is_active: true
      });
      results.push(result);
    }
    return results;
  }

  /**
   * Check if a staff member has complete working hours (all 7 days)
   */
  static async hasCompleteWorkingHours(salonId: string, staffId: string): Promise<boolean> {
    const res = await query(
      `SELECT COUNT(DISTINCT weekday) as day_count
       FROM staff_working_hours
       WHERE salon_id = $1 AND staff_id = $2 AND is_active = true`,
      [salonId, staffId]
    );
    return parseInt(res.rows[0]?.day_count || '0') === 7;
  }

  /**
   * Get availability summary for all staff in a salon
   * Shows which staff have incomplete working hours
   */
  static async getAvailabilitySummary(salonId: string): Promise<StaffAvailabilitySummary[]> {
    const res = await query(
      `SELECT 
         s.id as staff_id,
         s.full_name as staff_name,
         COUNT(wh.weekday) as weekday_count,
         ARRAY_AGG(wh.weekday ORDER BY wh.weekday) as present_weekdays
       FROM staff s
       LEFT JOIN staff_working_hours wh 
         ON s.id = wh.staff_id 
         AND wh.salon_id = s.salon_id 
         AND wh.is_active = true
       WHERE s.salon_id = $1 AND s.is_active = true
       GROUP BY s.id, s.full_name
       ORDER BY s.full_name`,
      [salonId]
    );

    return res.rows.map(row => {
      const presentWeekdays = row.present_weekdays?.filter((w: number | null) => w !== null) || [];
      const missingWeekdays = this.WEEKDAYS.filter(w => !presentWeekdays.includes(w));
      return {
        staff_id: row.staff_id,
        staff_name: row.staff_name,
        weekday_count: parseInt(row.weekday_count),
        missing_weekdays: missingWeekdays
      };
    });
  }

  /**
   * Auto-seed working hours for all staff missing availability data
   * Returns summary of actions taken
   */
  static async autoSeedMissingAvailability(
    salonId: string,
    options?: {
      startTime?: string;
      endTime?: string;
    }
  ): Promise<{
    seeded: Array<{ staff_id: string; staff_name: string; days_added: number }>;
    already_complete: Array<{ staff_id: string; staff_name: string }>;
  }> {
    const summary = await this.getAvailabilitySummary(salonId);
    
    const seeded = [];
    const alreadyComplete = [];

    for (const staff of summary) {
      if (staff.missing_weekdays.length === 0) {
        alreadyComplete.push({
          staff_id: staff.staff_id,
          staff_name: staff.staff_name
        });
      } else {
        await this.seedDefaultWorkingHours(salonId, staff.staff_id, {
          startTime: options?.startTime,
          endTime: options?.endTime,
          weekdays: staff.missing_weekdays
        });
        seeded.push({
          staff_id: staff.staff_id,
          staff_name: staff.staff_name,
          days_added: staff.missing_weekdays.length
        });
      }
    }

    return { seeded, already_complete: alreadyComplete };
  }

  /**
   * Delete working hours for a staff member (useful for cleanup)
   */
  static async deleteWorkingHours(salonId: string, staffId: string, weekday?: number) {
    if (weekday !== undefined) {
      await query(
        `DELETE FROM staff_working_hours 
         WHERE salon_id = $1 AND staff_id = $2 AND weekday = $3`,
        [salonId, staffId, weekday]
      );
    } else {
      await query(
        `DELETE FROM staff_working_hours 
         WHERE salon_id = $1 AND staff_id = $2`,
        [salonId, staffId]
      );
    }
  }

  /**
   * Get staff breaks for a specific weekday
   */
  static async getBreaks(salonId: string, staffId: string, weekday: number) {
    const res = await query(
      `SELECT id, start_time, end_time, created_at
       FROM staff_breaks
       WHERE salon_id = $1 AND staff_id = $2 AND weekday = $3
       ORDER BY start_time`,
      [salonId, staffId, weekday]
    );
    return res.rows;
  }

  /**
   * Add a break for a staff member
   */
  static async addBreak(
    salonId: string,
    staffId: string,
    weekday: number,
    startTime: string,
    endTime: string
  ) {
    const res = await query(
      `INSERT INTO staff_breaks (salon_id, staff_id, weekday, start_time, end_time)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [salonId, staffId, weekday, startTime, endTime]
    );
    return res.rows[0];
  }
}
