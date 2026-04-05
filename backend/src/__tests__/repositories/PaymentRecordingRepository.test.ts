import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockQuery = vi.hoisted(() => vi.fn());

vi.mock('../../config/db', () => ({
  default: { query: mockQuery },
  pool: { query: mockQuery },
}));

import PaymentRecordingRepository from '../../repositories/PaymentRecordingRepository';

describe('PaymentRecordingRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a payment record', async () => {
    const mockRow = {
      id: 'pay-1', salon_id: 'salon-1', amount: 500,
      payment_method: 'cash', payment_status: 'completed',
    };
    mockQuery.mockResolvedValue({ rows: [mockRow] });

    const result = await PaymentRecordingRepository.createPayment({
      salon_id: 'salon-1', amount: 500, payment_method: 'cash',
      payment_status: 'completed', recorded_by: 'user-1', recorded_at: new Date(),
    });

    expect(result.id).toBe('pay-1');
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO payment_records'),
      expect.arrayContaining(['salon-1', 500, 'cash', 'completed', 'user-1'])
    );
  });

  it('should get payment by id', async () => {
    const mockRow = { id: 'pay-1', salon_id: 'salon-1', amount: 500 };
    mockQuery.mockResolvedValue({ rows: [mockRow] });

    const result = await PaymentRecordingRepository.getPaymentById('pay-1', 'salon-1');

    expect(result).toEqual(mockRow);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM payment_records'),
      ['pay-1', 'salon-1']
    );
  });

  it('should return null when payment not found by id', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    const result = await PaymentRecordingRepository.getPaymentById('pay-999', 'salon-1');

    expect(result).toBeNull();
  });

  it('should get payments by filters', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: 'pay-1' }], rowCount: 1 });

    const result = await PaymentRecordingRepository.getPaymentsByFilters({
      salon_id: 'salon-1', payment_method: 'cash',
    });

    expect(result.payments).toHaveLength(1);
    expect(mockQuery).toHaveBeenCalled();
  });
});
