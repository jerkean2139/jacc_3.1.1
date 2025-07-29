// Comprehensive API Routing Fix - System-wide JSON Response Validation
import fetch from 'node-fetch';

async function validateApiRouting() {
  console.log('🔧 COMPREHENSIVE API ROUTING VALIDATION');
  console.log('======================================\n');

  // Create a working session for authenticated endpoints
  console.log('🔑 Creating authentication session...');
  const loginResponse = await fetch('http://localhost:5000/api/auth/simple-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  
  const cookies = loginResponse.headers.get('set-cookie');
  const sessionId = cookies?.match(/sessionId=([^;]+)/)?.[1];
  console.log(`✅ Session created: ${sessionId}\n`);

  // Test all critical API endpoints
  const testEndpoints = [
    // Authentication endpoints
    { path: '/api/user', method: 'GET', headers: { Cookie: `sessionId=${sessionId}` } },
    { path: '/api/logout', method: 'POST', headers: { Cookie: `sessionId=${sessionId}` } },
    
    // Core data endpoints
    { path: '/api/folders', method: 'GET', headers: {} },
    { path: '/api/documents', method: 'GET', headers: {} },
    { path: '/api/chats', method: 'GET', headers: { Cookie: `sessionId=${sessionId}` } },
    
    // Admin endpoints
    { path: '/api/admin/ai-config', method: 'GET', headers: { Cookie: `sessionId=${sessionId}` } },
    { path: '/api/admin/performance', method: 'GET', headers: { Cookie: `sessionId=${sessionId}` } },
    { path: '/api/admin/settings', method: 'GET', headers: { Cookie: `sessionId=${sessionId}` } },
    
    // FAQ and knowledge base
    { path: '/api/faq-knowledge-base', method: 'GET', headers: {} },
    
    // Health check
    { path: '/health', method: 'GET', headers: {} },
    
    // Non-existent endpoint (should return 404 JSON)
    { path: '/api/nonexistent-test-endpoint', method: 'GET', headers: {} }
  ];

  console.log('🧪 Testing API endpoints for JSON responses...\n');
  
  let passCount = 0;
  let failCount = 0;
  
  for (const endpoint of testEndpoints) {
    try {
      const response = await fetch(`http://localhost:5000${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...endpoint.headers
        }
      });
      
      const contentType = response.headers.get('content-type') || '';
      const responseText = await response.text();
      
      // Check if response is JSON
      let isJson = false;
      let jsonData = null;
      
      try {
        jsonData = JSON.parse(responseText);
        isJson = true;
      } catch (e) {
        isJson = false;
      }
      
      const isHtml = responseText.trim().startsWith('<!DOCTYPE html>') || 
                     responseText.trim().startsWith('<html');
      
      if (isJson && !isHtml) {
        console.log(`✅ ${endpoint.method} ${endpoint.path} - JSON (${response.status})`);
        passCount++;
      } else {
        console.log(`❌ ${endpoint.method} ${endpoint.path} - ${isHtml ? 'HTML' : 'OTHER'} (${response.status})`);
        console.log(`   Content-Type: ${contentType}`);
        console.log(`   Response: ${responseText.substring(0, 100)}...`);
        failCount++;
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint.method} ${endpoint.path} - ERROR: ${error.message}`);
      failCount++;
    }
  }
  
  console.log(`\n📊 VALIDATION RESULTS:`);
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📋 Total: ${testEndpoints.length}`);
  
  if (failCount === 0) {
    console.log('\n🎉 ALL API ENDPOINTS RETURN JSON CORRECTLY!');
    return { success: true, passed: passCount, failed: failCount };
  } else {
    console.log('\n⚠️ Some API endpoints still return HTML instead of JSON');
    console.log('This indicates the Vite middleware is still catching API routes');
    return { success: false, passed: passCount, failed: failCount };
  }
}

// Run the validation
validateApiRouting().then(result => {
  if (result.success) {
    console.log('\n🚀 API routing system is working correctly!');
  } else {
    console.log('\n🔧 Additional routing fixes needed for complete JSON compliance');
  }
});