import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import appointmentRouter from '../../routes/appointmentRoutes';
import { AppointmentRepository } from '../../repositories/AppointmentRepository';
import { WaitlistService } from '../../services/WaitlistService';
import { dispatchReminderForAppointment } from '../../services/NotificationOrchestrator';

vi.mock('../../repositories/AppointmentRepository', () => ({
  AppointmentRepository: {
    findAll: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
    findByQrToken: vi.fn(),
    addService: vi.fn(),
    updateServicePrice: vi.fn(),
  },
}));
vi.mock('../../services/WaitlistService', () => ({
  WaitlistService: { processCancellation: vi.fn() },
}));
vi.mock('../../services/NotificationOrchestrator', () => ({
  dispatchReminderForAppointment: vi.fn(),
}));
vi.mock('../../middleware/validateUUID', () => ({
  validateUUID: vi.fn((req, res, next) => next()),
}));

describe('Contract: Appointments API', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.restoreAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/appointments', appointmentRouter);
  });

  describe('GET /api/appointments – response shape', () => {
    it('should return an array of appointment objects with expected fields', async () => {
      const mockAppointments = [
        {
          id: 'apt-001',
          salon_id: 'salon-uuid',
          client_id: 'client-uuid',
          staff_id: 'staff-uuid',
          appointment_time: '2026-04-01T10:00:00Z',
          status: 'scheduled',
          created_at: '2026-03-18T08:00:00Z',
        },
        {
          id: 'apt-002',
          salon_id: 'salon-uuid',
          client_id: 'client-uuid-2',
          appointment_time: '2026-04-01T11:30:00Z',
          status: 'scheduled',
          created_at: '2026-03-18T09:00:00Z',
        },
      ];
      vi.mocked(AppointmentRepository.findAll).mockResolvedValue(mockAppointments);

      const res = await request(app).get('/api/appointments');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);

      // Contract: each appointment must have id and appointment_time
      for (const apt of res.body) {
        expect(apt).toHaveProperty('id');
        expect(typeof apt.id).toBe('string');
        expect(apt).toHaveProperty('appointment_time');
      }
    });

    it('should return 500 with { error: string } on database failure', async () => {
      vi.mocked(AppointmentRepository.findAll).mockRejectedValue(new Error('DB down'));

      const res = await request(app).get('/api/appointments');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error');
      expect(typeof res.body.error).toBe('string');
    });
  });

  describe('POST /api/appointments – response shape', () => {
    it('should return 201 with created appointment containing id', async () => {
      const mockAppointment = {
        id: 'apt-new-001',
        salon_id: 'b0dcbd9e-1ca0-450e-a299-7ad239f848f4',
        client_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        staff_id: 'c1c2c3d4-e5f6-7890-abcd-ef1234567890',
        appointment_time: '2026-04-15T14:00:00Z',
        status: 'scheduled',
        created_at: '2026-03-18T10:00:00Z',
      };
      vi.mocked(AppointmentRepository.create).mockResolvedValue(mockAppointment);

      const res = await request(app)
        .post('/api/appointments')
        .send({
          salon_id: 'b0dcbd9e-1ca0-450e-a299-7ad239f848f4',
          client_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          appointment_time: '2026-04-15T14:00:00Z',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(typeof res.body.id).toBe('string');
      expect(res.body).toHaveProperty('salon_id');
      expect(res.body).toHaveProperty('client_id');
      expect(res.body).toHaveProperty('appointment_time');
    });

    it('should return 500 with { error: string } on database failure', async () => {
      vi.mocked(AppointmentRepository.create).mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .post('/api/appointments')
        .send({
          salon_id: 'b0dcbd9e-1ca0-450e-a299-7ad239f848f4',
          client_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          appointment_time: '2026-04-15T14:00:00Z',
        });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error');
      expect(typeof res.body.error).toBe('string');
    });
  });

  describe('PATCH /api/appointments/:id/status – response shape', () => {
    it('should return 200 with updated appointment on valid status', async () => {
      const mockUpdated = { id: 'apt-001', status: 'scheduled', appointment_time: '2026-04-01T10:00:00Z' };
      vi.mocked(AppointmentRepository.updateStatus).mockResolvedValue(mockUpdated);

      const res = await request(app)
        .patch('/api/appointments/apt-001/status')
        .send({ status: 'scheduled' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('status');
      expect(res.body.status).toBe('scheduled');
    });

    it('should return 400 with { error: string } for invalid status value', async () => {
      const res = await request(app)
        .patch('/api/appointments/apt-001/status')
        .send({ status: 'not_a_real_status' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(typeof res.body.error).toBe('string');
    });

    it('should return 404 with { error: string } when appointment not found', async () => {
      vi.mocked(AppointmentRepository.updateStatus).mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/appointments/nonexistent/status')
        .send({ status: 'scheduled' });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
      expect(typeof res.body.error).toBe('string');
    });
  });

  describe('GET /api/appointments/qr/:token – response shape', () => {
    it('should return 200 with appointment object for valid token', async () => {
      const mockAppointment = { id: 'apt-qr-001', qr_token: 'token-abc', status: 'scheduled' };
      vi.mocked(AppointmentRepository.findByQrToken).mockResolvedValue(mockAppointment);

      const res = await request(app).get('/api/appointments/qr/token-abc');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('qr_token');
    });

    it('should return 404 with { error: string } for unknown token', async () => {
      vi.mocked(AppointmentRepository.findByQrToken).mockResolvedValue(null);

      const res = await request(app).get('/api/appointments/qr/unknown-token');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
      expect(typeof res.body.error).toBe('string');
    });
  });

  describe('POST /api/appointments/:id/services – response shape', () => {
    it('should return 201 with service object containing id and prices', async () => {
      const mockService = { id: 'svc-001', appointment_id: 'apt-001', base_price: 50, charged_price: 50 };
      vi.mocked(AppointmentRepository.addService).mockResolvedValue(mockService);

      const res = await request(app)
        .post('/api/appointments/apt-001/services')
        .send({ service_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', base_price: 50 });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('base_price');
      expect(res.body).toHaveProperty('charged_price');
    });

    it('should return 500 with { error: string } on database failure', async () => {
      vi.mocked(AppointmentRepository.addService).mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .post('/api/appointments/apt-001/services')
        .send({ service_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', base_price: 50 });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error');
      expect(typeof res.body.error).toBe('string');
    });
  });
});
