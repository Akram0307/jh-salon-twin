import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = '/a0/usr/projects/jh_salon_twin/qa_screenshots/respark_analysis';
const RESPARK_URL = 'https://dashboard.respark.in';
const USERNAME = 'jawed_habib_hair_n_beauty';
const PASSWORD = '@kurnool';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  
  const report = { screenshots: [], sections: [], uiElements: {}, designAnalysis: {} };
  
  try {
    // Step 1: Login
    console.log('🔐 Navigating to login...');
    await page.goto(`${RESPARK_URL}/#/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/final_01_login.png`, fullPage: true });
    report.screenshots.push('final_01_login.png');
    
    // Fill login form
    await page.fill('input[type="text"], input[type="email"], input[name="username"]', USERNAME);
    await page.fill('input[type="password"]', PASSWORD);
    await sleep(500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/final_02_login_filled.png`, fullPage: true });
    report.screenshots.push('final_02_login_filled.png');
    
    // Click login
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');
    await sleep(5000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/final_03_dashboard.png`, fullPage: true });
    report.screenshots.push('final_03_dashboard.png');
    console.log('✅ Logged in successfully');
    
    // Step 2: Analyze navigation structure
    console.log('🔍 Analyzing navigation...');
    const navItems = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('a, [role="menuitem"], .nav-item, .menu-item, .sidebar-item').forEach(el => {
        const text = el.textContent?.trim();
        const href = el.getAttribute('href');
        if (text && text.length < 50) items.push({ text, href });
      });
      return items;
    });
    report.uiElements.navigation = navItems;
    
    // Step 3: Capture all sidebar/menu sections
    const sections = [
      { name: 'Quick Sale', selector: 'a[href*="quick-sale"], a:has-text("Quick Sale")' },
      { name: 'Dashboard', selector: 'a[href*="dashboard"], a:has-text("Dashboard")' },
      { name: 'Appointments', selector: 'a[href*="appointment"], a:has-text("Appointment")' },
      { name: 'Services', selector: 'a[href*="service"], a:has-text("Service")' },
      { name: 'Staff', selector: 'a[href*="staff"], a:has-text("Staff")' },
      { name: 'Clients', selector: 'a[href*="client"], a:has-text("Client")' },
      { name: 'Reports', selector: 'a[href*="report"], a:has-text("Report")' },
      { name: 'Settings', selector: 'a[href*="setting"], a:has-text("Setting")' }
    ];
    
    for (const section of sections) {
      try {
        console.log(`📄 Capturing ${section.name}...`);
        const link = await page.$(section.selector);
        if (link) {
          await link.click();
          await sleep(3000);
          const filename = `final_section_${section.name.toLowerCase().replace(' ', '_')}.png`;
          await page.screenshot({ path: `${SCREENSHOT_DIR}/${filename}`, fullPage: true });
          report.screenshots.push(filename);
          report.sections.push({ name: section.name, url: page.url(), captured: true });
          console.log(`✅ ${section.name} captured`);
        } else {
          report.sections.push({ name: section.name, captured: false, reason: 'Link not found' });
          console.log(`⚠️ ${section.name} link not found`);
        }
      } catch (e) {
        report.sections.push({ name: section.name, captured: false, reason: e.message });
        console.log(`❌ ${section.name} error: ${e.message}`);
      }
    }
    
    // Step 4: Analyze design patterns
    console.log('🎨 Analyzing design patterns...');
    const designInfo = await page.evaluate(() => {
      const body = document.body;
      const computedStyle = getComputedStyle(body);
      
      // Detect UI framework
      const frameworks = [];
      if (document.querySelector('[class*="ant-"]')) frameworks.push('Ant Design');
      if (document.querySelector('[class*="Mui"]')) frameworks.push('Material UI');
      if (document.querySelector('[class*="el-"]')) frameworks.push('Element UI');
      if (document.querySelector('[class*="btn-"]')) frameworks.push('Bootstrap');
      
      // Get color scheme
      const colors = new Set();
      document.querySelectorAll('*').forEach(el => {
        const style = getComputedStyle(el);
        if (style.backgroundColor !== 'rgba(0, 0, 0, 0)') colors.add(style.backgroundColor);
      });
      
      // Get typography
      const fonts = new Set();
      document.querySelectorAll('h1, h2, h3, p, span, button').forEach(el => {
        const style = getComputedStyle(el);
        fonts.add(style.fontFamily);
      });
      
      return {
        frameworks,
        backgroundColor: computedStyle.backgroundColor,
        colors: Array.from(colors).slice(0, 10),
        fonts: Array.from(fonts).slice(0, 5),
        bodyClasses: body.className
      };
    });
    report.designAnalysis = designInfo;
    
    // Step 5: Analyze page structure
    const pageStructure = await page.evaluate(() => {
      const structure = {
        hasSidebar: !!document.querySelector('.sidebar, [class*="sidebar"], nav, [role="navigation"]'),
        hasHeader: !!document.querySelector('header, [class*="header"], [role="banner"]'),
        hasFooter: !!document.querySelector('footer, [class*="footer"], [role="contentinfo"]'),
        forms: document.querySelectorAll('form').length,
        tables: document.querySelectorAll('table').length,
        buttons: document.querySelectorAll('button').length,
        inputs: document.querySelectorAll('input').length,
        cards: document.querySelectorAll('[class*="card"]').length
      };
      return structure;
    });
    report.uiElements.pageStructure = pageStructure;
    
    // Save report
    fs.writeFileSync(`${SCREENSHOT_DIR}/respark_full_analysis.json`, JSON.stringify(report, null, 2));
    console.log('\n✅ Analysis complete! Report saved.');
    console.log(`📸 Screenshots: ${report.screenshots.length}`);
    console.log(`📄 Sections: ${report.sections.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
