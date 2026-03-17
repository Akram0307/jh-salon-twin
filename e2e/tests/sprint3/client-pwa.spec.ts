import { test, expect } from '@playwright/test';
import { clientChat } from '../../helpers/selectors';

test.describe('Client Conversational PWA', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/client/chat');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  });

  test('@client should display welcome message', async ({ page }) => {
    await expect(page.locator(clientChat.greetingMessage).first()).toBeVisible({ timeout: 10000 });
  });

  test('@client should have chat input', async ({ page }) => {
    await expect(page.locator(clientChat.chatInput).first()).toBeVisible({ timeout: 10000 });
  });

  test('@client should send free-form message (requires backend)', async ({ page }) => {
    test.skip(true, 'Requires running backend with AI concierge');

    const chatInput = page.locator(clientChat.chatInput).first();
    await chatInput.fill('I need a haircut tomorrow');
    await page.locator(clientChat.sendButton).first().click();
    await expect(page.locator('text=I need a haircut tomorrow')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(3000);
  });

  test('@client should browse services via quick reply (requires backend)', async ({ page }) => {
    test.skip(true, 'Requires running backend with AI concierge');

    const chatInput = page.locator(clientChat.chatInput).first();
    await chatInput.fill('Show me your services');
    await page.locator(clientChat.sendButton).first().click();
    await expect(page.locator('text=Show me your services')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(3000);
  });

  test('@client should check opening hours (requires backend)', async ({ page }) => {
    test.skip(true, 'Requires running backend with AI concierge');

    const chatInput = page.locator(clientChat.chatInput).first();
    await chatInput.fill('What are your opening hours?');
    await page.locator(clientChat.sendButton).first().click();
    await expect(page.locator('text=What are your opening hours?')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(3000);
  });

  test('@client should reload and see fresh greeting', async ({ page }) => {
    await expect(page.locator(clientChat.greetingMessage).first()).toBeVisible({ timeout: 10000 });
    await page.reload();
    await expect(page.locator(clientChat.greetingMessage).first()).toBeVisible({ timeout: 10000 });
  });
});
