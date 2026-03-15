import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// Create mock functions
const mockUpdateStatus = vi.fn();
const mockBulkUpdateStatus = vi.fn();

// Mock the service before importing the router
vi.mock('../../services/AppointmentStatusService', () => ({
  default: {
    updateStatus: (...args: any[]) => mockUpdateStatus(...args),
    bulkUpdateStatus: (...args: any[]) => mockBulkUpdateStatus(...args),
  },
}));

// Mock validateUUID middleware
vi.mock('../../middleware/validateUUID', () => ({
  validateUUID: (req: any, res: any, next: any) => next(),
}));

// Import router after mocks
import appointmentStatusRouter from '../../routes/appointmentStatusRoutes';

describe('appointmentStatusRoutes', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/appointments', appointmentStatusRouter);
  });

  describe('PATCH /api/appointments/:id/status', () => {
    it('should return 400 if salon_id is missing', async () => {
      const response = await request(app)
        .patch('/api/appointments/550e8400-e29b-41d4-a716-446655440000/status')
        .send({ status: 'confirmed' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('salon_id');
    });

    it('should return 400 if status is missing', async () => {
      const response = await request(app)
        .patch('/api/appointments/550e8400-e29b-41d4-a716-446655440000/status')
        .send({ salon_id: 'salon-1' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('status');
    });

    it('should update status successfully', async () => {
      mockUpdateStatus.mockResolvedValue({
        id: 'apt-1',
        status: 'confirmed',
      });

      const response = await request(app)
        .patch('/api/appointments/550e8400-e29b-41d4-a716-446655440000/status')
        .send({
          salon_id: 'salon-1',
          status: 'confirmed',
        });

      expect(response.status).toBe(200);
      expect(mockUpdateStatus).toHaveBeenCalled();
    });

    it('should return 404 if appointment not found', async () => {
      mockUpdateStatus.mockRejectedValue(new Error('Appointment not found'));

      const response = await request(app)
        .patch('/api/appointments/550e8400-e29b-41d4-a716-446655440000/status')
        .send({
          salon_id: 'salon-1',
          status: 'confirmed',
        });

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid status transition', async () => {
      mockUpdateStatus.mockRejectedValue(new Error('Invalid status transition from completed to scheduled'));

      const response = await request(app)
        .patch('/api/appointments/550e8400-e29b-41d4-a716-446655440000/status')
        .send({
          salon_id: 'salon-1',
          status: 'scheduled',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/appointments/bulk-status', () => {
    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/appointments/bulk-status')
        .send({ salon_id: 'salon-1' });

      expect(response.status).toBe(400);
    });

    it('should return 400 if appointment_ids is empty', async () => {
      const response = await request(app)
        .post('/api/appointments/bulk-status')
        .send({
          salon_id: 'salon-1',
          appointment_ids: [],
          status: 'confirmed',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 if more than 100 appointments', async () => {
      const ids = Array(101).fill('550e8400-e29b-41d4-a716-446655440000');
      const response = await request(app)
        .post('/api/appointments/bulk-status')
        .send({
          salon_id: 'salon-1',
          appointment_ids: ids,
          status: 'confirmed',
        });

      expect(response.status).toBe(400);
    });
  });
});
