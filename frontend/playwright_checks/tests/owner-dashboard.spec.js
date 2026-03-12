import { test, expect } from '@playwright/test';
import fs from 'fs';

test('inspect owner dashboard live content', async ({ page }) => {
  const events = [];
  page.on('console', msg => events.push(`[console:${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => events.push(`[pageerror] ${err.message}`));
  page.on('requestfailed', req => events.push(`[requestfailed] ${req.url()} :: ${req.failure()?.errorText || 'unknown'}`));

  const response = await page.goto('https://salonos-owner-frontend-rgvcleapsa-uc.a.run.app/owner', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'playwright_checks/owner_dashboard_validation.png', fullPage: true });

  const bodyText = await page.locator('body').innerText();
  const headings = await page.locator('h1, h2, h3, [role="heading"]').allInnerTexts();
  const buttons = await page.locator('button').allInnerTexts();
  const probes = ['Owner','Revenue','Opportunity','Campaign','Health','Waitlist','POS','Dashboard','Staff','Services','Schedule']
    .map(p => `- ${p}: ${bodyText.toLowerCase().includes(p.toLowerCase()) ? 'FOUND' : 'missing'}`)
    .join('\n');

  fs.writeFileSync('playwright_checks/owner_dashboard_validation_report.txt', [
    `Status: ${response ? response.status() : 'unknown'}`,
    `Title: ${await page.title()}`,
    '',
    'Probe results:',
    probes,
    '',
    'Headings:',
    ...headings.map(x => `- ${x}`),
    '',
    'Buttons:',
    ...buttons.map(x => `- ${x}`),
    '',
    'Events:',
    ...events,
    '',
    'Body excerpt:',
    bodyText.slice(0, 4000)
  ].join('\n'));

  expect(response && response.status()).toBeLessThan(400);
});
