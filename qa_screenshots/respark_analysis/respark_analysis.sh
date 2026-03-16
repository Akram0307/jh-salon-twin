#!/bin/bash

# Respark Dashboard Deep Analysis using Playwright CLI
# Date: $(date)

SCREENSHOT_DIR="/a0/usr/projects/jh_salon_twin/qa_screenshots/respark_analysis"
RESPARK_URL="https://dashboard.respark.in"
USERNAME="jawed_habib_hair_n_beauty"
PASSWORD="@kurnool"

echo "🚀 Starting Respark Dashboard Deep Analysis"
echo "============================================"

# Step 1: Capture Login Page
echo "📸 Step 1: Capturing Login Page..."
/opt/venv/bin/playwright screenshot --browser chromium --wait-for-timeout 3000 --full-page "$RESPARK_URL/#/login" "$SCREENSHOT_DIR/01_login_page.png" 2>&1

# Step 2: Navigate and Login using codegen-style approach
echo "🔐 Step 2: Creating login script..."
cat > "$SCREENSHOT_DIR/login_and_capture.mjs" << 'EOF'
import { chromium } from 'playwright';

const SCREENSHOT_DIR = '/a0/usr/projects/jh_salon_twin/qa_screenshots/respark_analysis';
const RESPARK_URL = 'https://dashboard.respark.in';
const USERNAME = 'jawed_habib_hair_n_beauty';
const PASSWORD = '@kurnool';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  
  console.log('🚀 Navigating to Respark login...');
  await page.goto(`${RESPARK_URL}/#/login`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  // Capture login page
  await page.screenshot({ path: `${SCREENSHOT_DIR}/01_login_page.png`, fullPage: true });
  console.log('✅ Login page captured');
  
  // Get login page HTML structure
  const loginInputs = await page.$$eval('input', inputs => inputs.map(i => ({
    type: i.type,
    name: i.name,
    placeholder: i.placeholder,
    id: i.id,
    class: i.className
  })));
  console.log('📝 Login form inputs:', JSON.stringify(loginInputs, null, 2));
  
  // Fill login form
  const usernameInput = await page.$('input[type="text"], input[type="email"], input[name="username"], input[name="email"]');
  const passwordInput = await page.$('input[type="password"]');
  
  if (usernameInput && passwordInput) {
    await usernameInput.fill(USERNAME);
    await passwordInput.fill(PASSWORD);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02_login_filled.png`, fullPage: true });
    console.log('✅ Login form filled');
    
    // Click login button
    const loginBtn = await page.$('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');
    if (loginBtn) {
      await loginBtn.click();
      console.log('⏳ Waiting for dashboard...');
      await page.waitForTimeout(5000);
      
      // Capture main dashboard
      await page.screenshot({ path: `${SCREENSHOT_DIR}/03_dashboard_main.png`, fullPage: true });
      console.log('✅ Main dashboard captured');
      
      // Get page URL after login
      console.log('📍 Current URL:', page.url());
      
      // Analyze navigation
      const navItems = await page.$$eval('nav a, .nav-item, .menu-item, [role="navigation"] a, .sidebar a, .sidebar-item', els => 
        els.map(el => ({ text: el.textContent?.trim(), href: el.getAttribute('href') })).filter(e => e.text && e.text.length > 0)
      );
      console.log('🧭 Navigation items:', JSON.stringify(navItems.slice(0, 20), null, 2));
      
      // Capture sidebar if exists
      const sidebar = await page.$('.sidebar, nav, [role="navigation"], .menu');
      if (sidebar) {
        await sidebar.screenshot({ path: `${SCREENSHOT_DIR}/04_sidebar.png` });
        console.log('✅ Sidebar captured');
      }
      
      // Navigate to different sections
      const sections = [
        { name: 'quick-sale', selectors: ['a[href*="quick-sale"]', 'text=Quick Sale', '.menu-item:has-text("Quick Sale")'] },
        { name: 'appointments', selectors: ['a[href*="appointment"]', 'text=Appointments', '.menu-item:has-text("Appointment")'] },
        { name: 'services', selectors: ['a[href*="service"]', 'text=Services', '.menu-item:has-text("Service")'] },
        { name: 'staff', selectors: ['a[href*="staff"]', 'text=Staff', '.menu-item:has-text("Staff")'] },
        { name: 'clients', selectors: ['a[href*="client"]', 'text=Clients', '.menu-item:has-text("Client")'] },
        { name: 'reports', selectors: ['a[href*="report"]', 'text=Reports', '.menu-item:has-text("Report")'] },
        { name: 'settings', selectors: ['a[href*="setting"]', 'text=Settings', '.menu-item:has-text("Setting")'] }
      ];
      
      for (const section of sections) {
        let clicked = false;
        for (const selector of section.selectors) {
          try {
            const el = await page.$(selector);
            if (el) {
              await el.click();
              await page.waitForTimeout(2000);
              await page.screenshot({ path: `${SCREENSHOT_DIR}/section_${section.name}.png`, fullPage: true });
              console.log(`✅ ${section.name} section captured`);
              clicked = true;
              break;
            }
          } catch (e) {}
        }
        if (!clicked) {
          console.log(`⚠️ Could not find ${section.name} section`);
        }
      }
      
      // Analyze design patterns
      const designAnalysis = await page.evaluate(() => {
        const body = document.body;
        const styles = getComputedStyle(body);
        const allElements = document.querySelectorAll('*');
        const frameworks = [];
        const colors = new Set();
        const fonts = new Set();
        
        // Check for UI frameworks
        if (document.querySelector('[class*="ant-"]')) frameworks.push('Ant Design');
        if (document.querySelector('[class*="Mui"]')) frameworks.push('Material UI');
        if (document.querySelector('[class*="el-"]')) frameworks.push('Element UI');
        if (document.querySelector('[class*="btn-"]')) frameworks.push('Bootstrap');
        if (document.querySelector('[class*="flex"]') && document.querySelector('[class*="p-"]')) frameworks.push('Tailwind CSS');
        
        // Collect colors and fonts
        allElements.forEach(el => {
          const s = getComputedStyle(el);
          if (s.color && s.color !== 'rgb(0, 0, 0)') colors.add(s.color);
          if (s.backgroundColor && s.backgroundColor !== 'rgba(0, 0, 0, 0)') colors.add(s.backgroundColor);
          if (s.fontFamily) fonts.add(s.fontFamily.split(',')[0].trim());
        });
        
        return {
          frameworks,
          colors: Array.from(colors).slice(0, 10),
          fonts: Array.from(fonts).slice(0, 5),
          bodyBg: styles.backgroundColor,
          bodyColor: styles.color
        };
      });
      console.log('🎨 Design analysis:', JSON.stringify(designAnalysis, null, 2));
      
      // Get page structure
      const pageStructure = await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => ({
          tag: h.tagName,
          text: h.textContent?.trim()
        })).filter(h => h.text);
        
        const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(t => t).slice(0, 15);
        const tables = document.querySelectorAll('table').length;
        const forms = document.querySelectorAll('form').length;
        const cards = document.querySelectorAll('.card, [class*="card"], [class*="Card"]').length;
        
        return { headings, buttons, tables, forms, cards };
      });
      console.log('📄 Page structure:', JSON.stringify(pageStructure, null, 2));
      
    } else {
      console.log('⚠️ Could not find login button');
    }
  } else {
    console.log('⚠️ Could not find login inputs');
  }
  
  await browser.close();
  console.log('\n✅ Analysis complete!');
})();
EOF

echo "✅ Login script created"
