import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentRecordingService } from '../../services/PaymentRecordingService';

vi.mock('../../repositories/PaymentRecordingRepository', () => ({
  default: {
    createPayment: vi.fn(),
  },
}));

import PaymentRecordingRepository from '../../repositories/PaymentRecordingRepository';

describe('PaymentRecordingService - createPayment', () => {
  let service: PaymentRecordingService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PaymentRecordingService();
  });

  it('should create a cash payment successfully', async () => {
    const mockPayment = {
      id: 'pay-1',
      salon_id: 'salon-1',
      amount: 500,
      payment_method: 'cash',
      payment_status: 'completed',
      recorded_by: 'user-1',
      recorded_at: new Date(),
    };
    vi.mocked(PaymentRecordingRepository.createPayment).mockResolvedValue(mockPayment);

    const result = await service.createPayment({
      salon_id: 'salon-1',
      amount: 500,
      payment_method: 'cash',
      recorded_by: 'user-1',
    });

    expect(result).toEqual(mockPayment);
    expect(PaymentRecordingRepository.createPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        salon_id: 'salon-1',
        amount: 500,
        payment_method: 'cash',
        payment_status: 'completed',
        recorded_by: 'user-1',
      })
    );
  });

  it('should create a UPI payment with reference number', async () => {
    const mockPayment = {
      id: 'pay-2',
      salon_id: 'salon-1',
      amount: 300,
      payment_method: 'upi',
      payment_status: 'completed',
      reference_number: 'UPI-REF-123',
      recorded_by: 'user-1',
      recorded_at: new Date(),
    };
    vi.mocked(PaymentRecordingRepository.createPayment).mockResolvedValue(mockPayment);

    const result = await service.createPayment({
      salon_id: 'salon-1',
      amount: 300,
      payment_method: 'upi',
      reference_number: 'UPI-REF-123',
      recorded_by: 'user-1',
    });

    expect(result.payment_method).toBe('upi');
    expect(PaymentRecordingRepository.createPayment).toHaveBeenCalled();
  });

  it('should create payment linked to appointment', async () => {
    const mockPayment = {
      id: 'pay-3',
      salon_id: 'salon-1',
      appointment_id: 'apt-1',
      client_id: 'client-1',
      amount: 200,
      payment_method: 'card',
      payment_status: 'completed',
      recorded_by: 'user-1',
      recorded_at: new Date(),
    };
    vi.mocked(PaymentRecordingRepository.createPayment).mockResolvedValue(mockPayment);

    const result = await service.createPayment({
      salon_id: 'salon-1',
      appointment_id: 'apt-1',
      client_id: 'client-1',
      amount: 200,
      payment_method: 'card',
      recorded_by: 'user-1',
    });

    expect(result.appointment_id).toBe('apt-1');
    expect(result.client_id).toBe('client-1');
  });

  it('should throw 400 when salon_id is missing', async () => {
    await expect(
      service.createPayment({
        salon_id: '',
        amount: 500,
        payment_method: 'cash',
        recorded_by: 'user-1',
      } as any)
    ).rejects.toThrow('Salon ID is required');
  });

  it('should throw 400 when amount is zero', async () => {
    await expect(
      service.createPayment({
        salon_id: 'salon-1',
        amount: 0,
        payment_method: 'cash',
        recorded_by: 'user-1',
      })
    ).rejects.toThrow('Amount must be greater than 0');
  });

  it('should throw 400 when amount is negative', async () => {
    await expect(
      service.createPayment({
        salon_id: 'salon-1',
        amount: -100,
        payment_method: 'cash',
        recorded_by: 'user-1',
      })
    ).rejects.toThrow('Amount must be greater than 0');
  });

  it('should throw 400 when payment_method is missing', async () => {
    await expect(
      service.createPayment({
        salon_id: 'salon-1',
        amount: 500,
        payment_method: undefined as any,
        recorded_by: 'user-1',
      })
    ).rejects.toThrow('Payment method is required');
  });

  it('should throw 400 when recorded_by is missing', async () => {
    await expect(
      service.createPayment({
        salon_id: 'salon-1',
        amount: 500,
        payment_method: 'cash',
        recorded_by: undefined as any,
      })
    ).rejects.toThrow('Recorded by is required');
  });

  it('should throw 400 for invalid payment method', async () => {
    await expect(
      service.createPayment({
        salon_id: 'salon-1',
        amount: 500,
        payment_method: 'bitcoin' as any,
        recorded_by: 'user-1',
      })
    ).rejects.toThrow('Invalid payment method');
  });
});
