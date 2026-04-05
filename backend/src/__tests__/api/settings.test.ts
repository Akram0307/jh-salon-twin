import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock the database pool
const mockQuery = vi.fn();
vi.mock('../../config/db', () => ({
  pool: {
    query: (...args: any[]) => mockQuery(...args),
  },
}));

// Mock the repositories
const mockFindByUserId = vi.fn();
const mockUpsert = vi.fn();
vi.mock('../../repositories/UserSettingsRepository', () => ({
  UserSettingsRepository: {
    findByUserId: (...args: any[]) => mockFindByUserId(...args),
    upsert: (...args: any[]) => mockUpsert(...args),
  },
}));

// Mock auth middleware - inject user into request
vi.mock('../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = {
      id: 'user-1',
      email: 'test@example.com',
      role: 'owner',
      user_type: 'owner',
    };
    next();
  },
}));

// Import router after mocks
import settingsRouter from '../../routes/settingsRoutes';

describe('settingsRoutes', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/settings', settingsRouter);
  });

  describe('GET /api/settings/profile', () => {
    it('should return user profile', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'user-1', name: 'Test User', email: 'test@example.com' }],
      });
      mockFindByUserId.mockResolvedValueOnce({ profile_data: {} });

      const response = await request(app)
        .get('/api/settings/profile');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 500 on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/api/settings/profile');

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('PUT /api/settings/profile', () => {
    it('should update user profile', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      mockUpsert.mockResolvedValue({});

      const response = await request(app)
        .put('/api/settings/profile')
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 500 on database error', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/settings/profile')
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(500);
    });
  });
});
