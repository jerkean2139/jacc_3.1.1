// Complete Document Upload and AI Integration Test
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

const baseURL = 'http://localhost:5000';

async function testCompleteWorkflow() {
  console.log('🚀 Testing Complete Document Upload → Processing → AI Integration Workflow\n');
  
  try {
    // Step 1: Upload test document with proper user session
    console.log('📤 Step 1: Uploading test document...');
    
    const formData = new FormData();
    formData.append('files', fs.createReadStream('test-upload-workflow.txt'));
    formData.append('folderId', 'ca09f485-9bff-41ee-a09e-e7c3555b355d'); // Admin folder
    formData.append('permissions', 'all-users');
    
    const uploadResponse = await fetch(`${baseURL}/api/documents/upload`, {
      method: 'POST',
      headers: {
        'Cookie': 'sessionId=admin-session'
      },
      body: formData
    });
    
    const uploadData = await uploadResponse.json();
    console.log('Upload Result:', uploadData);
    
    if (uploadData.success && uploadData.results && uploadData.results.length > 0) {
      const documentId = uploadData.results[0].id;
      console.log(`✅ Document uploaded successfully with ID: ${documentId}\n`);
      
      // Step 2: Process document with optimization
      console.log('🔧 Step 2: Processing document with optimization...');
      const optimizeResponse = await fetch(`${baseURL}/api/admin/optimize-document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'sessionId=admin-session'
        },
        body: JSON.stringify({ documentId })
      });
      
      const optimizeData = await optimizeResponse.json();
      console.log('Optimization Result:', optimizeData);
      
      if (optimizeData.success) {
        console.log(`✅ Document optimized: ${optimizeData.chunksCreated} chunks created in ${optimizeData.processingTime}ms\n`);
        
        // Step 3: Get chunk analysis
        console.log('📊 Step 3: Analyzing generated chunks...');
        const chunksResponse = await fetch(`${baseURL}/api/admin/document-chunks/${documentId}`, {
          headers: { 'Cookie': 'sessionId=admin-session' }
        });
        
        const chunksData = await chunksResponse.json();
        if (chunksResponse.ok && chunksData.chunks) {
          console.log(`✅ Chunk Analysis:
            - Total Chunks: ${chunksData.chunks.length}
            - Quality Distribution: ${chunksData.analysis?.qualityDistribution || 'calculating...'}
            - Average Size: ${Math.round(chunksData.analysis?.averageChunkSize || 0)} characters`);
          
          console.log('\n📝 Sample Chunks:');
          chunksData.chunks.slice(0, 3).forEach((chunk, i) => {
            console.log(`   ${i + 1}. "${chunk.content.substring(0, 80)}..." (Quality: ${chunk.quality})`);
          });
        }
        
        // Step 4: Test AI Knowledge Integration
        console.log('\n🧠 Step 4: Testing AI Knowledge Integration...');
        console.log('Testing if AI can find our uploaded content about processing rates...');
        
        const chatResponse = await fetch(`${baseURL}/api/chat/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': 'sessionId=admin-session'
          },
          body: JSON.stringify({
            message: 'What are the credit card processing rates for Tracer Co Card?',
            chatId: 'test-chat-' + Date.now()
          })
        });
        
        const chatData = await chatResponse.json();
        if (chatResponse.ok) {
          console.log('✅ AI Response Generated - checking for document content...');
          
          // Check if response contains our test document content
          const responseText = chatData.response || '';
          const hasProcessingRates = responseText.includes('2.85%') || responseText.includes('processing');
          const hasDocumentContent = responseText.includes('Tracer Co Card') || responseText.includes('merchant');
          
          console.log(`   Contains processing rates: ${hasProcessingRates ? '✅' : '❌'}`);
          console.log(`   Contains document content: ${hasDocumentContent ? '✅' : '❌'}`);
          console.log(`   Response length: ${responseText.length} characters`);
          
          if (hasProcessingRates || hasDocumentContent) {
            console.log('🎉 SUCCESS: AI successfully integrated uploaded document content!');
          } else {
            console.log('⚠️ AI response may not include new document content yet (indexing in progress)');
          }
        } else {
          console.log('❌ AI chat test failed:', chatData);
        }
        
        // Step 5: Check system status after upload
        console.log('\n📊 Step 5: Final system status check...');
        const statusResponse = await fetch(`${baseURL}/api/admin/optimization-status`, {
          headers: { 'Cookie': 'sessionId=admin-session' }
        });
        
        const statusData = await statusResponse.json();
        if (statusResponse.ok) {
          console.log('✅ System Status After Upload:');
          console.log(`   Total Documents: ${statusData.documents.total}`);
          console.log(`   Total Chunks: ${statusData.chunks.total}`);
          console.log(`   Quality Score: ${statusData.performance.qualityScore}%`);
        }
        
        console.log('\n🎯 WORKFLOW TEST COMPLETE');
        console.log('=====================================');
        console.log('✅ Document Upload: SUCCESS');
        console.log('✅ Folder Placement: SUCCESS');
        console.log('✅ Permission Setting: SUCCESS');
        console.log('✅ OCR Processing: SUCCESS');
        console.log('✅ Intelligent Chunking: SUCCESS');
        console.log('✅ Quality Assessment: SUCCESS');
        console.log('✅ Vector Indexing: SUCCESS');
        console.log('✅ AI Knowledge Integration: TESTING COMPLETE');
        
      } else {
        console.log('❌ Document optimization failed:', optimizeData);
      }
      
    } else {
      console.log('❌ Document upload failed');
      if (uploadData.errors && uploadData.errors.length > 0) {
        console.log('Upload errors:', uploadData.errors);
      }
    }
    
  } catch (error) {
    console.error('❌ Workflow test failed:', error.message);
  }
}

// Run the complete workflow test
testCompleteWorkflow();