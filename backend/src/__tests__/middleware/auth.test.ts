import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';

const { mockSign, mockVerify, mockQuery, JsonWebTokenError, TokenExpiredError } = vi.hoisted(() => {
  class JsonWebTokenError extends Error {}
  class TokenExpiredError extends JsonWebTokenError {}
  return {
    mockSign: vi.fn(),
    mockVerify: vi.fn(),
    mockQuery: vi.fn(),
    JsonWebTokenError,
    TokenExpiredError,
  };
});

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: mockSign,
    verify: mockVerify,
    JsonWebTokenError,
    TokenExpiredError,
  },
  sign: mockSign,
  verify: mockVerify,
  JsonWebTokenError,
  TokenExpiredError,
}));

vi.mock('../../config/db', () => ({
  default: { query: mockQuery },
}));

import jwt from 'jsonwebtoken';
import { authenticate, authorize, requireOwner, requireStaffOrOwner, AuthRequest } from '../../middleware/auth';

describe('auth middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequest = { headers: {} };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    nextFunction = vi.fn();
  });

  describe('authenticate', () => {
    it('should return 401 if no authorization header', async () => {
      await authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if authorization header does not start with Bearer', async () => {
      mockRequest.headers = { authorization: 'Invalid token' };
      await authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' };
      mockVerify.mockImplementation(() => { throw new jwt.JsonWebTokenError('invalid'); });
      await authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should set user and call next if token is valid', async () => {
      const mockDecoded = { id: '1', email: 'test@example.com', role: 'owner', user_type: 'owner' };
      mockRequest.headers = { authorization: 'Bearer valid-token' };
      mockVerify.mockReturnValue(mockDecoded as any);
      mockQuery.mockResolvedValue({ rows: [{ id: '1', email: 'test@example.com', role: 'owner', user_type: 'owner' }] });
      await authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);
      expect(mockQuery).toHaveBeenCalledWith('SELECT id, email, role, user_type FROM users WHERE id = $1', ['1']);
      expect(mockRequest.user).toEqual({ id: '1', email: 'test@example.com', role: 'owner', user_type: 'owner' });
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 if user not found in database', async () => {
      const mockDecoded = { id: '1', email: 'test@example.com', role: 'owner', user_type: 'owner' };
      mockRequest.headers = { authorization: 'Bearer valid-token' };
      mockVerify.mockReturnValue(mockDecoded as any);
      mockQuery.mockResolvedValue({ rows: [] });
      await authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'User not found' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if token is expired', async () => {
      mockRequest.headers = { authorization: 'Bearer expired-token' };
      mockVerify.mockImplementation(() => { throw new jwt.TokenExpiredError('expired', new Date()); });
      await authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('authorize', () => {
    it('should return 401 if user is not set', () => {
      const middleware = authorize('owner', 'admin');
      middleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 if user role is not allowed', () => {
      mockRequest.user = { id: '1', email: 'test@example.com', role: 'stylist', user_type: 'staff' };
      const middleware = authorize('owner', 'admin');
      middleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should call next if user role is allowed', () => {
      mockRequest.user = { id: '1', email: 'test@example.com', role: 'owner', user_type: 'owner' };
      const middleware = authorize('owner', 'admin');
      middleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('requireOwner', () => {
    it('should allow owner role', () => {
      mockRequest.user = { id: '1', email: 'test@example.com', role: 'owner', user_type: 'owner' };
      requireOwner(mockRequest as AuthRequest, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should allow owner user_type even with different role', () => {
      mockRequest.user = { id: '1', email: 'test@example.com', role: 'admin', user_type: 'owner' };
      requireOwner(mockRequest as AuthRequest, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should deny non-owner role and user_type', () => {
      mockRequest.user = { id: '1', email: 'test@example.com', role: 'manager', user_type: 'staff' };
      requireOwner(mockRequest as AuthRequest, mockResponse as Response, nextFunction);
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Owner access required' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not set', () => {
      requireOwner(mockRequest as AuthRequest, mockResponse as Response, nextFunction);
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
    });
  });

  describe('authorize as managerAndAbove', () => {
    it('should allow owner role', () => {
      mockRequest.user = { id: '1', email: 'test@example.com', role: 'owner', user_type: 'owner' };
      const middleware = authorize('owner', 'admin', 'manager');
      middleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should allow admin role', () => {
      mockRequest.user = { id: '1', email: 'test@example.com', role: 'admin', user_type: 'owner' };
      const middleware = authorize('owner', 'admin', 'manager');
      middleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should allow manager role', () => {
      mockRequest.user = { id: '1', email: 'test@example.com', role: 'manager', user_type: 'staff' };
      const middleware = authorize('owner', 'admin', 'manager');
      middleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should deny stylist role', () => {
      mockRequest.user = { id: '1', email: 'test@example.com', role: 'stylist', user_type: 'staff' };
      const middleware = authorize('owner', 'admin', 'manager');
      middleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('requireStaffOrOwner', () => {
    it('should allow owner role', () => {
      mockRequest.user = { id: '1', email: 'test@example.com', role: 'owner', user_type: 'owner' };
      requireStaffOrOwner(mockRequest as AuthRequest, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should allow staff role', () => {
      mockRequest.user = { id: '1', email: 'test@example.com', role: 'staff', user_type: 'staff' };
      requireStaffOrOwner(mockRequest as AuthRequest, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should allow owner user_type with non-staff role', () => {
      mockRequest.user = { id: '1', email: 'test@example.com', role: 'admin', user_type: 'owner' };
      requireStaffOrOwner(mockRequest as AuthRequest, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should allow staff user_type with non-staff role', () => {
      mockRequest.user = { id: '1', email: 'test@example.com', role: 'stylist', user_type: 'staff' };
      requireStaffOrOwner(mockRequest as AuthRequest, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should deny role and user_type that are neither owner nor staff', () => {
      mockRequest.user = { id: '1', email: 'test@example.com', role: 'client', user_type: 'client' };
      requireStaffOrOwner(mockRequest as AuthRequest, mockResponse as Response, nextFunction);
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Staff or owner access required' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not set', () => {
      requireStaffOrOwner(mockRequest as AuthRequest, mockResponse as Response, nextFunction);
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
    });
  });
});
