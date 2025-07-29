#!/usr/bin/env node

/**
 * JACC User Guide Screenshot Generator
 * 
 * This script automatically captures screenshots of key JACC interface elements
 * for inclusion in user guides. It uses Puppeteer to navigate the application
 * and capture high-quality images.
 */

import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCREENSHOT_CONFIG = {
  viewport: {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 2 // High DPI for crisp images
  },
  baseUrl: 'http://localhost:5000',
  outputDir: './user-guide-screenshots',
  adminCredentials: {
    username: 'admin',
    password: 'admin123'
  },
  userCredentials: {
    username: 'tracer-user',
    password: 'tracer123'
  }
};

async function ensureOutputDirectory() {
  try {
    await fs.mkdir(SCREENSHOT_CONFIG.outputDir, { recursive: true });
    console.log(`📁 Output directory created: ${SCREENSHOT_CONFIG.outputDir}`);
  } catch (error) {
    console.log(`📁 Output directory exists: ${SCREENSHOT_CONFIG.outputDir}`);
  }
}

async function loginUser(page, credentials, role = 'user') {
  console.log(`🔐 Logging in as ${role}...`);
  
  // Navigate to login page
  await page.goto(`${SCREENSHOT_CONFIG.baseUrl}/login`);
  await page.waitForSelector('input[name="username"]', { timeout: 10000 });
  
  // Fill login form
  await page.type('input[name="username"]', credentials.username);
  await page.type('input[name="password"]', credentials.password);
  
  // Submit form
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  
  console.log(`✅ Successfully logged in as ${role}`);
}

async function captureScreenshot(page, filename, selector = null, description = '') {
  console.log(`📸 Capturing: ${description || filename}`);
  
  const options = {
    path: path.join(SCREENSHOT_CONFIG.outputDir, filename),
    type: 'png',
    fullPage: selector ? false : true
  };
  
  if (selector) {
    try {
      await page.waitForSelector(selector, { timeout: 5000 });
      const element = await page.$(selector);
      if (element) {
        await element.screenshot(options);
        console.log(`✅ Element screenshot saved: ${filename}`);
        return;
      }
    } catch (error) {
      console.log(`⚠️  Element not found (${selector}), taking full page screenshot`);
    }
  }
  
  await page.screenshot(options);
  console.log(`✅ Screenshot saved: ${filename}`);
}

async function captureUserInterface(browser) {
  const page = await browser.newPage();
  await page.setViewport(SCREENSHOT_CONFIG.viewport);
  
  console.log('\n🎯 CAPTURING USER INTERFACE SCREENSHOTS');
  
  // Login as regular user
  await loginUser(page, SCREENSHOT_CONFIG.userCredentials, 'sales-agent');
  
  // 1. Dashboard/Welcome Screen
  await page.goto(`${SCREENSHOT_CONFIG.baseUrl}/`);
  await page.waitForSelector('.welcome-container', { timeout: 5000 });
  await captureScreenshot(page, '01-dashboard-welcome.png', null, 'Dashboard Welcome Screen');
  
  // 2. Chat Interface with Conversation Starters
  await captureScreenshot(page, '02-conversation-starters.png', '.conversation-starters', 'Conversation Starter Buttons');
  
  // 3. Chat Input and Interface
  await page.click('input[placeholder*="Ask JACC"]');
  await page.type('input[placeholder*="Ask JACC"]', 'What are the top 3 processors and why?');
  await captureScreenshot(page, '03-chat-input.png', '.chat-interface', 'Chat Input Interface');
  
  // Submit query and wait for response
  await page.keyboard.press('Enter');
  await page.waitForTimeout(3000); // Wait for response
  await captureScreenshot(page, '04-chat-response.png', '.chat-interface', 'Chat Response with AI Answer');
  
  // 4. Document Center
  await page.goto(`${SCREENSHOT_CONFIG.baseUrl}/documents`);
  await page.waitForSelector('.documents-page', { timeout: 5000 });
  await captureScreenshot(page, '05-document-center.png', null, 'Document Center Interface');
  
  // 5. Mobile Navigation (simulate mobile)
  await page.setViewport({ width: 375, height: 667, deviceScaleFactor: 2 });
  await page.goto(`${SCREENSHOT_CONFIG.baseUrl}/`);
  await page.waitForSelector('.bottom-nav', { timeout: 5000 });
  await captureScreenshot(page, '06-mobile-navigation.png', '.bottom-nav', 'Mobile Bottom Navigation');
  
  await page.close();
}

async function captureAdminInterface(browser) {
  const page = await browser.newPage();
  await page.setViewport(SCREENSHOT_CONFIG.viewport);
  
  console.log('\n🎯 CAPTURING ADMIN INTERFACE SCREENSHOTS');
  
  // Login as admin
  await loginUser(page, SCREENSHOT_CONFIG.adminCredentials, 'admin');
  
  // 1. Admin Control Center Overview
  await page.goto(`${SCREENSHOT_CONFIG.baseUrl}/unified-admin-panel`);
  await page.waitForSelector('.admin-tabs', { timeout: 5000 });
  await captureScreenshot(page, '07-admin-overview.png', null, 'Admin Control Center Overview');
  
  // 2. Q&A Knowledge Base
  await page.click('[data-tab="qa-knowledge"]');
  await page.waitForTimeout(1000);
  await captureScreenshot(page, '08-qa-knowledge.png', '.qa-knowledge-section', 'Q&A Knowledge Base Management');
  
  // 3. Document Center Admin
  await page.click('[data-tab="document-center"]');
  await page.waitForTimeout(1000);
  await captureScreenshot(page, '09-document-admin.png', '.document-center-section', 'Document Center Admin Interface');
  
  // 4. Content Quality Tab
  await page.click('[data-tab="content-quality"]');
  await page.waitForTimeout(1000);
  await captureScreenshot(page, '10-content-quality.png', '.content-quality-section', 'Content Quality Analysis');
  
  // 5. Chat & AI Training
  await page.click('[data-tab="chat-training"]');
  await page.waitForTimeout(1000);
  await captureScreenshot(page, '11-chat-training.png', '.chat-training-section', 'Chat Review & AI Training');
  
  // 6. System Monitor
  await page.click('[data-tab="system-monitor"]');
  await page.waitForTimeout(1000);
  await captureScreenshot(page, '12-system-monitor.png', '.system-monitor-section', 'System Performance Monitor');
  
  // 7. Settings Panel
  await page.click('[data-tab="settings"]');
  await page.waitForTimeout(1000);
  await captureScreenshot(page, '13-settings-panel.png', '.settings-section', 'Settings Configuration Panel');
  
  await page.close();
}

async function generateScreenshotIndex() {
  const indexContent = `# JACC User Guide Screenshots

This directory contains screenshots for the JACC user guides, automatically generated on ${new Date().toISOString()}.

## User Interface Screenshots

1. **01-dashboard-welcome.png** - Dashboard welcome screen with JACC branding
2. **02-conversation-starters.png** - Conversation starter buttons for quick access
3. **03-chat-input.png** - Chat interface with user input
4. **04-chat-response.png** - AI response with formatted content
5. **05-document-center.png** - Document browsing and access interface
6. **06-mobile-navigation.png** - Mobile bottom navigation bar

## Admin Interface Screenshots

7. **07-admin-overview.png** - Admin control center main dashboard
8. **08-qa-knowledge.png** - Q&A knowledge base management
9. **09-document-admin.png** - Document center admin interface
10. **10-content-quality.png** - Content quality analysis dashboard
11. **11-chat-training.png** - Chat review and AI training interface
12. **12-system-monitor.png** - System performance monitoring
13. **13-settings-panel.png** - Settings configuration panel

## Usage in Markdown

Include screenshots in user guides using:

\`\`\`markdown
![Dashboard Welcome](./user-guide-screenshots/01-dashboard-welcome.png)
*Figure 1: JACC Dashboard Welcome Screen*
\`\`\`

## Re-generating Screenshots

To update screenshots:
1. Ensure JACC server is running on http://localhost:5000
2. Run: \`node create-user-guide-screenshots.js\`
3. Screenshots will be saved to ./user-guide-screenshots/

Generated on: ${new Date().toISOString()}
`;

  await fs.writeFile(
    path.join(SCREENSHOT_CONFIG.outputDir, 'README.md'),
    indexContent
  );
  
  console.log('📋 Screenshot index created');
}

async function main() {
  console.log('🚀 JACC User Guide Screenshot Generator');
  console.log('=====================================');
  
  await ensureOutputDirectory();
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ]
  });
  
  try {
    // Capture user interface screenshots
    await captureUserInterface(browser);
    
    // Capture admin interface screenshots
    await captureAdminInterface(browser);
    
    // Generate index file
    await generateScreenshotIndex();
    
    console.log('\n✅ ALL SCREENSHOTS CAPTURED SUCCESSFULLY');
    console.log(`📁 Screenshots saved to: ${SCREENSHOT_CONFIG.outputDir}`);
    console.log('🎯 Ready for user guide integration');
    
  } catch (error) {
    console.error('❌ Error capturing screenshots:', error.message);
    console.log('💡 Make sure JACC server is running on http://localhost:5000');
  } finally {
    await browser.close();
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}