import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { Pool } from 'pg';

// Mock database connection for tests
let mockPool: Pool;

beforeAll(async () => {
  // Setup test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/salonos_test';
  
  // Initialize mock pool
  mockPool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
});

afterAll(async () => {
  // Cleanup
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
