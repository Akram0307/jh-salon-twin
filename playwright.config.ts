import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  outputDir: './e2e/test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  timeout: 30000,
  globalSetup: process.env.CI ? './e2e/global-setup.ts' : undefined,
  globalTeardown: process.env.CI ? './e2e/global-teardown.ts' : undefined,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: {
      mode: 'only-on-failure',
      path: './e2e/screenshots/current',
    },
    ...(process.env.CI
      ? { storageState: './e2e/auth-storage.json' }
      : {}),
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: ['**/visual-comparison.spec.ts'],
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 12'] },
      testIgnore: ['**/visual-comparison.spec.ts'],
    },
    {
      name: 'visual-regression',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/visual-comparison.spec.ts',
    },
  ],
  webServer: {
    command: 'cd frontend-next && npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
