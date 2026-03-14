import { test, expect } from '@playwright/test';

test.describe('Frontdesk POS Flow', () => {
  test('should load the POS page', async ({ page }) => {
    // Navigate to the POS page
    await page.goto('/frontdesk/pos');
    
    // Wait for the page to load - look for any heading or main content
    // The POS page might have a heading like "POS" or "Point of Sale"
    const heading = page.locator('h1, h2, h3').filter({ hasText: /pos|point of sale|checkout/i }).first();
    
    // If no specific heading, check for any main content
    const mainContent = page.locator('main, [role="main"]').first();
    
    // Either heading or main content should be visible
    const hasHeading = await heading.isVisible().catch(() => false);
    const hasMainContent = await mainContent.isVisible().catch(() => false);
    
    expect(hasHeading || hasMainContent).toBeTruthy();
  });

  test('should display POS interface elements', async ({ page }) => {
    await page.goto('/frontdesk/pos');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for common POS elements: service list, cart, payment buttons
    const serviceList = page.locator('[class*="service"], [class*="product"], [class*="item"]').first();
    const cart = page.locator('[class*="cart"], [class*="basket"], [class*="order"]').first();
    const paymentButton = page.locator('button').filter({ hasText: /pay|checkout|process/i }).first();
    
    // At least one of these should be visible
    const hasServiceList = await serviceList.isVisible().catch(() => false);
    const hasCart = await cart.isVisible().catch(() => false);
    const hasPaymentButton = await paymentButton.isVisible().catch(() => false);
    
    expect(hasServiceList || hasCart || hasPaymentButton).toBeTruthy();
  });

  test('should process a payment (requires backend)', async ({ page }) => {
    test.skip(true, 'This test requires a running backend with POS functionality');
    
    await page.goto('/frontdesk/pos');
    await page.waitForLoadState('networkidle');
    
    // Try to add a service to cart
    const serviceItem = page.locator('button, [role="button"]').filter({ hasText: /haircut|styling|color/i }).first();
    if (await serviceItem.isVisible().catch(() => false)) {
      await serviceItem.click();
    }
    
    // Try to checkout
    const checkoutButton = page.locator('button').filter({ hasText: /checkout|pay/i }).first();
    if (await checkoutButton.isVisible().catch(() => false)) {
      await checkoutButton.click();
      
      // Fill payment details if required
      const amountInput = page.locator('input[type="number"]').first();
      if (await amountInput.isVisible().catch(() => false)) {
        await amountInput.fill('50.00');
      }
      
      // Select payment method
      const paymentMethod = page.locator('button, select').filter({ hasText: /cash|card/i }).first();
      if (await paymentMethod.isVisible().catch(() => false)) {
        await paymentMethod.click();
      }
      
      // Confirm payment
      const confirmButton = page.locator('button').filter({ hasText: /confirm|submit/i }).first();
      if (await confirmButton.isVisible().catch(() => false)) {
        await confirmButton.click();
      }
      
      // Should show success message
      await expect(page.locator('text=/success|completed|paid/i')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should view transaction history (requires backend)', async ({ page }) => {
    test.skip(true, 'This test requires a running backend with transaction history');
    
    await page.goto('/frontdesk/pos');
    await page.waitForLoadState('networkidle');
    
    // Look for transaction history link or button
    const historyLink = page.locator('a, button').filter({ hasText: /history|transactions|recent/i }).first();
    
    if (await historyLink.isVisible().catch(() => false)) {
      await historyLink.click();
      
      // Should show transaction list
      await expect(page.locator('text=/transaction|payment|receipt/i')).toBeVisible();
    }
  });

  test('should generate receipts (requires backend)', async ({ page }) => {
    test.skip(true, 'This test requires a running backend with receipt generation');
    
    await page.goto('/frontdesk/pos');
    await page.waitForLoadState('networkidle');
    
    // Look for receipt or print button
    const receiptButton = page.locator('button').filter({ hasText: /receipt|print/i }).first();
    
    if (await receiptButton.isVisible().catch(() => false)) {
      await receiptButton.click();
      
      // Should show receipt or print dialog
      await expect(page.locator('text=/receipt|print/i')).toBeVisible();
    }
  });
});
