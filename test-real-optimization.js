// Test optimization with real documents
import fetch from 'node-fetch';

const baseURL = 'http://localhost:5000';

async function testOptimization() {
  console.log('🧪 Testing OCR and Chunking Optimization with Real Documents\n');
  
  try {
    // 1. Get optimization status
    console.log('📊 Getting optimization status...');
    const statusResponse = await fetch(`${baseURL}/api/admin/optimization-status`);
    const statusData = await statusResponse.json();
    
    if (statusResponse.ok) {
      console.log('✅ Optimization Status:');
      console.log(`   Total Documents: ${statusData.documents?.total || 0}`);
      console.log(`   With Content: ${statusData.documents?.withContent || 0}`);
      console.log(`   Processing Rate: ${statusData.documents?.processingRate || 0}%`);
      console.log(`   Total Chunks: ${statusData.chunks?.total || 0}`);
      console.log(`   Average Chunk Size: ${statusData.chunks?.averageSize || 0} chars`);
      console.log(`   Quality Score: ${statusData.performance?.qualityScore || 0}%\n`);
    } else {
      console.log('⚠️ Status check failed:', statusData.message);
    }

    // 2. Get list of documents
    console.log('📄 Getting document list...');
    const docsResponse = await fetch(`${baseURL}/api/documents`);
    const docsData = await docsResponse.json();
    
    if (docsResponse.ok && docsData.folders) {
      const allDocuments = [];
      docsData.folders.forEach(folder => {
        if (folder.documents) {
          allDocuments.push(...folder.documents);
        }
      });
      
      console.log(`✅ Found ${allDocuments.length} documents in system`);
      
      if (allDocuments.length > 0) {
        // Test optimization with first document
        const testDoc = allDocuments[0];
        console.log(`\n🔧 Testing optimization with: ${testDoc.title}`);
        console.log(`   Document ID: ${testDoc.id}`);
        console.log(`   Content Type: ${testDoc.contentType || testDoc.content_type || 'unknown'}`);
        
        const optimizeResponse = await fetch(`${baseURL}/api/admin/optimize-document`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': 'sessionId=admin-session'
          },
          body: JSON.stringify({ documentId: testDoc.id })
        });
        
        const optimizeData = await optimizeResponse.json();
        
        if (optimizeResponse.ok) {
          console.log('✅ Optimization Results:');
          console.log(`   Success: ${optimizeData.success}`);
          console.log(`   Chunks Created: ${optimizeData.chunksCreated}`);
          console.log(`   Processing Time: ${optimizeData.processingTime}ms`);
          console.log(`   Quality Score: ${optimizeData.quality}%`);
          
          if (optimizeData.chunksCreated > 0) {
            // Get chunk analysis
            console.log(`\n🧩 Getting chunk analysis for document...`);
            const chunksResponse = await fetch(`${baseURL}/api/admin/document-chunks/${testDoc.id}`);
            const chunksData = await chunksResponse.json();
            
            if (chunksResponse.ok) {
              console.log('✅ Chunk Analysis:');
              console.log(`   Total Chunks: ${chunksData.analysis?.chunkCount || 0}`);
              console.log(`   Average Size: ${Math.round(chunksData.analysis?.averageChunkSize || 0)} chars`);
              console.log(`   Quality Distribution:`);
              console.log(`     High: ${chunksData.analysis?.qualityDistribution?.high || 0}`);
              console.log(`     Medium: ${chunksData.analysis?.qualityDistribution?.medium || 0}`);
              console.log(`     Low: ${chunksData.analysis?.qualityDistribution?.low || 0}`);
              
              if (chunksData.chunks && chunksData.chunks.length > 0) {
                console.log(`\n📝 Sample Chunks:`);
                chunksData.chunks.slice(0, 3).forEach((chunk, i) => {
                  console.log(`   Chunk ${i + 1}: ${chunk.content.substring(0, 100)}...`);
                  console.log(`     Quality: ${chunk.quality}, Size: ${chunk.fullLength} chars`);
                });
              }
            } else {
              console.log('⚠️ Failed to get chunk analysis:', chunksData.message);
            }
          }
        } else {
          console.log('❌ Optimization failed:', optimizeData.error || optimizeData.message);
        }
        
        // Test batch optimization with multiple documents
        if (allDocuments.length >= 3) {
          console.log(`\n🚀 Testing batch optimization with 3 documents...`);
          const batchIds = allDocuments.slice(0, 3).map(doc => doc.id);
          
          const batchResponse = await fetch(`${baseURL}/api/admin/batch-optimize`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': 'sessionId=admin-session'
            },
            body: JSON.stringify({ documentIds: batchIds, maxDocuments: 3 })
          });
          
          const batchData = await batchResponse.json();
          
          if (batchResponse.ok) {
            console.log('✅ Batch Optimization Results:');
            console.log(`   Total Documents: ${batchData.totalDocuments}`);
            console.log(`   Successful: ${batchData.successful}`);
            console.log(`   Failed: ${batchData.failed}`);
            console.log(`   Total Chunks: ${batchData.totalChunks}`);
            console.log(`   Average Quality: ${Math.round(batchData.averageQuality)}%`);
            console.log(`   Total Processing Time: ${batchData.totalProcessingTime}ms`);
          } else {
            console.log('❌ Batch optimization failed:', batchData.error || batchData.message);
          }
        }
      }
    } else {
      console.log('⚠️ Failed to get documents:', docsData.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testOptimization();