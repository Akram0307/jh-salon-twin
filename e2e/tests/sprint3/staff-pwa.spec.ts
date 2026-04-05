import { test, expect } from '@playwright/test';
import { setAuthState } from '../../helpers/auth.helper';

test.describe('Staff Workspace PWA', () => {
  test.beforeEach(async ({ page }) => {
    // Staff pages require authentication
    await setAuthState(page, process.env.E2E_STAFF_TOKEN || 'test-staff-token');
  });

  test('@staff should view daily schedule', async ({ page }) => {
    await page.goto('/staff/schedule');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Verify schedule page loaded with relevant content
    const scheduleContent = page.locator('text=/schedule|today|appointments/i').first();
    await expect(scheduleContent).toBeVisible({ timeout: 10000 });
  });

  test('@staff should view earnings summary', async ({ page }) => {
    await page.goto('/staff/earnings');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    const earningsContent = page.locator('text=/earnings|revenue|income/i').first();
    await expect(earningsContent).toBeVisible({ timeout: 10000 });
  });

  test('@staff should manage availability', async ({ page }) => {
    await page.goto('/staff/availability');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    const availabilityContent = page.locator('text=/availability|schedule|hours|days/i').first();
    await expect(availabilityContent).toBeVisible({ timeout: 10000 });
  });
});
