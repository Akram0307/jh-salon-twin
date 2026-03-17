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

import clientRouter from '../../routes/clientRoutes';
import { ClientRepository } from '../../repositories/ClientRepository';

vi.mock('../../repositories/ClientRepository', () => ({
  ClientRepository: { findAll: vi.fn() },
}));

describe('clientRoutes - list', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/clients', clientRouter);
  });

  it('should return list of clients', async () => {
    const mockClients = [
      { id: '1', full_name: 'Alice', phone_number: '1111111111' },
      { id: '2', full_name: 'Bob', phone_number: '2222222222' },
    ];
    vi.mocked(ClientRepository.findAll).mockResolvedValue(mockClients);

    const res = await request(app).get('/api/clients');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].full_name).toBe('Alice');
  });

  it('should return empty array when no clients', async () => {
    vi.mocked(ClientRepository.findAll).mockResolvedValue([]);

    const res = await request(app).get('/api/clients');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('should return 500 on database error', async () => {
    vi.mocked(ClientRepository.findAll).mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/clients');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to fetch clients');
  });
});
