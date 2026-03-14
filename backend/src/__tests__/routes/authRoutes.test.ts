import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import crypto from 'crypto';

// Create mock functions using vi.hoisted
const mockQuery = vi.hoisted(() => vi.fn());
const mockBcryptCompare = vi.hoisted(() => vi.fn());
const mockBcryptHash = vi.hoisted(() => vi.fn());
const mockJwtSign = vi.hoisted(() => vi.fn());
const mockJwtVerify = vi.hoisted(() => vi.fn());

// Mock the database
vi.mock('../../config/db', () => ({
  default: { query: mockQuery },
}));

// Mock bcrypt
vi.mock('bcrypt', () => ({
  default: {
    compare: mockBcryptCompare,
    hash: mockBcryptHash,
  },
}));

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: mockJwtSign,
    verify: mockJwtVerify,
  },
}));

// Mock auth middleware - make it set req.user for authenticated routes
vi.mock('../../middleware/auth', () => ({
  authenticate: vi.fn((req: any, res: any, next: any) => {
    req.user = { id: '1', email: 'test@example.com', role: 'owner', user_type: 'owner' };
    next();
  }),
}));

// Import the router after mocks are set up
import authRouter from '../../routes/authRoutes';

describe('authRoutes', () => {
  let app: express.Application;
  let randomBytesSpy: any;
  let createHashSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Spy on crypto methods
    randomBytesSpy = vi.spyOn(crypto, 'randomBytes').mockReturnValue({
      toString: vi.fn().mockReturnValue('mocked-reset-token-hex'),
    } as any);
    
    createHashSpy = vi.spyOn(crypto, 'createHash').mockReturnValue({
      update: vi.fn().mockReturnValue({
        digest: vi.fn().mockReturnValue('hashed-token-value'),
      }),
    } as any);
    
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 if email or password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and password are required');
    });

    it('should return 400 if password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and password are required');
    });

    it('should return 401 if owner not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should return 401 if password hash is missing', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ id: '1', name: 'Test', email: 'test@example.com', phone: '1234567890', password_hash: null }],
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Account not set up for password login');
    });

    it('should return 401 if password is invalid', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ id: '1', name: 'Test', email: 'test@example.com', phone: '1234567890', password_hash: 'hashedpassword' }],
      });
      mockBcryptCompare.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should return tokens on successful login', async () => {
      const mockOwner = {
        id: '1',
        name: 'Test',
        email: 'test@example.com',
        phone: '1234567890',
        password_hash: 'hashedpassword',
      };
      mockQuery.mockResolvedValue({ rows: [mockOwner] });
      mockBcryptCompare.mockResolvedValue(true);
      mockJwtSign.mockReturnValue('mock-token');

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refresh_token');
      expect(response.body.user).toEqual({
        id: mockOwner.id,
        name: mockOwner.name,
        email: mockOwner.email,
        phone: mockOwner.phone,
        role: 'owner',
        user_type: 'owner',
      });
    });

    it('should return 500 on database error', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Login failed');
    });
  });

  describe('POST /api/auth/staff-login', () => {
    it('should return 400 if email or password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/staff-login')
        .send({ email: 'staff@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and password are required');
    });

    it('should return 400 if password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/staff-login')
        .send({ password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and password are required');
    });

    it('should return 401 if staff not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .post('/api/auth/staff-login')
        .send({ email: 'staff@example.com', password: 'password123' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should return 401 if staff password hash is missing', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ id: '2', name: 'Staff', email: 'staff@example.com', phone: '1234567890', role: 'stylist', salon_id: 'salon-1', password_hash: null }],
      });

      const response = await request(app)
        .post('/api/auth/staff-login')
        .send({ email: 'staff@example.com', password: 'password123' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Account not set up for password login');
    });

    it('should return 401 if staff password is invalid', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ id: '2', name: 'Staff', email: 'staff@example.com', phone: '1234567890', role: 'stylist', salon_id: 'salon-1', password_hash: 'hashedpassword' }],
      });
      mockBcryptCompare.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/auth/staff-login')
        .send({ email: 'staff@example.com', password: 'password123' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should return tokens on successful staff login', async () => {
      const mockStaff = {
        id: '2',
        name: 'Staff',
        email: 'staff@example.com',
        phone: '1234567890',
        role: 'stylist',
        salon_id: 'salon-1',
        password_hash: 'hashedpassword',
      };
      mockQuery.mockResolvedValue({ rows: [mockStaff] });
      mockBcryptCompare.mockResolvedValue(true);
      mockJwtSign.mockReturnValue('mock-staff-token');

      const response = await request(app)
        .post('/api/auth/staff-login')
        .send({ email: 'staff@example.com', password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refresh_token');
      expect(response.body.user).toEqual({
        id: mockStaff.id,
        name: mockStaff.name,
        email: mockStaff.email,
        phone: mockStaff.phone,
        role: 'stylist',
        user_type: 'staff',
        salon_id: mockStaff.salon_id,
      });
    });

    it('should use default role if role is null', async () => {
      const mockStaff = {
        id: '2',
        name: 'Staff',
        email: 'staff@example.com',
        phone: '1234567890',
        role: null,
        salon_id: 'salon-1',
        password_hash: 'hashedpassword',
      };
      mockQuery.mockResolvedValue({ rows: [mockStaff] });
      mockBcryptCompare.mockResolvedValue(true);
      mockJwtSign.mockReturnValue('mock-staff-token');

      const response = await request(app)
        .post('/api/auth/staff-login')
        .send({ email: 'staff@example.com', password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body.user.role).toBe('stylist');
    });

    it('should return 500 on database error', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/auth/staff-login')
        .send({ email: 'staff@example.com', password: 'password123' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Login failed');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should return 400 if refresh token is missing', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Refresh token required');
    });

    it('should return 401 if refresh token is invalid', async () => {
      mockJwtVerify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refresh_token: 'invalid-token' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid or expired refresh token');
    });

    it('should return 401 if refresh token not found in database', async () => {
      const mockPayload = { id: '1', email: 'test@example.com', role: 'owner', user_type: 'owner' };
      mockJwtVerify.mockReturnValue(mockPayload);
      mockQuery.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refresh_token: 'valid-refresh-token' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid refresh token');
    });

    it('should return 401 if stored token does not match', async () => {
      const mockPayload = { id: '1', email: 'test@example.com', role: 'owner', user_type: 'owner' };
      mockJwtVerify.mockReturnValue(mockPayload);
      mockQuery.mockResolvedValue({ rows: [{ token: 'different-token' }] });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refresh_token: 'valid-refresh-token' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid refresh token');
    });

    it('should return new access token on successful refresh', async () => {
      const mockPayload = { id: '1', email: 'test@example.com', role: 'owner', user_type: 'owner' };
      mockJwtVerify.mockReturnValue(mockPayload);
      mockJwtSign.mockReturnValue('new-access-token');
      
      mockQuery.mockResolvedValue({ rows: [{ token: 'valid-refresh-token' }] });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refresh_token: 'valid-refresh-token' });

      expect(response.status).toBe(200);
      expect(response.body.token).toBe('new-access-token');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should return success even if user not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('If an account exists, a reset link has been sent');
    });

    it('should return success if owner found', async () => {
      mockQuery.mockResolvedValue({ rows: [{ id: '1', email: 'test@example.com' }] });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('If an account exists, a reset link has been sent');
    });

    it('should return success if staff found with user_type=staff', async () => {
      mockQuery.mockResolvedValue({ rows: [{ id: '2', email: 'staff@example.com' }] });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'staff@example.com', user_type: 'staff' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('If an account exists, a reset link has been sent');
    });

    it('should return 400 if email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email is required');
    });

    it('should return 500 on database error', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to process request');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should return 400 if token is missing', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ password: 'newpassword' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Token and new password are required');
    });

    it('should return 400 if password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'valid-token' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Token and new password are required');
    });

    it('should return 400 if reset token is invalid', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'invalid-token', password: 'newpassword' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid or expired reset token');
    });

    it('should return 200 on successful owner password reset', async () => {
      mockQuery.mockResolvedValue({ rows: [{ id: '1', user_id: '1' }] });
      mockBcryptHash.mockResolvedValue('hashedpassword');

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'valid-token', password: 'newpassword' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Password reset successfully');
    });

    it('should return 200 on successful staff password reset', async () => {
      mockQuery.mockResolvedValue({ rows: [{ id: '2', user_id: '2' }] });
      mockBcryptHash.mockResolvedValue('hashedpassword');

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'valid-token', password: 'newpassword', user_type: 'staff' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Password reset successfully');
    });

    it('should return 500 on database error', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'valid-token', password: 'newpassword' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to reset password');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user info for owner', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ id: '1', name: 'Test Owner', email: 'test@example.com', phone: '1234567890' }],
      });

      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: '1',
        name: 'Test Owner',
        email: 'test@example.com',
        phone: '1234567890',
        role: 'owner',
        user_type: 'owner',
      });
    });

    it('should return 404 if user not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });

    it('should return 500 on database error', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to get user');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should return 200 on successful logout', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .post('/api/auth/logout')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logged out successfully');
    });

    it('should return 200 even on database error', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/auth/logout')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logged out successfully');
    });
  });
});
