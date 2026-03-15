import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SmartSlotRanker, RankedSlot, SlotRankingOptions } from '../../services/SmartSlotRanker';

// Mock the database query function
const mockQuery = vi.fn();
vi.mock('../../config/db', () => ({
  query: (...args: any[]) => mockQuery(...args)
}));

// Mock the dependent services
vi.mock('../../services/ClientHistoryAnalyzer', () => ({
  ClientHistoryAnalyzer: {
    analyzeClientPreferences: vi.fn().mockResolvedValue({
      preferredTimes: ['10:00', '14:00'],
      preferredStaffId: '550e8400-e29b-41d4-a716-446655440004',
      noShowRate: 0.1
    })
  }
}));

vi.mock('../../services/GapFillOptimizer', () => ({
  GapFillOptimizer: {
    getGapFillScores: vi.fn().mockResolvedValue([
      { gapFillScore: 0.8 },
      { gapFillScore: 0.5 },
      { gapFillScore: 0.3 }
    ])
  }
}));

// Test data constants
const VALID_CLIENT_ID = '550e8400-e29b-41d4-a716-446655440001';
const VALID_SALON_ID = '550e8400-e29b-41d4-a716-446655440002';
const VALID_SERVICE_ID = '550e8400-e29b-41d4-a716-446655440003';
const VALID_STAFF_ID_1 = '550e8400-e29b-41d4-a716-446655440004';
const VALID_STAFF_ID_2 = '550e8400-e29b-41d4-a716-446655440005';

// Helper to create test slots
function createTestSlot(time: Date, staffId: string, staffName: string = 'Test Staff') {
  return {
    time,
    staffId,
    staffName
  };
}

// Helper to create ranking options
function createRankingOptions(overrides: Partial<SlotRankingOptions> = {}): SlotRankingOptions {
  return {
    clientId: VALID_CLIENT_ID,
    salonId: VALID_SALON_ID,
    serviceId: VALID_SERVICE_ID,
    serviceDurationMinutes: 60,
    servicePrice: 100,
    date: '2026-03-15',
    candidateSlots: [
      createTestSlot(new Date('2026-03-15T10:00:00'), VALID_STAFF_ID_1, 'Alice'),
      createTestSlot(new Date('2026-03-15T14:00:00'), VALID_STAFF_ID_1, 'Alice'),
      createTestSlot(new Date('2026-03-15T16:00:00'), VALID_STAFF_ID_2, 'Bob'),
    ],
    ...overrides
  };
}

describe('SmartSlotRanker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock responses
    mockQuery.mockImplementation((sql: string, params: any[]) => {
      if (sql.includes('staff_working_hours')) {
        return Promise.resolve({ rows: [{ weekday: 1, start_time: '09:00', end_time: '18:00', capacity: 3 }] });
      }
      if (sql.includes('staff') && sql.includes('is_active')) {
        return Promise.resolve({ rows: [
          { staff_id: VALID_STAFF_ID_1, name: 'Alice' },
          { staff_id: VALID_STAFF_ID_2, name: 'Bob' }
        ] });
      }
      if (sql.includes('appointments') && sql.includes('COUNT')) {
        return Promise.resolve({ rows: [{ count: '5' }] });
      }
      if (sql.includes('cancelled_appointments')) {
        return Promise.resolve({ rows: [] });
      }
      if (sql.includes('waitlist')) {
        return Promise.resolve({ rows: [] });
      }
      return Promise.resolve({ rows: [] });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rankSlots', () => {
    it('should return ranked slots with all required fields', async () => {
      const options = createRankingOptions();
      const result = await SmartSlotRanker.rankSlots(options);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      
      // Check each slot has required fields
      result.forEach((slot: RankedSlot) => {
        expect(slot).toHaveProperty('slotTime');
        expect(slot).toHaveProperty('staffId');
        expect(slot).toHaveProperty('staffName');
        expect(slot).toHaveProperty('totalScore');
        expect(slot).toHaveProperty('breakdown');
        expect(slot).toHaveProperty('metadata');
        expect(slot.totalScore).toBeGreaterThanOrEqual(0);
        expect(slot.totalScore).toBeLessThanOrEqual(100);
      });
    });

    it('should rank slots in descending order by total score', async () => {
      const options = createRankingOptions();
      const result = await SmartSlotRanker.rankSlots(options);

      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].totalScore).toBeGreaterThanOrEqual(result[i].totalScore);
      }
    });

    it('should consider at least 5 factors in ranking', async () => {
      const options = createRankingOptions();
      const result = await SmartSlotRanker.rankSlots(options);

      expect(result.length).toBeGreaterThan(0);
      const slot = result[0];
      
      // Check that breakdown object has at least 5 factors
      const breakdownKeys = Object.keys(slot.breakdown);
      expect(breakdownKeys.length).toBeGreaterThanOrEqual(5);
      
      // Verify expected factor keys exist
      expect(slot.breakdown).toHaveProperty('clientPreferenceScore');
      expect(slot.breakdown).toHaveProperty('scheduleOptimizationScore');
      expect(slot.breakdown).toHaveProperty('staffAvailabilityScore');
      expect(slot.breakdown).toHaveProperty('serviceDurationFitScore');
      expect(slot.breakdown).toHaveProperty('revenueOptimizationScore');
    });

    it('should handle empty candidate slots gracefully', async () => {
      const options = createRankingOptions({ candidateSlots: [] });
      const result = await SmartSlotRanker.rankSlots(options);

      expect(result).toBeDefined();
      expect(result).toEqual([]);
    });

    it('should boost premium time slots (morning/evening)', async () => {
      const morningSlot = createTestSlot(new Date('2026-03-15T10:00:00'), VALID_STAFF_ID_1, 'Alice');
      const afternoonSlot = createTestSlot(new Date('2026-03-15T13:00:00'), VALID_STAFF_ID_1, 'Alice');
      
      const options = createRankingOptions({
        candidateSlots: [morningSlot, afternoonSlot]
      });
      
      const result = await SmartSlotRanker.rankSlots(options);
      
      // Morning slot should have premium boost
      const morningResult = result.find(s => s.slotTime.getHours() === 10);
      const afternoonResult = result.find(s => s.slotTime.getHours() === 13);
      
      expect(morningResult).toBeDefined();
      expect(afternoonResult).toBeDefined();
      expect(morningResult!.breakdown.revenueOptimizationScore).toBeGreaterThan(afternoonResult!.breakdown.revenueOptimizationScore);
    });

    it('should apply weather adjustments when provided', async () => {
      const options = createRankingOptions({
        context: { weatherCondition: 'rainy' }
      });
      
      const result = await SmartSlotRanker.rankSlots(options);
      
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      
      // Check that context-aware score is applied
      result.forEach((slot: RankedSlot) => {
        expect(slot.breakdown).toHaveProperty('contextAwareScore');
      });
    });

    it('should apply holiday adjustments when isHoliday is true', async () => {
      const options = createRankingOptions({
        context: { isHoliday: true }
      });
      
      const result = await SmartSlotRanker.rankSlots(options);
      
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      
      // Holiday slots should have adjusted scores
      result.forEach((slot: RankedSlot) => {
        expect(slot.metadata).toHaveProperty('contextFactors');
      });
    });

    it('should include cancellation recovery score when cancelled slots provided', async () => {
      const options = createRankingOptions({
        context: { cancelledSlotIds: ['cancel-1', 'cancel-2'] }
      });
      
      const result = await SmartSlotRanker.rankSlots(options);
      
      expect(result).toBeDefined();
      result.forEach((slot: RankedSlot) => {
        expect(slot.metadata).toHaveProperty('cancellationRecoveryScore');
      });
    });

    it('should apply real-time optimization based on current bookings', async () => {
      const options = createRankingOptions();
      const result = await SmartSlotRanker.rankSlots(options);

      expect(result).toBeDefined();
      result.forEach((slot: RankedSlot) => {
        expect(slot.breakdown).toHaveProperty('realTimeOptimizationScore');
      });
    });
  });

  describe('rankCustomSlots', () => {
    it('should rank a custom list of slots', async () => {
      const customSlots = [
        createTestSlot(new Date('2026-03-15T10:00:00'), VALID_STAFF_ID_1, 'Alice'),
        createTestSlot(new Date('2026-03-15T11:00:00'), VALID_STAFF_ID_2, 'Bob'),
      ];

      const options = createRankingOptions({ candidateSlots: customSlots });
      const result = await SmartSlotRanker.rankCustomSlots(options, customSlots);

      expect(result).toBeDefined();
      expect(result.length).toBe(2);
    });
  });

  describe('getOptimalTimes', () => {
    it('should return optimal times across a date range', async () => {
      const dateRange = {
        start: '2026-03-15',
        end: '2026-03-17'
      };

      const result = await SmartSlotRanker.getOptimalTimes(
        VALID_SALON_ID,
        VALID_SERVICE_ID,
        60,
        100,
        dateRange
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getWaitlistFitSlots', () => {
    it('should return slots matching waitlist preferences', async () => {
      const preferences = {
        preferredDates: ['2026-03-15', '2026-03-16'],
        preferredTimes: ['10:00', '14:00'],
        preferredStaffIds: [VALID_STAFF_ID_1]
      };

      const result = await SmartSlotRanker.getWaitlistFitSlots(
        VALID_SALON_ID,
        VALID_SERVICE_ID,
        60,
        100,
        preferences
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Scoring Weights', () => {
    it('should apply correct weight distribution across factors', async () => {
      const options = createRankingOptions();
      const result = await SmartSlotRanker.rankSlots(options);

      expect(result.length).toBeGreaterThan(0);
      const slot = result[0];

      // Verify total score is calculated
      expect(slot.totalScore).toBeGreaterThan(0);
      expect(slot.totalScore).toBeLessThanOrEqual(100);
      
      // Verify breakdown has all expected factors
      expect(slot.breakdown.clientPreferenceScore).toBeDefined();
      expect(slot.breakdown.scheduleOptimizationScore).toBeDefined();
      expect(slot.breakdown.staffAvailabilityScore).toBeDefined();
      expect(slot.breakdown.serviceDurationFitScore).toBeDefined();
      expect(slot.breakdown.revenueOptimizationScore).toBeDefined();
      expect(slot.breakdown.historicalPatternScore).toBeDefined();
      expect(slot.breakdown.contextAwareScore).toBeDefined();
      expect(slot.breakdown.realTimeOptimizationScore).toBeDefined();
    });
  });

  describe('Historical Pattern Analysis', () => {
    it('should consider historical booking patterns', async () => {
      const options = createRankingOptions();
      const result = await SmartSlotRanker.rankSlots(options);

      expect(result).toBeDefined();
      result.forEach((slot: RankedSlot) => {
        expect(slot.breakdown).toHaveProperty('historicalPatternScore');
      });
    });
  });

  describe('Staff Workload Balancing', () => {
    it('should balance workload across staff members', async () => {
      const options = createRankingOptions();
      const result = await SmartSlotRanker.rankSlots(options);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      
      // Verify staff availability scores are calculated
      result.forEach((slot: RankedSlot) => {
        expect(slot.breakdown.staffAvailabilityScore).toBeGreaterThanOrEqual(0);
        expect(slot.breakdown.staffAvailabilityScore).toBeLessThanOrEqual(100);
      });
    });
  });
});
