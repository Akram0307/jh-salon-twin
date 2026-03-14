import { query } from '../config/db';
import { SmartSlotRanker, RankedSlot, SlotRankingOptions } from './SmartSlotRanker';
import { ClientHistoryAnalyzer } from './ClientHistoryAnalyzer';
import { GapFillOptimizer } from './GapFillOptimizer';
import { ABTestingService } from './ABTestingService';
import { MetricsCollector } from './MetricsCollector';

const uuidRegex = /^[0-9a-fA-F-]{36}$/;

export interface RankedSlotResult {
  slots: RankedSlot[];
  metadata: {
    algorithm: string;
    experimentId?: string;
    responseTimeMs: number;
    totalCandidateSlots: number;
  };
}

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
      `SELECT id, duration_minutes, price FROM services WHERE id = $1 AND salon_id = $2`,
      [service_id, salon_id]
    );

    if (serviceRes.rows.length === 0) return [];

    const duration = serviceRes.rows[0].duration_minutes;
    const price = serviceRes.rows[0].price || 0;

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
            time: current.toISOString(),
            duration_minutes: duration,
            price: price
          });
        }

        current = new Date(current.getTime() + 10 * 60000);
      }
    }

    return slots.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }

  /**
   * Get ranked slots using the SmartSlotRanker algorithm
   */
  static async getRankedSlots(
    salon_id: string,
    service_id: string,
    date: string,
    client_id: string
  ): Promise<RankedSlotResult> {
    const startTime = Date.now();
    
    // Get candidate slots
    const candidateSlots = await this.getAvailableSlots(salon_id, service_id, date);
    
    if (candidateSlots.length === 0) {
      return {
        slots: [],
        metadata: {
          algorithm: 'none',
          responseTimeMs: Date.now() - startTime,
          totalCandidateSlots: 0
        }
      };
    }

    // Get service details
    const serviceRes = await query(
      `SELECT duration_minutes, price FROM services WHERE id = $1 AND salon_id = $2`,
      [service_id, salon_id]
    );
    
    if (serviceRes.rows.length === 0) {
      return {
        slots: [],
        metadata: {
          algorithm: 'none',
          responseTimeMs: Date.now() - startTime,
          totalCandidateSlots: candidateSlots.length
        }
      };
    }

    const service = serviceRes.rows[0];

    // Determine which algorithm to use (A/B testing)
    const { algorithm, experimentId } = await ABTestingService.getAlgorithmForRequest(salon_id, client_id);
    
    // Prepare ranking options
    const rankingOptions: SlotRankingOptions = {
      clientId: client_id,
      salonId: salon_id,
      serviceId: service_id,
      serviceDurationMinutes: service.duration_minutes,
      servicePrice: service.price || 0,
      date: date,
      candidateSlots: candidateSlots.map(slot => ({
        time: new Date(slot.time),
        staffId: slot.staff_id,
        staffName: slot.staff_name
      }))
    };

    // Get ranked slots
    let rankedSlots: RankedSlot[];
    
    if (algorithm === 'variant') {
      // Use the new SmartSlotRanker algorithm
      rankedSlots = await SmartSlotRanker.rankSlots(rankingOptions);
    } else {
      // Use control algorithm (simple time-based sorting)
      rankedSlots = candidateSlots.map(slot => ({
        slotTime: new Date(slot.time),
        staffId: slot.staff_id,
        staffName: slot.staff_name,
        totalScore: 100 - (new Date(slot.time).getHours() * 2), // Simple scoring: earlier = better
        breakdown: {
          clientPreferenceScore: 0,
          scheduleOptimizationScore: 0,
          staffAvailabilityScore: 0,
          serviceDurationFitScore: 0,
          revenueOptimizationScore: 0
        },
        metadata: {}
      })).sort((a, b) => b.totalScore - a.totalScore);
    }

    const responseTimeMs = Date.now() - startTime;

    // Log metrics
    await MetricsCollector.logSuggestion({
      salon_id,
      client_id,
      service_id,
      suggested_slots: rankedSlots.slice(0, 5), // Log top 5 suggestions
      response_time_ms: responseTimeMs,
      timestamp: new Date(),
      algorithm_version: algorithm
    });

    // Log A/B testing event
    if (experimentId) {
      await ABTestingService.logSuggestionEvent({
        experiment_id: experimentId,
        algorithm,
        client_id,
        salon_id,
        service_id,
        suggested_slots: rankedSlots.slice(0, 5),
        timestamp: new Date()
      });
    }

    return {
      slots: rankedSlots,
      metadata: {
        algorithm,
        experimentId,
        responseTimeMs,
        totalCandidateSlots: candidateSlots.length
      }
    };
  }

  /**
   * Get top N ranked slots
   */
  static async getTopRankedSlots(
    salon_id: string,
    service_id: string,
    date: string,
    client_id: string,
    limit: number = 5
  ): Promise<RankedSlot[]> {
    const result = await this.getRankedSlots(salon_id, service_id, date, client_id);
    return result.slots.slice(0, limit);
  }

  /**
   * Get the best slot for a client
   */
  static async getBestSlot(
    salon_id: string,
    service_id: string,
    date: string,
    client_id: string
  ): Promise<RankedSlot | null> {
    const topSlots = await this.getTopRankedSlots(salon_id, service_id, date, client_id, 1);
    return topSlots.length > 0 ? topSlots[0] : null;
  }
}
