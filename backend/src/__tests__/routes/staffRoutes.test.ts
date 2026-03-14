import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import staffRouter from '../../routes/staffRoutes';
import { StaffRepository } from '../../repositories/StaffRepository';
import { query } from '../../config/db';

vi.mock('../../repositories/StaffRepository', () => ({
  StaffRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));
vi.mock('../../config/db', () => ({
  query: vi.fn(),
}));

describe('staffRoutes', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/staff', staffRouter);
  });

  describe('GET /api/staff', () => {
    it('should return all staff', async () => {
      const mockStaff = [
        { id: '1', full_name: 'John Doe', email: 'john@example.com', updated_at: null },
        { id: '2', full_name: 'Jane Smith', email: 'jane@example.com', updated_at: null },
      ];
      vi.mocked(StaffRepository.findAll).mockResolvedValue(mockStaff);

      const response = await request(app).get('/api/staff');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockStaff);
      expect(StaffRepository.findAll).toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      vi.mocked(StaffRepository.findAll).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/staff');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch staff');
    });
  });

  describe('POST /api/staff', () => {
    it('should create a new staff member', async () => {
      const mockStaff = { id: '1', full_name: 'New Staff', email: 'new@example.com', updated_at: null };
      vi.mocked(StaffRepository.create).mockResolvedValue(mockStaff);
      vi.mocked(query).mockResolvedValue({ rows: [] });

      const response = await request(app)
        .post('/api/staff')
        .send({ full_name: 'New Staff', email: 'new@example.com' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockStaff);
    });

    it('should return 400 for invalid payload', async () => {
      const response = await request(app)
        .post('/api/staff')
        .send({ full_name: '' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 409 for duplicate email', async () => {
      vi.mocked(query).mockResolvedValue({ rows: [{ id: '1' }] });

      const response = await request(app)
        .post('/api/staff')
        .send({ full_name: 'New Staff', email: 'existing@example.com' });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('should return 500 on database error', async () => {
      vi.mocked(query).mockResolvedValue({ rows: [] });
      vi.mocked(StaffRepository.create).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/staff')
        .send({ full_name: 'New Staff', email: 'new@example.com' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to create staff');
    });
  });

  describe('PUT /api/staff/:id', () => {
    it('should update staff member', async () => {
      const mockExisting = { id: '1', full_name: 'Old Name', email: 'old@example.com' };
      const mockUpdated = { id: '1', full_name: 'New Name', email: 'new@example.com', updated_at: null };
      vi.mocked(StaffRepository.findById).mockResolvedValue(mockExisting);
      vi.mocked(StaffRepository.update).mockResolvedValue(mockUpdated);
      vi.mocked(query).mockResolvedValue({ rows: [] });

      const response = await request(app)
        .put('/api/staff/1')
        .send({ full_name: 'New Name' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockUpdated);
    });

    it('should return 404 if staff not found', async () => {
      vi.mocked(StaffRepository.findById).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/staff/1')
        .send({ full_name: 'New Name' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid payload', async () => {
      const mockExisting = { id: '1', full_name: 'Old Name', email: 'old@example.com' };
      vi.mocked(StaffRepository.findById).mockResolvedValue(mockExisting);

      const response = await request(app)
        .put('/api/staff/1')
        .send({ full_name: '' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 409 for duplicate email', async () => {
      const mockExisting = { id: '1', full_name: 'Old Name', email: 'old@example.com' };
      vi.mocked(StaffRepository.findById).mockResolvedValue(mockExisting);
      vi.mocked(query).mockResolvedValue({ rows: [{ id: '2' }] });

      const response = await request(app)
        .put('/api/staff/1')
        .send({ email: 'existing@example.com' });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('should return 500 on database error', async () => {
      vi.mocked(StaffRepository.findById).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/staff/1')
        .send({ full_name: 'New Name' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to update staff');
    });
  });

  describe('GET /api/staff/schedule', () => {
    it('should return staff schedule', async () => {
      const mockSchedule = [
        { id: '1', name: 'John Doe', role: 'stylist', is_available: true, break_times: [] },
      ];
      vi.mocked(query).mockResolvedValue({ rows: mockSchedule });

      const response = await request(app).get('/api/staff/schedule');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSchedule);
    });

    it('should return 500 on database error', async () => {
      vi.mocked(query).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/staff/schedule');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch staff schedule');
    });
  });
});
