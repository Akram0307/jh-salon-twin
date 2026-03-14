import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import appointmentRouter from '../../routes/appointmentRoutes';
import { AppointmentRepository } from '../../repositories/AppointmentRepository';
import { WaitlistService } from '../../services/WaitlistService';
import { dispatchReminderForAppointment } from '../../services/NotificationOrchestrator';
import { validateUUID } from '../../middleware/validateUUID';

// Mock dependencies
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
  WaitlistService: {
    processCancellation: vi.fn(),
  },
}));
vi.mock('../../services/NotificationOrchestrator', () => ({
  dispatchReminderForAppointment: vi.fn(),
}));
vi.mock('../../middleware/validateUUID', () => ({
  validateUUID: vi.fn((req, res, next) => next()),
}));

describe('appointmentRoutes', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/appointments', appointmentRouter);
  });

  describe('GET /api/appointments', () => {
    it('should return all appointments', async () => {
      const mockAppointments = [
        { id: '1', client_id: 'client-1', appointment_time: '2024-01-01T10:00:00Z' },
        { id: '2', client_id: 'client-2', appointment_time: '2024-01-01T11:00:00Z' },
      ];
      vi.mocked(AppointmentRepository.findAll).mockResolvedValue(mockAppointments);

      const response = await request(app).get('/api/appointments');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockAppointments);
      expect(AppointmentRepository.findAll).toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      vi.mocked(AppointmentRepository.findAll).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/appointments');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch appointments');
    });
  });

  describe('POST /api/appointments', () => {
    it('should create an appointment', async () => {
      const mockAppointment = { id: '1', client_id: 'client-1', appointment_time: '2024-01-01T10:00:00Z' };
      vi.mocked(AppointmentRepository.create).mockResolvedValue(mockAppointment);

      const response = await request(app)
        .post('/api/appointments')
        .send({ client_id: 'client-1', appointment_time: '2024-01-01T10:00:00Z' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockAppointment);
      expect(AppointmentRepository.create).toHaveBeenCalledWith({
        client_id: 'client-1',
        appointment_time: '2024-01-01T10:00:00Z',
      });
    });

    it('should return 500 on database error', async () => {
      vi.mocked(AppointmentRepository.create).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/appointments')
        .send({ client_id: 'client-1', appointment_time: '2024-01-01T10:00:00Z' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to create appointment');
    });
  });

  describe('PATCH /api/appointments/:id/status', () => {
    it('should update appointment status', async () => {
      const mockAppointment = { id: '1', status: 'scheduled', appointment_time: '2024-01-01T10:00:00Z' };
      vi.mocked(AppointmentRepository.updateStatus).mockResolvedValue(mockAppointment);

      const response = await request(app)
        .patch('/api/appointments/1/status')
        .send({ status: 'scheduled' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockAppointment);
      expect(AppointmentRepository.updateStatus).toHaveBeenCalledWith('1', 'scheduled');
    });

    it('should return 400 for invalid status', async () => {
      const response = await request(app)
        .patch('/api/appointments/1/status')
        .send({ status: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid appointment status');
    });

    it('should return 404 if appointment not found', async () => {
      vi.mocked(AppointmentRepository.updateStatus).mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/appointments/1/status')
        .send({ status: 'scheduled' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Appointment not found');
    });

    it('should trigger waitlist processing on cancellation', async () => {
      const mockAppointment = { id: '1', status: 'cancelled', appointment_time: '2024-01-01T10:00:00Z' };
      vi.mocked(AppointmentRepository.updateStatus).mockResolvedValue(mockAppointment);

      const response = await request(app)
        .patch('/api/appointments/1/status')
        .send({ status: 'CANCELLED' });

      expect(response.status).toBe(200);
      expect(WaitlistService.processCancellation).toHaveBeenCalledWith('2024-01-01T10:00:00Z');
    });

    it('should return 500 on database error', async () => {
      vi.mocked(AppointmentRepository.updateStatus).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .patch('/api/appointments/1/status')
        .send({ status: 'scheduled' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to update appointment status');
    });
  });

  describe('GET /api/appointments/qr/:token', () => {
    it('should return appointment by QR token', async () => {
      const mockAppointment = { id: '1', qr_token: 'token123' };
      vi.mocked(AppointmentRepository.findByQrToken).mockResolvedValue(mockAppointment);

      const response = await request(app).get('/api/appointments/qr/token123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockAppointment);
      expect(AppointmentRepository.findByQrToken).toHaveBeenCalledWith('token123');
    });

    it('should return 404 if appointment not found', async () => {
      vi.mocked(AppointmentRepository.findByQrToken).mockResolvedValue(null);

      const response = await request(app).get('/api/appointments/qr/token123');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Appointment not found');
    });

    it('should return 500 on database error', async () => {
      vi.mocked(AppointmentRepository.findByQrToken).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/appointments/qr/token123');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch appointment by QR token');
    });
  });

  describe('POST /api/appointments/:id/services', () => {
    it('should add a service to an appointment', async () => {
      const mockService = { id: 'service-1', appointment_id: '1', base_price: 50, charged_price: 50 };
      vi.mocked(AppointmentRepository.addService).mockResolvedValue(mockService);

      const response = await request(app)
        .post('/api/appointments/1/services')
        .send({ service_id: 'service-1', base_price: 50 });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockService);
      expect(AppointmentRepository.addService).toHaveBeenCalledWith('1', 'service-1', 50, 50);
    });

    it('should return 500 on database error', async () => {
      vi.mocked(AppointmentRepository.addService).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/appointments/1/services')
        .send({ service_id: 'service-1', base_price: 50 });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to add service to appointment');
    });
  });

  describe('PATCH /api/appointments/:id/services/:serviceId', () => {
    it('should update service price on an appointment', async () => {
      const mockService = { id: 'service-1', appointment_id: '1', charged_price: 60 };
      vi.mocked(AppointmentRepository.updateServicePrice).mockResolvedValue(mockService);

      const response = await request(app)
        .patch('/api/appointments/1/services/service-1')
        .send({ charged_price: 60 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockService);
      expect(AppointmentRepository.updateServicePrice).toHaveBeenCalledWith('1', 'service-1', 60);
    });

    it('should return 404 if service not found on appointment', async () => {
      vi.mocked(AppointmentRepository.updateServicePrice).mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/appointments/1/services/service-1')
        .send({ charged_price: 60 });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Service not found on appointment');
    });

    it('should return 500 on database error', async () => {
      vi.mocked(AppointmentRepository.updateServicePrice).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .patch('/api/appointments/1/services/service-1')
        .send({ charged_price: 60 });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to update service price');
    });
  });

  describe('POST /api/appointments/:id/send-reminder', () => {
    it('should send reminder for appointment', async () => {
      const mockResult = { success: true };
      vi.mocked(dispatchReminderForAppointment).mockResolvedValue(mockResult);

      const response = await request(app).post('/api/appointments/1/send-reminder');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true, notification: mockResult });
      expect(dispatchReminderForAppointment).toHaveBeenCalledWith('1');
    });

    it('should return 404 if appointment not found', async () => {
      vi.mocked(dispatchReminderForAppointment).mockResolvedValue({ error: 'appointment_not_found' });

      const response = await request(app).post('/api/appointments/1/send-reminder');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Appointment not found');
    });

    it('should return 500 on error', async () => {
      vi.mocked(dispatchReminderForAppointment).mockRejectedValue(new Error('Reminder failed'));

      const response = await request(app).post('/api/appointments/1/send-reminder');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to send reminder');
    });
  });
});
