import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIRevenueBrain, DemandForecast } from '../../services/AIRevenueBrain';
import { query } from '../../config/db';

// Mock the database query function
vi.mock('../../config/db', () => ({
  query: vi.fn(),
}));

const mockSalonId = 'salon-123';


describe('AIRevenueBrain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('forecastDemand', () => {
    it('should return demandHealth low when avg daily bookings < 5', async () => {
      // Parallel query mocks: [trends, peakSlots, staffing, avg]
      vi.mocked(query)
        // trends (computeTrends) – returns 2 weeks
        .mockResolvedValueOnce({
          rows: [
            { week_start: new Date('2024-01-08'), booking_count: 20, revenue: 5000 },
            { week_start: new Date('2024-01-01'), booking_count: 18, revenue: 4500 },
          ],
        })
        // peakSlots (computePeakSlots)
        .mockResolvedValueOnce({
          rows: [
            { day_of_week: 6, hour: 10, booking_density: 8 },
          ],
        })
        // staffing (computeStaffingRecommendations) – no capacity record
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        // avg (computeAverageDaily)
        .mockResolvedValueOnce({ rows: [{ avg: 3.2 }] });

      const result: DemandForecast = await AIRevenueBrain.forecastDemand(mockSalonId);


      expect(result.averageDailyBookings).toBe(3.2);
      expect(result.demandHealth).toBe('low');
      expect(result.recommendation).toContain('Demand is low');
      expect(result.trends).toHaveLength(2);
      expect(result.peakSlots[0].label).toBe('Sat 10:00');
    });

    it('should return demandHealth healthy when avg daily bookings 10-20', async () => {
      vi.mocked(query)
        .mockResolvedValueOnce({
          rows: [
            { week_start: new Date('2024-01-08'), booking_count: 80, revenue: 20000 },
            { week_start: new Date('2024-01-01'), booking_count: 75, revenue: 18500 },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            { day_of_week: 6, hour: 11, booking_density: 15 },
            { day_of_week: 6, hour: 12, booking_density: 14 },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            { men_chairs: 3, women_chairs: 4, unisex_chairs: 2 },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            { day_of_week: 6, time_slot: 'afternoon', avg_bookings: 12 },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ avg: 15 }] });

      const result: DemandForecast = await AIRevenueBrain.forecastDemand(mockSalonId);


      expect(result.averageDailyBookings).toBe(15);
      expect(result.demandHealth).toBe('healthy');
      expect(result.recommendation).toContain('Demand is healthy');
      expect(result.staffingRecommendations[0].currentCapacity).toBe(9);
    });

    it('should flag add_staff when utilization exceeds 85%', async () => {
      vi.mocked(query)
        .mockResolvedValueOnce({
          rows: [
            { week_start: new Date('2024-01-08'), booking_count: 100, revenue: 25000 },
            { week_start: new Date('2024-01-01'), booking_count: 95, revenue: 23000 },
          ],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{ men_chairs: 2, women_chairs: 2, unisex_chairs: 1 }],
        })
        .mockResolvedValueOnce({
          rows: [
            { day_of_week: 6, time_slot: 'afternoon', avg_bookings: 9 },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ avg: 25 }] });

      const result: DemandForecast = await AIRevenueBrain.forecastDemand(mockSalonId);

      expect(result.demandHealth).toBe('high');
      const understaffed = result.staffingRecommendations.filter(
        s => s.action === 'add_staff',
      );
      expect(understaffed.length).toBeGreaterThan(0);
    });

    it('should project next week bookings using linear extrapolation', async () => {
      // Week1: 60 bookings, Week2: 50, Week3: 40, Week4: 30
      // slope = (60 - 30) / (4 - 1) = 10 → next = 60 + 10 = 70
      vi.mocked(query)
        .mockResolvedValueOnce({
          rows: [
            { week_start: new Date('2024-01-22'), booking_count: 60, revenue: 15000 },
            { week_start: new Date('2024-01-15'), booking_count: 50, revenue: 12500 },
            { week_start: new Date('2024-01-08'), booking_count: 40, revenue: 10000 },
            { week_start: new Date('2024-01-01'), booking_count: 30, revenue: 7500 },
          ],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ avg: 12 }] });

      const result: DemandForecast = await AIRevenueBrain.forecastDemand(mockSalonId);

      expect(result.projectedNextWeekBookings).toBe(70);
    });

    it('should handle empty results gracefully', async () => {
      vi.mocked(query)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const result: DemandForecast = await AIRevenueBrain.forecastDemand(mockSalonId);

      expect(result.averageDailyBookings).toBe(0);
      expect(result.demandHealth).toBe('low');
      expect(result.trends).toHaveLength(0);
      expect(result.peakSlots).toHaveLength(0);
    });

    it('should propagate database errors', async () => {
      vi.mocked(query).mockRejectedValue(new Error('Database connection failed'));

      await expect(AIRevenueBrain.forecastDemand(mockSalonId)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
