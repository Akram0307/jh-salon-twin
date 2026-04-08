import { query } from '../config/db';
import logger from '../config/logger';

const log = logger.child({ module: 'ai_revenue_brain' });

// ─── Return-type contracts (extended but backward-compatible) ───

export interface TrendPoint {
  weekLabel: string;
  weekStart: string;
  bookingCount: number;
  revenue: number;
}

export interface PeakSlot {
  dayOfWeek: number;   // 0=Sun .. 6=Sat
  hour: number;        // 0-23
  bookingDensity: number;
  label: string;
}

export interface StaffingRecommendation {
  dayOfWeek: number;
  timeSlot: string;
  currentCapacity: number;
  recommendedStaff: number;
  utilizationPct: number;
  action: 'adequate' | 'add_staff' | 'overstaffed';
}

export interface DemandForecast {
  averageDailyBookings: number;
  recommendation: string;
  // ── New predictive fields ──
  trends: TrendPoint[];
  peakSlots: PeakSlot[];
  staffingRecommendations: StaffingRecommendation[];
  projectedNextWeekBookings: number;
  demandHealth: 'low' | 'moderate' | 'healthy' | 'high';
}

// ─── AIRevenueBrain ──────────────────────────────────────────────

export class AIRevenueBrain {

  /**
   * forecastDemand – upgraded from simple COUNT stub.
   * Satisfies: historical trend analysis, demand forecasting, staffing recommendations.
   * Backward-compatible: still returns { averageDailyBookings, recommendation } plus new fields.
   */
  static async forecastDemand(salonId: string): Promise<DemandForecast> {
    const [trends, peakSlots, staffingRecs, avgResult] = await Promise.all([
      this.computeTrends(salonId),
      this.computePeakSlots(salonId),
      this.computeStaffingRecommendations(salonId),
      this.computeAverageDaily(salonId),
    ]);

    const averageDailyBookings = avgResult;
    const projectedNextWeekBookings = this.projectNextWeek(trends);

    // AC: Demand health classification
    const demandHealth = this.classifyDemand(averageDailyBookings, projectedNextWeekBookings);

    // Backward-compatible recommendation string (enhanced)
    const recommendation = this.buildRecommendation(demandHealth, staffingRecs, peakSlots);

    return {
      averageDailyBookings,
      recommendation,
      trends,
      peakSlots,
      staffingRecommendations: staffingRecs,
      projectedNextWeekBookings,
      demandHealth,
    };
  }

  // ── Private helpers ────────────────────────────────────────────

  /** Compare last 4 weeks of bookings + revenue */
  private static async computeTrends(salonId: string): Promise<TrendPoint[]> {
    const res = await query(`
      WITH weeks AS (
        SELECT
          date_trunc('week', a.appointment_time) AS week_start,
          COUNT(*)                                   AS booking_count,
          COALESCE(SUM(aps.charged_price), 0)        AS revenue
        FROM appointments a
        LEFT JOIN appointment_services aps ON a.id = aps.appointment_id
        WHERE a.salon_id = $1
          AND a.appointment_time >= NOW() - INTERVAL '28 days'
          AND a.status NOT IN ('cancelled')
        GROUP BY week_start
        ORDER BY week_start DESC
        LIMIT 4
      )
      SELECT * FROM weeks
    `, [salonId]);

    return res.rows.map((r: any) => ({
      weekLabel: `Week of ${new Date(r.week_start).toLocaleDateString()}`,
      weekStart: r.week_start,
      bookingCount: Number(r.booking_count),
      revenue: Number(r.revenue),
    }));
  }

  /** Identify peak hours/days from appointment density */
  private static async computePeakSlots(salonId: string): Promise<PeakSlot[]> {
    const res = await query(`
      SELECT
        EXTRACT(ISODOW FROM appointment_time)::int AS day_of_week,
        EXTRACT(HOUR FROM appointment_time)::int   AS hour,
        COUNT(*)                                    AS booking_density
      FROM appointments
      WHERE salon_id = $1
        AND appointment_time >= NOW() - INTERVAL '90 days'
        AND status NOT IN ('cancelled')
      GROUP BY day_of_week, hour
      ORDER BY booking_density DESC
      LIMIT 10
    `, [salonId]);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return res.rows.map((r: any) => ({
      dayOfWeek: r.day_of_week % 7, // ISODOW 1=Mon..7=Sun → convert to 0=Sun
      hour: r.hour,
      bookingDensity: Number(r.booking_density),
      label: `${dayNames[r.day_of_week % 7]} ${String(r.hour).padStart(2, '0')}:00`,
    }));
  }

  /** Staffing recommendations based on appointment density vs capacity */
  private static async computeStaffingRecommendations(salonId: string): Promise<StaffingRecommendation[]> {
    // Get salon capacity
    const capRes = await query(`
      SELECT men_chairs, women_chairs, unisex_chairs
      FROM salon_capacity
      WHERE salon_id = $1
    `, [salonId]);

    const totalChairs = capRes.rows.length
      ? Number(capRes.rows[0].men_chairs) + Number(capRes.rows[0].women_chairs) + Number(capRes.rows[0].unisex_chairs)
      : 5; // sensible default if no capacity record

    // Get average bookings per day-of-week + time-slot band
    const densityRes = await query(`
      SELECT
        EXTRACT(ISODOW FROM appointment_time)::int AS day_of_week,
        CASE
          WHEN EXTRACT(HOUR FROM appointment_time) < 12 THEN 'morning'
          WHEN EXTRACT(HOUR FROM appointment_time) < 17 THEN 'afternoon'
          ELSE 'evening'
        END AS time_slot,
        COUNT(*)::float / GREATEST(COUNT(DISTINCT DATE(appointment_time)), 1) AS avg_bookings
      FROM appointments
      WHERE salon_id = $1
        AND appointment_time >= NOW() - INTERVAL '90 days'
        AND status NOT IN ('cancelled')
      GROUP BY day_of_week, time_slot
      ORDER BY day_of_week, time_slot
    `, [salonId]);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return densityRes.rows.map((r: any): StaffingRecommendation => {
      const avg = Number(r.avg_bookings);
      // Each staff member can handle ~1 appointment per hour; slots are 3-5 hours
      // Heuristic: staff needed = ceil(avg / 3), capped at total chairs
      const recommendedStaff = Math.min(Math.max(Math.ceil(avg / 3), 1), totalChairs);
      const utilizationPct = Math.round((avg / (totalChairs * 3)) * 100);

      let action: StaffingRecommendation['action'] = 'adequate';
      if (utilizationPct > 85) action = 'add_staff';
      else if (utilizationPct < 30) action = 'overstaffed';

      return {
        dayOfWeek: r.day_of_week % 7,
        timeSlot: `${dayNames[r.day_of_week % 7]} ${r.time_slot}`,
        currentCapacity: totalChairs,
        recommendedStaff,
        utilizationPct,
        action,
      };
    });
  }

  /** Simple average daily bookings (backward-compat) */
  private static async computeAverageDaily(salonId: string): Promise<number> {
    const res = await query(`
      SELECT COUNT(*)::float / GREATEST(COUNT(DISTINCT DATE(appointment_time)), 1) AS avg
      FROM appointments
      WHERE salon_id = $1
        AND appointment_time >= NOW() - INTERVAL '30 days'
        AND status NOT IN ('cancelled')
    `, [salonId]);

    return Number(res.rows[0]?.avg ?? 0);
  }

  /** Project next week using linear trend over last 4 weeks */
  private static projectNextWeek(trends: TrendPoint[]): number {
    if (trends.length < 2) return trends[0]?.bookingCount ?? 0;

    // Simple linear extrapolation: slope = (latest - oldest) / (weeks - 1)
    const latest = trends[0].bookingCount;
    const oldest = trends[trends.length - 1].bookingCount;
    const slope = (latest - oldest) / (trends.length - 1);

    return Math.max(0, Math.round(latest + slope));
  }

  /** Classify demand health */
  private static classifyDemand(avgDaily: number, projected: number): DemandForecast['demandHealth'] {
    const growth = avgDaily > 0 ? (projected - avgDaily) / avgDaily : 0;

    if (avgDaily < 5) return 'low';
    if (avgDaily < 10 || growth < -0.15) return 'moderate';
    if (avgDaily < 20 || growth < 0.15) return 'healthy';
    return 'high';
  }

  /** Build human-readable recommendation string */
  private static buildRecommendation(
    health: DemandForecast['demandHealth'],
    staffing: StaffingRecommendation[],
    peaks: PeakSlot[],
  ): string {
    const parts: string[] = [];

    switch (health) {
      case 'low':
        parts.push('Demand is low — consider running promotions or rebooking campaigns.');
        break;
      case 'moderate':
        parts.push('Demand is moderate — monitor trends and prepare promotional offers.');
        break;
      case 'healthy':
        parts.push('Demand is healthy — maintain current strategies.');
        break;
      case 'high':
        parts.push('Demand is high — ensure adequate staffing to capture revenue.');
        break;
    }

    const understaffed = staffing.filter(s => s.action === 'add_staff');
    if (understaffed.length > 0) {
      parts.push(`⚠️ ${understaffed.length} time slot(s) may need additional staff.`);
    }

    if (peaks.length > 0) {
      parts.push(`Peak slot: ${peaks[0].label} (${peaks[0].bookingDensity} bookings).`);
    }

    return parts.join(' ');
  }
}
