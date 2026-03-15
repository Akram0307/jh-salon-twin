import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock the DataExportService
const mockExportClients = vi.fn();
vi.mock('../../services/DataExportService', () => ({
  DataExportService: class {
    exportClients = (...args: any[]) => mockExportClients(...args);
  },
}));

// Mock auth middleware
vi.mock('../../middleware/auth', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = {
      id: 'user-1',
      email: 'test@example.com',
      role: 'owner',
      user_type: 'owner',
      salon_id: 'salon-1',
    };
    next();
  },
}));

// Import router after mocks
import exportRouter from '../../routes/exportRoutes';

describe('exportRoutes', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/exports', exportRouter);
  });

  describe('GET /api/exports/clients', () => {
    it('should export clients in CSV format', async () => {
      mockExportClients.mockResolvedValue(`id,name
1,John`);

      const response = await request(app)
        .get('/api/exports/clients?format=csv&salon_id=salon-1');

      expect(response.status).toBe(200);
    });

    it('should return 500 on service error', async () => {
      mockExportClients.mockRejectedValue(new Error('Export failed'));

      const response = await request(app)
        .get('/api/exports/clients?format=csv&salon_id=salon-1');

      expect(response.status).toBe(500);
    });
  });
});
