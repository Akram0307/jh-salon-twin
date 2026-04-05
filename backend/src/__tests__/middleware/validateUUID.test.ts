import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { validateUUID } from '../../middleware/validateUUID';

describe('validateUUID middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      params: {},
      query: {},
      body: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
  });

  it('should call next() when no UUID fields are present', () => {
    validateUUID(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it('should call next() when salon_id is a valid UUID', () => {
    mockReq.query = { salon_id: '123e4567-e89b-12d3-a456-426614174000' };
    validateUUID(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it('should return 400 when salon_id is an invalid UUID', () => {
    mockReq.query = { salon_id: 'invalid-uuid' };
    validateUUID(mockReq as Request, mockRes as Response, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid UUID' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next() when service_id is a valid UUID', () => {
    mockReq.query = { service_id: '123e4567-e89b-12d3-a456-426614174000' };
    validateUUID(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it('should return 400 when service_id is an invalid UUID', () => {
    mockReq.query = { service_id: 'invalid-uuid' };
    validateUUID(mockReq as Request, mockRes as Response, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid UUID' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next() when client_id is a valid UUID', () => {
    mockReq.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
    mockReq.body = { client_id: '123e4567-e89b-12d3-a456-426614174000' };
    validateUUID(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it('should return 400 when client_id is an invalid UUID', () => {
    mockReq.body = { client_id: 'not-a-uuid' };
    validateUUID(mockReq as Request, mockRes as Response, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid UUID' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle multiple UUID fields with all valid', () => {
    mockReq.query = {
      salon_id: '123e4567-e89b-12d3-a456-426614174000',
      service_id: '123e4567-e89b-12d3-a456-426614174001',
    };
    mockReq.body = { client_id: '123e4567-e89b-12d3-a456-426614174002' };
    validateUUID(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it('should return 400 when one of multiple UUID fields is invalid', () => {
    mockReq.query = {
      salon_id: '123e4567-e89b-12d3-a456-426614174000',
      service_id: 'invalid',
    };
    validateUUID(mockReq as Request, mockRes as Response, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle empty string as valid (no value check)', () => {
    mockReq.query = { salon_id: '' };
    validateUUID(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it('should handle undefined as valid (no value check)', () => {
    mockReq.query = { salon_id: undefined };
    validateUUID(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });
});
