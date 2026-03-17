import { chromium, FullConfig } from '@playwright/test';
import path from 'path';

const BASELINE_DIR = path.join(__dirname, 'screenshots', 'baseline');

const PAGES = [
  { name: 'owner-dashboard', url: '/owner/dashboard', auth: true, waitFor: 'h1:has-text("Dashboard")' },
  { name: 'schedule-view', url: '/owner/schedule', auth: true, waitFor: 'main' },
  { name: 'client-chat', url: '/client/chat', auth: false, waitFor: 'main' },
  { name: 'staff-schedule', url: '/staff/schedule', auth: true, waitFor: 'main' },
  { name: 'settings-page', url: '/owner/settings', auth: true, waitFor: 'main' },
  { name: 'onboarding-page', url: '/onboarding', auth: false, waitFor: 'main' },
];

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  for (const pageConfig of PAGES) {
    console.log(`\n📸 Capturing baseline: ${pageConfig.name}`);

    if (pageConfig.auth) {
      await page.goto('/login');
      await page.waitForLoadState('networkidle').catch(() => {});

      // Inject auth state directly for baseline capture
      await page.evaluate(() => {
        const token = process.env.E2E_TEST_TOKEN || 'baseline-capture-token';
        const user = {
          id: 'baseline-user-id',
          email: 'owner@salon.com',
          name: 'Baseline User',
          role: 'owner',
          salonId: 'baseline-salon-id',
        };
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
      });
    }

    await page.goto(pageConfig.url);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Wait for specific element if defined
    if (pageConfig.waitFor) {
      try {
        await page.locator(pageConfig.waitFor).first().waitFor({ timeout: 10000 });
      } catch {
        console.log(`  ⚠️  Wait selector '${pageConfig.waitFor}' not found, capturing anyway`);
      }
    }

    const screenshotPath = path.join(BASELINE_DIR, `${pageConfig.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`  ✅ Saved: ${screenshotPath}`);
  }

  await browser.close();
  console.log('\n\n🎉 All baselines captured!');
}

export default globalSetup;
