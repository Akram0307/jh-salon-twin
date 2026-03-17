import { ClientHistoryAnalyzer, ClientPreferences } from './ClientHistoryAnalyzer';
import { GapFillOptimizer, GapFillScore } from './GapFillOptimizer';
import { AppointmentRepository } from '../repositories/AppointmentRepository';
import { query } from '../config/db';

import logger from '../config/logger';

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
    historicalPatternScore: number;
    contextAwareScore: number;
    realTimeOptimizationScore: number;
  };
  metadata: {
    gapFillScore?: number;
    clientPreferenceScore?: ClientPreferences;
    estimatedRevenue?: number;
    historicalConfidence?: number;
    contextFactors?: string[];
    isPremiumSlot?: boolean;
    waitlistFitScore?: number;
    cancellationRecoveryScore?: number;
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
  context?: {
    weatherCondition?: string;
    isHoliday?: boolean;
    localEvents?: string[];
    waitlistId?: string;
    cancelledSlotIds?: string[];
  };
}

export interface HistoricalPattern {
  preferredTimeSlots: Record<string, number>; // hour -> frequency
  preferredStaff: Record<string, number>; // staffId -> frequency
  noShowRate: number;
  averageLeadTimeDays: number;
  rebookingIntervalDays: number;
}

export interface StaffWorkloadPattern {
  staffId: string;
  currentLoad: number;
  maxCapacity: number;
  preferredServices: string[];
  averageServiceDuration: number;
}

export class SmartSlotRanker {
  // Enhanced weights for scoring factors (must sum to 100)
  private static readonly WEIGHTS = {
    clientPreference: 25,
    scheduleOptimization: 20,
    staffAvailability: 15,
    serviceDurationFit: 10,
    revenueOptimization: 10,
    historicalPattern: 10,
    contextAware: 5,
    realTimeOptimization: 5
  };

  // Premium time slots (peak hours get revenue boost)
  private static readonly PREMIUM_HOURS = [10, 11, 14, 15, 16]; // 10am-11am, 2pm-4pm
  
  // Weather impact multipliers
  private static readonly WEATHER_IMPACT: Record<string, number> = {
    'sunny': 1.0,
    'cloudy': 0.95,
    'rainy': 0.85,
    'stormy': 0.75,
    'snow': 0.70
  };

  /**
   * Rank candidate slots based on multiple enhanced factors
   */
  static async rankSlots(options: SlotRankingOptions): Promise<RankedSlot[]> {
    const {
      clientId,
      salonId,
      serviceId,
      serviceDurationMinutes,
      servicePrice,
      date,
      candidateSlots,
      context
    } = options;

    // Parallel data fetching for performance
    const [
      clientPreferences,
      gapFillScores,
      staffWorkloads,
      historicalPatterns,
      cancelledSlots
    ] = await Promise.all([
      ClientHistoryAnalyzer.analyzeClientPreferences(clientId, salonId),
      GapFillOptimizer.getGapFillScores(
        salonId,
        date,
        candidateSlots.map(slot => ({
          time: slot.time,
          staffId: slot.staffId,
          durationMinutes: serviceDurationMinutes
        }))
      ),
      this.getStaffWorkloadPatterns(salonId, date),
      this.getHistoricalPatterns(clientId, salonId, serviceId),
      this.getRecentlyCancelledSlots(salonId, date)
    ]);

    // Calculate all scoring factors
    const clientPreferenceScores = this.calculateEnhancedClientPreferences(
      clientPreferences,
      candidateSlots,
      historicalPatterns
    );

    const scheduleOptScores = gapFillScores.map(g => g?.gapFillScore || 0);
    const staffAvailScores = this.calculateEnhancedStaffAvailability(candidateSlots, staffWorkloads);
    const durationFitScores = this.calculateEnhancedDurationFit(
      candidateSlots,
      serviceDurationMinutes,
      staffWorkloads
    );
    const revenueScores = this.calculateEnhancedRevenueScores(
      candidateSlots,
      servicePrice,
      date
    );
    const historicalScores = this.calculateHistoricalPatternScores(
      candidateSlots,
      historicalPatterns
    );
    const contextScores = this.calculateContextAwareScores(candidateSlots, date, context);
    const realTimeScores = this.calculateRealTimeOptimizationScores(
      candidateSlots,
      cancelledSlots,
      context?.waitlistId
    );

    // Calculate total scores for each slot
    const rankedSlots: RankedSlot[] = candidateSlots.map((slot, index) => {
      const clientPreferenceScore = clientPreferenceScores[index] || 0;
      const scheduleOptimizationScore = scheduleOptScores[index] || 0;
      const staffAvailabilityScore = staffAvailScores[index] || 0;
      const serviceDurationFitScore = durationFitScores[index] || 0;
      const revenueOptimizationScore = revenueScores[index] || 0;
      const historicalPatternScore = historicalScores[index] || 0;
      const contextAwareScore = contextScores[index] || 0;
      const realTimeOptimizationScore = realTimeScores[index] || 0;

      // Calculate weighted total score
      const totalScore = (
        (clientPreferenceScore * this.WEIGHTS.clientPreference) +
        (scheduleOptimizationScore * this.WEIGHTS.scheduleOptimization) +
        (staffAvailabilityScore * this.WEIGHTS.staffAvailability) +
        (serviceDurationFitScore * this.WEIGHTS.serviceDurationFit) +
        (revenueOptimizationScore * this.WEIGHTS.revenueOptimization) +
        (historicalPatternScore * this.WEIGHTS.historicalPattern) +
        (contextAwareScore * this.WEIGHTS.contextAware) +
        (realTimeOptimizationScore * this.WEIGHTS.realTimeOptimization)
      ) / 100;

      // Determine context factors
      const contextFactors: string[] = [];
      const hour = new Date(slot.time).getHours();
      if (this.PREMIUM_HOURS.includes(hour)) {
        contextFactors.push('premium_time_slot');
      }
      if (context?.isHoliday) {
        contextFactors.push('holiday_adjusted');
      }
      if (context?.weatherCondition && this.WEATHER_IMPACT[context.weatherCondition] < 0.9) {
        contextFactors.push('weather_impacted');
      }

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
          revenueOptimizationScore,
          historicalPatternScore,
          contextAwareScore,
          realTimeOptimizationScore
        },
        metadata: {
          gapFillScore: gapFillScores[index]?.gapFillScore,
          clientPreferenceScore: clientPreferences,
          estimatedRevenue: this.calculateSlotRevenue(servicePrice, slot.time, date),
          historicalConfidence: historicalPatterns.noShowRate < 0.2 ? 0.9 : 0.6,
          contextFactors,
          isPremiumSlot: this.PREMIUM_HOURS.includes(hour),
          waitlistFitScore: context?.waitlistId ? realTimeOptimizationScore : undefined,
          cancellationRecoveryScore: cancelledSlots.length > 0 ? this.calculateCancellationRecoveryScore(slot, cancelledSlots) : undefined
        }
      };
    });

    // Sort by total score descending
    return rankedSlots.sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Get historical booking patterns for a client
   */
  private static async getHistoricalPatterns(
    clientId: string,
    salonId: string,
    serviceId: string
  ): Promise<HistoricalPattern> {
    try {
      // Get client's booking history
      const historyResult = await query(
        `SELECT 
           appointment_time,
           staff_id,
           status,
           created_at
         FROM appointments
         WHERE client_id = $1
         AND salon_id = $2
         AND service_id = $3
         AND appointment_time < NOW()
         ORDER BY appointment_time DESC
         LIMIT 50`,
        [clientId, salonId, serviceId]
      );

      const preferredTimeSlots: Record<string, number> = {};
      const preferredStaff: Record<string, number> = {};
      let noShowCount = 0;
      let totalBookings = historyResult.rows.length;
      let totalLeadTimeDays = 0;
      let rebookingIntervals: number[] = [];

      let previousTime: Date | null = null;

      for (const row of historyResult.rows) {
        const appointmentTime = new Date(row.appointment_time);
        const hour = appointmentTime.getHours().toString();
        
        // Track preferred hours
        preferredTimeSlots[hour] = (preferredTimeSlots[hour] || 0) + 1;
        
        // Track preferred staff
        preferredStaff[row.staff_id] = (preferredStaff[row.staff_id] || 0) + 1;
        
        // Track no-shows
        if (row.status === 'NO_SHOW') {
          noShowCount++;
        }
        
        // Calculate lead time
        const createdAt = new Date(row.created_at);
        const leadTimeDays = Math.floor((appointmentTime.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        totalLeadTimeDays += leadTimeDays;
        
        // Calculate rebooking intervals
        if (previousTime) {
          const intervalDays = Math.floor((previousTime.getTime() - appointmentTime.getTime()) / (1000 * 60 * 60 * 24));
          if (intervalDays > 0 && intervalDays < 180) {
            rebookingIntervals.push(intervalDays);
          }
        }
        previousTime = appointmentTime;
      }

      return {
        preferredTimeSlots,
        preferredStaff,
        noShowRate: totalBookings > 0 ? noShowCount / totalBookings : 0,
        averageLeadTimeDays: totalBookings > 0 ? totalLeadTimeDays / totalBookings : 7,
        rebookingIntervalDays: rebookingIntervals.length > 0 
          ? rebookingIntervals.reduce((a, b) => a + b, 0) / rebookingIntervals.length 
          : 14
      };
    } catch (error) {
      logger.error({ err: error }, 'Error getting historical patterns:');
      return {
        preferredTimeSlots: {},
        preferredStaff: {},
        noShowRate: 0.1,
        averageLeadTimeDays: 7,
        rebookingIntervalDays: 14
      };
    }
  }

  /**
   * Get staff workload patterns for the day
   */
  private static async getStaffWorkloadPatterns(
    salonId: string,
    date: string
  ): Promise<Map<string, StaffWorkloadPattern>> {
    const workloadMap = new Map<string, StaffWorkloadPattern>();

    try {
      // Get all staff and their current workload
      const staffResult = await query(
        `SELECT 
           s.id as staff_id,
           s.name as staff_name,
           COUNT(a.id) as current_appointments,
           COALESCE(SUM(a.duration_minutes), 0) as total_duration
         FROM staff s
         LEFT JOIN appointments a ON s.id = a.staff_id 
           AND DATE(a.appointment_time) = $2
           AND a.status IN ('SCHEDULED', 'IN_PROGRESS')
         WHERE s.salon_id = $1
         GROUP BY s.id, s.name`,
        [salonId, date]
      );

      // Get staff capacity from working hours
      const capacityResult = await query(
        `SELECT staff_id, capacity, start_time, end_time
         FROM staff_working_hours
         WHERE salon_id = $1
         AND weekday = EXTRACT(DOW FROM $2::date)`,
        [salonId, date]
      );

      for (const staff of staffResult.rows) {
        const capacity = capacityResult.rows.find((c: { staff_id: string }) => c.staff_id === staff.staff_id);
        const maxCapacity = capacity ? parseInt(capacity.capacity) || 8 : 8;
        
        workloadMap.set(staff.staff_id, {
          staffId: staff.staff_id,
          currentLoad: parseInt(staff.current_appointments) || 0,
          maxCapacity,
          preferredServices: [],
          averageServiceDuration: staff.total_duration > 0 
            ? staff.total_duration / staff.current_appointments 
            : 60
        });
      }
    } catch (error) {
      logger.error({ err: error }, 'Error getting staff workload patterns:');
    }

    return workloadMap;
  }

  /**
   * Get recently cancelled slots for recovery scoring
   */
  private static async getRecentlyCancelledSlots(
    salonId: string,
    date: string
  ): Promise<{ time: Date; staffId: string }[]> {
    try {
      const result = await query(
        `SELECT appointment_time, staff_id
         FROM appointments
         WHERE salon_id = $1
         AND DATE(appointment_time) = $2
         AND status = 'CANCELLED'
         AND updated_at > NOW() - INTERVAL '24 hours'
         ORDER BY appointment_time`,
        [salonId, date]
      );

      return result.rows.map((row: { appointment_time: Date | string; staff_id: string }) => ({
        time: new Date(row.appointment_time),
        staffId: row.staff_id
      }));
    } catch (error) {
      logger.error({ err: error }, 'Error getting cancelled slots:');
      return [];
    }
  }

  /**
   * Calculate enhanced client preference scores
   */
  private static calculateEnhancedClientPreferences(
    preferences: ClientPreferences,
    slots: { time: Date; staffId: string }[],
    historicalPatterns: HistoricalPattern
  ): number[] {
    return slots.map(slot => {
      const hour = new Date(slot.time).getHours().toString();
      let score = 50; // Base score

      // Time preference from history
      const timeFrequency = historicalPatterns.preferredTimeSlots[hour] || 0;
      if (timeFrequency > 0) {
        score += Math.min(30, timeFrequency * 10);
      }

      // Staff preference from history
      const staffFrequency = historicalPatterns.preferredStaff[slot.staffId] || 0;
      if (staffFrequency > 0) {
        score += Math.min(20, staffFrequency * 5);
      }

      // Adjust for no-show rate (lower confidence for high no-show clients)
      if (historicalPatterns.noShowRate > 0.2) {
        score *= 0.8;
      }

      return Math.min(100, Math.max(0, score));
    });
  }

  /**
   * Calculate enhanced staff availability scores
   */
  private static calculateEnhancedStaffAvailability(
    slots: { time: Date; staffId: string }[],
    staffWorkloads: Map<string, StaffWorkloadPattern>
  ): number[] {
    return slots.map(slot => {
      const workload = staffWorkloads.get(slot.staffId);
      if (!workload) return 50;

      const utilizationRate = workload.currentLoad / workload.maxCapacity;
      
      // Score based on utilization (optimal at 60-80%)
      if (utilizationRate < 0.4) {
        return 70; // Under-utilized, good for filling
      } else if (utilizationRate < 0.6) {
        return 90; // Optimal range
      } else if (utilizationRate < 0.8) {
        return 80; // Good utilization
      } else if (utilizationRate < 0.95) {
        return 60; // Getting full
      } else {
        return 30; // Nearly full
      }
    });
  }

  /**
   * Calculate enhanced duration fit scores
   */
  private static calculateEnhancedDurationFit(
    slots: { time: Date; staffId: string }[],
    serviceDurationMinutes: number,
    staffWorkloads: Map<string, StaffWorkloadPattern>
  ): number[] {
    return slots.map(slot => {
      const workload = staffWorkloads.get(slot.staffId);
      let score = 70; // Base score

      // Check if service duration matches staff's average
      if (workload) {
        const durationDiff = Math.abs(serviceDurationMinutes - workload.averageServiceDuration);
        if (durationDiff < 15) {
          score += 20; // Close to average
        } else if (durationDiff < 30) {
          score += 10; // Reasonably close
        }
      }

      // Short services get bonus for gap filling
      if (serviceDurationMinutes <= 30) {
        score += 10;
      }

      return Math.min(100, score);
    });
  }

  /**
   * Calculate enhanced revenue scores with premium time slots
   */
  private static calculateEnhancedRevenueScores(
    slots: { time: Date }[],
    servicePrice: number,
    date: string
  ): number[] {
    const dayOfWeek = new Date(date).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    return slots.map(slot => {
      const hour = new Date(slot.time).getHours();
      let score = 50; // Base score

      // Premium hours boost
      if (this.PREMIUM_HOURS.includes(hour)) {
        score += 25;
      }

      // Weekend premium
      if (isWeekend) {
        score += 15;
      }

      // Price normalization
      const priceScore = Math.min(20, servicePrice / 20);
      score += priceScore;

      return Math.min(100, score);
    });
  }

  /**
   * Calculate historical pattern scores
   */
  private static calculateHistoricalPatternScores(
    slots: { time: Date; staffId: string }[],
    patterns: HistoricalPattern
  ): number[] {
    return slots.map(slot => {
      const hour = new Date(slot.time).getHours().toString();
      let score = 50;

      // Boost for historically popular times
      const popularity = patterns.preferredTimeSlots[hour] || 0;
      if (popularity > 3) {
        score += 30;
      } else if (popularity > 1) {
        score += 15;
      }

      // Adjust for rebooking interval
      // If client typically rebooks every 14 days, suggest similar spacing
      score += 10; // Base adjustment

      return Math.min(100, Math.max(0, score));
    });
  }

  /**
   * Calculate context-aware scores (weather, holidays, events)
   */
  private static calculateContextAwareScores(
    slots: { time: Date }[],
    date: string,
    context?: SlotRankingOptions['context']
  ): number[] {
    const baseScore = 70;

    return slots.map(slot => {
      let score = baseScore;
      const hour = new Date(slot.time).getHours();

      // Weather adjustment
      if (context?.weatherCondition) {
        const weatherMultiplier = this.WEATHER_IMPACT[context.weatherCondition] || 1.0;
        score *= weatherMultiplier;
      }

      // Holiday adjustment (suggest earlier slots on holidays)
      if (context?.isHoliday) {
        if (hour < 14) {
          score += 15; // Earlier slots preferred on holidays
        } else {
          score -= 10;
        }
      }

      // Local events adjustment
      if (context?.localEvents && context.localEvents.length > 0) {
        // During local events, later slots might be better
        if (hour >= 14) {
          score += 10;
        }
      }

      return Math.min(100, Math.max(0, score));
    });
  }

  /**
   * Calculate real-time optimization scores
   */
  private static calculateRealTimeOptimizationScores(
    slots: { time: Date; staffId: string }[],
    cancelledSlots: { time: Date; staffId: string }[],
    waitlistId?: string
  ): number[] {
    return slots.map(slot => {
      let score = 50;

      // Check if this slot was recently cancelled (recovery opportunity)
      const isCancelledSlot = cancelledSlots.some(
        cancelled => 
          cancelled.staffId === slot.staffId &&
          Math.abs(new Date(cancelled.time).getTime() - new Date(slot.time).getTime()) < 60000
      );

      if (isCancelledSlot) {
        score += 30; // Boost for cancellation recovery
      }

      // Waitlist fit bonus
      if (waitlistId) {
        score += 15; // Prioritize filling waitlist
      }

      return Math.min(100, Math.max(0, score));
    });
  }

  /**
   * Calculate cancellation recovery score for a specific slot
   */
  private static calculateCancellationRecoveryScore(
    slot: { time: Date; staffId: string },
    cancelledSlots: { time: Date; staffId: string }[]
  ): number {
    const matchingCancellation = cancelledSlots.find(
      cancelled =>
        cancelled.staffId === slot.staffId &&
        Math.abs(new Date(cancelled.time).getTime() - new Date(slot.time).getTime()) < 60000
    );

    return matchingCancellation ? 85 : 0;
  }

  /**
   * Calculate slot revenue with time-based pricing
   */
  private static calculateSlotRevenue(basePrice: number, slotTime: Date, date: string): number {
    const hour = slotTime.getHours();
    const dayOfWeek = new Date(date).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    let multiplier = 1.0;

    // Premium hours
    if (this.PREMIUM_HOURS.includes(hour)) {
      multiplier += 0.15;
    }

    // Weekend premium
    if (isWeekend) {
      multiplier += 0.10;
    }

    return basePrice * multiplier;
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
   * Get the best slot for given criteria
   */
  static async getBestSlot(options: SlotRankingOptions): Promise<RankedSlot | null> {
    const topSlots = await this.getTopSlots(options, 1);
    return topSlots.length > 0 ? topSlots[0] : null;
  }

  /**
   * Rank custom slot list (for AI concierge integration)
   */
  static async rankCustomSlots(
    options: SlotRankingOptions,
    customSlots: { time: Date; staffId: string; staffName: string }[]
  ): Promise<RankedSlot[]> {
    const modifiedOptions = {
      ...options,
      candidateSlots: customSlots
    };
    return this.rankSlots(modifiedOptions);
  }

  /**
   * Get optimal booking times for a service
   */
  static async getOptimalTimes(
    salonId: string,
    serviceId: string,
    serviceDurationMinutes: number,
    servicePrice: number,
    dateRange: { start: string; end: string }
  ): Promise<{ date: string; optimalSlots: RankedSlot[] }[]> {
    const results: { date: string; optimalSlots: RankedSlot[] }[] = [];
    
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      
      // Get available slots for this date
      const availableSlots = await this.getAvailableSlotsForDate(
        salonId,
        dateStr,
        serviceDurationMinutes
      );
      
      if (availableSlots.length > 0) {
        const rankedSlots = await this.getTopSlots({
          clientId: '', // No specific client for optimal times
          salonId,
          serviceId,
          serviceDurationMinutes,
          servicePrice,
          date: dateStr,
          candidateSlots: availableSlots
        }, 3);
        
        results.push({ date: dateStr, optimalSlots: rankedSlots });
      }
    }
    
    return results;
  }

  /**
   * Get available slots for a specific date
   */
  private static async getAvailableSlotsForDate(
    salonId: string,
    date: string,
    durationMinutes: number
  ): Promise<{ time: Date; staffId: string; staffName: string }[]> {
    try {
      const result = await query(
        `SELECT 
           s.id as staff_id,
           s.name as staff_name,
           wh.start_time,
           wh.end_time
         FROM staff s
         JOIN staff_working_hours wh ON s.id = wh.staff_id
         WHERE s.salon_id = $1
         AND wh.weekday = EXTRACT(DOW FROM $2::date)
         AND wh.capacity > 0`,
        [salonId, date]
      );

      const slots: { time: Date; staffId: string; staffName: string }[] = [];

      for (const staff of result.rows) {
        const startTime = staff.start_time.split(':').map(Number);
        const endTime = staff.end_time.split(':').map(Number);
        
        // Generate 30-minute slots
        for (let hour = startTime[0]; hour < endTime[0]; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            if (hour === startTime[0] && minute < startTime[1]) continue;
            if (hour === endTime[0] - 1 && minute + durationMinutes > endTime[1] * 60) continue;
            
            const slotTime = new Date(date);
            slotTime.setHours(hour, minute, 0, 0);
            
            slots.push({
              time: slotTime,
              staffId: staff.staff_id,
              staffName: staff.staff_name
            });
          }
        }
      }

      return slots;
    } catch (error) {
      logger.error({ err: error }, 'Error getting available slots:');
      return [];
    }
  }

  /**
   * Find slots that fit waitlist preferences
   */
  static async getWaitlistFitSlots(
    salonId: string,
    serviceId: string,
    serviceDurationMinutes: number,
    servicePrice: number,
    waitlistPreferences: {
      preferredDates: string[];
      preferredTimes: string[];
      preferredStaffIds?: string[];
    }
  ): Promise<RankedSlot[]> {
    const allRankedSlots: RankedSlot[] = [];

    for (const date of waitlistPreferences.preferredDates) {
      const availableSlots = await this.getAvailableSlotsForDate(
        salonId,
        date,
        serviceDurationMinutes
      );

      // Filter by preferences
      const filteredSlots = availableSlots.filter(slot => {
        const hour = new Date(slot.time).getHours().toString();
        const matchesTime = waitlistPreferences.preferredTimes.length === 0 || 
          waitlistPreferences.preferredTimes.includes(hour);
        const matchesStaff = !waitlistPreferences.preferredStaffIds ||
          waitlistPreferences.preferredStaffIds.length === 0 ||
          waitlistPreferences.preferredStaffIds.includes(slot.staffId);
        return matchesTime && matchesStaff;
      });

      if (filteredSlots.length > 0) {
        const rankedSlots = await this.rankSlots({
          clientId: '',
          salonId,
          serviceId,
          serviceDurationMinutes,
          servicePrice,
          date,
          candidateSlots: filteredSlots,
          context: { waitlistId: 'waitlist' }
        });

        allRankedSlots.push(...rankedSlots);
      }
    }

    return allRankedSlots.sort((a, b) => b.totalScore - a.totalScore);
  }
}
