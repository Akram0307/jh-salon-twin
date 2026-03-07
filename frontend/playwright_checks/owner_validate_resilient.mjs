import { chromium } from '@playwright/test';
import fs from 'fs';

const url = 'https://salonos-owner-frontend-687369167038.us-central1.run.app/owner';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } });

const events = [];
page.on('console', msg => events.push(`[console:${msg.type()}] ${msg.text()}`));
page.on('pageerror', err => events.push(`[pageerror] ${err.message}`));
page.on('requestfailed', req => events.push(`[requestfailed] ${req.url()} :: ${req.failure()?.errorText || 'unknown'}`));
page.on('response', async res => {
  const status = res.status();
  if (status >= 400) events.push(`[response:${status}] ${res.url()}`);
});

const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(8000);

const title = await page.title();
const bodyText = await page.locator('body').innerText().catch(() => '');
const headings = await page.locator('h1,h2,h3').allInnerTexts().catch(() => []);
const buttons = await page.locator('button').allInnerTexts().catch(() => []);
await page.screenshot({ path: 'playwright_checks/owner_dashboard_validation_resilient.png', fullPage: true });

const probes = ['Owner','Revenue','Opportunity','Campaign','Health','Waitlist','POS','Dashboard','Staff','Services','Schedule'];
const report = [];
report.push(`Status: ${response?.status()}`);
report.push(`Title: ${title}`);
report.push('');
report.push('Probe results:');
for (const p of probes) report.push(`- ${p}: ${bodyText.includes(p) ? 'present' : 'missing'}`);
report.push('');
report.push('Headings:');
for (const h of headings) report.push(`- ${h}`);
report.push('');
report.push('Buttons:');
for (const b of buttons.slice(0, 50)) report.push(`- ${b}`);
report.push('');
report.push('Events:');
for (const e of events) report.push(e);
report.push('');
report.push('Body excerpt:');
report.push(bodyText.slice(0, 5000));

fs.writeFileSync('playwright_checks/owner_dashboard_validation_resilient_report.txt', report.join('\n'));
console.log(report.join('\n'));

await browser.close();
