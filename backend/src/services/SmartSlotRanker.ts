import { ClientHistoryAnalyzer, ClientPreferences } from './ClientHistoryAnalyzer';
import { GapFillOptimizer, GapFillScore } from './GapFillOptimizer';
import { AppointmentRepository } from '../repositories/AppointmentRepository';
import { query } from '../config/db';

export interface RankedSlot {
  slotTime: Date;
  staffId: string;
  staffName: string;
  totalScore: number;
  breakdown: {
    clientPreferenceScore: number;
    scheduleOptimizationScore: number;
    staffAvailabilityScore: number;
    serviceDurationFitScore: number;
    revenueOptimizationScore: number;
  };
  metadata: {
    gapFillScore?: number;
    clientPreference?: ClientPreferences;
    estimatedRevenue?: number;
  };
}

export interface SlotRankingOptions {
  clientId: string;
  salonId: string;
  serviceId: string;
  serviceDurationMinutes: number;
  servicePrice: number;
  date: string;
  candidateSlots: {
    time: Date;
    staffId: string;
    staffName: string;
  }[];
}

export class SmartSlotRanker {
  // Weights for scoring factors (must sum to 100)
  private static readonly WEIGHTS = {
    clientPreference: 35,
    scheduleOptimization: 25,
    staffAvailability: 20,
    serviceDurationFit: 10,
    revenueOptimization: 10
  };

  /**
   * Rank candidate slots based on multiple factors
   */
  static async rankSlots(options: SlotRankingOptions): Promise<RankedSlot[]> {
    const {
      clientId,
      salonId,
      serviceId,
      serviceDurationMinutes,
      servicePrice,
      date,
      candidateSlots
    } = options;

    // Get client preferences
    const clientPreferences = await ClientHistoryAnalyzer.analyzeClientPreferences(clientId, salonId);

    // Get gap fill scores for all candidate slots
    const gapFillScores = await GapFillOptimizer.getGapFillScores(
      salonId,
      date,
      candidateSlots.map(slot => ({
        time: slot.time,
        staffId: slot.staffId,
        durationMinutes: serviceDurationMinutes
      }))
    );

    // Get staff availability scores
    const staffAvailabilityScores = await this.calculateStaffAvailabilityScores(
      candidateSlots,
      salonId,
      date
    );

    // Calculate revenue optimization scores
    const revenueScores = this.calculateRevenueScores(candidateSlots, servicePrice);

    // Calculate service duration fit scores
    const durationFitScores = this.calculateDurationFitScores(
      candidateSlots,
      serviceDurationMinutes,
      salonId,
      date
    );

    // Calculate total scores for each slot
    const rankedSlots: RankedSlot[] = candidateSlots.map((slot, index) => {
      // Client preference score (0-100)
      const clientPreferenceScore = ClientHistoryAnalyzer.calculatePreferenceScore(
        clientPreferences,
        slot.time,
        slot.staffId
      );

      // Schedule optimization score (gap fill score)
      const scheduleOptimizationScore = gapFillScores[index]?.gapFillScore || 0;

      // Staff availability score
      const staffAvailabilityScore = staffAvailabilityScores[index] || 0;

      // Service duration fit score
      const serviceDurationFitScore = durationFitScores[index] || 0;

      // Revenue optimization score
      const revenueOptimizationScore = revenueScores[index] || 0;

      // Calculate weighted total score
      const totalScore = (
        (clientPreferenceScore * this.WEIGHTS.clientPreference) +
        (scheduleOptimizationScore * this.WEIGHTS.scheduleOptimization) +
        (staffAvailabilityScore * this.WEIGHTS.staffAvailability) +
        (serviceDurationFitScore * this.WEIGHTS.serviceDurationFit) +
        (revenueOptimizationScore * this.WEIGHTS.revenueOptimization)
      ) / 100;

      return {
        slotTime: slot.time,
        staffId: slot.staffId,
        staffName: slot.staffName,
        totalScore,
        breakdown: {
          clientPreferenceScore,
          scheduleOptimizationScore,
          staffAvailabilityScore,
          serviceDurationFitScore,
          revenueOptimizationScore
        },
        metadata: {
          gapFillScore: gapFillScores[index]?.gapFillScore,
          clientPreference,
          estimatedRevenue: servicePrice
        }
      };
    });

    // Sort by total score descending
    return rankedSlots.sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Calculate staff availability scores based on current workload
   */
  private static async calculateStaffAvailabilityScores(
    slots: { time: Date; staffId: string }[],
    salonId: string,
    date: string
  ): Promise<number[]> {
    const scores: number[] = [];

    // Get staff workload for the day
    const staffWorkload: Record<string, number> = {};
    
    for (const slot of slots) {
      if (!staffWorkload[slot.staffId]) {
        // Count appointments for this staff on this day
        const apptCount = await query(
          `SELECT COUNT(*) as count
           FROM appointments
           WHERE staff_id = $1
           AND salon_id = $2
           AND DATE(appointment_time) = $3
           AND status IN ('SCHEDULED', 'IN_PROGRESS')`,
          [slot.staffId, salonId, date]
        );
        staffWorkload[slot.staffId] = parseInt(apptCount.rows[0]?.count || '0');
      }
    }

    // Calculate scores (inverse of workload - more workload = lower score)
    const maxWorkload = Math.max(...Object.values(staffWorkload), 1);
    
    for (const slot of slots) {
      const workload = staffWorkload[slot.staffId] || 0;
      const score = 100 - ((workload / maxWorkload) * 100);
      scores.push(Math.max(0, score));
    }

    return scores;
  }

  /**
   * Calculate revenue optimization scores
   */
  private static calculateRevenueScores(
    slots: { time: Date }[],
    servicePrice: number
  ): number[] {
    // For now, simple implementation: higher price = higher score
    // In future, could consider time-based pricing, peak hours, etc.
    const baseScore = Math.min(100, servicePrice / 10); // Normalize
    return slots.map(() => baseScore);
  }

  /**
   * Calculate service duration fit scores
   */
  private static calculateDurationFitScores(
    slots: { time: Date; staffId: string }[],
    serviceDurationMinutes: number,
    salonId: string,
    date: string
  ): number[] {
    // For now, return a base score
    // In future, could check if duration fits well with staff schedule
    return slots.map(() => 80); // Base score of 80
  }

  /**
   * Get top N ranked slots
   */
  static async getTopSlots(
    options: SlotRankingOptions,
    limit: number = 5
  ): Promise<RankedSlot[]> {
    const rankedSlots = await this.rankSlots(options);
    return rankedSlots.slice(0, limit);
  }

  /**
   * Get the best slot for a given criteria
   */
  static async getBestSlot(options: SlotRankingOptions): Promise<RankedSlot | null> {
    const topSlots = await this.getTopSlots(options, 1);
    return topSlots.length > 0 ? topSlots[0] : null;
  }
}
