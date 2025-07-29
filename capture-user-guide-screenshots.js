/**
 * JACC User Guide Screenshot Capture Script
 * Automatically captures screenshots of current JACC interface for user guide
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5000';
const SCREENSHOT_DIR = './user-guide-screenshots';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Admin credentials for authenticated screenshots
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureScreenshots() {
  console.log('🚀 Starting JACC User Guide Screenshot Capture...');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for production
    defaultViewport: {
      width: 1920,
      height: 1080
    },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  try {
    // 1. Welcome Screen (Mobile and Desktop)
    console.log('📸 Capturing Welcome Screen...');
    await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle2' });
    await delay(2000);
    
    // Desktop version
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'welcome-screen-desktop.png'),
      fullPage: true
    });
    
    // Mobile version
    await page.setViewport({ width: 375, height: 812 });
    await delay(1000);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'welcome-screen-mobile.png'),
      fullPage: true
    });
    
    // Reset to desktop
    await page.setViewport({ width: 1920, height: 1080 });
    
    // 2. Login and Authentication
    console.log('🔐 Capturing Login Process...');
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle2' });
    await delay(1000);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'login-screen.png'),
      fullPage: true
    });
    
    // Perform login
    await page.type('#username', ADMIN_CREDENTIALS.username);
    await page.type('#password', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await delay(3000);
    
    // 3. Main Chat Interface
    console.log('💬 Capturing Chat Interface...');
    await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle2' });
    await delay(2000);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'chat-interface-main.png'),
      fullPage: true
    });
    
    // 4. Conversation Starters Detail
    console.log('🎯 Capturing Conversation Starters...');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'conversation-starters.png'),
      clip: { x: 300, y: 300, width: 1320, height: 600 }
    });
    
    // 5. Admin Panel Overview
    console.log('⚙️ Capturing Admin Panel...');
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle2' });
    await delay(3000);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'admin-panel.png'),
      fullPage: true
    });
    
    // 6. API Usage Dashboard
    console.log('📊 Capturing API Usage Dashboard...');
    await page.click('[data-tab="settings"]'); // Click settings tab
    await delay(2000);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'api-usage-dashboard.png'),
      fullPage: true
    });
    
    // 7. Configure Button Modal
    console.log('🔧 Capturing Configure Modal...');
    const configureButton = await page.$('.configure-button');
    if (configureButton) {
      await configureButton.click();
      await delay(1000);
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'api-usage-alerts.png'),
        fullPage: true
      });
      // Close modal
      await page.keyboard.press('Escape');
    }
    
    // 8. System Monitor (F35 Style)
    console.log('🛡️ Capturing F35 System Monitor...');
    await page.click('[data-tab="system-monitor"]');
    await delay(2000);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'f35-system-monitor.png'),
      fullPage: true
    });
    
    // 9. Document Center
    console.log('📁 Capturing Document Center...');
    await page.click('[data-tab="document-center"]');
    await delay(2000);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'document-center.png'),
      fullPage: true
    });
    
    // 10. Voice Agent Costs
    console.log('🎙️ Capturing Voice Agent Integration...');
    await page.click('[data-tab="settings"]');
    await delay(1000);
    // Look for voice agent section
    const voiceSection = await page.$('.voice-agent-section');
    if (voiceSection) {
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'voice-agent-costs.png'),
        clip: { x: 100, y: 200, width: 1720, height: 400 }
      });
    }
    
    // 11. Mobile Chat Interface
    console.log('📱 Capturing Mobile Chat Interface...');
    await page.setViewport({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle2' });
    await delay(2000);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'mobile-chat-interface.png'),
      fullPage: true
    });
    
    // 12. Performance Dashboard
    console.log('⚡ Capturing Performance Metrics...');
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle2' });
    await delay(2000);
    await page.click('[data-tab="system-monitor"]');
    await delay(2000);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'performance-dashboard.png'),
      clip: { x: 0, y: 100, width: 1920, height: 800 }
    });
    
    console.log('✅ Screenshot capture completed successfully!');
    console.log(`📁 Screenshots saved to: ${SCREENSHOT_DIR}`);
    
    // Generate screenshot index
    const screenshots = fs.readdirSync(SCREENSHOT_DIR)
      .filter(file => file.endsWith('.png'))
      .map(file => `- ${file}`)
      .join('\n');
    
    fs.writeFileSync(
      path.join(SCREENSHOT_DIR, 'README.md'),
      `# JACC User Guide Screenshots\n\nCaptured: ${new Date().toISOString()}\n\n## Available Screenshots:\n${screenshots}\n`
    );
    
  } catch (error) {
    console.error('❌ Error capturing screenshots:', error);
  } finally {
    await browser.close();
  }
}

// Execute screenshot capture
captureScreenshots()
  .then(() => {
    console.log('🎉 JACC User Guide Screenshots Ready!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Screenshot capture failed:', error);
    process.exit(1);
  });