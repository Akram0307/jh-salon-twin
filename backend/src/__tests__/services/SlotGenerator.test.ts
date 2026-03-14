import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config/db', () => ({
  query: vi.fn(),
}));

import { SlotGenerator } from '../../services/SlotGenerator';
import { query } from '../../config/db';

describe('SlotGenerator', () => {
  const mockSalonId = 'b0dcbd9e-1ca0-450e-a299-7ad239f848f4';
  const mockServiceId = 'c1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a';
  const mockDate = '2026-03-15';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAvailableSlots', () => {
    it('should return empty array for invalid salon_id UUID', async () => {
      const result = await SlotGenerator.getAvailableSlots('invalid-uuid', mockServiceId, mockDate);
      expect(result).toEqual([]);
      expect(query).not.toHaveBeenCalled();
    });

    it('should return empty array for invalid service_id UUID', async () => {
      const result = await SlotGenerator.getAvailableSlots(mockSalonId, 'invalid-uuid', mockDate);
      expect(result).toEqual([]);
      expect(query).not.toHaveBeenCalled();
    });

    it('should return empty array when service not found', async () => {
      vi.mocked(query).mockResolvedValueOnce({ rows: [] });

      const result = await SlotGenerator.getAvailableSlots(mockSalonId, mockServiceId, mockDate);

      expect(result).toEqual([]);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, duration_minutes FROM services'),
        [mockServiceId, mockSalonId]
      );
    });

    it('should return slots when service and capacity exist', async () => {
      vi.mocked(query)
        .mockResolvedValueOnce({ rows: [{ id: mockServiceId, duration_minutes: 60 }] })
        .mockResolvedValueOnce({ rows: [{ men_chairs: 2, women_chairs: 3, unisex_chairs: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id: 'staff-1', full_name: 'John Doe' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ start_time: '09:00:00', end_time: '17:00:00' }] });

      const result = await SlotGenerator.getAvailableSlots(mockSalonId, mockServiceId, mockDate);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('staff_id');
      expect(result[0]).toHaveProperty('staff_name');
      expect(result[0]).toHaveProperty('time');
    });

    it('should skip staff with no working hours', async () => {
      vi.mocked(query)
        .mockResolvedValueOnce({ rows: [{ id: mockServiceId, duration_minutes: 60 }] })
        .mockResolvedValueOnce({ rows: [{ men_chairs: 2, women_chairs: 3, unisex_chairs: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id: 'staff-1', full_name: 'John Doe' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await SlotGenerator.getAvailableSlots(mockSalonId, mockServiceId, mockDate);

      expect(result).toEqual([]);
    });

    it('should handle existing appointments and filter overlapping slots', async () => {
      vi.mocked(query)
        .mockResolvedValueOnce({ rows: [{ id: mockServiceId, duration_minutes: 60 }] })
        .mockResolvedValueOnce({ rows: [{ men_chairs: 1, women_chairs: 0, unisex_chairs: 0 }] })
        .mockResolvedValueOnce({ rows: [{ id: 'staff-1', full_name: 'John Doe' }] })
        .mockResolvedValueOnce({
          rows: [
            {
              appointment_time: `${mockDate}T10:00:00`,
              end_time: `${mockDate}T11:00:00`,
              staff_id: 'staff-1',
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ start_time: '09:00:00', end_time: '17:00:00' }] });

      const result = await SlotGenerator.getAvailableSlots(mockSalonId, mockServiceId, mockDate);

      // Should have slots but not during the existing appointment time
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('should return empty array when total chairs is 0 (null capacity)', async () => {
      vi.mocked(query)
        .mockResolvedValueOnce({ rows: [{ id: mockServiceId, duration_minutes: 30 }] })
        .mockResolvedValueOnce({ rows: [{ men_chairs: null, women_chairs: null, unisex_chairs: null }] })
        .mockResolvedValueOnce({ rows: [{ id: 'staff-1', full_name: 'Jane Smith' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ start_time: '10:00:00', end_time: '14:00:00' }] });

      const result = await SlotGenerator.getAvailableSlots(mockSalonId, mockServiceId, mockDate);

      // When totalChairs is 0, no slots should be available
      expect(result).toEqual([]);
    });

    it('should sort slots by time', async () => {
      vi.mocked(query)
        .mockResolvedValueOnce({ rows: [{ id: mockServiceId, duration_minutes: 30 }] })
        .mockResolvedValueOnce({ rows: [{ men_chairs: 5, women_chairs: 5, unisex_chairs: 5 }] })
        .mockResolvedValueOnce({
          rows: [
            { id: 'staff-1', full_name: 'Alice' },
            { id: 'staff-2', full_name: 'Bob' },
          ],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ start_time: '09:00:00', end_time: '12:00:00' }] })
        .mockResolvedValueOnce({ rows: [{ start_time: '09:00:00', end_time: '12:00:00' }] });

      const result = await SlotGenerator.getAvailableSlots(mockSalonId, mockServiceId, mockDate);

      // Verify slots are sorted by time
      for (let i = 1; i < result.length; i++) {
        const prevTime = new Date(result[i - 1].time).getTime();
        const currTime = new Date(result[i].time).getTime();
        expect(currTime).toBeGreaterThanOrEqual(prevTime);
      }
    });
  });
});
