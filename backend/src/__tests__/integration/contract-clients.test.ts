import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

vi.mock('../../middleware/validateUUID', () => ({
  validateUUID: (req: any, res: any, next: any) => next(),
}));
vi.mock('../../middleware/auth', () => ({
  authenticate: vi.fn((req: any, res: any, next: any) => {
    req.user = { id: '1', email: 'owner@salon.com', role: 'owner', user_type: 'owner' };
    next();
  }),
  requireStaffOrOwner: vi.fn((req: any, res: any, next: any) => next()),
}));
vi.mock('../../repositories/ClientRepository', () => ({
  ClientRepository: { create: vi.fn(), findAll: vi.fn() },
}));
vi.mock('../../services/ClientBeautyProfileService', () => ({
  default: {
    getClientProfile: vi.fn(),
    createProfile: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

import clientRoutes from '../../routes/clientRoutes';
import { ClientRepository } from '../../repositories/ClientRepository';

const app = express();
app.use(express.json());
app.use('/clients', clientRoutes);

describe('Contract: Clients API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /clients – response shape', () => {
    it('should return an array of client objects with expected fields', async () => {
      const mockClients = [
        {
          id: 'c-001',
          full_name: 'Alice Smith',
          phone_number: '5551112222',
          email: 'alice@example.com',
          salon_id: 'salon-uuid',
          created_at: '2026-01-15T10:00:00Z',
        },
        {
          id: 'c-002',
          full_name: 'Bob Jones',
          phone_number: '5553334444',
          email: null,
          salon_id: 'salon-uuid',
          created_at: '2026-02-20T14:00:00Z',
        },
      ];
      vi.mocked(ClientRepository.findAll).mockResolvedValue(mockClients as never);

      const res = await request(app).get('/clients');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);

      // Contract: each client must have these fields
      for (const client of res.body) {
        expect(client).toHaveProperty('id');
        expect(client).toHaveProperty('full_name');
        expect(client).toHaveProperty('phone_number');
      }
    });

    it('should return 500 with { error: string } on database failure', async () => {
      vi.mocked(ClientRepository.findAll).mockRejectedValue(new Error('DB down'));

      const res = await request(app).get('/clients');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error');
      expect(typeof res.body.error).toBe('string');
    });
  });

  describe('POST /clients – response shape', () => {
    it('should return 201 with created client object containing id', async () => {
      const mockClient = {
        id: 'c-new-001',
        full_name: 'Charlie Brown',
        phone_number: '5556667777',
        email: 'charlie@example.com',
        salon_id: 'salon-uuid',
        created_at: '2026-03-18T08:00:00Z',
      };
      vi.mocked(ClientRepository.create).mockResolvedValue(mockClient as never);

      const res = await request(app)
        .post('/clients')
        .send({ full_name: 'Charlie Brown', phone_number: '5556667777' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(typeof res.body.id).toBe('string');
      expect(res.body).toHaveProperty('full_name');
      expect(res.body.full_name).toBe('Charlie Brown');
      expect(res.body).toHaveProperty('phone_number');
    });

    it('should return 422 with validation error when full_name is missing', async () => {
      const res = await request(app)
        .post('/clients')
        .send({ phone_number: '5556667777' });

      expect(res.status).toBe(422);
    });

    it('should return 422 with validation error when phone_number is missing', async () => {
      const res = await request(app)
        .post('/clients')
        .send({ full_name: 'Test' });

      expect(res.status).toBe(422);
    });

    it('should return 422 for invalid email format', async () => {
      const res = await request(app)
        .post('/clients')
        .send({ full_name: 'Test', phone_number: '555', email: 'not-email' });

      expect(res.status).toBe(422);
    });

    it('should return 422 for extra fields (strict schema)', async () => {
      const res = await request(app)
        .post('/clients')
        .send({ full_name: 'Test', phone_number: '555', unexpected: 'field' });

      expect(res.status).toBe(422);
    });

    it('should return 500 with { error: string } on database failure', async () => {
      vi.mocked(ClientRepository.create).mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .post('/clients')
        .send({ full_name: 'Test', phone_number: '555' });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error');
      expect(typeof res.body.error).toBe('string');
    });
  });
});
