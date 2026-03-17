import { test, expect } from '@playwright/test';
import { clientChat } from '../helpers/selectors';

test.describe('Client Chat Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/client/chat');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  });

  test('@client should load chat interface with greeting', async ({ page }) => {
    await expect(page.locator(clientChat.greetingMessage).first()).toBeVisible({ timeout: 10000 });
  });

  test('@client should display quick reply buttons', async ({ page }) => {
    await page.waitForTimeout(2000);
    const hasBookBtn = await page.locator(clientChat.quickReplyBook).isVisible().catch(() => false);
    const hasServicesBtn = await page.locator(clientChat.quickReplyServices).isVisible().catch(() => false);
    const hasHoursBtn = await page.locator(clientChat.quickReplyHours).isVisible().catch(() => false);
    expect(hasBookBtn || hasServicesBtn || hasHoursBtn).toBeTruthy();
  });

  test('@client should have chat input and send button', async ({ page }) => {
    await expect(page.locator(clientChat.chatInput).first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator(clientChat.sendButton).first()).toBeVisible();
  });

  test('@client should send a message and display it', async ({ page }) => {
    test.skip(true, 'Requires running backend with AI concierge');

    const chatInput = page.locator(clientChat.chatInput).first();
    await chatInput.fill('I want to book a haircut');
    await page.locator(clientChat.sendButton).first().click();

    await expect(page.locator('text=I want to book a haircut')).toBeVisible({ timeout: 5000 });
  });
});
