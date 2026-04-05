import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';

const mockFindBySalonId = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock('../../middleware/auth', () => ({
  authenticate: vi.fn((req: any, res: any, next: any) => next()),
}));

vi.mock('../../repositories/NotificationTemplateRepository', () => ({
  NotificationTemplateRepository: {
    findBySalonId: (...args: any[]) => mockFindBySalonId(...args),
    create: (...args: any[]) => mockCreate(...args),
    update: (...args: any[]) => mockUpdate(...args),
    delete: (...args: any[]) => mockDelete(...args),
  },
}));

vi.mock('../../repositories/NotificationLogRepository', () => ({
  NotificationLogRepository: {
    findBySalonId: vi.fn(),
    getStats: vi.fn(),
  },
}));

vi.mock('../../services/NotificationOrchestrator', () => ({
  dispatchNotification: vi.fn(),
  sendAppointmentConfirmation: vi.fn(),
  dispatchReminderForAppointment: vi.fn(),
}));

vi.mock('../../config/db', () => ({
  query: vi.fn(),
}));

import notificationRouter from '../../routes/notificationRoutes';

describe('notificationRoutes', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/notifications', notificationRouter);
  });

  describe('GET /api/notifications/templates', () => {
    it('should return 400 if salon_id is missing', async () => {
      const response = await request(app)
        .get('/api/notifications/templates');
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('salon_id');
    });

    it('should return templates for a salon', async () => {
      const mockTemplates = [
        { id: '1', name: 'Confirmation', type: 'sms' },
        { id: '2', name: 'Reminder', type: 'email' },
      ];
      mockFindBySalonId.mockResolvedValue(mockTemplates);
      const response = await request(app)
        .get('/api/notifications/templates?salon_id=salon-1');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTemplates);
    });
  });

  describe('POST /api/notifications/templates', () => {
    it('should return 422 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/notifications/templates')
        .send({ salon_id: 'salon-1' });
      expect(response.status).toBe(422);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should create a template successfully', async () => {
      const mockTemplate = {
        id: '1', name: 'Test Template', type: 'sms', body: 'Hello {{name}}',
      };
      mockCreate.mockResolvedValue(mockTemplate);
      const response = await request(app)
        .post('/api/notifications/templates')
        .send({ salon_id: 'salon-1', name: 'Test Template', type: 'sms', body: 'Hello {{name}}' });
      expect(response.status).toBe(201);
      expect(response.body.data).toEqual(mockTemplate);
    });
  });
});
