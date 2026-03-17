import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

vi.mock('../../middleware/auth', () => ({
  authenticate: vi.fn((req: any, res: any, next: any) => next()),
}));

vi.mock('../../middleware/validateUUID', () => ({
  validateUUID: (req: any, res: any, next: any) => next(),
}));

import clientRouter from '../../routes/clientRoutes';
import { ClientRepository } from '../../repositories/ClientRepository';

vi.mock('../../repositories/ClientRepository', () => ({
  ClientRepository: {
    findAll: vi.fn(),
    create: vi.fn(),
  },
}));

describe('clientRoutes', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/clients', clientRouter);
  });

  describe('GET /api/clients', () => {
    it('should return all clients', async () => {
      const mockClients = [
        { id: '1', name: 'Client 1', email: 'client1@example.com' },
        { id: '2', name: 'Client 2', email: 'client2@example.com' },
      ];
      vi.mocked(ClientRepository.findAll).mockResolvedValue(mockClients);
      const response = await request(app).get('/api/clients');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockClients);
      expect(ClientRepository.findAll).toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      vi.mocked(ClientRepository.findAll).mockRejectedValue(new Error('Database error'));
      const response = await request(app).get('/api/clients');
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch clients');
    });
  });

  describe('POST /api/clients', () => {
    it('should create a client', async () => {
      const mockClient = { id: '1', full_name: 'New Client', phone_number: '555-1234', email: 'new@example.com' };
      vi.mocked(ClientRepository.create).mockResolvedValue(mockClient);
      const response = await request(app)
        .post('/api/clients')
        .send({ full_name: 'New Client', phone_number: '555-1234', email: 'new@example.com' });
      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockClient);
      expect(ClientRepository.create).toHaveBeenCalledWith({ full_name: 'New Client', phone_number: '555-1234', email: 'new@example.com' });
    });

    it('should return 500 on database error', async () => {
      vi.mocked(ClientRepository.create).mockRejectedValue(new Error('Database error'));
      const response = await request(app)
        .post('/api/clients')
        .send({ full_name: 'New Client', phone_number: '555-1234', email: 'new@example.com' });
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to create client');
    });
  });
});
