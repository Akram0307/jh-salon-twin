import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import appointmentRouter from '../../routes/appointmentRoutes';
import { AppointmentRepository } from '../../repositories/AppointmentRepository';

vi.mock('../../repositories/AppointmentRepository', () => ({
  AppointmentRepository: { findAll: vi.fn() },
}));
vi.mock('../../middleware/validateUUID', () => ({
  validateUUID: vi.fn((req, res, next) => next()),
}));

describe('appointmentRoutes - list', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/appointments', appointmentRouter);
  });

  it('should return list of appointments', async () => {
    const mockAppointments = [
      { id: '1', client_name: 'Alice', staff_name: 'Bob', appointment_time: '2024-01-01T10:00:00Z', status: 'SCHEDULED', services: [] },
      { id: '2', client_name: 'Carol', staff_name: 'Dave', appointment_time: '2024-01-01T11:00:00Z', status: 'COMPLETED', services: [] },
    ];
    vi.mocked(AppointmentRepository.findAll).mockResolvedValue(mockAppointments);

    const res = await request(app).get('/api/appointments');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].client_name).toBe('Alice');
  });

  it('should return empty array when no appointments', async () => {
    vi.mocked(AppointmentRepository.findAll).mockResolvedValue([]);

    const res = await request(app).get('/api/appointments');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('should return 500 on database error', async () => {
    vi.mocked(AppointmentRepository.findAll).mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/appointments');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to fetch appointments');
  });
});
