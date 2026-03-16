import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = '/a0/usr/projects/jh_salon_twin/qa_screenshots/respark_analysis';
const RESPARK_URL = 'https://dashboard.respark.in';
const USERNAME = 'jawed_habib_hair_n_beauty';
const PASSWORD = '@kurnool';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function analyzeRespark() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  
  const analysis = {
    timestamp: new Date().toISOString(),
    login: {},
    dashboard: {},
    sections: {},
    design: {},
    features: []
  };

  try {
    // 1. Login Page Analysis
    console.log('🔐 Step 1: Analyzing Login Page...');
    await page.goto(`${RESPARK_URL}/#/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/cli_01_login.png`, fullPage: true });
    
    analysis.login = {
      url: page.url(),
      title: await page.title(),
      hasUsernameField: !!(await page.$('input[type="text"], input[type="email"]')),
      hasPasswordField: !!(await page.$('input[type="password"]')),
      hasLoginButton: !!(await page.$('button[type="submit"], button:has-text("Login")')),
    };
    console.log('✅ Login page captured');

    // 2. Perform Login
    console.log('🔑 Step 2: Logging in...');
    const usernameInput = await page.$('input[type="text"], input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    
    if (usernameInput && passwordInput) {
      await usernameInput.fill(USERNAME);
      await passwordInput.fill(PASSWORD);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/cli_02_login_filled.png`, fullPage: true });
      
      const loginBtn = await page.$('button[type="submit"], button:has-text("Login")');
      if (loginBtn) {
        await loginBtn.click();
        await sleep(5000);
        console.log('✅ Login successful');
      }
    }

    // 3. Main Dashboard Analysis
    console.log('📊 Step 3: Analyzing Main Dashboard...');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/cli_03_dashboard.png`, fullPage: true });
    
    analysis.dashboard = {
      url: page.url(),
      title: await page.title(),
    };

    // 4. Capture Navigation Structure
    console.log('🧭 Step 4: Capturing Navigation...');
    const navItems = await page.$$eval('nav a, .sidebar a, [class*="menu"] a, [class*="nav"] a', els => 
      els.map(el => ({ text: el.textContent?.trim(), href: el.getAttribute('href') })).filter(e => e.text && e.text.length > 0)
    );
    analysis.dashboard.navigation = navItems;
    console.log(`Found ${navItems.length} navigation items`);

    // 5. Navigate to each section
    const sections = [
      { name: 'Quick Sale', selectors: ['a:has-text("Quick Sale")', 'a:has-text("quick-sale")', 'a[href*="quick-sale"]'] },
      { name: 'Appointments', selectors: ['a:has-text("Appointment")', 'a:has-text("Booking")', 'a[href*="appointment"]'] },
      { name: 'Services', selectors: ['a:has-text("Service")', 'a[href*="service"]'] },
      { name: 'Staff', selectors: ['a:has-text("Staff")', 'a:has-text("Team")', 'a[href*="staff"]'] },
      { name: 'Clients', selectors: ['a:has-text("Client")', 'a:has-text("Customer")', 'a[href*="client"]'] },
      { name: 'Reports', selectors: ['a:has-text("Report")', 'a:has-text("Analytics")', 'a[href*="report"]'] },
      { name: 'Settings', selectors: ['a:has-text("Setting")', 'a[href*="setting"]'] },
    ];

    for (const section of sections) {
      console.log(`📄 Step: Analyzing ${section.name}...`);
      let clicked = false;
      for (const selector of section.selectors) {
        try {
          const link = await page.$(selector);
          if (link) {
            await link.click();
            await sleep(3000);
            await page.screenshot({ 
              path: `${SCREENSHOT_DIR}/cli_section_${section.name.toLowerCase().replace(' ', '_')}.png`, 
              fullPage: true 
            });
            analysis.sections[section.name] = {
              url: page.url(),
              captured: true
            };
            clicked = true;
            console.log(`✅ ${section.name} captured`);
            break;
          }
        } catch (e) {}
      }
      if (!clicked) {
        console.log(`⚠️ Could not navigate to ${section.name}`);
        analysis.sections[section.name] = { captured: false };
      }
      // Go back to dashboard
      await page.goto(`${RESPARK_URL}/#/quick-sale`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
      await sleep(2000);
    }

    // 6. Design Analysis
    console.log('🎨 Step 6: Analyzing Design Patterns...');
    analysis.design = await page.evaluate(() => {
      const body = document.body;
      const computedStyle = getComputedStyle(body);
      
      // Detect UI framework
      const frameworks = [];
      if (document.querySelector('[class*="ant-"]')) frameworks.push('Ant Design');
      if (document.querySelector('[class*="Mui"]')) frameworks.push('Material UI');
      if (document.querySelector('[class*="el-"]')) frameworks.push('Element UI');
      if (document.querySelector('[class*="v-"], [class*="vue"]')) frameworks.push('Vue.js');
      if (document.querySelector('[class*="react"]')) frameworks.push('React');
      
      // Get color scheme
      const colors = {
        background: computedStyle.backgroundColor,
        text: computedStyle.color,
        font: computedStyle.fontFamily
      };
      
      // Count UI elements
      const elements = {
        buttons: document.querySelectorAll('button').length,
        inputs: document.querySelectorAll('input').length,
        tables: document.querySelectorAll('table').length,
        forms: document.querySelectorAll('form').length,
        cards: document.querySelectorAll('[class*="card"]').length,
        modals: document.querySelectorAll('[class*="modal"], [class*="dialog"]').length
      };
      
      return { frameworks, colors, elements };
    });

    // 7. Feature Detection
    console.log('🔍 Step 7: Detecting Features...');
    const pageContent = await page.innerText('body').catch(() => '');
    
    const featureKeywords = [
      'POS', 'Point of Sale', 'Invoice', 'Payment', 'Cash', 'Card',
      'Appointment', 'Booking', 'Schedule', 'Calendar',
      'Staff', 'Employee', 'Team', 'Commission',
      'Service', 'Menu', 'Price', 'Discount', 'Offer',
      'Client', 'Customer', 'Member', 'Loyalty',
      'Report', 'Analytics', 'Dashboard', 'Revenue',
      'Inventory', 'Product', 'Stock',
      'SMS', 'WhatsApp', 'Notification', 'Reminder',
      'Settings', 'Configuration', 'Profile'
    ];
    
    analysis.features = featureKeywords.filter(kw => 
      pageContent.toLowerCase().includes(kw.toLowerCase())
    );

    // Save analysis report
    fs.writeFileSync(
      `${SCREENSHOT_DIR}/respark_deep_analysis.json`,
      JSON.stringify(analysis, null, 2)
    );
    
    console.log('\n✅ Deep analysis complete!');
    console.log(`📸 Screenshots saved to: ${SCREENSHOT_DIR}`);
    console.log(`📄 Report saved to: ${SCREENSHOT_DIR}/respark_deep_analysis.json`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

analyzeRespark().catch(console.error);
