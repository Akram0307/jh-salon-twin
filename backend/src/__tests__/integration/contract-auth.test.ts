import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

const mockQuery = vi.hoisted(() => vi.fn());
const mockBcryptCompare = vi.hoisted(() => vi.fn());
const mockBcryptHash = vi.hoisted(() => vi.fn());
const mockJwtSign = vi.hoisted(() => vi.fn());
const mockJwtVerify = vi.hoisted(() => vi.fn());
const mockCryptoRandomBytes = vi.hoisted(() => vi.fn());
const mockCryptoCreateHash = vi.hoisted(() => vi.fn());

vi.mock('../../config/db', () => ({ default: { query: mockQuery } }));
vi.mock('bcrypt', () => ({
  default: { compare: mockBcryptCompare, hash: mockBcryptHash },
}));
vi.mock('jsonwebtoken', () => ({
  default: { sign: mockJwtSign, verify: mockJwtVerify },
}));
vi.mock('crypto', () => ({
  default: { randomBytes: mockCryptoRandomBytes, createHash: mockCryptoCreateHash },
  randomBytes: mockCryptoRandomBytes,
  createHash: mockCryptoCreateHash,
}));
vi.mock('../../middleware/auth', () => ({
  authenticate: vi.fn((req: any, res: any, next: any) => {
    req.user = { id: '1', email: 'test@example.com', role: 'owner', user_type: 'owner' };
    next();
  }),
}));

import authRouter from '../../routes/authRoutes';

describe('Contract: Auth API', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.restoreAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
  });

  describe('POST /api/auth/login – response shape', () => {
    it('should return { token, refresh_token, user: { id, name, email, phone, role, user_type } } on success', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ id: 'uuid-1', name: 'Jane Doe', email: 'jane@salon.com', phone: '5551234567', password_hash: 'hash' }],
      });
      mockBcryptCompare.mockResolvedValue(true);
      mockJwtSign.mockReturnValue('signed-jwt');

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'jane@salon.com', password: 'secret123' });

      expect(res.status).toBe(200);
      // Contract: top-level fields
      expect(res.body).toHaveProperty('token');
      expect(typeof res.body.token).toBe('string');
      expect(res.body).toHaveProperty('refresh_token');
      expect(typeof res.body.refresh_token).toBe('string');
      expect(res.body).toHaveProperty('user');
      // Contract: user object shape
      const user = res.body.user;
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('phone');
      expect(user).toHaveProperty('role');
      expect(user.role).toBe('owner');
      expect(user).toHaveProperty('user_type');
      expect(user.user_type).toBe('owner');
    });

    it('should return { error: string } on invalid credentials', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@salon.com', password: 'wrong' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
      expect(typeof res.body.error).toBe('string');
    });

    it('should return 422 for malformed request body (missing fields)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'not-valid' }); // missing password, invalid email

      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/auth/forgot-password – response shape', () => {
    it('should return { message: string } even when email does not exist (prevents enumeration)', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'unknown@salon.com' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(typeof res.body.message).toBe('string');
    });

    it('should return { message: string } when email exists', async () => {
      mockCryptoCreateHash.mockImplementation(() => ({
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue('hashed-token'),
      }));
      mockQuery.mockResolvedValue({ rows: [{ id: '1', email: 'jane@salon.com' }] });
      mockCryptoRandomBytes.mockReturnValue({ toString: () => 'reset-token-hex' });

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'jane@salon.com' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(typeof res.body.message).toBe('string');
    });

    it('should return 422 for invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'not-an-email' });

      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/auth/reset-password – response shape', () => {
    it('should return { message: string } on successful reset', async () => {
      mockCryptoCreateHash.mockImplementation(() => ({
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue('hashed-token'),
      }));
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 'tok-1', user_id: 'user-1' }] })  // find reset token
        .mockResolvedValueOnce({ rows: [] })  // update password
        .mockResolvedValueOnce({ rows: [] });  // mark token as used
      mockBcryptHash.mockResolvedValue('new-hash');

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'reset-token-hex', password: 'newpassword123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(typeof res.body.message).toBe('string');
    });

    it('should return { error: string } for invalid/expired token', async () => {
      mockCryptoCreateHash.mockImplementation(() => ({
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue('hashed-token'),
      }));
      mockQuery.mockResolvedValue({ rows: [] });

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'bad-token', password: 'newpassword123' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(typeof res.body.error).toBe('string');
    });

    it('should return 422 for short password', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'some-token', password: 'short' });

      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/auth/refresh – response shape', () => {
    it('should return { token: string } on valid refresh', async () => {
      mockJwtVerify.mockImplementation(() => ({ id: '1', email: 'j@salon.com', role: 'owner', user_type: 'owner' }));
      mockQuery.mockResolvedValue({ rows: [{ token: 'valid-refresh' }] });
      mockJwtSign.mockImplementation(() => 'new-access-token');

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refresh_token: 'valid-refresh' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(typeof res.body.token).toBe('string');
    });

    it('should return { error: string } for invalid refresh token', async () => {
      mockJwtVerify.mockImplementation(() => { throw new Error('invalid'); });

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refresh_token: 'bad-token' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });
  });
});
