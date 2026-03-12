import { StaffAvailabilityRepository } from '../repositories/StaffAvailabilityRepository';
import { StaffRepository } from '../repositories/StaffRepository';

export type AvailabilityValidationResult = {
  isReady: boolean;
  totalStaff: number;
  staffWithCompleteHours: number;
  staffWithMissingHours: Array<{
    staff_id: string;
    staff_name: string;
    missing_days: number[];
  }>;
  canGenerateSlots: boolean;
};

export class StaffAvailabilityService {
  static async validateAvailability(salonId: string): Promise<AvailabilityValidationResult> {
    const summary = await StaffAvailabilityRepository.getAvailabilitySummary(salonId);
    const staffWithMissingHours = summary
      .filter(s => s.missing_weekdays.length > 0)
      .map(s => ({ staff_id: s.staff_id, staff_name: s.staff_name, missing_days: s.missing_weekdays }));
    const staffWithCompleteHours = summary.filter(s => s.missing_weekdays.length === 0).length;
    return {
      isReady: staffWithMissingHours.length === 0 && summary.length > 0,
      totalStaff: summary.length,
      staffWithCompleteHours,
      staffWithMissingHours,
      canGenerateSlots: staffWithCompleteHours > 0
    };
  }

  static async autoSeedAvailability(salonId: string, options?: { startTime?: string; endTime?: string }) {
    const result = await StaffAvailabilityRepository.autoSeedMissingAvailability(salonId, options);
    return { success: true, ...result, errors: [] as Array<{staff_id: string; error: string}> };
  }

  static async ensureStaffAvailability(salonId: string, staffId: string, options?: { startTime?: string; endTime?: string }) {
    const hasComplete = await StaffAvailabilityRepository.hasCompleteWorkingHours(salonId, staffId);
    if (hasComplete) return { success: true, daysAdded: 0, message: 'Staff already has complete working hours' };
    const allHours = await StaffAvailabilityRepository.getAllWorkingHours(salonId, staffId);
    const presentWeekdays = allHours.map(h => h.weekday);
    const missingWeekdays = StaffAvailabilityRepository.WEEKDAYS.filter(w => !presentWeekdays.includes(w));
    await StaffAvailabilityRepository.seedDefaultWorkingHours(salonId, staffId, { ...options, weekdays: missingWeekdays });
    return { success: true, daysAdded: missingWeekdays.length, message: `Added ${missingWeekdays.length} days of working hours` };
  }
}
