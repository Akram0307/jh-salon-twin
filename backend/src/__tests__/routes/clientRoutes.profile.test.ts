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
  ClientRepository: { findAll: vi.fn() },
}));
vi.mock('../../services/ClientBeautyProfileService', () => ({
  default: {
    getClientProfile: vi.fn(),
    createProfile: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

import clientRoutes from '../../routes/clientRoutes';
import beautyProfileService from '../../services/ClientBeautyProfileService';

const app = express();
app.use(express.json());
app.use('/clients', clientRoutes);

describe('clientRoutes - beauty profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create client beauty profile', async () => {
    vi.mocked(beautyProfileService.createProfile).mockResolvedValue({ id: 'profile-1' } as never);

    const res = await request(app)
      .post('/clients/abc123-def456/profile')
      .send({
        salon_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        hair_profile: { type: 'curly', texture: 'fine' },
        skin_profile: { type: 'oily' },
      });

    expect(res.status).toBe(201);
    expect(beautyProfileService.createProfile).toHaveBeenCalled();
  });

  it('should return 500 on create profile error', async () => {
    vi.mocked(beautyProfileService.createProfile).mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .post('/clients/abc123-def456/profile')
      .send({
        salon_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        hair_profile: {},
      });

    expect(res.status).toBe(500);
  });

  it('should update client beauty profile', async () => {
    vi.mocked(beautyProfileService.updateProfile).mockResolvedValue({ id: 'profile-1', hair_profile: { updated: true } } as never);

    const res = await request(app)
      .patch('/clients/abc123-def456/profile')
      .send({
        salon_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        hair_profile: { updated: true },
      });

    expect(res.status).toBe(200);
    expect(beautyProfileService.updateProfile).toHaveBeenCalled();
  });

  it('should return 500 on update profile error', async () => {
    vi.mocked(beautyProfileService.updateProfile).mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .patch('/clients/abc123-def456/profile')
      .send({
        salon_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        hair_profile: {},
      });

    expect(res.status).toBe(500);
  });

  it('should return 422 when salon_id is missing from profile', async () => {
    const res = await request(app)
      .post('/clients/abc123-def456/profile')
      .send({ hair_profile: { type: 'curly' } });

    expect(res.status).toBe(422);
  });

  it('should return 422 when salon_id is not a valid UUID', async () => {
    const res = await request(app)
      .post('/clients/abc123-def456/profile')
      .send({ salon_id: 'not-a-uuid', hair_profile: {} });

    expect(res.status).toBe(422);
  });

  it('should reject extra fields in profile payload (strict mode)', async () => {
    const res = await request(app)
      .post('/clients/abc123-def456/profile')
      .send({
        salon_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        hair_profile: {},
        unexpected_field: 'should fail',
      });

    expect(res.status).toBe(422);
  });
});
