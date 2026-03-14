import { test, expect } from '@playwright/test';

test.describe('Owner Dashboard Flow', () => {
  test('should load dashboard with KPIs', async ({ page }) => {
    // Navigate to the owner dashboard
    await page.goto('/owner/dashboard');
    
    // Wait for the page to load - look for the main heading
    await expect(page.locator('h2').filter({ hasText: 'Revenue Command Center' })).toBeVisible({ timeout: 10000 });
    
    // Check for Today's Pulse section
    await expect(page.locator('h3').filter({ hasText: "Today's Pulse" })).toBeVisible();
    
    // Check for KPI cards - they should be visible in the Today's Pulse section
    // The error context shows KPIs like Revenue, Bookings, Clients, Utilization
    const kpiPatterns = [
      /Revenue/,
      /Bookings/,
      /Clients/,
      /Utilization/
    ];
    
    for (const pattern of kpiPatterns) {
      await expect(page.locator('text=' + pattern.source).first()).toBeVisible();
    }
  });

  test('should display Action Required section', async ({ page }) => {
    await page.goto('/owner/dashboard');
    
    // Wait for page to load
    await expect(page.locator('h2').filter({ hasText: 'Revenue Command Center' })).toBeVisible({ timeout: 10000 });
    
    // Check for Action Required section
    await expect(page.locator('h3').filter({ hasText: 'Action Required' })).toBeVisible();
    
    // Check for action items - the error context shows items like "Staff capacity at 85% for tomorrow"
    const actionItems = page.locator('button').filter({ hasText: /Review Schedule|Send Reminders|View Report/ });
    const actionCount = await actionItems.count();
    expect(actionCount).toBeGreaterThan(0);
  });

  test('should display Today\'s Schedule section', async ({ page }) => {
    await page.goto('/owner/dashboard');
    
    // Wait for page to load
    await expect(page.locator('h2').filter({ hasText: 'Revenue Command Center' })).toBeVisible({ timeout: 10000 });
    
    // Check for Today's Schedule section
    await expect(page.locator('h3').filter({ hasText: "Today's Schedule" })).toBeVisible();
    
    // Check for schedule items - the error context shows appointments with names and times
    const scheduleItems = page.locator('text=/\\d{1,2}:\\d{2} [AP]M/');
    const scheduleCount = await scheduleItems.count();
    expect(scheduleCount).toBeGreaterThan(0);
  });

  test('should display Quick Actions section', async ({ page }) => {
    await page.goto('/owner/dashboard');
    
    // Wait for page to load
    await expect(page.locator('h2').filter({ hasText: 'Revenue Command Center' })).toBeVisible({ timeout: 10000 });
    
    // Check for Quick Actions section
    await expect(page.locator('h3').filter({ hasText: 'Quick Actions' })).toBeVisible();
    
    // Check for quick action buttons - the error context shows buttons like "New Booking", "Add Client", "AI Insights", "Reports"
    const quickActionButtons = page.locator('button').filter({ hasText: /New Booking|Add Client|AI Insights|Reports/ });
    const quickActionCount = await quickActionButtons.count();
    expect(quickActionCount).toBeGreaterThan(0);
  });

  test('should display AI Revenue Intelligence section', async ({ page }) => {
    await page.goto('/owner/dashboard');
    
    // Wait for page to load
    await expect(page.locator('h2').filter({ hasText: 'Revenue Command Center' })).toBeVisible({ timeout: 10000 });
    
    // Check for AI Revenue Intelligence section
    await expect(page.locator('h3').filter({ hasText: 'AI Revenue Intelligence' })).toBeVisible();
    
    // Check for AI insights - the error context shows items like "Rebooking Opportunity", "Upsell Potential", "Waitlist Recovery"
    const aiInsights = page.locator('text=/Rebooking Opportunity|Upsell Potential|Waitlist Recovery/');
    const aiInsightCount = await aiInsights.count();
    expect(aiInsightCount).toBeGreaterThan(0);
  });

  test('should navigate to different sections from dashboard', async ({ page }) => {
    await page.goto('/owner/dashboard');
    
    // Wait for page to load
    await expect(page.locator('h2').filter({ hasText: 'Revenue Command Center' })).toBeVisible({ timeout: 10000 });
    
    // Test navigation to Clients
    await page.locator('nav a').filter({ hasText: 'Clients' }).click();
    await expect(page).toHaveURL(/owner\/clients/);
    await page.goBack();
    
    // Test navigation to Staff
    await page.locator('nav a').filter({ hasText: 'Staff' }).click();
    await expect(page).toHaveURL(/owner\/staff/);
    await page.goBack();
    
    // Test navigation to Services
    await page.locator('nav a').filter({ hasText: 'Services' }).click();
    await expect(page).toHaveURL(/owner\/services/);
    await page.goBack();
    
    // Test navigation to Schedule
    await page.locator('nav a').filter({ hasText: 'Schedule' }).click();
    await expect(page).toHaveURL(/owner\/schedule/);
    await page.goBack();
    
    // Test navigation to Reports
    await page.locator('nav a').filter({ hasText: 'Reports' }).click();
    await expect(page).toHaveURL(/owner\/reports/);
    await page.goBack();
    
    // Test navigation to Settings
    await page.locator('nav a').filter({ hasText: 'Settings' }).click();
    await expect(page).toHaveURL(/owner\/settings/);
  });
});
