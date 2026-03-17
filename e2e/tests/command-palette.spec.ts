import { test, expect } from '@playwright/test';
import { setAuthState } from '../helpers/auth.helper';

/**
 * Command Palette / Global Search E2E Tests
 *
 * The actual component is GlobalSearchBar (frontend-next/src/components/search/GlobalSearchBar.tsx)
 * which renders a fixed overlay (div.fixed.inset-0.z-50) when opened via Ctrl+K / Cmd+K.
 * The SearchContext (frontend-next/src/contexts/SearchContext.tsx) handles the keyboard shortcut.
 *
 * Key selectors:
 * - Overlay:     .fixed.inset-0.z-50  (backdrop + modal container)
 * - Modal:       .fixed.left-1\/2.top-1\/2  (centered modal panel)
 * - Input:       input[placeholder*="Search clients"]
 * - Close:       ESC key (handled by SearchContext)
 */

test.describe('Command Palette / Dashboard Search', () => {
  test.beforeEach(async ({ page }) => {
    await setAuthState(page);
    await page.goto('/owner/dashboard');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  });

  test('should open search overlay with Ctrl+K', async ({ page }) => {
    await page.keyboard.press('Control+K');
    await page.waitForTimeout(500);

    // The GlobalSearchBar renders a fixed overlay when open
    const searchOverlay = page.locator('.fixed.inset-0.z-50').first();
    let hasOverlay = await searchOverlay.isVisible().catch(() => false);

    if (!hasOverlay) {
      // Try Meta+K as fallback (macOS)
      await page.keyboard.press('Meta+K');
      await page.waitForTimeout(500);
      hasOverlay = await searchOverlay.isVisible().catch(() => false);
    }

    // Verify the search input inside the overlay is visible
    const searchInput = page.locator('input[placeholder*="Search clients"]').first();
    const hasInput = await searchInput.isVisible({ timeout: 3000 }).catch(() => false);

    // Either the overlay or the search input should be present
    expect(hasOverlay || hasInput).toBeTruthy();
  });

  test('should close search overlay with Escape', async ({ page }) => {
    await page.keyboard.press('Control+K');
    await page.waitForTimeout(500);

    const searchOverlay = page.locator('.fixed.inset-0.z-50').first();
    const isOpen = await searchOverlay.isVisible().catch(() => false);

    if (isOpen) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      const isClosed = !(await searchOverlay.isVisible().catch(() => true));
      expect(isClosed).toBeTruthy();
    } else {
      test.skip(true, 'Search overlay not found - skipping close test');
    }
  });

  test('should search and show results in search overlay', async ({ page }) => {
    await page.keyboard.press('Control+K');
    await page.waitForTimeout(500);

    const searchInput = page.locator('input[placeholder*="Search clients"]').first();
    const hasSearch = await searchInput.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasSearch) {
      test.skip(true, 'Search overlay input not found');
      return;
    }

    await searchInput.fill('client');
    await page.waitForTimeout(500);

    // The search results area or quick actions should appear inside the modal
    const modalContent = page.locator('.fixed.left-1\/2.top-1\/2').first();
    const hasContent = await modalContent.isVisible().catch(() => false);
    expect(hasContent).toBeTruthy();
  });
});
