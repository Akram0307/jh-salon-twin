import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const baseUrl = process.env.OWNER_URL || 'https://salonos-owner-frontend-687369167038.us-central1.run.app/owner';
const runId = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const artifactsDir = path.resolve('playwright_checks', 'artifacts', `owner_prod_validation_${runId}`);
fs.mkdirSync(artifactsDir, { recursive: true });

const summaryPath = path.join(artifactsDir, 'summary.txt');
const screenshotPath = path.join(artifactsDir, 'owner_dashboard.png');
const htmlPath = path.join(artifactsDir, 'owner_dashboard.html');
const consolePath = path.join(artifactsDir, 'console.log');
const pageErrorsPath = path.join(artifactsDir, 'pageerrors.log');
const requestFailedPath = path.join(artifactsDir, 'requestfailed.json');
const networkPath = path.join(artifactsDir, 'network.json');
const storageStatePath = path.join(artifactsDir, 'storage_state.json');

const consoleEvents = [];
const pageErrors = [];
const requestFailed = [];
const network = [];
const failedApi = [];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  ignoreHTTPSErrors: true,
  serviceWorkers: 'block',
  viewport: { width: 1440, height: 1200 },
  userAgent: `owner-prod-validator/${runId}`,
  extraHTTPHeaders: {
    'Cache-Control': 'no-cache, no-store, max-age=0',
    Pragma: 'no-cache',
    Expires: '0'
  }
});

await context.addInitScript(() => {
  try { localStorage.clear(); } catch {}
  try { sessionStorage.clear(); } catch {}
  try {
    if ('caches' in window) {
      caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).catch(() => {});
    }
  } catch {}
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())).catch(() => {});
    }
  } catch {}
});

await context.route('**/*', async route => {
  const request = route.request();
  const resourceType = request.resourceType();
  if (['document', 'fetch', 'xhr', 'script'].includes(resourceType)) {
    const headers = {
      ...request.headers(),
      'Cache-Control': 'no-cache, no-store, max-age=0',
      Pragma: 'no-cache',
      Expires: '0'
    };
    await route.continue({ headers });
    return;
  }
  await route.continue();
});

const page = await context.newPage();

page.on('console', msg => {
  consoleEvents.push(`[${new Date().toISOString()}] [console:${msg.type()}] ${msg.text()}`);
});

page.on('pageerror', err => {
  pageErrors.push(`[${new Date().toISOString()}] ${err.stack || err.message}`);
});

page.on('requestfailed', req => {
  const item = {
    ts: new Date().toISOString(),
    method: req.method(),
    url: req.url(),
    resourceType: req.resourceType(),
    failure: req.failure()?.errorText || 'unknown'
  };
  requestFailed.push(item);
});

page.on('response', async res => {
  const req = res.request();
  const url = res.url();
  const interesting = /\/api\/|owner|analytics|revenue|dashboard|staff|clients|appointments|pos/i.test(url);
  if (!interesting) return;
  const record = {
    ts: new Date().toISOString(),
    method: req.method(),
    url,
    status: res.status(),
    statusText: res.statusText(),
    resourceType: req.resourceType(),
    requestHeaders: Object.fromEntries(Object.entries(req.headers()).filter(([k]) => ['accept','content-type','cache-control','pragma'].includes(k.toLowerCase()))),
    responseHeaders: Object.fromEntries(Object.entries(await res.allHeaders()).filter(([k]) => ['content-type','cache-control','etag','age'].includes(k.toLowerCase())))
  };
  if (res.status() >= 400) {
    try {
      record.bodyPreview = (await res.text()).slice(0, 4000);
    } catch (e) {
      record.bodyPreview = `<<unavailable: ${e.message}>>`;
    }
    failedApi.push(`${res.status()} ${req.method()} ${url}`);
  }
  network.push(record);
});

const url = `${baseUrl}?pw_run=${encodeURIComponent(runId)}&_=${Date.now()}`;
let gotoStatus = 'unknown';
let title = '';
let bodyText = '';
let headings = [];
let buttons = [];
let controllerState = 'unavailable';
let pass = false;
let failureReason = '';

try {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  gotoStatus = response ? String(response.status()) : 'null';
  await page.waitForTimeout(10000);

  title = await page.title();
  bodyText = await page.locator('body').innerText().catch(() => '');
  headings = await page.locator('h1,h2,h3,[role="heading"]').allInnerTexts().catch(() => []);
  buttons = await page.locator('button').allInnerTexts().catch(() => []);
  controllerState = await page.evaluate(() => ('serviceWorker' in navigator ? (navigator.serviceWorker.controller ? 'present' : 'none') : 'unsupported')).catch(() => 'eval-failed');

  let screenshotIssue = '';
  try {
    await page.screenshot({ path: screenshotPath, fullPage: true });
  } catch (e) {
    screenshotIssue = e?.message || String(e);
    consoleEvents.push(`[validator] fullPage screenshot failed: ${screenshotIssue}`);
    try {
      await page.screenshot({ path: screenshotPath, fullPage: false });
    } catch (e2) {
      const fallbackIssue = e2?.message || String(e2);
      consoleEvents.push(`[validator] viewport screenshot failed: ${fallbackIssue}`);
    }
  }
  fs.writeFileSync(htmlPath, await page.content());
  await context.storageState({ path: storageStatePath });

  const required = ['Owner Control Tower', 'AI Revenue Opportunity Engine', 'POS Intelligence', 'System Health'];
  const missing = required.filter(x => !bodyText.toLowerCase().includes(x.toLowerCase()));

  if (Number(gotoStatus) >= 400) {
    failureReason = `HTTP ${gotoStatus}`;
  } else if (missing.length) {
    failureReason = `Missing UI markers: ${missing.join(', ')}`;
  } else if (pageErrors.length) {
    failureReason = `Page errors detected: ${pageErrors.length}`;
  } else {
    pass = true;
    if (screenshotIssue) failureReason = `Non-fatal screenshot issue: ${screenshotIssue}`;
  }
} catch (e) {
  failureReason = e.stack || e.message;
  try { await page.screenshot({ path: screenshotPath, fullPage: true }); } catch {}
  try { fs.writeFileSync(htmlPath, await page.content()); } catch {}
  try { await context.storageState({ path: storageStatePath }); } catch {}
}

fs.writeFileSync(consolePath, consoleEvents.join('\n'));
fs.writeFileSync(pageErrorsPath, pageErrors.join('\n'));
fs.writeFileSync(requestFailedPath, JSON.stringify(requestFailed, null, 2));
fs.writeFileSync(networkPath, JSON.stringify(network, null, 2));

const summary = [];
summary.push(`runId: ${runId}`);
summary.push(`baseUrl: ${baseUrl}`);
summary.push(`navigatedUrl: ${url}`);
summary.push(`status: ${gotoStatus}`);
summary.push(`title: ${title}`);
summary.push(`serviceWorkerController: ${controllerState}`);
summary.push(`result: ${pass ? 'PASS' : 'FAIL'}`);
summary.push(`failureReason: ${failureReason || 'none'}`);
summary.push(`consoleEvents: ${consoleEvents.length}`);
summary.push(`pageErrors: ${pageErrors.length}`);
summary.push(`requestFailed: ${requestFailed.length}`);
summary.push(`failedApiResponses: ${failedApi.length}`);
summary.push('');
summary.push('keyHeadings:');
for (const h of headings.slice(0, 50)) summary.push(`- ${h}`);
summary.push('');
summary.push('buttons:');
for (const b of buttons.slice(0, 50)) summary.push(`- ${b}`);
summary.push('');
summary.push('failedApi:');
if (!failedApi.length) summary.push('- none');
for (const x of failedApi) summary.push(`- ${x}`);
summary.push('');
summary.push('bodyExcerpt:');
summary.push(bodyText.slice(0, 5000));
fs.writeFileSync(summaryPath, summary.join('\n'));

console.log(`ARTIFACT_DIR=${artifactsDir}`);
console.log(fs.readFileSync(summaryPath, 'utf8'));

await context.close();
await browser.close();
process.exit(pass ? 0 : 1);
