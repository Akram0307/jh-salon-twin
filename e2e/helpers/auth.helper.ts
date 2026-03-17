import { Page } from '@playwright/test';

const TEST_CREDENTIALS = {
  email: process.env.E2E_TEST_EMAIL || 'owner@salon.com',
  password: process.env.E2E_TEST_PASSWORD || 'test-password',
};

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * Login via API and store token in localStorage.
 * Returns the token string or null on failure.
 */
export async function loginViaAPI(page: Page): Promise<string | null> {
  try {
    const response = await page.context().request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: TEST_CREDENTIALS.email,
        password: TEST_CREDENTIALS.password,
      },
    });

    if (!response.ok()) {
      console.warn(`API login failed: ${response.status()} ${response.statusText()}`);
      return null;
    }

    const body = await response.json();
    const token = body.token || body.accessToken || body.data?.token || null;

    if (token) {
      await page.goto('/');
      await page.evaluate((tok: string) => {
        localStorage.setItem('auth_token', tok);
        localStorage.setItem('auth_user', JSON.stringify({
          email: TEST_CREDENTIALS.email,
          role: 'owner',
        }));
      }, token);
    }

    return token;
  } catch (error: any) {
    console.warn(`API login error: ${error.message}`);
    return null;
  }
}

/**
 * Inject auth state into localStorage for pre-authenticated tests.
 * Use this when you have a known valid token (e.g., from CI storage state).
 */
export async function setAuthState(page: Page, token?: string): Promise<void> {
  const authToken = token || process.env.E2E_AUTH_TOKEN || 'test-token';
  await page.goto('/');
  await page.evaluate((tok: string) => {
    localStorage.setItem('auth_token', tok);
    localStorage.setItem('auth_user', JSON.stringify({
      email: TEST_CREDENTIALS.email,
      role: 'owner',
    }));
  }, authToken);
}

/**
 * Clear auth state from localStorage for logout tests.
 */
export async function clearAuthState(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token_expiry');
  });
}
