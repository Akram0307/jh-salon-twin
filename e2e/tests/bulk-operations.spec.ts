import { test, expect } from '@playwright/test';
import { setAuthState } from '../helpers/auth.helper';

test.describe('Bulk Operations', () => {
  test.beforeEach(async ({ page }) => {
    await setAuthState(page);
  });

  test('should navigate to clients page', async ({ page }) => {
    await page.goto('/owner/clients');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await expect(page.locator('h1, h2').filter({ hasText: /clients|customers/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('should display client list with selection capability', async ({ page }) => {
    await page.goto('/owner/clients');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const checkboxes = page.locator('input[type="checkbox"], [role="checkbox"]');
    const selectAllButton = page.locator('button').filter({ hasText: /select all|bulk/i }).first();

    const hasCheckboxes = (await checkboxes.count()) > 0;
    const hasSelectAll = await selectAllButton.isVisible().catch(() => false);

    expect(hasCheckboxes || hasSelectAll).toBeTruthy();
  });

  test('should select multiple clients for bulk action', async ({ page }) => {
    await page.goto('/owner/clients');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const checkboxes = page.locator('input[type="checkbox"], [role="checkbox"]');
    const checkboxCount = await checkboxes.count();

    if (checkboxCount >= 2) {
      await checkboxes.nth(0).click();
      await page.waitForTimeout(200);
      await checkboxes.nth(1).click();
      await page.waitForTimeout(500);

      const bulkToolbar = page.locator('[class*="bulk"], [class*="selection"], [class*="action-bar"]').first();
      const selectedCount = page.locator('text=/\d+ selected/i, text=/\d+ items/i').first();
      const hasToolbar = await bulkToolbar.isVisible().catch(() => false);
      const hasCount = await selectedCount.isVisible().catch(() => false);
      expect(hasToolbar || hasCount).toBeTruthy();
    } else {
      test.skip(true, 'Not enough clients for bulk selection test');
    }
  });

  test('should export selected clients (requires backend)', async ({ page }) => {
    test.skip(true, 'Export requires backend with client data');
  });

  test('should bulk cancel appointments (requires backend)', async ({ page }) => {
    test.skip(true, 'Bulk cancel requires backend with appointment data');
  });
});
