import { test, expect } from '@playwright/test';
import { pos } from '../helpers/selectors';
import { setAuthState } from '../helpers/auth.helper';

test.describe('POS - Service Selection & Cart', () => {
  test.beforeEach(async ({ page }) => {
    await setAuthState(page);
    await page.goto('/owner/pos');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  });

  test('@pos should load POS page', async ({ page }) => {
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('@pos should display client selector', async ({ page }) => {
    await expect(page.locator(pos.clientSelector).first()).toBeVisible({ timeout: 10000 });
  });

  test('@pos should display staff selector', async ({ page }) => {
    await expect(page.locator(pos.staffSelector).first()).toBeVisible({ timeout: 10000 });
  });

  test('@pos should display service selection area', async ({ page }) => {
    await expect(page.locator(pos.serviceSelection).first()).toBeVisible({ timeout: 10000 });
  });

  test('@pos should display cart area', async ({ page }) => {
    await expect(page.locator(pos.cart).first()).toBeVisible({ timeout: 10000 });
  });

  test('@pos should add service to cart (requires backend)', async ({ page }) => {
    test.skip(true, 'Requires running backend with services configured');

    const serviceItem = page.locator('button, [role="button"]').filter({ hasText: /haircut|styling|color/i }).first();
    if (await serviceItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await serviceItem.click();
      await page.waitForTimeout(500);
      // Verify cart updated
      await expect(page.locator(pos.cart)).toContainText(/haircut|styling|color/i);
    }
  });
});
