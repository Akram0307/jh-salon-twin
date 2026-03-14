import { test, expect } from '@playwright/test';

// Since there's no explicit login page, we'll test the owner dashboard as the default page
// and test navigation between different sections

test.describe('Owner Dashboard and Navigation', () => {
  test('should load owner dashboard by default', async ({ page }) => {
    // The root path redirects to /owner/dashboard
    await page.goto('/');
    await expect(page).toHaveURL(/owner\/dashboard/);
    
    // Check for dashboard elements - look for the main heading
    await expect(page.locator('h2').filter({ hasText: 'Revenue Command Center' })).toBeVisible();
    
    // Check for Today's Pulse section
    await expect(page.locator('h3').filter({ hasText: "Today's Pulse" })).toBeVisible();
  });

  test('should navigate to different owner sections', async ({ page }) => {
    await page.goto('/owner/dashboard');
    
    // Wait for the page to load
    await expect(page.locator('h2').filter({ hasText: 'Revenue Command Center' })).toBeVisible();
    
    // Test navigation to Clients - use the sidebar navigation
    await page.locator('nav a').filter({ hasText: 'Clients' }).click();
    await expect(page).toHaveURL(/owner\/clients/);
    
    // Test navigation to Staff
    await page.locator('nav a').filter({ hasText: 'Staff' }).click();
    await expect(page).toHaveURL(/owner\/staff/);
    
    // Test navigation to Services
    await page.locator('nav a').filter({ hasText: 'Services' }).click();
    await expect(page).toHaveURL(/owner\/services/);
    
    // Test navigation to Schedule
    await page.locator('nav a').filter({ hasText: 'Schedule' }).click();
    await expect(page).toHaveURL(/owner\/schedule/);
    
    // Test navigation to Reports
    await page.locator('nav a').filter({ hasText: 'Reports' }).click();
    await expect(page).toHaveURL(/owner\/reports/);
    
    // Test navigation to Settings
    await page.locator('nav a').filter({ hasText: 'Settings' }).click();
    await expect(page).toHaveURL(/owner\/settings/);
  });

  test('should test logout functionality (if available)', async ({ page }) => {
    await page.goto('/owner/dashboard');
    
    // Wait for the page to load
    await expect(page.locator('h2').filter({ hasText: 'Revenue Command Center' })).toBeVisible();
    
    // Look for logout button or link
    const logoutButton = page.locator('button, a').filter({ hasText: /logout|sign out/i });
    
    // If logout exists, test it
    if (await logoutButton.count() > 0) {
      await logoutButton.click();
      // After logout, should redirect to login or home
      await expect(page).not.toHaveURL(/owner\/dashboard/);
    } else {
      // If no logout button, skip or mark as not implemented
      test.skip();
    }
  });
});
