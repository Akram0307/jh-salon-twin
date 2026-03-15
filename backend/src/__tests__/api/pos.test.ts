import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// Import router
import posRouter from '../../routes/posRoutes';

describe('posRoutes', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/pos', posRouter);
  });

  describe('POST /api/pos/create-draft', () => {
    it('should return 400 if items are missing', async () => {
      const response = await request(app)
        .post('/api/pos/create-draft')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Items required');
    });

    it('should return 400 if items is empty array', async () => {
      const response = await request(app)
        .post('/api/pos/create-draft')
        .send({ items: [] });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Items required');
    });

    it('should create a draft successfully', async () => {
      const response = await request(app)
        .post('/api/pos/create-draft')
        .send({
          items: [{ name: 'Haircut', price: 50, quantity: 1 }],
        });

      expect(response.status).toBe(200);
      expect(response.body.items).toBeDefined();
      expect(response.body.subtotal).toBe(50);
    });
  });
});
