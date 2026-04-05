import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted to define mocks that can be used in vi.mock
const { mockQuery, mockConnect, mockEnd, mockOn, MockPool } = vi.hoisted(() => {
  const mockQuery = vi.fn();
  const mockConnect = vi.fn();
  const mockEnd = vi.fn();
  const mockOn = vi.fn();
  
  // Create a proper mock class that can be instantiated with 'new'
  class MockPool {
    query = mockQuery;
    connect = mockConnect;
    end = mockEnd;
    on = mockOn;
    constructor(config: any) {
      // Store config for verification if needed
    }
  }
  
  return { mockQuery, mockConnect, mockEnd, mockOn, MockPool };
});

// Mock the 'pg' module - Pool should be the MockPool class
vi.mock('pg', () => ({
  Pool: MockPool,
}));

// Import after mock
import { query, getClient, pool } from '../../config/db';

describe('db config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DB_USER = 'testuser';
    process.env.DB_PASSWORD = 'testpass';
    process.env.DB_NAME = 'testdb';
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '5432';
    delete process.env.INSTANCE_CONNECTION_NAME;
  });

  afterEach(() => {
    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_NAME;
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.INSTANCE_CONNECTION_NAME;
  });

  describe('query', () => {
    it('should call pool.query with text and params', async () => {
      const mockResult = { rows: [] };
      mockQuery.mockResolvedValue(mockResult);

      const result = await query('SELECT 1', []);

      expect(mockQuery).toHaveBeenCalledWith('SELECT 1', []);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getClient', () => {
    it('should return a client from pool.connect', async () => {
      const mockClient = { release: vi.fn() };
      mockConnect.mockResolvedValue(mockClient);

      const client = await getClient();

      expect(mockConnect).toHaveBeenCalled();
      expect(client).toEqual(mockClient);
    });
  });

  describe('pool', () => {
    it('should have query method that calls pool.query', async () => {
      const mockResult = { rows: [] };
      mockQuery.mockResolvedValue(mockResult);

      const result = await pool.query('SELECT 1', []);

      expect(mockQuery).toHaveBeenCalledWith('SELECT 1', []);
      expect(result).toEqual(mockResult);
    });

    it('should have connect method that calls pool.connect', async () => {
      const mockClient = { release: vi.fn() };
      mockConnect.mockResolvedValue(mockClient);

      const client = await pool.connect();

      expect(mockConnect).toHaveBeenCalled();
      expect(client).toEqual(mockClient);
    });

    it('should have on method that calls pool.on', () => {
      const handler = vi.fn();
      pool.on('error', handler);
      expect(mockOn).toHaveBeenCalledWith('error', handler);
    });

    it('should have end method that calls pool.end', async () => {
      mockEnd.mockResolvedValue(undefined);
      await pool.end();
      expect(mockEnd).toHaveBeenCalled();
    });
  });
});
