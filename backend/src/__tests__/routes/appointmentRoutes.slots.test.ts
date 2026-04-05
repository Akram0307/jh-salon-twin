import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import appointmentRouter from '../../routes/appointmentRoutes';
import { SlotGenerator } from '../../services/SlotGenerator';

vi.mock('../../services/SlotGenerator', () => ({
  SlotGenerator: { getAvailableSlots: vi.fn() },
}));
vi.mock('../../middleware/validateUUID', () => ({
  validateUUID: vi.fn((req, res, next) => next()),
}));

describe('appointmentRoutes - slots', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/appointments', appointmentRouter);
  });

  it('should return available slots', async () => {
    const mockSlots = [
      { start_time: '2024-01-01T11:00:00Z', end_time: '2024-01-01T11:30:00Z', available: true },
      { start_time: '2024-01-01T13:00:00Z', end_time: '2024-01-01T13:30:00Z', available: true },
    ];
    vi.mocked(SlotGenerator.getAvailableSlots).mockResolvedValue(mockSlots);

    const res = await request(app)
      .get('/api/appointments/slots?salon_id=salon-1&service_id=svc-1&date=2024-01-01');

    expect(res.status).toBe(200);
    expect(res.body.date).toBe('2024-01-01');
    expect(res.body.service_id).toBe('svc-1');
    expect(res.body.slots).toHaveLength(2);
    expect(SlotGenerator.getAvailableSlots).toHaveBeenCalledWith('salon-1', 'svc-1', '2024-01-01');
  });

  it('should return 400 when missing query params', async () => {
    const res = await request(app)
      .get('/api/appointments/slots?salon_id=salon-1');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('salon_id, service_id and date are required');
  });

  it('should return 400 when only service_id provided', async () => {
    const res = await request(app)
      .get('/api/appointments/slots?service_id=svc-1&date=2024-01-01');

    expect(res.status).toBe(400);
  });

  it('should return 500 on error', async () => {
    vi.mocked(SlotGenerator.getAvailableSlots).mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .get('/api/appointments/slots?salon_id=salon-1&service_id=svc-1&date=2024-01-01');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to generate slots');
  });
});
