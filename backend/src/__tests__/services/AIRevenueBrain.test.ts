import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIRevenueBrain } from '../../services/AIRevenueBrain';
import { query } from '../../config/db';

// Mock the database query function
vi.mock('../../config/db', () => ({
  query: vi.fn(),
}));

describe('AIRevenueBrain', () => {
  const mockSalonId = 'salon-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('forecastDemand', () => {
    it('should return average daily bookings and recommendation when demand is low', async () => {
      // Arrange
      const mockStats = {
        rows: [
          { d: '2024-01-01', c: '5' },
          { d: '2024-01-02', c: '8' },
          { d: '2024-01-03', c: '7' },
        ],
      };

      vi.mocked(query).mockResolvedValue(mockStats);

      // Act
      const result = await AIRevenueBrain.forecastDemand(mockSalonId);

      // Assert
      expect(result.averageDailyBookings).toBe(6.666666666666667); // (5+8+7)/3
      expect(result.recommendation).toBe('Run promotion or rebooking campaign');

      // Verify the query was called with correct parameters
      expect(query).toHaveBeenCalledWith(
        `
   SELECT DATE(appointment_date) d, COUNT(*) c
   FROM appointments
   WHERE salon_id=$1
   GROUP BY d
   ORDER BY d DESC
   LIMIT 30
  `,
        [mockSalonId]
      );
    });

    it('should return average daily bookings and recommendation when demand is healthy', async () => {
      // Arrange
      const mockStats = {
        rows: [
          { d: '2024-01-01', c: '15' },
          { d: '2024-01-02', c: '12' },
          { d: '2024-01-03', c: '18' },
        ],
      };

      vi.mocked(query).mockResolvedValue(mockStats);

      // Act
      const result = await AIRevenueBrain.forecastDemand(mockSalonId);

      // Assert
      expect(result.averageDailyBookings).toBe(15); // (15+12+18)/3
      expect(result.recommendation).toBe('Demand healthy');

      // Verify the query was called with correct parameters
      expect(query).toHaveBeenCalledWith(
        `
   SELECT DATE(appointment_date) d, COUNT(*) c
   FROM appointments
   WHERE salon_id=$1
   GROUP BY d
   ORDER BY d DESC
   LIMIT 30
  `,
        [mockSalonId]
      );
    });

    it('should handle empty stats (no appointments)', async () => {
      // Arrange
      const mockStats = {
        rows: [],
      };

      vi.mocked(query).mockResolvedValue(mockStats);

      // Act
      const result = await AIRevenueBrain.forecastDemand(mockSalonId);

      // Assert
      expect(result.averageDailyBookings).toBe(0); // 0 / (0 || 1) = 0
      expect(result.recommendation).toBe('Run promotion or rebooking campaign'); // avg < 10

      // Verify the query was called with correct parameters
      expect(query).toHaveBeenCalledWith(
        `
   SELECT DATE(appointment_date) d, COUNT(*) c
   FROM appointments
   WHERE salon_id=$1
   GROUP BY d
   ORDER BY d DESC
   LIMIT 30
  `,
        [mockSalonId]
      );
    });

    it('should handle database query errors', async () => {
      // Arrange
      const mockError = new Error('Database connection failed');
      vi.mocked(query).mockRejectedValue(mockError);

      // Act & Assert
      await expect(AIRevenueBrain.forecastDemand(mockSalonId)).rejects.toThrow('Database connection failed');

      // Verify the query was called with correct parameters
      expect(query).toHaveBeenCalledWith(
        `
   SELECT DATE(appointment_date) d, COUNT(*) c
   FROM appointments
   WHERE salon_id=$1
   GROUP BY d
   ORDER BY d DESC
   LIMIT 30
  `,
        [mockSalonId]
      );
    });
  });
});
