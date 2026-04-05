import { test, expect } from '@playwright/test';
import fs from 'fs';

const OWNER_URL = process.env.OWNER_URL || 'https://salonos-owner-frontend-687369167038.us-central1.run.app/owner';
const REPORT_PATH = 'playwright_checks/owner_dashboard_regression_report.txt';
const SHOT_PATH = 'playwright_checks/owner_dashboard_regression.png';

function containsProbe(text, probe) {
  return text.toLowerCase().includes(probe.toLowerCase());
}

test('owner dashboard production regression renders key modules', async ({ page }) => {
  const events = [];
  const apiIssues = [];

  page.on('console', msg => events.push(`[console:${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => events.push(`[pageerror] ${err.message}`));
  page.on('requestfailed', req => {
    const line = `[requestfailed] ${req.method()} ${req.url()} :: ${req.failure()?.errorText || 'unknown'}`;
    events.push(line);
    if (req.url().includes('/api/')) apiIssues.push(line);
  });
  page.on('response', async res => {
    if (res.status() >= 400) {
      const line = `[response:${res.status()}] ${res.request().method()} ${res.url()}`;
      events.push(line);
      if (res.url().includes('/api/')) apiIssues.push(line);
    }
  });

  const response = await page.goto(OWNER_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);

  const body = page.locator('body');
  await expect(body).toContainText('Owner Control Tower', { timeout: 30000 });
  await expect(body).toContainText('AI Revenue Opportunity Engine', { timeout: 30000 });
  await expect(body).toContainText('POS Intelligence', { timeout: 30000 });
  await expect(body).toContainText('System Health', { timeout: 30000 });

  const bodyText = await body.innerText().catch(() => '');
  const headings = await page.locator('h1, h2, h3, [role="heading"]').allInnerTexts().catch(() => []);
  const buttons = await page.locator('button').allInnerTexts().catch(() => []);
  const title = await page.title().catch(() => 'unknown');

  const probes = [
    'Owner Control Tower',
    'Revenue Trend',
    'Live Salon Activity',
    "Today's Appointments",
    'Client Profiles',
    'Staff Performance',
    'POS Intelligence',
    'System Health',
    'Revenue Intelligence',
    'AI Revenue Forecast',
    'Staff Utilization Heatmap',
    'AI Revenue Opportunity Engine',
    'AI Campaign Control'
  ];

  let screenshotStatus = 'PASS';
  try {
    await page.screenshot({ path: SHOT_PATH, fullPage: false });
  } catch (err) {
    screenshotStatus = `WARN: ${err instanceof Error ? err.message : String(err)}`;
    events.push(`[screenshot-warning] ${screenshotStatus}`);
  }

  const report = [];
  report.push(`URL: ${OWNER_URL}`);
  report.push(`Status: ${response?.status() ?? 'unknown'}`);
  report.push(`Title: ${title}`);
  report.push(`Screenshot: ${screenshotStatus}`);
  report.push('');
  report.push('Assertions:');
  report.push('- Owner Control Tower: PASS');
  report.push('- AI Revenue Opportunity Engine: PASS');
  report.push('- POS Intelligence: PASS');
  report.push('- System Health: PASS');
  report.push('');
  report.push('Probe results:');
  for (const probe of probes) report.push(`- ${probe}: ${containsProbe(bodyText, probe) ? 'FOUND' : 'missing'}`);
  report.push('');
  report.push('Headings:');
  for (const h of headings) report.push(`- ${h}`);
  report.push('');
  report.push('Buttons (first 80):');
  for (const b of buttons.slice(0, 80)) report.push(`- ${b}`);
  report.push('');
  report.push('API issues (warnings):');
  if (apiIssues.length === 0) report.push('- none observed');
  for (const i of apiIssues) report.push(i);
  report.push('');
  report.push('Events:');
  if (events.length === 0) report.push('- none observed');
  for (const e of events) report.push(e);
  report.push('');
  report.push('Body excerpt:');
  report.push(bodyText.slice(0, 5000));

  fs.writeFileSync(REPORT_PATH, report.join('\n'));

  expect(response).not.toBeNull();
  expect(response.status()).toBeLessThan(400);
});
