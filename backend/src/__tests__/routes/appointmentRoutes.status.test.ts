import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import appointmentRouter from '../../routes/appointmentRoutes';
import { AppointmentRepository } from '../../repositories/AppointmentRepository';
import { WaitlistService } from '../../services/WaitlistService';

vi.mock('../../repositories/AppointmentRepository', () => ({
  AppointmentRepository: { updateStatus: vi.fn() },
}));
vi.mock('../../services/WaitlistService', () => ({
  WaitlistService: { processCancellation: vi.fn() },
}));
vi.mock('../../middleware/validateUUID', () => ({
  validateUUID: vi.fn((req, res, next) => next()),
}));

describe('appointmentRoutes - status update', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/appointments', appointmentRouter);
  });

  it('should update status to SCHEDULED', async () => {
    vi.mocked(AppointmentRepository.updateStatus).mockResolvedValue({
      id: '1', status: 'SCHEDULED', appointment_time: '2024-01-01T10:00:00Z',
    });

    const res = await request(app)
      .patch('/api/appointments/1/status')
      .send({ status: 'SCHEDULED' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('SCHEDULED');
  });

  it('should update status to IN_PROGRESS', async () => {
    vi.mocked(AppointmentRepository.updateStatus).mockResolvedValue({
      id: '1', status: 'IN_PROGRESS', appointment_time: '2024-01-01T10:00:00Z',
    });

    const res = await request(app)
      .patch('/api/appointments/1/status')
      .send({ status: 'IN_PROGRESS' });

    expect(res.status).toBe(200);
  });

  it('should update status to COMPLETED', async () => {
    vi.mocked(AppointmentRepository.updateStatus).mockResolvedValue({
      id: '1', status: 'COMPLETED', appointment_time: '2024-01-01T10:00:00Z',
    });

    const res = await request(app)
      .patch('/api/appointments/1/status')
      .send({ status: 'COMPLETED' });

    expect(res.status).toBe(200);
  });

  it('should update status to NO_SHOW', async () => {
    vi.mocked(AppointmentRepository.updateStatus).mockResolvedValue({
      id: '1', status: 'NO_SHOW', appointment_time: '2024-01-01T10:00:00Z',
    });

    const res = await request(app)
      .patch('/api/appointments/1/status')
      .send({ status: 'NO_SHOW' });

    expect(res.status).toBe(200);
  });

  it('should trigger waitlist on CANCELLED status', async () => {
    vi.mocked(AppointmentRepository.updateStatus).mockResolvedValue({
      id: '1', status: 'CANCELLED', appointment_time: '2024-01-01T10:00:00Z',
    });

    const res = await request(app)
      .patch('/api/appointments/1/status')
      .send({ status: 'CANCELLED' });

    expect(res.status).toBe(200);
    expect(WaitlistService.processCancellation).toHaveBeenCalledWith('2024-01-01T10:00:00Z');
  });

  it('should return 400 for invalid status', async () => {
    const res = await request(app)
      .patch('/api/appointments/1/status')
      .send({ status: 'INVALID_STATUS' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid appointment status');
  });

  it('should return 404 when appointment not found', async () => {
    vi.mocked(AppointmentRepository.updateStatus).mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/appointments/999/status')
      .send({ status: 'SCHEDULED' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Appointment not found');
  });

  it('should return 500 on database error', async () => {
    vi.mocked(AppointmentRepository.updateStatus).mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .patch('/api/appointments/1/status')
      .send({ status: 'SCHEDULED' });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to update appointment status');
  });
});
