import { test, expect } from '@playwright/test';

test.describe('AI Concierge Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Client PWA chat interface
    await page.goto('/client');
    // Wait for the chat interface to load - check for AI stylist greeting
    await expect(page.getByText(/Hi.*AI stylist/i)).toBeVisible({ timeout: 10000 });
  });

  test('Connect to AI concierge', async ({ page }) => {
    // Given I am on the Client PWA
    // When I open the chat interface (done in beforeEach)
    // Then I see a greeting message from the AI
    await expect(page.getByText(/Hi.*AI stylist/i)).toBeVisible();
    
    // And I see the text input for chat
    const chatInput = page.locator('input[type="text"], textarea').first();
    await expect(chatInput).toBeVisible();
    
    // And I see the send button
    await expect(page.getByRole('button', { name: /send/i })).toBeVisible();
  });

  test('Receive personalized slot suggestions', async ({ page }) => {
    // Given I have booking history with the salon
    // When I request appointment slots via the booking flow
    const chatInput = page.locator('input[type="text"], textarea').first();
    await expect(chatInput).toBeVisible({ timeout: 5000 });
    
    await chatInput.fill('I want to book a haircut');
    await page.getByRole('button', { name: /send/i }).click();
    
    // Then I see my message in the chat
    await expect(page.getByText('I want to book a haircut')).toBeVisible({ timeout: 5000 });
    
    // Wait for AI response
    await page.waitForTimeout(3000);
  });

  test('Handle invalid input gracefully', async ({ page }) => {
    // Given I am on the Client PWA
    // When I send an invalid or unclear message
    const chatInput = page.locator('input[type="text"], textarea').first();
    await expect(chatInput).toBeVisible({ timeout: 5000 });
    
    await chatInput.fill('asdfghjkl nonsense query');
    await page.getByRole('button', { name: /send/i }).click();
    
    // Then I should see my message in the chat
    await expect(page.getByText('asdfghjkl nonsense query')).toBeVisible({ timeout: 5000 });
    
    // Wait for AI response
    await page.waitForTimeout(3000);
  });

  test('Handle session timeout gracefully', async ({ page }) => {
    // Given I am on the Client PWA
    // When I interact with the AI concierge
    const chatInput = page.locator('input[type="text"], textarea').first();
    await expect(chatInput).toBeVisible({ timeout: 5000 });
    
    await chatInput.fill('Book me a haircut');
    await page.getByRole('button', { name: /send/i }).click();
    
    // Then the session should remain active
    await expect(page.getByText('Book me a haircut')).toBeVisible({ timeout: 5000 });
    
    // Wait for AI response
    await page.waitForTimeout(3000);
  });

  test('Navigate through complete booking flow', async ({ page }) => {
    // Given I am on the Client PWA
    const chatInput = page.locator('input[type="text"], textarea').first();
    await expect(chatInput).toBeVisible({ timeout: 5000 });
    
    await chatInput.fill('I need to book an appointment');
    await page.getByRole('button', { name: /send/i }).click();
    
    // Then I see my message in the chat
    await expect(page.getByText('I need to book an appointment')).toBeVisible({ timeout: 5000 });
    
    // Wait for AI response
    await page.waitForTimeout(3000);
  });

  test('View services via chat', async ({ page }) => {
    // Given I am on the Client PWA
    const chatInput = page.locator('input[type="text"], textarea').first();
    await expect(chatInput).toBeVisible({ timeout: 5000 });
    
    // When I ask about services
    await chatInput.fill('What services do you offer?');
    await page.getByRole('button', { name: /send/i }).click();
    
    // Then I see my message in the chat
    await expect(page.getByText('What services do you offer?')).toBeVisible({ timeout: 5000 });
    
    // Wait for AI response
    await page.waitForTimeout(3000);
  });

  test('Check opening hours', async ({ page }) => {
    // Given I am on the Client PWA
    const chatInput = page.locator('input[type="text"], textarea').first();
    await expect(chatInput).toBeVisible({ timeout: 5000 });
    
    // When I ask about opening hours
    await chatInput.fill('What are your opening hours?');
    await page.getByRole('button', { name: /send/i }).click();
    
    // Then I see my message in the chat
    await expect(page.getByText('What are your opening hours?')).toBeVisible({ timeout: 5000 });
    
    // Wait for AI response
    await page.waitForTimeout(3000);
  });
});
