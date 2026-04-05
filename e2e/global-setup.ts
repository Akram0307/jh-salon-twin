import { chromium, FullConfig } from '@playwright/test';
import path from 'path';

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3000';
  const storageStatePath = path.join(__dirname, 'auth-storage.json');

  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL });

  try {
    // Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Fill login form
    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');
    const submitButton = page.locator('button:has-text("Sign in")');

    await emailInput.waitFor({ state: 'visible', timeout: 5000 });
    await emailInput.fill(process.env.E2E_TEST_EMAIL || 'owner@salon.com');
    await passwordInput.fill(process.env.E2E_TEST_PASSWORD || 'test-password');
    await submitButton.click();

    // Wait for redirect to dashboard
    await page.waitForURL('**/owner/dashboard', { timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Save storage state
    await page.context().storageState({ path: storageStatePath });
    console.log(`✓ Auth storage state saved to ${storageStatePath}`);
  } catch (error: any) {
    console.warn(`⚠ Global setup: Could not authenticate - ${error.message}`);
    console.warn('  Tests requiring auth will use test.skip() or setAuthState()');
  } finally {
    await browser.close();
  }
}

export default globalSetup;
