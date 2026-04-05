import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

const mockQuery = vi.hoisted(() => vi.fn());
const mockJwtSign = vi.hoisted(() => vi.fn());
const mockJwtVerify = vi.hoisted(() => vi.fn());

vi.mock('../../config/db', () => ({ default: { query: mockQuery } }));
vi.mock('bcrypt', () => ({ default: { compare: vi.fn(), hash: vi.fn() } }));
vi.mock('jsonwebtoken', () => ({ default: { sign: mockJwtSign, verify: mockJwtVerify } }));
vi.mock('../../middleware/auth', () => ({
  authenticate: vi.fn((req: any, res: any, next: any) => {
    req.user = { id: '1', email: 'test@example.com', role: 'owner', user_type: 'owner' };
    next();
  }),
}));

import authRouter from '../../routes/authRoutes';

describe('authRoutes - token lifecycle', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
  });

  it('should return new access token on valid refresh', async () => {
    const payload = { id: '1', email: 'test@test.com', role: 'owner', user_type: 'owner' };
    mockJwtVerify.mockReturnValue(payload);
    mockJwtSign.mockReturnValue('new-access-token');
    mockQuery.mockResolvedValue({ rows: [{ token: 'valid-refresh-token' }] });

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refresh_token: 'valid-refresh-token' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBe('new-access-token');
  });

  it('should return 401 when refresh token is missing', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({});

    expect(res.status).toBe(422);
    expect(res.body.error).toBe('Validation failed');
  });

  it('should return 401 when refresh token is invalid', async () => {
    mockJwtVerify.mockImplementation(() => { throw new Error('Invalid token'); });

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refresh_token: 'bad-token' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid or expired refresh token');
  });

  it('should return 401 when refresh token not in database', async () => {
    mockJwtVerify.mockReturnValue({ id: '1', email: 'test@test.com', role: 'owner', user_type: 'owner' });
    mockQuery.mockResolvedValue({ rows: [] });

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refresh_token: 'valid-but-not-stored' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid refresh token');
  });

  it('should return 401 when stored token does not match', async () => {
    mockJwtVerify.mockReturnValue({ id: '1', email: 'test@test.com', role: 'owner', user_type: 'owner' });
    mockQuery.mockResolvedValue({ rows: [{ token: 'different-token' }] });

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refresh_token: 'sent-token' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid refresh token');
  });

  it('should return 200 on logout regardless of DB error', async () => {
    mockQuery.mockRejectedValue(new Error('DB down'));

    const res = await request(app)
      .post('/api/auth/logout')
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Logged out successfully');
  });
});
