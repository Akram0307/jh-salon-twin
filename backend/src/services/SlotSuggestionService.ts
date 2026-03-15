import { SmartSlotRanker, RankedSlot, SlotRankingOptions } from './SmartSlotRanker';
import { SlotGenerator } from './SlotGenerator';
import { query } from '../config/db';
import { EventEmitter } from 'events';

export interface SuggestionContext {
  weatherCondition?: string;
  isHoliday?: boolean;
  localEvents?: string[];
  waitlistId?: string;
  cancelledSlotIds?: string[];
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  urgency?: 'low' | 'medium' | 'high';
}

export interface SlotSuggestionRequest {
  clientId: string;
  salonId: string;
  serviceId: string;
  serviceDurationMinutes: number;
  servicePrice: number;
  preferredDate?: string;
  dateRange?: { start: string; end: string };
  context?: SuggestionContext;
  limit?: number;
}

export interface NaturalLanguageQuery {
  query: string;
  clientId: string;
  salonId: string;
  serviceId?: string;
}

export interface ParsedQueryIntent {
  serviceId?: string;
  preferredDate?: string;
  preferredTimeRange?: { start: number; end: number };
  preferredStaffId?: string;
  urgency: 'low' | 'medium' | 'high';
  confidence: number;
}

export interface MultiSlotComparison {
  date: string;
  slots: RankedSlot[];
  summary: string;
}

export interface WaitlistFitRequest {
  salonId: string;
  serviceId: string;
  serviceDurationMinutes: number;
  servicePrice: number;
  preferredDates: string[];
  preferredTimes: string[];
  preferredStaffIds?: string[];
  clientId: string;
}

/**
 * SlotSuggestionService - Context-aware slot suggestion service
 * Provides intelligent slot suggestions with natural language processing,
 * multi-slot comparison, and preference learning
 */
export class SlotSuggestionService extends EventEmitter {
  private static instance: SlotSuggestionService;
  private preferenceCache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    super();
  }

  static getInstance(): SlotSuggestionService {
    if (!SlotSuggestionService.instance) {
      SlotSuggestionService.instance = new SlotSuggestionService();
    }
    return SlotSuggestionService.instance;
  }

  /**
   * Get smart slot suggestions with context awareness
   */
  async getSmartSuggestions(request: SlotSuggestionRequest): Promise<RankedSlot[]> {
    const startTime = Date.now();

    try {
      // Get available slots for the date or date range
      let candidateSlots: { time: Date; staffId: string; staffName: string }[] = [];

      if (request.preferredDate) {
        candidateSlots = await this.getAvailableSlots(
          request.salonId,
          request.preferredDate,
          request.serviceDurationMinutes
        );
      } else if (request.dateRange) {
        // Get slots across date range
        const startDate = new Date(request.dateRange.start);
        const endDate = new Date(request.dateRange.end);

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          const daySlots = await this.getAvailableSlots(
            request.salonId,
            dateStr,
            request.serviceDurationMinutes
          );
          candidateSlots.push(...daySlots);
        }
      }

      if (candidateSlots.length === 0) {
        return [];
      }

      // Build ranking options with context
      const rankingOptions: SlotRankingOptions = {
        clientId: request.clientId,
        salonId: request.salonId,
        serviceId: request.serviceId,
        serviceDurationMinutes: request.serviceDurationMinutes,
        servicePrice: request.servicePrice,
        date: request.preferredDate || request.dateRange?.start || new Date().toISOString().split('T')[0],
        candidateSlots,
        context: {
          weatherCondition: request.context?.weatherCondition,
          isHoliday: request.context?.isHoliday,
          localEvents: request.context?.localEvents,
          waitlistId: request.context?.waitlistId,
          cancelledSlotIds: request.context?.cancelledSlotIds
        }
      };

      // Get ranked slots
      const rankedSlots = await SmartSlotRanker.rankSlots(rankingOptions);

      // Apply context-based filtering
      const filteredSlots = this.applyContextFilters(rankedSlots, request.context);

      // Limit results
      const limit = request.limit || 5;
      const result = filteredSlots.slice(0, limit);

      // Emit metrics
      this.emit('suggestionGenerated', {
        clientId: request.clientId,
        salonId: request.salonId,
        responseTimeMs: Date.now() - startTime,
        slotsReturned: result.length,
        algorithmVersion: '2.0'
      });

      return result;
    } catch (error) {
      console.error('Error getting smart suggestions:', error);
      throw error;
    }
  }

  /**
   * Parse natural language query for slot search
   */
  async parseNaturalLanguageQuery(query: NaturalLanguageQuery): Promise<ParsedQueryIntent> {
    const text = query.query.toLowerCase();
    const intent: ParsedQueryIntent = {
      urgency: 'medium',
      confidence: 0.5
    };

    // Parse time references
    const timePatterns: Record<string, { start: number; end: number }> = {
      'morning': { start: 8, end: 12 },
      'afternoon': { start: 12, end: 17 },
      'evening': { start: 17, end: 20 },
      'noon': { start: 11, end: 13 },
      'lunch': { start: 12, end: 14 },
      'after work': { start: 17, end: 19 },
      'early': { start: 8, end: 10 },
      'late': { start: 18, end: 20 }
    };

    for (const [pattern, range] of Object.entries(timePatterns)) {
      if (text.includes(pattern)) {
        intent.preferredTimeRange = range;
        intent.confidence += 0.2;
        break;
      }
    }

    // Parse specific time (e.g., "3pm", "15:00")
    const timeMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const meridiem = timeMatch[3];

      if (meridiem === 'pm' && hour < 12) hour += 12;
      if (meridiem === 'am' && hour === 12) hour = 0;

      intent.preferredTimeRange = { start: hour, end: hour + 2 };
      intent.confidence += 0.3;
    }

    // Parse date references
    const today = new Date();
    if (text.includes('today')) {
      intent.preferredDate = today.toISOString().split('T')[0];
      intent.confidence += 0.2;
    } else if (text.includes('tomorrow')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      intent.preferredDate = tomorrow.toISOString().split('T')[0];
      intent.confidence += 0.2;
    } else if (text.includes('weekend')) {
      // Find next Saturday
      const daysUntilSaturday = (6 - today.getDay() + 7) % 7 || 7;
      const nextSaturday = new Date(today);
      nextSaturday.setDate(nextSaturday.getDate() + daysUntilSaturday);
      intent.preferredDate = nextSaturday.toISOString().split('T')[0];
      intent.confidence += 0.15;
    }

    // Parse urgency
    if (text.includes('asap') || text.includes('urgent') || text.includes('immediately')) {
      intent.urgency = 'high';
      intent.confidence += 0.1;
    } else if (text.includes('flexible') || text.includes('anytime')) {
      intent.urgency = 'low';
      intent.confidence += 0.1;
    }

    // Parse staff preference
    const staffMatch = text.match(/with\s+(\w+)/);
    if (staffMatch) {
      // Look up staff by name
      const staffResult = await query(
        `SELECT id FROM staff WHERE LOWER(name) LIKE $1 LIMIT 1`,
        [`%${staffMatch[1].toLowerCase()}%`]
      );
      if (staffResult.rows.length > 0) {
        intent.preferredStaffId = staffResult.rows[0].id;
        intent.confidence += 0.2;
      }
    }

    // Parse "earliest" or "first available"
    if (text.includes('earliest') || text.includes('first available') || text.includes('as soon')) {
      intent.urgency = 'high';
      intent.confidence += 0.15;
    }

    // Parse "next week"
    if (text.includes('next week')) {
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      intent.preferredDate = nextWeek.toISOString().split('T')[0];
      intent.confidence += 0.15;
    }

    return intent;
  }

  /**
   * Get slots matching natural language query
   */
  async getSlotsFromNaturalLanguage(query: NaturalLanguageQuery): Promise<RankedSlot[]> {
    const intent = await this.parseNaturalLanguageQuery(query);

    if (!query.serviceId && !intent.serviceId) {
      throw new Error('Service ID required for slot search');
    }

    // Get service details
    const serviceResult = await query(
      `SELECT id, duration_minutes, price FROM services WHERE id = $1`,
      [query.serviceId || intent.serviceId]
    );

    if (serviceResult.rows.length === 0) {
      throw new Error('Service not found');
    }

    const service = serviceResult.rows[0];

    // Build date range based on intent
    const startDate = intent.preferredDate || new Date().toISOString().split('T')[0];
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (intent.urgency === 'high' ? 3 : 7));

    const request: SlotSuggestionRequest = {
      clientId: query.clientId,
      salonId: query.salonId,
      serviceId: query.serviceId || intent.serviceId!,
      serviceDurationMinutes: service.duration_minutes,
      servicePrice: parseFloat(service.price),
      preferredDate: intent.preferredDate,
      dateRange: { start: startDate, end: endDate.toISOString().split('T')[0] },
      context: {
        urgency: intent.urgency
      },
      limit: 10
    };

    let slots = await this.getSmartSuggestions(request);

    // Filter by time range if specified
    if (intent.preferredTimeRange) {
      slots = slots.filter(slot => {
        const hour = new Date(slot.slotTime).getHours();
        return hour >= intent.preferredTimeRange!.start && hour < intent.preferredTimeRange!.end;
      });
    }

    // Filter by preferred staff if specified
    if (intent.preferredStaffId) {
      const staffSlots = slots.filter(slot => slot.staffId === intent.preferredStaffId);
      if (staffSlots.length > 0) {
        slots = staffSlots;
      }
    }

    return slots;
  }

  /**
   * Compare slots across multiple dates
   */
  async getMultiSlotComparison(
    clientId: string,
    salonId: string,
    serviceId: string,
    serviceDurationMinutes: number,
    servicePrice: number,
    dates: string[],
    slotsPerDate: number = 3
  ): Promise<MultiSlotComparison[]> {
    const comparisons: MultiSlotComparison[] = [];

    for (const date of dates) {
      const request: SlotSuggestionRequest = {
        clientId,
        salonId,
        serviceId,
        serviceDurationMinutes,
        servicePrice,
        preferredDate: date,
        limit: slotsPerDate
      };

      const slots = await this.getSmartSuggestions(request);

      if (slots.length > 0) {
        const dateObj = new Date(date);
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        comparisons.push({
          date,
          slots,
          summary: `${dayName}, ${formattedDate}: ${slots.length} available slots, best at ${this.formatTime(slots[0].slotTime)}`
        });
      }
    }

    return comparisons;
  }

  /**
   * Find slots that fit waitlist preferences
   */
  async getWaitlistFitSlots(request: WaitlistFitRequest): Promise<RankedSlot[]> {
    const rankedSlots = await SmartSlotRanker.getWaitlistFitSlots(
      request.salonId,
      request.serviceId,
      request.serviceDurationMinutes,
      request.servicePrice,
      {
        preferredDates: request.preferredDates,
        preferredTimes: request.preferredTimes,
        preferredStaffIds: request.preferredStaffIds
      }
    );

    // Limit to top 10
    return rankedSlots.slice(0, 10);
  }

  /**
   * Get optimal booking times for a service across date range
   */
  async getOptimalTimes(
    salonId: string,
    serviceId: string,
    serviceDurationMinutes: number,
    servicePrice: number,
    dateRange: { start: string; end: string }
  ): Promise<{ date: string; optimalSlots: RankedSlot[] }[]> {
    return SmartSlotRanker.getOptimalTimes(
      salonId,
      serviceId,
      serviceDurationMinutes,
      servicePrice,
      dateRange
    );
  }

  /**
   * Rank custom slot list
   */
  async rankCustomSlots(
    clientId: string,
    salonId: string,
    serviceId: string,
    serviceDurationMinutes: number,
    servicePrice: number,
    date: string,
    customSlots: { time: Date; staffId: string; staffName: string }[]
  ): Promise<RankedSlot[]> {
    return SmartSlotRanker.rankCustomSlots(
      {
        clientId,
        salonId,
        serviceId,
        serviceDurationMinutes,
        servicePrice,
        date,
        candidateSlots: customSlots
      },
      customSlots
    );
  }

  /**
   * Get available slots for a specific date
   */
  private async getAvailableSlots(
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
         AND wh.capacity > 0
         AND s.is_active = true`,
        [salonId, date]
      );

      const slots: { time: Date; staffId: string; staffName: string }[] = [];

      for (const staff of result.rows) {
        const startParts = staff.start_time.split(':').map(Number);
        const endParts = staff.end_time.split(':').map(Number);
        
        const startHour = startParts[0];
        const startMinute = startParts[1] || 0;
        const endHour = endParts[0];
        const endMinute = endParts[1] || 0;

        // Generate 30-minute slots
        for (let hour = startHour; hour <= endHour; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            // Skip if before start time
            if (hour === startHour && minute < startMinute) continue;
            // Skip if slot would end after closing
            const slotEndMinute = hour * 60 + minute + durationMinutes;
            const closingMinute = endHour * 60 + endMinute;
            if (slotEndMinute > closingMinute) continue;

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

      // Filter out already booked slots
      const bookedResult = await query(
        `SELECT appointment_time, staff_id
         FROM appointments
         WHERE salon_id = $1
         AND DATE(appointment_time) = $2
         AND status IN ('SCHEDULED', 'IN_PROGRESS')`,
        [salonId, date]
      );

      const bookedSlots = new Set(
        bookedResult.rows.map((r: any) => `${r.staff_id}-${r.appointment_time}`)
      );

      return slots.filter(slot => {
        const key = `${slot.staffId}-${slot.time.toISOString()}`;
        return !bookedSlots.has(key);
      });
    } catch (error) {
      console.error('Error getting available slots:', error);
      return [];
    }
  }

  /**
   * Apply context-based filters to ranked slots
   */
  private applyContextFilters(slots: RankedSlot[], context?: SuggestionContext): RankedSlot[] {
    if (!context) return slots;

    let filtered = [...slots];

    // Filter by time of day preference
    if (context.timeOfDay) {
      const timeRanges: Record<string, [number, number]> = {
        'morning': [6, 12],
        'afternoon': [12, 17],
        'evening': [17, 21]
      };

      const range = timeRanges[context.timeOfDay];
      if (range) {
        filtered = filtered.filter(slot => {
          const hour = new Date(slot.slotTime).getHours();
          return hour >= range[0] && hour < range[1];
        });
      }
    }

    // Boost slots with cancellation recovery for high urgency
    if (context.urgency === 'high') {
      filtered = filtered.map(slot => ({
        ...slot,
        totalScore: slot.totalScore + (slot.metadata.cancellationRecoveryScore || 0) * 0.2
      }));
    }

    return filtered.sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Format time for display
   */
  private formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  /**
   * Learn from user interaction (slot acceptance/rejection)
   */
  async recordInteraction(
    clientId: string,
    salonId: string,
    slotTime: Date,
    accepted: boolean,
    algorithmVersion: string = '2.0'
  ): Promise<void> {
    try {
      await query(
        `INSERT INTO slot_interaction_logs 
         (client_id, salon_id, slot_time, accepted, algorithm_version, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [clientId, salonId, slotTime, accepted, algorithmVersion]
      );

      this.emit('interactionRecorded', {
        clientId,
        salonId,
        slotTime,
        accepted
      });
    } catch (error) {
      console.error('Error recording interaction:', error);
    }
  }

  /**
   * Get preference learning data for a client
   */
  async getClientInteractionHistory(
    clientId: string,
    salonId: string,
    limit: number = 50
  ): Promise<{ slotTime: Date; accepted: boolean }[]> {
    try {
      const result = await query(
        `SELECT slot_time, accepted
         FROM slot_interaction_logs
         WHERE client_id = $1 AND salon_id = $2
         ORDER BY created_at DESC
         LIMIT $3`,
        [clientId, salonId, limit]
      );

      return result.rows.map((row: any) => ({
        slotTime: new Date(row.slot_time),
        accepted: row.accepted
      }));
    } catch (error) {
      console.error('Error getting interaction history:', error);
      return [];
    }
  }
}
