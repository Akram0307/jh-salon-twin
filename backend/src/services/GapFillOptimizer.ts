import { query } from '../config/db';
import { AppointmentRepository } from '../repositories/AppointmentRepository';
import type { AppointmentTimeRow } from '../types/serviceTypes';

export interface ScheduleGap {
  staffId: string;
  staffName: string;
  gapStart: Date;
  gapEnd: Date;
  durationMinutes: number;
  gapType: 'morning' | 'afternoon' | 'evening' | 'between_appointments';
}

export interface GapFillScore {
  slotTime: Date;
  staffId: string;
  gapFillScore: number; // 0-100
  gapReductionMinutes: number;
  utilizationImprovement: number;
}

export class GapFillOptimizer {
  /**
   * Identify schedule gaps for a specific staff member on a given date
   */
  static async identifyStaffGaps(
    staffId: string,
    salonId: string,
    date: string
  ): Promise<ScheduleGap[]> {
    // Get staff working hours for the day
    const hoursRes = await query(
      `SELECT start_time, end_time
       FROM staff_working_hours
       WHERE staff_id = $1
       AND salon_id = $2
       AND weekday = EXTRACT(DOW FROM $3::date)
       AND is_active = TRUE`,
      [staffId, salonId, date]
    );

    if (hoursRes.rows.length === 0) return [];

    const workStart = new Date(`${date}T${hoursRes.rows[0].start_time}`);
    const workEnd = new Date(`${date}T${hoursRes.rows[0].end_time}`);

    // Get appointments for the staff on that day
    const apptRes = await query(
      `SELECT appointment_time, end_time
       FROM appointments
       WHERE staff_id = $1
       AND salon_id = $2
       AND DATE(appointment_time) = $3
       AND status IN ('SCHEDULED', 'IN_PROGRESS')
       ORDER BY appointment_time ASC`,
      [staffId, salonId, date]
    );

    const appointments = apptRes.rows.map((r: AppointmentTimeRow) => ({
      start: new Date(r.appointment_time),
      end: new Date(r.end_time)
    }));

    const gaps: ScheduleGap[] = [];
    let currentTime = new Date(workStart);

    // Check for gap at start of day
    if (appointments.length === 0) {
      // Entire day is a gap
      gaps.push({
        staffId,
        staffName: '', // Will be filled later
        gapStart: workStart,
        gapEnd: workEnd,
        durationMinutes: (workEnd.getTime() - workStart.getTime()) / 60000,
        gapType: this.getTimeOfDayGap(workStart, workEnd)
      });
    } else {
      // Check gap before first appointment
      if (currentTime < appointments[0].start) {
        gaps.push({
          staffId,
          staffName: '',
          gapStart: currentTime,
          gapEnd: appointments[0].start,
          durationMinutes: (appointments[0].start.getTime() - currentTime.getTime()) / 60000,
          gapType: this.getTimeOfDayGap(currentTime, appointments[0].start)
        });
      }

      // Check gaps between appointments
      for (let i = 0; i < appointments.length - 1; i++) {
        const currentEnd = appointments[i].end;
        const nextStart = appointments[i + 1].start;

        if (currentEnd < nextStart) {
          gaps.push({
            staffId,
            staffName: '',
            gapStart: currentEnd,
            gapEnd: nextStart,
            durationMinutes: (nextStart.getTime() - currentEnd.getTime()) / 60000,
            gapType: 'between_appointments'
          });
        }
      }

      // Check gap after last appointment
      const lastAppointment = appointments[appointments.length - 1];
      if (lastAppointment.end < workEnd) {
        gaps.push({
          staffId,
          staffName: '',
          gapStart: lastAppointment.end,
          gapEnd: workEnd,
          durationMinutes: (workEnd.getTime() - lastAppointment.end.getTime()) / 60000,
          gapType: this.getTimeOfDayGap(lastAppointment.end, workEnd)
        });
      }
    }

    return gaps;
  }

  /**
   * Identify gaps for all staff in a salon on a given date
   */
  static async identifyAllStaffGaps(
    salonId: string,
    date: string
  ): Promise<ScheduleGap[]> {
    // Get all active staff
    const staffRes = await query(
      `SELECT id, full_name FROM staff WHERE salon_id = $1 AND is_active = TRUE`,
      [salonId]
    );

    const allGaps: ScheduleGap[] = [];

    for (const staff of staffRes.rows) {
      const gaps = await this.identifyStaffGaps(staff.id, salonId, date);
      gaps.forEach(gap => {
        gap.staffName = staff.full_name;
        allGaps.push(gap);
      });
    }

    return allGaps;
  }

  /**
   * Calculate gap fill score for a potential slot
   */
  static calculateGapFillScore(
    slotTime: Date,
    slotDurationMinutes: number,
    staffId: string,
    gaps: ScheduleGap[],
    totalWorkingMinutes: number
  ): GapFillScore {
    const slotEnd = new Date(slotTime.getTime() + slotDurationMinutes * 60000);
    let gapReductionMinutes = 0;
    let bestGapFit = 0;

    // Find gaps that this slot would fill
    for (const gap of gaps) {
      if (gap.staffId !== staffId) continue;

      // Check if slot fits within gap
      if (slotTime >= gap.gapStart && slotEnd <= gap.gapEnd) {
        // Perfect fit within gap
        gapReductionMinutes = slotDurationMinutes;
        bestGapFit = 100;
        break;
      }
      
      // Check if slot overlaps with gap
      const overlapStart = new Date(Math.max(slotTime.getTime(), gap.gapStart.getTime()));
      const overlapEnd = new Date(Math.min(slotEnd.getTime(), gap.gapEnd.getTime()));
      
      if (overlapStart < overlapEnd) {
        const overlapMinutes = (overlapEnd.getTime() - overlapStart.getTime()) / 60000;
        if (overlapMinutes > gapReductionMinutes) {
          gapReductionMinutes = overlapMinutes;
          bestGapFit = (overlapMinutes / slotDurationMinutes) * 100;
        }
      }
    }

    // Calculate utilization improvement
    const utilizationImprovement = totalWorkingMinutes > 0 
      ? (gapReductionMinutes / totalWorkingMinutes) * 100 
      : 0;

    // Final gap fill score (0-100)
    const gapFillScore = Math.min(100, bestGapFit * 0.7 + utilizationImprovement * 0.3);

    return {
      slotTime,
      staffId,
      gapFillScore,
      gapReductionMinutes,
      utilizationImprovement
    };
  }

  /**
   * Get gap fill scores for multiple slots
   */
  static async getGapFillScores(
    salonId: string,
    date: string,
    slots: { time: Date; staffId: string; durationMinutes: number }[]
  ): Promise<GapFillScore[]> {
    const gaps = await this.identifyAllStaffGaps(salonId, date);
    const scores: GapFillScore[] = [];

    // Calculate total working minutes per staff
    const staffWorkingMinutes: Record<string, number> = {};
    for (const gap of gaps) {
      if (!staffWorkingMinutes[gap.staffId]) {
        // Get working hours for this staff
        const hoursRes = await query(
          `SELECT start_time, end_time
           FROM staff_working_hours
           WHERE staff_id = $1
           AND salon_id = $2
           AND weekday = EXTRACT(DOW FROM $3::date)
           AND is_active = TRUE`,
          [gap.staffId, salonId, date]
        );

        if (hoursRes.rows.length > 0) {
          const start = new Date(`${date}T${hoursRes.rows[0].start_time}`);
          const end = new Date(`${date}T${hoursRes.rows[0].end_time}`);
          staffWorkingMinutes[gap.staffId] = (end.getTime() - start.getTime()) / 60000;
        } else {
          staffWorkingMinutes[gap.staffId] = 0;
        }
      }
    }

    // Calculate scores for each slot
    for (const slot of slots) {
      const score = this.calculateGapFillScore(
        slot.time,
        slot.durationMinutes,
        slot.staffId,
        gaps,
        staffWorkingMinutes[slot.staffId] || 0
      );
      scores.push(score);
    }

    return scores;
  }

  /**
   * Helper to determine gap type based on time of day
   */
  private static getTimeOfDayGap(start: Date, end: Date): 'morning' | 'afternoon' | 'evening' {
    const startHour = start.getHours();
    const endHour = end.getHours();
    const avgHour = (startHour + endHour) / 2;

    if (avgHour < 12) return 'morning';
    if (avgHour < 17) return 'afternoon';
    return 'evening';
  }
}
