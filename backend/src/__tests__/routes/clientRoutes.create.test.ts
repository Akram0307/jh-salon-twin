import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

vi.mock('../../middleware/validateUUID', () => ({
  validateUUID: (req: any, res: any, next: any) => next(),
}));
vi.mock('../../middleware/auth', () => ({
  authenticate: vi.fn((req: any, res: any, next: any) => {
    req.user = { id: '1', email: 'test@example.com', role: 'owner', user_type: 'owner' };
    next();
  }),
  requireStaffOrOwner: vi.fn((req: any, res: any, next: any) => next()),
}));
vi.mock('../../repositories/ClientRepository', () => ({
  ClientRepository: { create: vi.fn(), findAll: vi.fn() },
}));

import clientRoutes from '../../routes/clientRoutes';
import { ClientRepository } from '../../repositories/ClientRepository';

const app = express();
app.use(express.json());
app.use('/clients', clientRoutes);

describe('clientRoutes - create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a new client', async () => {
    const mockClient = { id: '1', full_name: 'New Client', phone_number: '9999999999', salon_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' };
    vi.mocked(ClientRepository.create).mockResolvedValue(mockClient as never);

    const res = await request(app)
      .post('/clients')
      .send({ full_name: 'New Client', phone_number: '9999999999', salon_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.full_name).toBe('New Client');
  });

  it('should return 500 on database error', async () => {
    vi.mocked(ClientRepository.create).mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .post('/clients')
      .send({ full_name: 'Test', phone_number: '111', salon_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });

    expect(res.status).toBe(500);
  });

  it('should return 422 when full_name is missing', async () => {
    const res = await request(app)
      .post('/clients')
      .send({ phone_number: '9999999999' });

    expect(res.status).toBe(422);
  });

  it('should return 422 when phone_number is missing', async () => {
    const res = await request(app)
      .post('/clients')
      .send({ full_name: 'Test' });

    expect(res.status).toBe(422);
  });

  it('should return 422 for invalid email format', async () => {
    const res = await request(app)
      .post('/clients')
      .send({ full_name: 'Test', phone_number: '999', email: 'not-an-email' });

    expect(res.status).toBe(422);
  });

  it('should return 422 for extra fields (strict mode)', async () => {
    const res = await request(app)
      .post('/clients')
      .send({ full_name: 'Test', phone_number: '999', extra: 'field' });

    expect(res.status).toBe(422);
  });
});
