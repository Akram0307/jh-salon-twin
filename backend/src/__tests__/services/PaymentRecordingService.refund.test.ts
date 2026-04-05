import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentRecordingService } from '../../services/PaymentRecordingService';

vi.mock('../../repositories/PaymentRecordingRepository', () => ({
  default: {
    getPaymentById: vi.fn(),
    updatePayment: vi.fn(),
  },
}));

import PaymentRecordingRepository from '../../repositories/PaymentRecordingRepository';

describe('PaymentRecordingService - refundPayment', () => {
  let service: PaymentRecordingService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PaymentRecordingService();
  });

  it('should refund a completed payment', async () => {
    const existingPayment = {
      id: 'pay-1',
      salon_id: 'salon-1',
      amount: 500,
      payment_method: 'cash',
      payment_status: 'completed',
    };
    const refundedPayment = {
      ...existingPayment,
      payment_status: 'refunded',
      notes: 'Refunded from payment pay-1',
    };

    vi.mocked(PaymentRecordingRepository.getPaymentById).mockResolvedValue(existingPayment);
    vi.mocked(PaymentRecordingRepository.updatePayment).mockResolvedValue(refundedPayment);

    const result = await service.refundPayment('pay-1', 'salon-1');

    expect(result.payment_status).toBe('refunded');
    expect(PaymentRecordingRepository.updatePayment).toHaveBeenCalledWith(
      'pay-1', 'salon-1',
      expect.objectContaining({ payment_status: 'refunded' })
    );
  });

  it('should refund with custom notes', async () => {
    const existingPayment = {
      id: 'pay-1',
      salon_id: 'salon-1',
      amount: 500,
      payment_method: 'cash',
      payment_status: 'completed',
    };
    vi.mocked(PaymentRecordingRepository.getPaymentById).mockResolvedValue(existingPayment);
    vi.mocked(PaymentRecordingRepository.updatePayment).mockResolvedValue({
      ...existingPayment,
      payment_status: 'refunded',
      notes: 'Customer requested refund',
    });

    const result = await service.refundPayment('pay-1', 'salon-1', 'Customer requested refund');

    expect(PaymentRecordingRepository.updatePayment).toHaveBeenCalledWith(
      'pay-1', 'salon-1',
      expect.objectContaining({ notes: 'Customer requested refund' })
    );
  });

  it('should throw 404 when payment not found', async () => {
    vi.mocked(PaymentRecordingRepository.getPaymentById).mockResolvedValue(null);

    await expect(service.refundPayment('pay-999', 'salon-1'))
      .rejects.toThrow('Payment not found');
  });

  it('should throw 400 when payment is already refunded', async () => {
    vi.mocked(PaymentRecordingRepository.getPaymentById).mockResolvedValue({
      id: 'pay-1',
      salon_id: 'salon-1',
      payment_status: 'refunded',
    });

    await expect(service.refundPayment('pay-1', 'salon-1'))
      .rejects.toThrow('Payment is already refunded');
  });

  it('should throw 400 when payment is pending (not completed)', async () => {
    vi.mocked(PaymentRecordingRepository.getPaymentById).mockResolvedValue({
      id: 'pay-1',
      salon_id: 'salon-1',
      payment_status: 'pending',
    });

    await expect(service.refundPayment('pay-1', 'salon-1'))
      .rejects.toThrow('Only completed payments can be refunded');
  });

  it('should throw 400 when payment is failed', async () => {
    vi.mocked(PaymentRecordingRepository.getPaymentById).mockResolvedValue({
      id: 'pay-1',
      salon_id: 'salon-1',
      payment_status: 'failed',
    });

    await expect(service.refundPayment('pay-1', 'salon-1'))
      .rejects.toThrow('Only completed payments can be refunded');
  });

  it('should throw 400 when ids are missing', async () => {
    await expect(service.refundPayment('', 'salon-1'))
      .rejects.toThrow('Payment ID and Salon ID are required');
  });
});
