import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import appointmentRouter from '../../routes/appointmentRoutes';
import { AppointmentRepository } from '../../repositories/AppointmentRepository';

vi.mock('../../repositories/AppointmentRepository', () => ({
  AppointmentRepository: { rescheduleAppointment: vi.fn() },
}));
vi.mock('../../middleware/validateUUID', () => ({
  validateUUID: vi.fn((req, res, next) => next()),
}));

describe('appointmentRoutes - reschedule', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/appointments', appointmentRouter);
  });

  it('should reschedule appointment to new time', async () => {
    const updated = {
      id: '1',
      appointment_time: '2024-01-01T14:00:00Z',
      status: 'SCHEDULED',
    };
    vi.mocked(AppointmentRepository.rescheduleAppointment).mockResolvedValue(updated);

    const res = await request(app)
      .patch('/api/appointments/1/reschedule')
      .send({ newDate: '2024-01-01', newStartTime: '2024-01-01T14:00:00Z', newEndTime: '2024-01-01T14:30:00Z' });

    expect(res.status).toBe(200);
    expect(res.body.appointment_time).toBe('2024-01-01T14:00:00Z');
    expect(AppointmentRepository.rescheduleAppointment).toHaveBeenCalledWith('1', '2024-01-01T14:00:00Z');
  });

  it('should return 400 on error', async () => {
    vi.mocked(AppointmentRepository.rescheduleAppointment).mockRejectedValue(new Error('Not found'));

    const res = await request(app)
      .patch('/api/appointments/1/reschedule')
      .send({ newDate: '2024-01-01', newStartTime: '2024-01-01T14:00:00Z', newEndTime: '2024-01-01T14:30:00Z' });

    expect(res.status).toBe(400);
  });
});
