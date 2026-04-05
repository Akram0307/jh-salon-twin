// IMPORTANT: Environment variables MUST be set before any imports
// that trigger module-level code (e.g., auth middleware, queue config)
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/salonos_test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-vitest-must-be-32chars';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-key-for-vitest-32ch';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.REDIS_URL = 'redis://localhost:6379';

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { Pool } from 'pg';

// Mock database connection for tests
let mockPool: Pool;

beforeAll(async () => {
  mockPool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
});

afterAll(async () => {
  if (mockPool) {
    await mockPool.end();
  }
});

beforeEach(() => {
  // Reset mocks before each test
});

afterEach(() => {
  // Cleanup after each test
});

export { mockPool };
