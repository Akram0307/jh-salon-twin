import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockLogError, mockLogInfo, mockGenerateOffer, MockDynamicOfferGenerator } = vi.hoisted(() => {
  const mockLogError = vi.fn();
  const mockLogInfo = vi.fn();
  const mockGenerateOffer = vi.fn();
  class MockDynamicOfferGenerator {
    generateOffer = mockGenerateOffer;
  }
  return { mockLogError, mockLogInfo, mockGenerateOffer, MockDynamicOfferGenerator };
});

vi.mock('../../config/logger', () => ({
  default: {
    child: vi.fn(() => ({
      info: mockLogInfo,
      error: mockLogError,
      warn: vi.fn(),
      debug: vi.fn(),
    })),
  },
}));

vi.mock('../../config/db', () => ({
  query: vi.fn(),
}));

vi.mock('../../services/UpsellService', () => ({
  UpsellService: {
    getUpsells: vi.fn(),
  },
}));

vi.mock('../../services/TwilioWhatsAppService', () => ({
  sendWaitlistOffer: vi.fn(),
}));

vi.mock('../../services/DynamicOfferGenerator', () => ({
  DynamicOfferGenerator: MockDynamicOfferGenerator,
}));

import { ClientRevenueOrchestrator } from '../../services/ClientRevenueOrchestrator';
import { UpsellService } from '../../services/UpsellService';
import { sendWaitlistOffer } from '../../services/TwilioWhatsAppService';

describe('ClientRevenueOrchestrator', () => {
  const mockSalonId = 'b0dcbd9e-1ca0-450e-a299-7ad239f848f4';
  let orchestrator: ClientRevenueOrchestrator;

  beforeEach(() => {
    vi.clearAllMocks();
    orchestrator = new ClientRevenueOrchestrator();
  });

  describe('runDailyRevenueCycle', () => {
    it('should call UpsellService.getUpsells with correct base service ID', async () => {
      vi.mocked(UpsellService.getUpsells).mockResolvedValue([]);
      await orchestrator.runDailyRevenueCycle(mockSalonId);
      expect(UpsellService.getUpsells).toHaveBeenCalledWith('2bb87460-320b-42d8-9f07-3fbb659e6b0f');
    });

    it('should not call sendWaitlistOffer when no upsells found', async () => {
      vi.mocked(UpsellService.getUpsells).mockResolvedValue([]);
      await orchestrator.runDailyRevenueCycle(mockSalonId);
      expect(sendWaitlistOffer).not.toHaveBeenCalled();
    });

    it('should not call sendWaitlistOffer when upsells is null', async () => {
      vi.mocked(UpsellService.getUpsells).mockResolvedValue(null as any);
      await orchestrator.runDailyRevenueCycle(mockSalonId);
      expect(sendWaitlistOffer).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const mockError = new Error('Database connection failed');
      vi.mocked(UpsellService.getUpsells).mockRejectedValue(mockError);
      await orchestrator.runDailyRevenueCycle(mockSalonId);
      expect(mockLogError).toHaveBeenCalledWith(
        { err: mockError },
        '[ClientRevenueOrchestrator] Revenue cycle failed:'
      );
    });

    it('should skip dynamic offer generation for non-UUID salonId', async () => {
      const nonUuidSalon = 'not-a-uuid';
      const mockUpsells = [{ upsell_service_id: 'upsell-1', name: 'Add-on Service' }];
      vi.mocked(UpsellService.getUpsells).mockResolvedValue(mockUpsells);
      await orchestrator.runDailyRevenueCycle(nonUuidSalon);
      expect(UpsellService.getUpsells).toHaveBeenCalled();
    });

    it('should call sendWaitlistOffer when upsells exist', async () => {
      const mockUpsells = [{ upsell_service_id: 'upsell-1', name: 'Add-on Service' }];
      vi.mocked(UpsellService.getUpsells).mockResolvedValue(mockUpsells);
      mockGenerateOffer.mockResolvedValue({ message: 'Test offer' });
      vi.mocked(sendWaitlistOffer).mockResolvedValue(undefined);
      await orchestrator.runDailyRevenueCycle(mockSalonId);
      expect(sendWaitlistOffer).toHaveBeenCalled();
    });
  });
});
