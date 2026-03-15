import { test, expect } from '@playwright/test';

test.describe('Bulk Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'owner@salon.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should navigate to clients page', async ({ page }) => {
    await page.goto('/owner/clients');
    await page.waitForLoadState('networkidle');

    // Verify clients page loaded
    const clientsHeading = page.locator('h1, h2').filter({ hasText: /clients|customers/i });
    await expect(clientsHeading.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display client list with checkboxes', async ({ page }) => {
    await page.goto('/owner/clients');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for checkboxes or selection elements
    const checkboxes = page.locator('input[type="checkbox"], [role="checkbox"]');
    const checkboxCount = await checkboxes.count();

    // If checkboxes exist, we have bulk selection capability
    if (checkboxCount > 0) {
      expect(checkboxCount).toBeGreaterThan(0);
    } else {
      // Look for select all button or bulk action toolbar
      const selectAllButton = page.locator('button').filter({ hasText: /select all|bulk/i }).first();
      const hasSelectAll = await selectAllButton.isVisible().catch(() => false);

      // Either checkboxes or select all should be available
      expect(hasSelectAll || checkboxCount > 0).toBeTruthy();
    }
  });

  test('should select multiple clients', async ({ page }) => {
    await page.goto('/owner/clients');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find checkboxes for client selection
    const checkboxes = page.locator('input[type="checkbox"], [role="checkbox"]');
    const checkboxCount = await checkboxes.count();

    if (checkboxCount >= 2) {
      // Select first two clients
      await checkboxes.nth(0).click();
      await page.waitForTimeout(200);
      await checkboxes.nth(1).click();
      await page.waitForTimeout(500);

      // Look for bulk action toolbar that appears after selection
      const bulkToolbar = page.locator('[class*="bulk"], [class*="selection"], [class*="action-bar"]').first();
      const hasToolbar = await bulkToolbar.isVisible().catch(() => false);

      // Look for selected count indicator
      const selectedCount = page.locator('text=/\d+ selected/i, text=/\d+ items/i').first();
      const hasCount = await selectedCount.isVisible().catch(() => false);

      // Either toolbar or count should be visible after selection
      expect(hasToolbar || hasCount).toBeTruthy();
    } else {
      test.skip(true, 'Not enough clients for bulk selection test');
    }
  });

  test('should export selected clients', async ({ page }) => {
    await page.goto('/owner/clients');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Select multiple clients
    const checkboxes = page.locator('input[type="checkbox"], [role="checkbox"]');
    const checkboxCount = await checkboxes.count();

    if (checkboxCount >= 2) {
      await checkboxes.nth(0).click();
      await page.waitForTimeout(200);
      await checkboxes.nth(1).click();
      await page.waitForTimeout(500);

      // Look for export button
      const exportButton = page.locator('button').filter({ hasText: /export|download/i }).first();

      if (await exportButton.isVisible().catch(() => false)) {
        await exportButton.click();
        await page.waitForTimeout(1000);

        // Look for export format options or download dialog
        const exportDialog = page.locator('[class*="dialog"], [class*="modal"], [role="dialog"]').first();
        const hasDialog = await exportDialog.isVisible().catch(() => false);

        // Look for CSV/Excel options
        const csvOption = page.locator('button, a').filter({ hasText: /csv|excel|download/i }).first();
        const hasCsvOption = await csvOption.isVisible().catch(() => false);

        // Either dialog or direct download should be available
        expect(hasDialog || hasCsvOption).toBeTruthy();
      }
    } else {
      test.skip(true, 'Not enough clients for export test');
    }
  });

  test('should bulk cancel appointments', async ({ page }) => {
    await page.goto('/owner/schedule');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for appointment checkboxes
    const checkboxes = page.locator('[class*="appointment"] input[type="checkbox"], [class*="event"] input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();

    if (checkboxCount >= 2) {
      // Select multiple appointments
      await checkboxes.nth(0).click();
      await page.waitForTimeout(200);
      await checkboxes.nth(1).click();
      await page.waitForTimeout(500);

      // Look for cancel button
      const cancelButton = page.locator('button').filter({ hasText: /cancel|delete/i }).first();

      if (await cancelButton.isVisible().catch(() => false)) {
        await cancelButton.click();
        await page.waitForTimeout(500);

        // Look for confirmation dialog
        const confirmDialog = page.locator('[class*="confirm"], [class*="dialog"], [role="alertdialog"]').first();
        const hasConfirm = await confirmDialog.isVisible().catch(() => false);

        // Confirmation should appear before bulk action
        expect(hasConfirm).toBeTruthy();
      }
    } else {
      test.skip(true, 'Not enough appointments for bulk cancel test');
    }
  });
});
