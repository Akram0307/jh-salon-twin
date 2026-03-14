import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';

// Use vi.hoisted to create mocks that work properly
const { mockSign, mockVerify } = vi.hoisted(() => ({
  mockSign: vi.fn(),
  mockVerify: vi.fn(),
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: mockSign,
    verify: mockVerify,
  },
  sign: mockSign,
  verify: mockVerify,
}));

import jwt from 'jsonwebtoken';
import { authenticate, authorize, ownerOnly, managerAndAbove, allStaff, AuthRequest } from '../../middleware/auth';

describe('auth middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequest = {
      headers: {},
    };
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
      mockVerify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should set user and call next if token is valid', async () => {
      const mockDecoded = {
        id: '1',
        email: 'test@example.com',
        role: 'owner',
        user_type: 'owner',
      };
      mockRequest.headers = { authorization: 'Bearer valid-token' };
      mockVerify.mockReturnValue(mockDecoded as any);

      await authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toEqual(mockDecoded);
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('authorize', () => {
    it('should return 401 if user is not set', () => {
      const middleware = authorize('owner', 'admin');
      middleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 if user role is not allowed', () => {
      mockRequest.user = {
        id: '1',
        email: 'test@example.com',
        role: 'stylist',
        user_type: 'staff',
      };
      const middleware = authorize('owner', 'admin');
      middleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should call next if user role is allowed', () => {
      mockRequest.user = {
        id: '1',
        email: 'test@example.com',
        role: 'owner',
        user_type: 'owner',
      };
      const middleware = authorize('owner', 'admin');
      middleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('ownerOnly', () => {
    it('should allow owner role', () => {
      mockRequest.user = {
        id: '1',
        email: 'test@example.com',
        role: 'owner',
        user_type: 'owner',
      };
      ownerOnly(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should allow admin role', () => {
      mockRequest.user = {
        id: '1',
        email: 'test@example.com',
        role: 'admin',
        user_type: 'owner',
      };
      ownerOnly(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should deny manager role', () => {
      mockRequest.user = {
        id: '1',
        email: 'test@example.com',
        role: 'manager',
        user_type: 'staff',
      };
      ownerOnly(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });
  });

  describe('managerAndAbove', () => {
    it('should allow owner role', () => {
      mockRequest.user = {
        id: '1',
        email: 'test@example.com',
        role: 'owner',
        user_type: 'owner',
      };
      managerAndAbove(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should allow admin role', () => {
      mockRequest.user = {
        id: '1',
        email: 'test@example.com',
        role: 'admin',
        user_type: 'owner',
      };
      managerAndAbove(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should allow manager role', () => {
      mockRequest.user = {
        id: '1',
        email: 'test@example.com',
        role: 'manager',
        user_type: 'staff',
      };
      managerAndAbove(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should deny stylist role', () => {
      mockRequest.user = {
        id: '1',
        email: 'test@example.com',
        role: 'stylist',
        user_type: 'staff',
      };
      managerAndAbove(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });
  });

  describe('allStaff', () => {
    it('should allow owner role', () => {
      mockRequest.user = {
        id: '1',
        email: 'test@example.com',
        role: 'owner',
        user_type: 'owner',
      };
      allStaff(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should allow admin role', () => {
      mockRequest.user = {
        id: '1',
        email: 'test@example.com',
        role: 'admin',
        user_type: 'owner',
      };
      allStaff(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should allow manager role', () => {
      mockRequest.user = {
        id: '1',
        email: 'test@example.com',
        role: 'manager',
        user_type: 'staff',
      };
      allStaff(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should allow stylist role', () => {
      mockRequest.user = {
        id: '1',
        email: 'test@example.com',
        role: 'stylist',
        user_type: 'staff',
      };
      allStaff(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });
  });
});
