const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const base = 'https://salonos-owner-frontend-rgvcleapsa-uc.a.run.app';
  const routes = ['/', '/owner/dashboard', '/owner/schedule', '/onboarding', '/owner/clients', '/owner/staff'];
  const outDir = path.resolve(__dirname);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });
  const results = [];

  for (const route of routes) {
    const url = `${base}${route}`;
    let status = null, finalUrl = null, title = null, marker = null, error = null;
    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1500);
      status = response ? response.status() : null;
      finalUrl = page.url();
      title = await page.title();
      const bodyText = await page.locator('body').innerText().catch(() => '');
      marker = bodyText.includes('404') ? 'contains_404_text' : bodyText.includes('SalonOS') ? 'contains_salonos' : 'loaded_without_brand_match';
      const fileSafe = route === '/' ? 'root' : route.replace(/^\//, '').replace(/\//g, '__');
      await page.screenshot({ path: path.join(outDir, `${fileSafe}.png`), fullPage: true });
    } catch (e) {
      error = String(e && e.message ? e.message : e);
    }
    results.push({ route, status, finalUrl, title, marker, error });
  }

  await browser.close();
  fs.writeFileSync(path.join(outDir, 'route_results.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
})();
