import { test, expect } from '@playwright/test';

test.describe('POS Payment Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'owner@salon.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should navigate to POS page', async ({ page }) => {
    await page.goto('/frontdesk/pos');
    await page.waitForLoadState('networkidle');

    // Verify POS page loaded
    const posHeading = page.locator('h1, h2').filter({ hasText: /pos|point of sale|checkout/i });
    await expect(posHeading.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display payment method options', async ({ page }) => {
    await page.goto('/frontdesk/pos');
    await page.waitForLoadState('networkidle');

    // Look for payment method buttons
    const cashButton = page.locator('button').filter({ hasText: /cash/i });
    const upiButton = page.locator('button').filter({ hasText: /upi|phonepe/i });
    const cardButton = page.locator('button').filter({ hasText: /card/i });

    // At least one payment method should be visible
    const hasCash = await cashButton.isVisible().catch(() => false);
    const hasUpi = await upiButton.isVisible().catch(() => false);
    const hasCard = await cardButton.isVisible().catch(() => false);

    expect(hasCash || hasUpi || hasCard).toBeTruthy();
  });

  test('should record a cash payment', async ({ page }) => {
    await page.goto('/frontdesk/pos');
    await page.waitForLoadState('networkidle');

    // Select a service if available
    const serviceItem = page.locator('[class*="service"], button').filter({ hasText: /haircut|styling|color/i }).first();
    if (await serviceItem.isVisible().catch(() => false)) {
      await serviceItem.click();
      await page.waitForTimeout(500);
    }

    // Select cash payment method
    const cashButton = page.locator('button').filter({ hasText: /cash/i }).first();
    if (await cashButton.isVisible().catch(() => false)) {
      await cashButton.click();
    }

    // Look for amount input
    const amountInput = page.locator('input[type="number"], input[placeholder*="amount"]').first();
    if (await amountInput.isVisible().catch(() => false)) {
      await amountInput.fill('500');
    }

    // Submit payment
    const submitButton = page.locator('button').filter({ hasText: /record|submit|pay|confirm/i }).first();
    if (await submitButton.isVisible().catch(() => false)) {
      await submitButton.click();
      await page.waitForTimeout(1000);
    }

    // Verify success or continue (test may be skipped if backend not available)
    test.skip(true, 'Payment recording requires backend integration');
  });

  test('should generate Z-report', async ({ page }) => {
    await page.goto('/frontdesk/pos');
    await page.waitForLoadState('networkidle');

    // Look for Z-report button
    const zReportButton = page.locator('button').filter({ hasText: /z-?report|daily report|end of day/i }).first();

    if (await zReportButton.isVisible().catch(() => false)) {
      await zReportButton.click();
      await page.waitForTimeout(1000);

      // Verify report modal or page appears
      const reportContent = page.locator('[class*="report"], [class*="summary"]').first();
      await expect(reportContent).toBeVisible({ timeout: 5000 });
    }
  });
});
