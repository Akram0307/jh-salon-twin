/**
 * Test credentials for E2E tests requiring backend authentication.
 * Defaults come from environment variables; fallbacks are provided for local development.
 */

export const TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'owner@salon.com';
export const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'test-password';

export interface TestCredentials {
  email: string;
  password: string;
}

/**
 * Returns the test credentials to use for login flows.
 */
export function getTestCredentials(): TestCredentials {
  return {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  };
}
