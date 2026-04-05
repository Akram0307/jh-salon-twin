import { test, expect } from '@playwright/test';
import { login, dashboard, sidebar } from '../../helpers/selectors';
import { setAuthState } from '../../helpers/auth.helper';
import { getTestCredentials } from '../../helpers/test-credentials';

test.describe('Mobile Viewport Tests', () => {
  test('should display login form on mobile', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    await expect(page.locator(login.heading)).toBeVisible({ timeout: 10000 });
    await expect(page.locator(login.emailInput)).toBeVisible();
    await expect(page.locator(login.passwordInput)).toBeVisible();
    await expect(page.locator(login.submitButton)).toBeVisible();
  });

  test('@smoke should login and load dashboard on mobile (requires backend)', async ({ page }) => {
    const { email, password } = getTestCredentials();

    await page.locator(login.emailInput).fill(email);
    await page.locator(login.passwordInput).fill(password);
    await page.locator(login.submitButton).tap();

    await expect(page).toHaveURL('/owner/dashboard', { timeout: 15000 });
    await expect(page.locator(dashboard.heading)).toBeVisible({ timeout: 10000 });
  });

  test('should navigate dashboard on mobile', async ({ page }) => {
    await setAuthState(page);
    await page.goto('/owner/dashboard');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    await expect(page.locator(dashboard.heading)).toBeVisible({ timeout: 10000 });

    // Try mobile menu button
    const menuButton = page.locator('button[aria-label="menu"], button[aria-label="Menu"]').first();
    if (await menuButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await menuButton.tap();
      await page.waitForTimeout(500);

      const scheduleLink = page.locator('a').filter({ hasText: /schedule/i }).first();
      if (await scheduleLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await scheduleLink.tap();
        await expect(page).toHaveURL(/owner\/schedule/, { timeout: 10000 });
      }
    } else {
      // Sidebar may be always visible on larger mobile or tablet
      const scheduleLink = page.locator(sidebar.navLinks.schedule);
      if (await scheduleLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await scheduleLink.tap();
        await expect(page).toHaveURL(/owner\/schedule/, { timeout: 10000 });
      }
    }
  });

  test('should display client chat on mobile', async ({ page }) => {
    await page.goto('/client/chat');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    const greeting = page.locator('text=/hi|hello|welcome/i').first();
    await expect(greeting).toBeVisible({ timeout: 10000 });
  });

  test('should handle orientation changes on dashboard', async ({ page }) => {
    await setAuthState(page);
    await page.goto('/owner/dashboard');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Portrait
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    await expect(page.locator(dashboard.heading)).toBeVisible({ timeout: 10000 });

    // Landscape
    await page.setViewportSize({ width: 812, height: 375 });
    await page.waitForTimeout(500);
    await expect(page.locator(dashboard.heading)).toBeVisible({ timeout: 10000 });

    // Back to portrait
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    await expect(page.locator(dashboard.heading)).toBeVisible({ timeout: 10000 });
  });

  test('should have responsive layout on dashboard', async ({ page }) => {
    await setAuthState(page);
    await page.goto('/owner/dashboard');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    const mobileMenu = page.locator('button[aria-label="menu"], button[aria-label="Menu"], [class*="mobile-menu"]').first();
    const gridItems = page.locator('[class*="grid"] > div, [class*="card"]').first();

    const hasMobileMenu = await mobileMenu.isVisible().catch(() => false);
    const hasGrid = await gridItems.isVisible().catch(() => false);
    expect(hasMobileMenu || hasGrid).toBeTruthy();
  });
});
