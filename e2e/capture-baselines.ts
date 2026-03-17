import { chromium } from '@playwright/test';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const BASELINE_DIR = path.join(__dirname, '../screenshots/baseline');

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 375, height: 812 }
};

const PAGES = [
  { name: 'owner-dashboard', path: '/owner/dashboard' },
  { name: 'schedule-view', path: '/owner/schedule' },
  { name: 'pos-payment', path: '/frontdesk/pos' },
  { name: 'client-list', path: '/owner/clients' },
  { name: 'staff-management', path: '/owner/staff' },
  { name: 'settings-page', path: '/owner/settings' }
];

async function captureBaselines() {
  const browser = await chromium.launch({ headless: true });

  console.log('Starting baseline screenshot capture...');
  console.log(`Base URL: ${BASE_URL}`);

  for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
    console.log(`
Capturing ${viewportName} viewports (${viewport.width}x${viewport.height})...`);

    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: viewportName === 'mobile' ? 2 : 1
    });

    const page = await context.newPage();

    // Authenticate via API token injection (SalonOS uses modal auth, no /login route)
    try {
      const testEmail = process.env.E2E_TEST_EMAIL || 'owner@salon.com';
      const testPassword = process.env.E2E_TEST_PASSWORD || 'test-password';

      // Attempt API login for token
      const loginResp = await page.context().request.post(`${BASE_URL}/api/auth/login`, {
        data: { email: testEmail, password: testPassword }
      });

      if (loginResp.ok()) {
        const { token } = await loginResp.json();
        // Navigate to first page and inject token
        await page.goto(`${BASE_URL}${PAGES[0].path}`);
        await page.evaluate((tok) => {
          localStorage.setItem('auth_token', tok);
          localStorage.setItem('auth_user', JSON.stringify({
            email: 'owner@salon.com', role: 'owner'
          }));
        }, token);
        await page.reload();
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        console.log('  Authenticated via API token injection');
      } else {
        console.warn('  API login failed, attempting UI modal auth fallback');
        await page.goto(`${BASE_URL}${PAGES[0].path}`);
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        // Modal auth fallback - look for auth modal inputs
        const emailInput = page.locator('input[type="email"]').first();
        if (await emailInput.isVisible().catch(() => false)) {
          await emailInput.fill(testEmail);
          const pwInput = page.locator('input[type="password"]').first();
          if (await pwInput.isVisible().catch(() => false)) {
            await pwInput.fill(testPassword);
          }
          const submitBtn = page.locator('button[type="submit"]').first();
          if (await submitBtn.isVisible().catch(() => false)) {
            await submitBtn.click();
            await page.waitForTimeout(2000);
          }
        }
      }
    } catch (e) {
      console.log('  Auth failed, continuing without login (screenshots may show auth wall):', e.message);
    }

    for (const pageConfig of PAGES) {
      try {
        console.log(`  Capturing: ${pageConfig.name}`);

        await page.goto(`${BASE_URL}${pageConfig.path}`);
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        await page.waitForTimeout(1000); // Wait for animations

        const screenshotPath = path.join(BASELINE_DIR, viewportName, `${pageConfig.name}.png`);
        await page.screenshot({
          path: screenshotPath,
          fullPage: viewportName === 'mobile',
          animations: 'disabled'
        });

        console.log(`    ✓ Saved: ${screenshotPath}`);
      } catch (e) {
        console.error(`    ✗ Failed to capture ${pageConfig.name}: ${e.message}`);
      }
    }

    await context.close();
  }

  await browser.close();
  console.log('
Baseline screenshot capture complete!');
}

captureBaselines().catch(console.error);
