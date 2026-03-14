import { test, expect } from '@playwright/test';

test.describe('Client Booking Flow', () => {
  test('should load the booking page and display service selection', async ({ page }) => {
    // Start at the client services page
    await page.goto('/client/services');
    
    // Wait for the page to load - look for the heading
    await expect(page.locator('h2').filter({ hasText: 'What would you like today?' })).toBeVisible({ timeout: 10000 });
    
    // Check for loading state or services
    const loadingText = page.locator('text=Loading services');
    const servicesText = page.locator('text=/service/i').first();
    
    // Either loading or services should be visible
    const isLoading = await loadingText.isVisible().catch(() => false);
    const hasServices = await servicesText.isVisible().catch(() => false);
    
    expect(isLoading || hasServices).toBeTruthy();
  });

  test('should display service categories or empty state', async ({ page }) => {
    await page.goto('/client/services');
    
    // Wait for page to load
    await expect(page.locator('h2').filter({ hasText: 'What would you like today?' })).toBeVisible({ timeout: 10000 });
    
    // Check for service count text
    const serviceCountText = page.locator('text=/\\d+ service/i');
    const emptyStateText = page.locator('text=/no services|0 services/i');
    
    // Either service count or empty state should be visible
    const hasServiceCount = await serviceCountText.isVisible().catch(() => false);
    const hasEmptyState = await emptyStateText.isVisible().catch(() => false);
    
    expect(hasServiceCount || hasEmptyState).toBeTruthy();
  });

  test('should have back navigation to chat', async ({ page }) => {
    await page.goto('/client/services');
    
    // Wait for page to load
    await expect(page.locator('h2').filter({ hasText: 'What would you like today?' })).toBeVisible({ timeout: 10000 });
    
    // Check for back button
    const backButton = page.locator('button').filter({ hasText: 'Back to chat' });
    await expect(backButton).toBeVisible();
  });

  test('should navigate to slot selection when service is selected (requires backend)', async ({ page }) => {
    test.skip(true, 'This test requires a running backend with services configured');
    
    await page.goto('/client/services');
    await expect(page.locator('h2').filter({ hasText: 'What would you like today?' })).toBeVisible({ timeout: 10000 });
    
    // Try to click a service option if available
    const serviceOption = page.locator('button, [role="button"]').filter({ hasText: /haircut|styling|color|service/i }).first();
    
    if (await serviceOption.isVisible().catch(() => false)) {
      await serviceOption.click();
      // Should navigate to slot selection
      await expect(page).toHaveURL(/client\/slots/, { timeout: 10000 });
    }
  });

  test('should complete booking flow (requires backend with data)', async ({ page }) => {
    test.skip(true, 'This test requires a running backend with services and slots configured');
    
    // Full booking flow test
    await page.goto('/client/services');
    
    // Select a service
    const serviceOption = page.locator('button').filter({ hasText: /haircut|styling|color/i }).first();
    await serviceOption.click();
    
    // Select a time slot
    await expect(page).toHaveURL(/client\/slots/);
    const timeSlot = page.locator('button').filter({ hasText: /\\d{1,2}:\\d{2}|AM|PM/i }).first();
    await timeSlot.click();
    
    // Fill confirmation form
    await expect(page).toHaveURL(/client\/confirm/);
    await page.locator('input[name="name"]').fill('Test Client');
    await page.locator('input[name="phone"]').fill('555-123-4567');
    
    // Confirm booking
    await page.locator('button').filter({ hasText: /confirm|book/i }).click();
    
    // Should show success
    await expect(page.locator('text=/success|confirmed/i')).toBeVisible({ timeout: 10000 });
  });
});
