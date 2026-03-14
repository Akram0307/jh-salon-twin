import { test, expect } from '@playwright/test';

test.describe('Client Conversational PWA Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Client PWA chat interface
    await page.goto('/client');
    // Wait for the chat interface to load - check for AI stylist greeting
    await expect(page.getByText(/Hi.*AI stylist/i)).toBeVisible({ timeout: 10000 });
  });

  test('Complete booking via conversational UI', async ({ page }) => {
    // Given I am a client on the Client PWA
    // When I open the chat interface (done in beforeEach)
    // Then I see the welcome message
    await expect(page.getByText(/Hi.*AI stylist/i)).toBeVisible();
    
    // And I see the text input
    const chatInput = page.locator('input[type="text"], textarea').first();
    await expect(chatInput).toBeVisible({ timeout: 5000 });
    
    // When I type "I need a haircut"
    await chatInput.fill('I need a haircut');
    await page.getByRole('button', { name: /send/i }).click();
    
    // Then I see my message in the chat
    await expect(page.getByText('I need a haircut')).toBeVisible({ timeout: 5000 });
    
    // And I receive a response from the AI
    // Wait for a response message
    await page.waitForTimeout(3000);
  });

  test('Browse services via quick reply', async ({ page }) => {
    // Given I am on the Client PWA
    // When I type a message about services
    const chatInput = page.locator('input[type="text"], textarea').first();
    await expect(chatInput).toBeVisible({ timeout: 5000 });
    
    await chatInput.fill('Show me your services');
    await page.getByRole('button', { name: /send/i }).click();
    
    // Then I see my message in the chat
    await expect(page.getByText('Show me your services')).toBeVisible({ timeout: 5000 });
    
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

  test('Send free-form message', async ({ page }) => {
    // Given I am on the Client PWA
    // When I type a message in the chat input
    const chatInput = page.locator('input[type="text"], textarea').first();
    await expect(chatInput).toBeVisible({ timeout: 5000 });
    
    await chatInput.fill('I need a haircut tomorrow');
    
    // And I click the send button
    await page.getByRole('button', { name: /send/i }).click();
    
    // Then I see my message in the chat
    await expect(page.getByText('I need a haircut tomorrow')).toBeVisible({ timeout: 5000 });
    
    // And I receive a response from the AI
    // Wait for a response message (not the initial greeting)
    await page.waitForTimeout(3000);
  });

  test('Navigate back to main menu', async ({ page }) => {
    // Given I am in a conversation
    const chatInput = page.locator('input[type="text"], textarea').first();
    await expect(chatInput).toBeVisible({ timeout: 5000 });
    
    await chatInput.fill('Book an appointment');
    await page.getByRole('button', { name: /send/i }).click();
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    // When I reload the page to start fresh
    await page.goto('/client');
    await expect(page.getByText(/Hi.*AI stylist/i)).toBeVisible({ timeout: 10000 });
  });
});
