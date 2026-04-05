import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentRecordingService } from '../../services/PaymentRecordingService';

vi.mock('../../repositories/PaymentRecordingRepository', () => ({
  default: {
    getPaymentById: vi.fn(),
    getPaymentsByFilters: vi.fn(),
    getPaymentStats: vi.fn(),
  },
}));

import PaymentRecordingRepository from '../../repositories/PaymentRecordingRepository';

describe('PaymentRecordingService - getPayment / filters / stats', () => {
  let service: PaymentRecordingService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PaymentRecordingService();
  });

  it('should get payment by id', async () => {
    const mockPayment = {
      id: 'pay-1', salon_id: 'salon-1', amount: 500,
      payment_method: 'cash', payment_status: 'completed',
    };
    vi.mocked(PaymentRecordingRepository.getPaymentById).mockResolvedValue(mockPayment);

    const result = await service.getPaymentById('pay-1', 'salon-1');
    expect(result.id).toBe('pay-1');
  });

  it('should throw 404 when payment not found by id', async () => {
    vi.mocked(PaymentRecordingRepository.getPaymentById).mockResolvedValue(null);

    await expect(service.getPaymentById('pay-999', 'salon-1'))
      .rejects.toThrow('Payment not found');
  });

  it('should throw 400 when ids are missing for getPaymentById', async () => {
    await expect(service.getPaymentById('', 'salon-1'))
      .rejects.toThrow('Payment ID and Salon ID are required');
  });

  it('should get payments by filters with pagination', async () => {
    vi.mocked(PaymentRecordingRepository.getPaymentsByFilters).mockResolvedValue({
      payments: [{ id: 'pay-1' }], total: 1,
    });

    const result = await service.getPaymentsByFilters({
      salon_id: 'salon-1', page: 1, limit: 10,
    });

    expect(result.payments).toHaveLength(1);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.total_pages).toBe(1);
  });

  it('should calculate total_pages correctly', async () => {
    vi.mocked(PaymentRecordingRepository.getPaymentsByFilters).mockResolvedValue({
      payments: [], total: 25,
    });

    const result = await service.getPaymentsByFilters({
      salon_id: 'salon-1', page: 1, limit: 10,
    });

    expect(result.total_pages).toBe(3); // ceil(25/10)
  });

  it('should throw 400 when salon_id missing for filters', async () => {
    await expect(service.getPaymentsByFilters({ salon_id: '' } as any))
      .rejects.toThrow('Salon ID is required');
  });

  it('should get payment stats', async () => {
    const mockStats = {
      total_amount: 15000,
      transaction_count: 30,
      by_method: { cash: { amount: 10000, count: 20 } },
      by_status: { completed: { amount: 15000, count: 30 } },
    };
    vi.mocked(PaymentRecordingRepository.getPaymentStats).mockResolvedValue(mockStats);

    const result = await service.getPaymentStats('salon-1');
    expect(result.total_amount).toBe(15000);
  });

  it('should get today summary', async () => {
    const mockStats = {
      total_amount: 5000,
      transaction_count: 10,
      by_method: { cash: { amount: 3000, count: 6 }, upi: { amount: 2000, count: 4 } },
    };
    vi.mocked(PaymentRecordingRepository.getPaymentStats).mockResolvedValue(mockStats);

    const result = await service.getTodaySummary('salon-1');
    expect(result.total_amount).toBe(5000);
    expect(result.transaction_count).toBe(10);
    expect(result.by_method).toHaveProperty('cash');
    expect(result.by_method).toHaveProperty('upi');
  });
});
