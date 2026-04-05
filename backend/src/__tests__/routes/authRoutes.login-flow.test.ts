import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

const mockQuery = vi.hoisted(() => vi.fn());
const mockBcryptCompare = vi.hoisted(() => vi.fn());
const mockJwtSign = vi.hoisted(() => vi.fn());

vi.mock('../../config/db', () => ({ default: { query: mockQuery } }));
vi.mock('bcrypt', () => ({ default: { compare: mockBcryptCompare } }));
vi.mock('jsonwebtoken', () => ({ default: { sign: mockJwtSign, verify: vi.fn() } }));
vi.mock('../../middleware/auth', () => ({
  authenticate: vi.fn((req: any, res: any, next: any) => {
    req.user = { id: '1', email: 'test@example.com', role: 'owner', user_type: 'owner' };
    next();
  }),
}));

import authRouter from '../../routes/authRoutes';

describe('authRoutes - login flow', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
  });

  it('should return token and user on successful owner login', async () => {
    mockQuery.mockResolvedValue({
      rows: [{ id: '1', name: 'Test Owner', email: 'owner@test.com', phone: '1111111111', password_hash: 'hash' }],
    });
    mockBcryptCompare.mockResolvedValue(true);
    mockJwtSign.mockReturnValue('jwt-token');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@test.com', password: 'pass123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBe('jwt-token');
    expect(res.body.refresh_token).toBe('jwt-token');
    expect(res.body.user.id).toBe('1');
    expect(res.body.user.role).toBe('owner');
    expect(res.body.user.user_type).toBe('owner');
  });

  it('should return 401 for wrong password', async () => {
    mockQuery.mockResolvedValue({
      rows: [{ id: '1', name: 'Test', email: 'test@test.com', phone: '111', password_hash: 'hash' }],
    });
    mockBcryptCompare.mockResolvedValue(false);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'wrongpass' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('should return 401 for non-existent email', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'pass123' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('should return 401 when password_hash is null', async () => {
    mockQuery.mockResolvedValue({
      rows: [{ id: '1', name: 'Test', email: 'test@test.com', phone: '111', password_hash: null }],
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'pass123' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Account not set up for password login');
  });

  it('should store refresh token in database on login', async () => {
    mockQuery.mockResolvedValue({
      rows: [{ id: '1', name: 'Test', email: 'test@test.com', phone: '111', password_hash: 'hash' }],
    });
    mockBcryptCompare.mockResolvedValue(true);
    mockJwtSign.mockReturnValue('jwt-token');

    await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'pass123' });

    // Called twice: once for user lookup, once for refresh token storage
    expect(mockQuery).toHaveBeenCalledTimes(2);
    const insertCall = mockQuery.mock.calls[1];
    expect(insertCall[0]).toContain('INSERT INTO refresh_tokens');
  });
});
