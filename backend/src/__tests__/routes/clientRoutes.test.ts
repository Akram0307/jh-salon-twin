import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock validateUUID BEFORE importing routes
vi.mock('../../middleware/validateUUID', () => ({
  validateUUID: (req: any, res: any, next: any) => next(),
}));

import clientRouter from '../../routes/clientRoutes';
import { ClientRepository } from '../../repositories/ClientRepository';
import beautyProfileService from '../../services/ClientBeautyProfileService';

// Mock dependencies
vi.mock('../../repositories/ClientRepository', () => ({
  ClientRepository: {
    findAll: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../../services/ClientBeautyProfileService', () => ({
  default: {
    getClientProfile: vi.fn(),
    createProfile: vi.fn(),
    updateProfile: vi.fn(),
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
      const mockClient = { id: '1', name: 'New Client', email: 'new@example.com' };
      vi.mocked(ClientRepository.create).mockResolvedValue(mockClient);

      const response = await request(app)
        .post('/api/clients')
        .send({ name: 'New Client', email: 'new@example.com' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockClient);
      expect(ClientRepository.create).toHaveBeenCalledWith({
        name: 'New Client',
        email: 'new@example.com',
      });
    });

    it('should return 500 on database error', async () => {
      vi.mocked(ClientRepository.create).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/clients')
        .send({ name: 'New Client', email: 'new@example.com' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to create client');
    });
  });

  describe('GET /api/clients/:id/profile', () => {
    it('should return client profile', async () => {
      const mockProfile = { clientId: '1', salonId: 'salon-123', preferences: {} };
      vi.mocked(beautyProfileService.getClientProfile).mockResolvedValue(mockProfile);

      const response = await request(app).get('/api/clients/1/profile?salon_id=salon-123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProfile);
      expect(beautyProfileService.getClientProfile).toHaveBeenCalledWith('1', 'salon-123');
    });

    it('should return 500 on error', async () => {
      vi.mocked(beautyProfileService.getClientProfile).mockRejectedValue(new Error('Profile error'));

      const response = await request(app).get('/api/clients/1/profile?salon_id=salon-123');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch client profile');
    });

    it('should return empty object when profile is null', async () => {
      vi.mocked(beautyProfileService.getClientProfile).mockResolvedValue(null as any);

      const response = await request(app).get('/api/clients/1/profile?salon_id=salon-123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({});
      expect(beautyProfileService.getClientProfile).toHaveBeenCalledWith('1', 'salon-123');
    });
  });

  describe('POST /api/clients/:id/profile', () => {
    it('should create client profile', async () => {
      const mockProfile = { clientId: '1', salonId: 'salon-123', preferences: {} };
      vi.mocked(beautyProfileService.createProfile).mockResolvedValue(mockProfile);

      const response = await request(app)
        .post('/api/clients/1/profile')
        .send({ salon_id: 'salon-123', preferences: {} });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockProfile);
      expect(beautyProfileService.createProfile).toHaveBeenCalledWith('1', 'salon-123', {
        salon_id: 'salon-123',
        preferences: {},
      });
    });

    it('should return 500 on error', async () => {
      vi.mocked(beautyProfileService.createProfile).mockRejectedValue(new Error('Profile error'));

      const response = await request(app)
        .post('/api/clients/1/profile')
        .send({ salon_id: 'salon-123', preferences: {} });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to create client profile');
    });
  });

  describe('PATCH /api/clients/:id/profile', () => {
    it('should update client profile', async () => {
      const mockProfile = { clientId: '1', salonId: 'salon-123', preferences: { updated: true } };
      vi.mocked(beautyProfileService.updateProfile).mockResolvedValue(mockProfile);

      const response = await request(app)
        .patch('/api/clients/1/profile')
        .send({ salon_id: 'salon-123', preferences: { updated: true } });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProfile);
      expect(beautyProfileService.updateProfile).toHaveBeenCalledWith('1', 'salon-123', {
        salon_id: 'salon-123',
        preferences: { updated: true },
      });
    });

    it('should return 500 on error', async () => {
      vi.mocked(beautyProfileService.updateProfile).mockRejectedValue(new Error('Profile error'));

      const response = await request(app)
        .patch('/api/clients/1/profile')
        .send({ salon_id: 'salon-123', preferences: { updated: true } });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to update client profile');
    });
  });
});
