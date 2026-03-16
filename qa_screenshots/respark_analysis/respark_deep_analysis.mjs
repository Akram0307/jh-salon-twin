import { chromium } from 'playwright';
import fs from 'fs';

const RESPARK_URL = 'https://dashboard.respark.in/#/quick-sale';
const USERNAME = 'jawed_habib_hair_n_beauty';
const PASSWORD = '@kurnool';
const SCREENSHOT_DIR = '/a0/usr/projects/jh_salon_twin/qa_screenshots/respark_analysis';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function analyzeResparkDashboard() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  const page = await context.newPage();
  
  const report = {
    timestamp: new Date().toISOString(),
    pages: [],
    features: [],
    designPatterns: [],
    navigation: [],
    forms: [],
    screenshots: []
  };

  try {
    console.log('🚀 Navigating to Respark Dashboard...');
    await page.goto(RESPARK_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(2000);
    
    // Capture login page
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01_login_page.png`, fullPage: true });
    report.screenshots.push('01_login_page.png');
    console.log('📸 Login page captured');
    
    // Analyze login page structure
    const loginPageHTML = await page.content();
    report.pages.push({
      name: 'Login Page',
      url: page.url(),
      title: await page.title()
    });
    
    // Try to login
    console.log('🔐 Attempting login...');
    
    // Look for username/email input
    const usernameSelectors = [
      'input[type="email"]',
      'input[type="text"]',
      'input[name="username"]',
      'input[name="email"]',
      'input[placeholder*="user"]',
      'input[placeholder*="email"]',
      'input[placeholder*="User"]',
      'input[placeholder*="Email"]',
      '#username',
      '#email'
    ];
    
    let usernameInput = null;
    for (const selector of usernameSelectors) {
      try {
        usernameInput = await page.$(selector);
        if (usernameInput) {
          console.log(`Found username input: ${selector}`);
          break;
        }
      } catch (e) {}
    }
    
    // Look for password input
    const passwordInput = await page.$('input[type="password"]');
    
    if (usernameInput && passwordInput) {
      await usernameInput.fill(USERNAME);
      await passwordInput.fill(PASSWORD);
      await sleep(500);
      
      // Capture filled login form
      await page.screenshot({ path: `${SCREENSHOT_DIR}/02_login_filled.png`, fullPage: true });
      report.screenshots.push('02_login_filled.png');
      console.log('📸 Filled login form captured');
      
      // Find and click login button
      const loginButtonSelectors = [
        'button[type="submit"]',
        'button:has-text("Login")',
        'button:has-text("Sign in")',
        'button:has-text("Log in")',
        'input[type="submit"]',
        '.login-button',
        '.btn-login'
      ];
      
      let loginButton = null;
      for (const selector of loginButtonSelectors) {
        try {
          loginButton = await page.$(selector);
          if (loginButton) {
            console.log(`Found login button: ${selector}`);
            break;
          }
        } catch (e) {}
      }
      
      if (loginButton) {
        await loginButton.click();
        console.log('⏳ Waiting for dashboard to load...');
        await sleep(5000);
        
        // Capture dashboard after login
        await page.screenshot({ path: `${SCREENSHOT_DIR}/03_dashboard_main.png`, fullPage: true });
        report.screenshots.push('03_dashboard_main.png');
        console.log('📸 Main dashboard captured');
        
        report.pages.push({
          name: 'Dashboard Main',
          url: page.url(),
          title: await page.title()
        });
      } else {
        console.log('⚠️ Could not find login button');
      }
    } else {
      console.log('⚠️ Could not find login form inputs');
      console.log(`Username input: ${usernameInput ? 'Found' : 'Not found'}`);
      console.log(`Password input: ${passwordInput ? 'Found' : 'Not found'}`);
    }
    
    // Analyze current page structure
    console.log('🔍 Analyzing page structure...');
    
    // Get all navigation elements
    const navItems = await page.$$eval('nav a, .nav-item, .menu-item, [role="navigation"] a', els => 
      els.map(el => ({ text: el.textContent?.trim(), href: el.getAttribute('href') })).filter(e => e.text)
    );
    report.navigation = navItems.slice(0, 20);
    
    // Get all buttons
    const buttons = await page.$$eval('button, [role="button"], .btn', els => 
      els.map(el => ({ text: el.textContent?.trim(), class: el.className })).filter(e => e.text).slice(0, 15)
    );
    
    // Get all forms
    const forms = await page.$$eval('form', els => 
      els.map(el => ({ action: el.getAttribute('action'), method: el.getAttribute('method') }))
    );
    report.forms = forms;
    
    // Get page text content for feature analysis
    const pageText = await page.innerText('body').catch(() => '');
    
    // Try to navigate to different sections
    const sectionsToTry = [
      { name: 'Quick Sale', path: '#/quick-sale' },
      { name: 'Dashboard', path: '#/dashboard' },
      { name: 'Appointments', path: '#/appointments' },
      { name: 'Services', path: '#/services' },
      { name: 'Staff', path: '#/staff' },
      { name: 'Reports', path: '#/reports' },
      { name: 'Settings', path: '#/settings' }
    ];
    
    for (const section of sectionsToTry) {
      try {
        await page.goto(`https://dashboard.respark.in/${section.path}`, { waitUntil: 'networkidle', timeout: 15000 });
        await sleep(2000);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/section_${section.name.toLowerCase().replace(' ', '_')}.png`, fullPage: true });
        report.screenshots.push(`section_${section.name.toLowerCase().replace(' ', '_')}.png`);
        report.pages.push({ name: section.name, url: page.url() });
        console.log(`📸 ${section.name} section captured`);
      } catch (e) {
        console.log(`⚠️ Could not load ${section.name}: ${e.message}`);
      }
    }
    
    // Analyze design patterns
    const designPatterns = await page.evaluate(() => {
      const patterns = [];
      
      // Check for common UI frameworks
      const body = document.body;
      if (body.classList.toString().includes('ant-')) patterns.push('Ant Design');
      if (body.classList.toString().includes('Mui')) patterns.push('Material UI');
      if (body.classList.toString().includes('el-')) patterns.push('Element UI');
      if (body.classList.toString().includes('bootstrap')) patterns.push('Bootstrap');
      
      // Check for Tailwind
      if (document.querySelector('[class*="flex"]') && document.querySelector('[class*="p-"]')) {
        patterns.push('Tailwind CSS (likely)');
      }
      
      // Check color scheme
      const styles = getComputedStyle(document.body);
      patterns.push(`Background: ${styles.backgroundColor}`);
      patterns.push(`Primary Color: ${styles.color}`);
      
      return patterns;
    });
    report.designPatterns = designPatterns;
    
    // Generate report
    const reportContent = `# Respark Dashboard Deep Analysis Report

**Date:** ${report.timestamp}
**Analyst:** Agent Zero (Playwright CLI)

---

## 📸 Screenshots Captured

${report.screenshots.map(s => `- ${s}`).join('\n')}

---

## 📄 Pages Analyzed

${report.pages.map(p => `### ${p.name}\n- URL: ${p.url}\n- Title: ${p.title || 'N/A'}`).join('\n\n')}

---

## 🧭 Navigation Structure

${report.navigation.map(n => `- ${n.text} → ${n.href || 'N/A'}`).join('\n')}

---

## 🎨 Design Patterns Detected

${report.designPatterns.map(p => `- ${p}`).join('\n')}

---

## 📝 Forms Detected

${report.forms.length > 0 ? report.forms.map(f => `- Action: ${f.action}, Method: ${f.method}`).join('\n') : 'No forms detected'}

---

## 🔍 Key Observations

### UI Framework
${report.designPatterns.join(', ') || 'Unknown'}

### Navigation Style
${report.navigation.length > 0 ? 'Multi-section navigation detected' : 'Single page application'}

### Page Count
${report.pages.length} pages analyzed

`;
    
    fs.writeFileSync(`${SCREENSHOT_DIR}/respark_analysis_report.md`, reportContent);
    console.log('\n✅ Analysis complete! Report saved to respark_analysis_report.md');
    
  } catch (error) {
    console.error('❌ Error during analysis:', error.message);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/error_state.png`, fullPage: true }).catch(() => {});
  } finally {
    await browser.close();
  }
}

analyzeResparkDashboard().catch(console.error);
