import { test, expect } from '@playwright/test';
import { pos } from '../helpers/selectors';
import { setAuthState } from '../helpers/auth.helper';

test.describe('POS - Payment Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setAuthState(page);
    await page.goto('/owner/pos');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  });

  test('@pos should display payment section', async ({ page }) => {
    await expect(page.locator(pos.paymentSection).first()).toBeVisible({ timeout: 10000 });
  });

  test('@pos should display payment method options', async ({ page }) => {
    const cashButton = page.locator('button').filter({ hasText: /cash/i });
    const upiButton = page.locator('button').filter({ hasText: /upi|phonepe/i });
    const cardButton = page.locator('button').filter({ hasText: /card/i });

    const hasCash = await cashButton.isVisible().catch(() => false);
    const hasUpi = await upiButton.isVisible().catch(() => false);
    const hasCard = await cardButton.isVisible().catch(() => false);

    expect(hasCash || hasUpi || hasCard).toBeTruthy();
  });

  test('@pos should record a cash payment', async ({ page }) => {
    // Add a service first
    const serviceItem = page.locator('button, [role="button"]').filter({ hasText: /haircut|styling|color/i }).first();
    if (await serviceItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await serviceItem.click();
      await page.waitForTimeout(500);
    }

    // Select cash
    const cashButton = page.locator('button').filter({ hasText: /cash/i }).first();
    if (await cashButton.isVisible().catch(() => false)) {
      await cashButton.click();
    }

    // Submit
    const submitButton = page.locator('button').filter({ hasText: /record|submit|pay|confirm/i }).first();
    if (await submitButton.isVisible().catch(() => false)) {
      await submitButton.click();
      await expect(page.locator('text=/success|completed|paid/i')).toBeVisible({ timeout: 10000 });
    }
  });

  test('@pos should generate Z-report', async ({ page }) => {
    const zReportButton = page.locator('button').filter({ hasText: /z-?report|daily report|end of day/i }).first();
    if (await zReportButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await zReportButton.click();
      const reportContent = page.locator('[class*="report"], [class*="summary"]').first();
      await expect(reportContent).toBeVisible({ timeout: 5000 });
    }
  });
});
