const { chromium } = require('playwright');
const fs = require('fs');
(async() => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 2200 } });
  const url = 'https://salonos-owner-frontend-rgvcleapsa-uc.a.run.app/owner';
  const findings = [];
  page.on('console', msg => findings.push(`[console:${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => findings.push(`[pageerror] ${err.message}`));
  page.on('requestfailed', req => findings.push(`[requestfailed] ${req.url()} :: ${req.failure()?.errorText || 'unknown'}`));
  const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  findings.push(`[http-status] ${resp && resp.status ? resp.status() : 'unknown'}`);
  await page.screenshot({ path: './playwright_checks/owner_dashboard_validation.png', fullPage: true });
  const bodyText = await page.locator('body').innerText();
  const probes = ['Owner','Revenue','Opportunity','Campaign','Health','Waitlist','POS','Dashboard','Staff','Services','Schedule'];
  const results = probes.map(p => ({ probe: p, found: bodyText.toLowerCase().includes(p.toLowerCase()) }));
  const title = await page.title();
  const headings = await page.locator('h1, h2, h3, [role="heading"]').allInnerTexts().catch(() => []);
  const buttons = await page.locator('button').allInnerTexts().catch(() => []);
  const links = await page.locator('a').evaluateAll(els => els.map(a => ({ text: (a.textContent || '').trim(), href: a.href })).filter(x => x.text || x.href));
  fs.writeFileSync('./playwright_checks/owner_dashboard_validation_report.txt', [
    `URL: ${url}`,
    `Title: ${title}`,
    `Status: ${resp && resp.status ? resp.status() : 'unknown'}`,
    '',
    'Probe results:',
    ...results.map(r => `- ${r.probe}: ${r.found ? 'FOUND' : 'missing'}`),
    '',
    'Headings:',
    ...headings.map(x => `- ${x}`),
    '',
    'Buttons:',
    ...buttons.map(x => `- ${x}`),
    '',
    'Links:',
    ...links.map(x => `- ${x.text} -> ${x.href}`),
    '',
    'Events:',
    ...findings,
    '',
    'Body excerpt:',
    bodyText.slice(0, 4000)
  ].join('\n'));
  console.log('REPORT=./playwright_checks/owner_dashboard_validation_report.txt');
  console.log('SCREENSHOT=./playwright_checks/owner_dashboard_validation.png');
  console.log('TITLE=' + title);
  console.log('STATUS=' + (resp && resp.status ? resp.status() : 'unknown'));
  console.log('HEADINGS=' + headings.length);
  console.log('BUTTONS=' + buttons.length);
  await browser.close();
})();
