import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';

const mockUpdateStatus = vi.fn();
const mockBulkUpdateStatus = vi.fn();

vi.mock('../../services/AppointmentStatusService', () => ({
  default: {
    updateStatus: (...args: any[]) => mockUpdateStatus(...args),
    bulkUpdateStatus: (...args: any[]) => mockBulkUpdateStatus(...args),
  },
}));

vi.mock('../../middleware/validateUUID', () => ({
  validateUUID: (req: any, res: any, next: any) => next(),
}));

import appointmentStatusRouter from '../../routes/appointmentStatusRoutes';

const VALID_SALON_ID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_APPT_ID = '550e8400-e29b-41d4-a716-446655440001';

describe('appointmentStatusRoutes', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/appointments', appointmentStatusRouter);
  });

  describe('PATCH /api/appointments/:id/status', () => {
    it('should return 422 if salon_id is missing', async () => {
      const response = await request(app)
        .patch(`/api/appointments/${VALID_APPT_ID}/status`)
        .send({ status: 'confirmed' });
      expect(response.status).toBe(422);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details.some((d: any) => d.field === 'salon_id')).toBe(true);
    });

    it('should return 422 if status is missing', async () => {
      const response = await request(app)
        .patch(`/api/appointments/${VALID_APPT_ID}/status`)
        .send({ salon_id: VALID_SALON_ID });
      expect(response.status).toBe(422);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details.some((d: any) => d.field === 'status')).toBe(true);
    });

    it('should update status successfully', async () => {
      mockUpdateStatus.mockResolvedValue({ id: 'apt-1', status: 'confirmed' });
      const response = await request(app)
        .patch(`/api/appointments/${VALID_APPT_ID}/status`)
        .send({ salon_id: VALID_SALON_ID, status: 'confirmed' });
      expect(response.status).toBe(200);
      expect(mockUpdateStatus).toHaveBeenCalled();
    });

    it('should return 404 if appointment not found', async () => {
      mockUpdateStatus.mockRejectedValue(new Error('Appointment not found'));
      const response = await request(app)
        .patch(`/api/appointments/${VALID_APPT_ID}/status`)
        .send({ salon_id: VALID_SALON_ID, status: 'confirmed' });
      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid status transition', async () => {
      mockUpdateStatus.mockRejectedValue(new Error('Invalid status transition from completed to scheduled'));
      const response = await request(app)
        .patch(`/api/appointments/${VALID_APPT_ID}/status`)
        .send({ salon_id: VALID_SALON_ID, status: 'scheduled' });
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/appointments/bulk-status', () => {
    it('should return 422 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/appointments/bulk-status')
        .send({ salon_id: VALID_SALON_ID });
      expect(response.status).toBe(422);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 422 if appointment_ids is empty', async () => {
      const response = await request(app)
        .post('/api/appointments/bulk-status')
        .send({ salon_id: VALID_SALON_ID, appointment_ids: [], status: 'confirmed' });
      expect(response.status).toBe(422);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 422 if more than 100 appointments', async () => {
      const ids = Array(101).fill(VALID_APPT_ID);
      const response = await request(app)
        .post('/api/appointments/bulk-status')
        .send({ salon_id: VALID_SALON_ID, appointment_ids: ids, status: 'confirmed' });
      expect(response.status).toBe(422);
      expect(response.body.error).toBe('Validation failed');
    });
  });
});
