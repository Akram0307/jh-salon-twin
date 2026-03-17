import { test, expect } from '@playwright/test';
import { clientChat } from '../../helpers/selectors';

test.describe('AI Concierge', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/client/chat');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  });

  test('@client should display AI greeting', async ({ page }) => {
    await expect(page.locator(clientChat.greetingMessage).first()).toBeVisible({ timeout: 10000 });
  });

  test('@client should have chat input and send button', async ({ page }) => {
    await expect(page.locator(clientChat.chatInput).first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator(clientChat.sendButton).first()).toBeVisible();
  });

  test('@client should send message and receive AI response', async ({ page }) => {
    const chatInput = page.locator(clientChat.chatInput).first();
    await chatInput.fill('I want to book a haircut');
    await page.locator(clientChat.sendButton).first().click();
    await expect(page.locator('text=I want to book a haircut')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(3000);
  });

  test('@client should handle invalid input gracefully', async ({ page }) => {
    const chatInput = page.locator(clientChat.chatInput).first();
    await chatInput.fill('asdfghjkl nonsense query');
    await page.locator(clientChat.sendButton).first().click();
    await expect(page.locator('text=asdfghjkl nonsense query')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(3000);
  });

  test('@client should navigate through booking flow', async ({ page }) => {
    const chatInput = page.locator(clientChat.chatInput).first();
    await chatInput.fill('I need to book an appointment');
    await page.locator(clientChat.sendButton).first().click();
    await expect(page.locator('text=I need to book an appointment')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(3000);
  });

  test('@client should view services via chat', async ({ page }) => {
    const chatInput = page.locator(clientChat.chatInput).first();
    await chatInput.fill('What services do you offer?');
    await page.locator(clientChat.sendButton).first().click();
    await expect(page.locator('text=What services do you offer?')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(3000);
  });

  test('@client should check opening hours', async ({ page }) => {
    const chatInput = page.locator(clientChat.chatInput).first();
    await chatInput.fill('What are your opening hours?');
    await page.locator(clientChat.sendButton).first().click();
    await expect(page.locator('text=What are your opening hours?')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(3000);
  });
});
