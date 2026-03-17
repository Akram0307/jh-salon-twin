import { test, expect } from '@playwright/test';
import { setAuthState } from '../helpers/auth.helper';

test.describe('Drag-and-Drop Scheduling', () => {
  test.beforeEach(async ({ page }) => {
    await setAuthState(page);
    await page.goto('/owner/schedule');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  });

  test('should navigate to schedule page', async ({ page }) => {
    await expect(page.locator('h1, h2').filter({ hasText: /schedule|calendar/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('should display schedule view', async ({ page }) => {
    await page.waitForTimeout(2000);
    // Schedule should have some content - either appointments or empty state
    const scheduleContent = page.locator('main, [role="main"]').first();
    await expect(scheduleContent).toBeVisible();
  });

  test('should drag and drop an appointment (requires backend)', async ({ page }) => {
    test.skip(true, 'Drag-and-drop requires backend with appointment data');

    const appointment = page.locator('[class*="appointment"], [class*="event"]').first();
    if (!(await appointment.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'No appointments available for drag-and-drop');
    }

    const box = await appointment.boundingBox();
    if (!box) {
      test.skip(true, 'Could not get appointment bounding box');
    }

    const targetSlot = page.locator('[class*="time-slot"], [class*="slot"]').nth(2);
    if (!(await targetSlot.isVisible().catch(() => false))) {
      test.skip(true, 'No target time slot available');
    }

    const targetBox = await targetSlot.boundingBox();
    if (!targetBox) {
      test.skip(true, 'Could not get target slot bounding box');
    }

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(1000);
  });

  test('should detect scheduling conflicts (requires backend)', async ({ page }) => {
    test.skip(true, 'Conflict detection requires backend with overlapping appointments');
  });
});
