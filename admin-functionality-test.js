#!/usr/bin/env node

/**
 * Comprehensive Admin Panel Functionality Test
 * Tests all 8 tabs, buttons, and API endpoints systematically
 */

const fs = require('fs');

// Session cookie for authentication
const ADMIN_COOKIE = 'connect.sid=s%3Asession_f4a0f785-088b-4a3a-8d39-c1ca421cdd79.SomeSignature';

// Base URL
const BASE_URL = 'http://localhost:5000';

// Test categories
const tests = {
  'Tab 1: Overview & System Health': [
    { name: 'System Health Monitor', endpoint: '/api/admin/system/health', method: 'GET' },
    { name: 'Performance Metrics', endpoint: '/api/admin/performance', method: 'GET' },
    { name: 'Memory Usage Stats', endpoint: '/api/admin/memory-stats', method: 'GET' },
    { name: 'Database Status', endpoint: '/api/admin/database/status', method: 'GET' }
  ],
  'Tab 2: Q&A Knowledge Base': [
    { name: 'List FAQ Entries', endpoint: '/api/admin/faq', method: 'GET' },
    { name: 'Create FAQ Entry', endpoint: '/api/admin/faq', method: 'POST', data: { question: 'Test Q?', answer: 'Test A', category: 'test', priority: 1 } },
    { name: 'Vendor URLs List', endpoint: '/api/admin/vendor-urls', method: 'GET' },
    { name: 'Google Sheets Config', endpoint: '/api/admin/google-sheets', method: 'GET' }
  ],
  'Tab 3: Document Center': [
    { name: 'List Documents', endpoint: '/api/admin/documents', method: 'GET' },
    { name: 'Document Statistics', endpoint: '/api/admin/documents/stats', method: 'GET' },
    { name: 'Folder Management', endpoint: '/api/admin/folders', method: 'GET' },
    { name: 'Document Upload Status', endpoint: '/api/admin/documents/upload-status', method: 'GET' }
  ],
  'Tab 4: Content Quality': [
    { name: 'Content Quality Stats', endpoint: '/api/admin/content-quality', method: 'GET' },
    { name: 'Flagged Chunks', endpoint: '/api/admin/content-quality/flagged', method: 'GET' },
    { name: 'Quality Analysis', endpoint: '/api/admin/content-quality/analysis', method: 'GET' }
  ],
  'Tab 5: Advanced OCR': [
    { name: 'OCR Status', endpoint: '/api/admin/ocr/status', method: 'GET' },
    { name: 'OCR Queue', endpoint: '/api/admin/ocr/queue', method: 'GET' },
    { name: 'OCR Statistics', endpoint: '/api/admin/ocr/stats', method: 'GET' }
  ],
  'Tab 6: Chat & AI Training': [
    { name: 'Chat Monitoring', endpoint: '/api/admin/chat-monitoring', method: 'GET' },
    { name: 'Training Analytics', endpoint: '/api/admin/training-analytics', method: 'GET' },
    { name: 'AI Simulator Test', endpoint: '/api/admin/ai-simulator/test', method: 'POST', data: { query: 'Test query' } },
    { name: 'Live Chats', endpoint: '/api/admin/live-chats', method: 'GET' }
  ],
  'Tab 7: System Monitor': [
    { name: 'System Health', endpoint: '/api/admin/system/health', method: 'GET' },
    { name: 'Active Sessions', endpoint: '/api/admin/sessions', method: 'GET' },
    { name: 'Usage Analytics', endpoint: '/api/admin/usage-analytics', method: 'GET' },
    { name: 'User Activity', endpoint: '/api/admin/user-activity', method: 'GET' }
  ],
  'Tab 8: Settings': [
    { name: 'AI Configuration', endpoint: '/api/admin/ai-config', method: 'GET' },
    { name: 'User Management', endpoint: '/api/admin/users', method: 'GET' },
    { name: 'System Settings', endpoint: '/api/admin/settings', method: 'GET' },
    { name: 'API Usage Stats', endpoint: '/api/admin/api-usage', method: 'GET' }
  ]
};

async function makeRequest(endpoint, method = 'GET', data = null) {
  const { execSync } = require('child_process');
  
  let command = `curl -X ${method} "${BASE_URL}${endpoint}" -H "Cookie: ${ADMIN_COOKIE}" -H "Content-Type: application/json"`;
  
  if (data && method !== 'GET') {
    command += ` -d '${JSON.stringify(data)}'`;
  }
  
  command += ' -w "\\nHTTP_STATUS:%{http_code}\\nTIME:%{time_total}s\\n" -s';
  
  try {
    const result = execSync(command, { encoding: 'utf8', timeout: 10000 });
    const lines = result.split('\n');
    const statusLine = lines.find(line => line.startsWith('HTTP_STATUS:'));
    const timeLine = lines.find(line => line.startsWith('TIME:'));
    
    const status = statusLine ? statusLine.split(':')[1] : 'unknown';
    const time = timeLine ? timeLine.split(':')[1] : 'unknown';
    const response = lines.filter(line => !line.startsWith('HTTP_STATUS:') && !line.startsWith('TIME:')).join('\n').trim();
    
    return { status, time, response };
  } catch (error) {
    return { status: 'error', time: 'timeout', response: error.message };
  }
}

async function runTests() {
  console.log('🧪 JACC Admin Panel Comprehensive Functionality Test');
  console.log('='.repeat(60));
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    details: {}
  };
  
  for (const [category, categoryTests] of Object.entries(tests)) {
    console.log(`\n📋 ${category}`);
    console.log('-'.repeat(40));
    
    results.details[category] = { passed: 0, failed: 0, tests: [] };
    
    for (const test of categoryTests) {
      results.total++;
      console.log(`Testing: ${test.name}...`);
      
      const result = await makeRequest(test.endpoint, test.method, test.data);
      const passed = ['200', '201', '202'].includes(result.status);
      
      if (passed) {
        results.passed++;
        results.details[category].passed++;
        console.log(`  ✅ PASS - Status: ${result.status}, Time: ${result.time}`);
      } else {
        results.failed++;
        results.details[category].failed++;
        console.log(`  ❌ FAIL - Status: ${result.status}, Time: ${result.time}`);
        if (result.response) {
          console.log(`     Response: ${result.response.substring(0, 100)}...`);
        }
      }
      
      results.details[category].tests.push({
        name: test.name,
        endpoint: test.endpoint,
        method: test.method,
        status: result.status,
        time: result.time,
        passed
      });
    }
  }
  
  // Summary Report
  console.log('\n📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed} (${Math.round(results.passed/results.total*100)}%)`);
  console.log(`Failed: ${results.failed} (${Math.round(results.failed/results.total*100)}%)`);
  
  console.log('\n📋 BY CATEGORY:');
  for (const [category, stats] of Object.entries(results.details)) {
    const total = stats.passed + stats.failed;
    const passRate = Math.round(stats.passed/total*100);
    console.log(`  ${category}: ${stats.passed}/${total} (${passRate}%)`);
  }
  
  // Save detailed results
  fs.writeFileSync('admin-test-results.json', JSON.stringify(results, null, 2));
  console.log('\n💾 Detailed results saved to admin-test-results.json');
  
  // Button and UI interaction tests
  console.log('\n🖱️  UI INTERACTION TESTS');
  console.log('='.repeat(60));
  console.log('Testing critical UI components...');
  
  const uiTests = [
    'F35 System Health Monitor refresh button',
    'FAQ creation form submission',
    'Document upload interface',
    'Chat simulation test button',
    'Settings save button',
    'Tab navigation functionality',
    'Real-time status indicators',
    'Performance metrics refresh'
  ];
  
  uiTests.forEach((test, index) => {
    console.log(`${index + 1}. ${test} - Manual verification required`);
  });
  
  return results;
}

// Run the tests
if (require.main === module) {
  runTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  }).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests };