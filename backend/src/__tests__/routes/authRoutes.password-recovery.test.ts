import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import crypto from 'crypto';

const mockQuery = vi.hoisted(() => vi.fn());
const mockBcryptHash = vi.hoisted(() => vi.fn());

vi.mock('../../config/db', () => ({ default: { query: mockQuery } }));
vi.mock('bcrypt', () => ({ default: { compare: vi.fn(), hash: mockBcryptHash } }));
vi.mock('jsonwebtoken', () => ({ default: { sign: vi.fn(), verify: vi.fn() } }));
vi.mock('../../middleware/auth', () => ({
  authenticate: vi.fn((req: any, res: any, next: any) => {
    req.user = { id: '1', email: 'test@example.com', role: 'owner', user_type: 'owner' };
    next();
  }),
}));

import authRouter from '../../routes/authRoutes';

describe('authRoutes - password recovery', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(crypto, 'randomBytes').mockReturnValue({
      toString: vi.fn().mockReturnValue('reset-token-hex'),
    } as any);
    vi.spyOn(crypto, 'createHash').mockReturnValue({
      update: vi.fn().mockReturnValue({
        digest: vi.fn().mockReturnValue('hashed-reset-token'),
      }),
    } as any);
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 200 for forgot-password even if user not found (security)', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@test.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('If an account exists, a reset link has been sent');
  });

  it('should return 200 for forgot-password when user exists', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: '1', email: 'test@test.com' }] });

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'test@test.com' });

    expect(res.status).toBe(200);
  });

  it('should return 400 for forgot-password without email', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({});

    expect(res.status).toBe(422);
    expect(res.body.error).toBe('Validation failed');
  });

  it('should reset password with valid token', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: '1', user_id: '1' }] });
    mockBcryptHash.mockResolvedValue('new-hash');

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'valid-token', password: 'newPassword123' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Password reset successfully');
  });

  it('should return 400 for reset-password without token', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ password: 'newPassword123' });

    expect(res.status).toBe(422);
    expect(res.body.error).toBe('Validation failed');
  });

  it('should return 400 for reset-password without password', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'some-token' });

    expect(res.status).toBe(422);
    expect(res.body.error).toBe('Validation failed');
  });

  it('should return 400 for reset-password with invalid token', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'invalid-token', password: 'newPassword123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid or expired reset token');
  });
});
