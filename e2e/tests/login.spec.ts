import { test, expect } from '@playwright/test';
import { login } from '../helpers/selectors';
import { getTestCredentials } from '../helpers/test-credentials';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form elements', async ({ page }) => {
    await expect(page.locator(login.heading)).toBeVisible();
    await expect(page.locator(login.emailInput)).toBeVisible();
    await expect(page.locator(login.passwordInput)).toBeVisible();
    await expect(page.locator(login.submitButton)).toBeVisible();
  });

  test('should show validation for empty email', async ({ page }) => {
    await page.locator(login.submitButton).click();
    // HTML5 validation or custom error should appear
    const emailInput = page.locator(login.emailInput);
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
  });

  test('should show validation for invalid email format', async ({ page }) => {
    await page.locator(login.emailInput).fill('not-an-email');
    await page.locator(login.passwordInput).fill('password123');
    await page.locator(login.submitButton).click();
    const emailInput = page.locator(login.emailInput);
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.typeMismatch);
    expect(isInvalid).toBeTruthy();
  });

  test('should show validation for short password', async ({ page }) => {
    await page.locator(login.emailInput).fill('test@example.com');
    await page.locator(login.passwordInput).fill('ab');
    await page.locator(login.submitButton).click();
    // Check for either HTML5 minLength validation or custom error message
    const passwordInput = page.locator(login.passwordInput);
    const isInvalid = await passwordInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    const hasCustomError = await page.locator(login.passwordError).isVisible().catch(() => false);
    expect(isInvalid || hasCustomError).toBeTruthy();
  });

  test('@smoke should login successfully and redirect to dashboard', async ({ page }) => {
    const { email, password } = getTestCredentials();

    await page.locator(login.emailInput).fill(email);
    await page.locator(login.passwordInput).fill(password);
    await page.locator(login.submitButton).click();

    await expect(page).toHaveURL('/owner/dashboard', { timeout: 15000 });
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  });
});
