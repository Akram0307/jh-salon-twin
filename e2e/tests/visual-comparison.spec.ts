import { test, expect } from '@playwright/test';
import { setAuthState } from '../helpers/auth.helper';

const VISUAL_OPTIONS = {
  fullPage: true,
  maxDiffPixelRatio: 0.02,
  threshold: 0.15,
} as const;

test.describe('Visual Regression Baselines', () => {
  test.describe.configure({ mode: 'serial' });

  test('owner-dashboard', async ({ page }) => {
    await setAuthState(page);
    await page.goto('/owner/dashboard');
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await expect(page.locator('h1').filter({ hasText: 'Dashboard' })).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveScreenshot('owner-dashboard.png', VISUAL_OPTIONS);
  });

  test('schedule-view', async ({ page }) => {
    await setAuthState(page);
    await page.goto('/owner/schedule');
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await expect(page).toHaveScreenshot('schedule-view.png', VISUAL_OPTIONS);
  });

  test('client-chat', async ({ page }) => {
    await page.goto('/client/chat');
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await expect(page).toHaveScreenshot('client-chat.png', VISUAL_OPTIONS);
  });

  test('staff-schedule', async ({ page }) => {
    await setAuthState(page, process.env.E2E_STAFF_TOKEN || 'test-staff-token');
    await page.goto('/staff/schedule');
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await expect(page).toHaveScreenshot('staff-schedule.png', VISUAL_OPTIONS);
  });

  test('settings-page', async ({ page }) => {
    await setAuthState(page);
    await page.goto('/owner/settings');
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await expect(page).toHaveScreenshot('settings-page.png', VISUAL_OPTIONS);
  });

  test('onboarding-page', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await expect(page).toHaveScreenshot('onboarding-page.png', VISUAL_OPTIONS);
  });
});
