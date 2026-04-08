import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SmartUpsellEngine, UpsellSuggestion } from '../../../services/SmartUpsellEngine';
import { query } from '../../../config/db';

// Mock the database query function
vi.mock('../../../config/db', () => ({
  query: vi.fn(),
}));


const mockSalonId = 'salon-456';
const mockServiceId = 'service-789';


describe('SmartUpsellEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('recommendAddons', () => {
    it('should return affinity-based suggestions ranked by co-occurrence', async () => {
      // Mock: affinity query finds 2 co-booked services
      vi.mocked(query)
        // affinity
        .mockResolvedValueOnce({
          rows: [
            { id: 'svc-2', name: 'Hair Coloring', price: 800, duration_minutes: 60, co_occurrence: 15 },
            { id: 'svc-3', name: 'Head Massage', price: 200, duration_minutes: 15, co_occurrence: 10 },
          ],
        })
        // price tier – source service found but no tier matches
        .mockResolvedValueOnce({
          rows: [{ price: 500, category: 'Hair' }],
        })
        .mockResolvedValueOnce({ rows: [] })
        // time-based
        .mockResolvedValueOnce({ rows: [] })
        // popular fallback
        .mockResolvedValueOnce({ rows: [] });


      const result: UpsellSuggestion[] = await SmartUpsellEngine.recommendAddons(
        mockServiceId,
        mockSalonId,
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].category).toBe('affinity');
      expect(result[0].id).toBe('svc-2');
      expect(result[0].confidence).toBeGreaterThan(result[1].confidence);
      expect(result[0].reason).toContain('15x');
    });


    it('should return price-tier suggestions when affinity returns empty', async () => {
      vi.mocked(query)
        // affinity – empty
        .mockResolvedValueOnce({ rows: [] })
        // price tier – source service is premium (price=1200)
        .mockResolvedValueOnce({ rows: [{ price: 1200, category: 'Hair' }] })
        // tier matches: 2 premium services
        .mockResolvedValueOnce({
          rows: [
            { id: 'svc-premium-1', name: 'Keratin Treatment', price: 1500, duration_minutes: 90 },
            { id: 'svc-premium-2', name: 'Hair Spa', price: 1100, duration_minutes: 75 },
          ],
        })
        // time-based
        .mockResolvedValueOnce({ rows: [] })
        // popular fallback
        .mockResolvedValueOnce({ rows: [] });


      const result: UpsellSuggestion[] = await SmartUpsellEngine.recommendAddons(
        mockServiceId,
        mockSalonId,
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].category).toBe('price_tier');
      expect(result[0].reason).toContain('premium');
    });

    it('should suggest express services during peak hours (10-13, 16-19)', async () => {
      // Mock server time as 11:00 (peak morning)
      vi.useFakeTimers?.();
      vi.setSystemTime(new Date('2024-06-15T11:30:00'));


      vi.mocked(query)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ price: 400, category: 'Hair' }] })
        .mockResolvedValueOnce({ rows: [] })
        // time-based returns short services during peak
        .mockResolvedValueOnce({
          rows: [
            { id: 'svc-express', name: 'Blow Dry', price: 150, duration_minutes: 20 },
          ],
        })
        .mockResolvedValueOnce({ rows: [] });

      const result: UpsellSuggestion[] = await SmartUpsellEngine.recommendAddons(
        mockServiceId,
        mockSalonId,
      );


      expect(result.some(r => r.category === 'time_based' && r.reason.includes('busy hours'))).toBe(
        true,
      );
      vi.useRealTimers?.();
    });

    it('should suggest premium services off-peak', async () => {
      // Mock server time as 14:30 (off-peak afternoon)
      vi.useFakeTimers?.();
      vi.setSystemTime(new Date('2024-06-15T14:30:00'));

      vi.mocked(query)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ price: 400, category: 'Hair' }] })
        .mockResolvedValueOnce({ rows: [] })
        // off-peak: premium/longer suggestions
        .mockResolvedValueOnce({
          rows: [
            { id: 'svc-premium', name: 'Luxury Hair Treatment', price: 2000, duration_minutes: 90 },
          ],
        })
        .mockResolvedValueOnce({ rows: [] });


      const result: UpsellSuggestion[] = await SmartUpsellEngine.recommendAddons(
        mockServiceId,
        mockSalonId,
      );

      expect(result.some(r => r.category === 'time_based' && r.reason.includes('availability'))).toBe(
        true,
      );
      vi.useRealTimers?.();
    });

    it('should fall back to popular services when all intelligent recs are empty', async () => {
      vi.mocked(query)
        .mockResolvedValueOnce({ rows: [] }) // affinity
        .mockResolvedValueOnce({ rows: [{ price: 400, category: 'Hair' }] }) // src service
        .mockResolvedValueOnce({ rows: [] }) // tier match
        .mockResolvedValueOnce({ rows: [] }) // time-based
        // popular fallback
        .mockResolvedValueOnce({
          rows: [
            { id: 'svc-pop-1', name: 'Haircut', price: 300, duration_minutes: 30, booking_count: 50 },
            { id: 'svc-pop-2', name: 'Shampoo', price: 100, duration_minutes: 15, booking_count: 40 },
          ],
        });


      const result: UpsellSuggestion[] = await SmartUpsellEngine.recommendAddons(
        mockServiceId,
        mockSalonId,
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].category).toBe('popular');
    });

    it('should deduplicate results by service id, keeping highest confidence', async () => {
      // svc-2 appears in both affinity AND popular lists
      vi.mocked(query)
        .mockResolvedValueOnce({
          rows: [
            { id: 'svc-2', name: 'Hair Coloring', price: 800, duration_minutes: 60, co_occurrence: 15 },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ price: 400, category: 'Hair' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [
            { id: 'svc-2', name: 'Hair Coloring', price: 800, duration_minutes: 60, booking_count: 5 },
          ],
        });

      const result: UpsellSuggestion[] = await SmartUpsellEngine.recommendAddons(
        mockServiceId,
        mockSalonId,
      );

      const svc2Count = result.filter(r => r.id === 'svc-2').length;
      expect(svc2Count).toBe(1);
      expect(result[0].category).toBe('affinity'); // affinity has higher base confidence (0.9)
    });

    it('should exclude the source service itself from recommendations', async () => {
      vi.mocked(query)
        .mockResolvedValueOnce({
          rows: [
            { id: mockServiceId, name: 'Haircut', price: 300, duration_minutes: 30, co_occurrence: 100 },
            { id: 'svc-other', name: 'Coloring', price: 800, duration_minutes: 60, co_occurrence: 50 },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ price: 300, category: 'Hair' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const result: UpsellSuggestion[] = await SmartUpsellEngine.recommendAddons(
        mockServiceId,
        mockSalonId,
      );

      expect(result.some(r => r.id === mockServiceId)).toBe(false);
    });

    it('should limit results to top 5', async () => {
      vi.mocked(query)
        .mockResolvedValueOnce({
          rows: [
            { id: 'svc-1', name: 'S1', price: 100, duration_minutes: 15, co_occurrence: 20 },
            { id: 'svc-2', name: 'S2', price: 200, duration_minutes: 15, co_occurrence: 18 },
            { id: 'svc-3', name: 'S3', price: 300, duration_minutes: 15, co_occurrence: 15 },
            { id: 'svc-4', name: 'S4', price: 400, duration_minutes: 15, co_occurrence: 12 },
            { id: 'svc-5', name: 'S5', price: 500, duration_minutes: 15, co_occurrence: 10 },
            { id: 'svc-6', name: 'S6', price: 600, duration_minutes: 15, co_occurrence: 8 },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ price: 300, category: 'Hair' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });


      const result: UpsellSuggestion[] = await SmartUpsellEngine.recommendAddons(
        mockServiceId,
        mockSalonId,
      );

      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should propagate database errors', async () => {
      vi.mocked(query).mockRejectedValue(new Error('Database connection failed'));


      await expect(
        SmartUpsellEngine.recommendAddons(mockServiceId, mockSalonId),
      ).rejects.toThrow('Database connection failed');
    });
  });
});
