// Test the document search directly
import { UnifiedAIService } from './server/services/unified-ai-service.js';

async function testSearch() {
  const aiService = new UnifiedAIService();
  
  console.log('Testing Clover search...');
  const results = await aiService.searchDocuments('clover');
  
  console.log(`Found ${results.length} results for 'clover':`);
  results.forEach((result, i) => {
    console.log(`${i + 1}. ${result.metadata?.documentName || result.id}`);
    console.log(`   Score: ${result.score}`);
    console.log(`   Content: ${result.content.substring(0, 100)}...`);
  });

  console.log('\n\nTesting "Clover vs Square" search...');
  const results2 = await aiService.searchDocuments('Clover vs Square');
  
  console.log(`Found ${results2.length} results for 'Clover vs Square':`);
  results2.forEach((result, i) => {
    console.log(`${i + 1}. ${result.metadata?.documentName || result.id}`);
    console.log(`   Score: ${result.score}`);
    console.log(`   Content: ${result.content.substring(0, 100)}...`);
  });
}

testSearch().catch(console.error);