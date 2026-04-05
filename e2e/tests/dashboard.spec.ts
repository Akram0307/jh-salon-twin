import { test, expect } from '@playwright/test';
import { dashboard, sidebar } from '../helpers/selectors';
import { setAuthState } from '../helpers/auth.helper';

test.describe('Owner Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setAuthState(page);
    await page.goto('/owner/dashboard');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  });

  test('@smoke should load dashboard with heading', async ({ page }) => {
    await expect(page.locator(dashboard.heading)).toBeVisible({ timeout: 10000 });
  });

  test('should display all KPI cards', async ({ page }) => {
    await expect(page.locator(dashboard.kpiCards.todayRevenue).first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator(dashboard.kpiCards.todayBookings).first()).toBeVisible();
    await expect(page.locator(dashboard.kpiCards.activeClients).first()).toBeVisible();
    await expect(page.locator(dashboard.kpiCards.staffUtilization).first()).toBeVisible();
  });

  test('should display Today\'s Schedule section', async ({ page }) => {
    await expect(page.locator(dashboard.scheduleSection)).toBeVisible({ timeout: 10000 });
  });

  test('should display Alerts section', async ({ page }) => {
    await expect(page.locator(dashboard.alertsSection)).toBeVisible({ timeout: 10000 });
  });

  test('should display Quick Actions section', async ({ page }) => {
    await expect(page.locator(dashboard.quickActions)).toBeVisible({ timeout: 10000 });
  });

  test('should display Weekly Revenue chart card', async ({ page }) => {
    await expect(page.locator(dashboard.weeklyRevenue)).toBeVisible({ timeout: 10000 });
  });

  test('@smoke should navigate via sidebar links', async ({ page }) => {
    const navTests = [
      { label: 'Schedule', expected: /owner\/schedule/ },
      { label: 'Clients', expected: /owner\/clients/ },
      { label: 'Staff', expected: /owner\/staff/ },
      { label: 'Services', expected: /owner\/services/ },
      { label: 'Reports', expected: /owner\/reports/ },
      { label: 'Settings', expected: /owner\/settings/ },
    ];

    for (const nav of navTests) {
      const link = page.locator(sidebar.navLinks[nav.label as keyof typeof sidebar.navLinks]);
      if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
        await link.click();
        await expect(page).toHaveURL(nav.expected, { timeout: 10000 });
        await page.goBack();
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      }
    }
  });
});
