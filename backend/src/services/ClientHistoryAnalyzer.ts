import { AppointmentRepository } from '../repositories/AppointmentRepository';
import { ClientRepository } from '../repositories/ClientRepository';

export interface ClientPreferences {
  preferredDayOfWeek: number[]; // 0-6, Sunday=0
  preferredTimeOfDay: 'morning' | 'afternoon' | 'evening';
  preferredStylistId?: string;
  averageIntervalDays?: number;
  bookingPattern?: 'regular' | 'occasional' | 'first_time';
}

export interface BookingPattern {
  clientId: string;
  serviceId: string;
  intervalDays: number;
  lastBookingDate: Date;
  nextPredictedDate?: Date;
}

export class ClientHistoryAnalyzer {
  /**
   * Analyze client booking history to determine preferences
   */
  static async analyzeClientPreferences(clientId: string, salonId: string): Promise<ClientPreferences> {
    const history = await AppointmentRepository.getClientServiceHistory(clientId, salonId);
    
    if (history.length === 0) {
      return {
        preferredDayOfWeek: [],
        preferredTimeOfDay: 'afternoon', // default
        bookingPattern: 'first_time'
      };
    }

    // Analyze day of week preferences
    const dayCounts: Record<number, number> = {};
    const timeOfDayCounts: Record<string, number> = { morning: 0, afternoon: 0, evening: 0 };
    const stylistCounts: Record<string, number> = {};
    const intervals: number[] = [];

    let previousDate: Date | null = null;

    for (const appointment of history) {
      const date = new Date(appointment.appointment_date);
      
      // Day of week
      const day = date.getDay();
      dayCounts[day] = (dayCounts[day] || 0) + 1;
      
      // Time of day
      const hour = date.getHours();
      if (hour < 12) timeOfDayCounts.morning++;
      else if (hour < 17) timeOfDayCounts.afternoon++;
      else timeOfDayCounts.evening++;
      
      // Stylist preference (if available)
      if (appointment.staff_id) {
        stylistCounts[appointment.staff_id] = (stylistCounts[appointment.staff_id] || 0) + 1;
      }
      
      // Calculate intervals
      if (previousDate) {
        const diffTime = Math.abs(date.getTime() - previousDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        intervals.push(diffDays);
      }
      previousDate = date;
    }

    // Determine preferred days (top 2)
    const preferredDays = Object.entries(dayCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([day]) => parseInt(day));

    // Determine preferred time of day
    const preferredTimeOfDay = Object.entries(timeOfDayCounts)
      .sort(([, a], [, b]) => b - a)[0][0] as 'morning' | 'afternoon' | 'evening';

    // Determine preferred stylist
    const preferredStylist = Object.entries(stylistCounts)
      .sort(([, a], [, b]) => b - a)[0];
    
    // Calculate average interval
    const avgInterval = intervals.length > 0 
      ? intervals.reduce((a, b) => a + b, 0) / intervals.length 
      : 28; // default 28 days

    // Determine booking pattern
    let bookingPattern: 'regular' | 'occasional' | 'first_time' = 'occasional';
    if (avgInterval <= 35) bookingPattern = 'regular';
    else if (avgInterval > 60) bookingPattern = 'occasional';

    return {
      preferredDayOfWeek: preferredDays,
      preferredTimeOfDay,
      preferredStylistId: preferredStylist ? preferredStylist[0] : undefined,
      averageIntervalDays: avgInterval,
      bookingPattern
    };
  }

  /**
   * Identify rebooking patterns for a client
   */
  static async identifyRebookingPatterns(clientId: string, salonId: string): Promise<BookingPattern[]> {
    const history = await AppointmentRepository.getClientServiceHistory(clientId, salonId);
    const patterns: BookingPattern[] = [];

    // Group by service
    const serviceGroups: Record<string, any[]> = {};
    for (const appointment of history) {
      const serviceId = appointment.service_id;
      if (!serviceGroups[serviceId]) serviceGroups[serviceId] = [];
      serviceGroups[serviceId].push(appointment);
    }

    // Analyze each service group
    for (const [serviceId, appointments] of Object.entries(serviceGroups)) {
      if (appointments.length < 2) continue;

      // Sort by date
      appointments.sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());
      
      const intervals: number[] = [];
      for (let i = 1; i < appointments.length; i++) {
        const prev = new Date(appointments[i-1].appointment_date);
        const curr = new Date(appointments[i].appointment_date);
        const diffDays = Math.ceil(Math.abs(curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        intervals.push(diffDays);
      }

      if (intervals.length > 0) {
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const lastAppointment = appointments[appointments.length - 1];
        const lastDate = new Date(lastAppointment.appointment_date);
        const nextPredicted = new Date(lastDate.getTime() + avgInterval * 24 * 60 * 60 * 1000);

        patterns.push({
          clientId,
          serviceId,
          intervalDays: avgInterval,
          lastBookingDate: lastDate,
          nextPredictedDate: nextPredicted
        });
      }
    }

    return patterns;
  }

  /**
   * Calculate client preference score for a given slot
   */
  static calculatePreferenceScore(
    preferences: ClientPreferences,
    slotTime: Date,
    staffId?: string
  ): number {
    let score = 0;
    const maxScore = 100;

    // Day of week match (40 points)
    const slotDay = slotTime.getDay();
    if (preferences.preferredDayOfWeek.includes(slotDay)) {
      score += 40;
    } else if (preferences.preferredDayOfWeek.length > 0) {
      // Partial score for adjacent days
      const minDiff = Math.min(
        ...preferences.preferredDayOfWeek.map(d => Math.min(
          Math.abs(d - slotDay),
          7 - Math.abs(d - slotDay)
        ))
      );
      score += Math.max(0, 40 - (minDiff * 10));
    }

    // Time of day match (30 points)
    const hour = slotTime.getHours();
    let slotTimeOfDay: 'morning' | 'afternoon' | 'evening';
    if (hour < 12) slotTimeOfDay = 'morning';
    else if (hour < 17) slotTimeOfDay = 'afternoon';
    else slotTimeOfDay = 'evening';

    if (slotTimeOfDay === preferences.preferredTimeOfDay) {
      score += 30;
    }

    // Stylist match (30 points)
    if (staffId && preferences.preferredStylistId && staffId === preferences.preferredStylistId) {
      score += 30;
    }

    return Math.min(score, maxScore);
  }
}
