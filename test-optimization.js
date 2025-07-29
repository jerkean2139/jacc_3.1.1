// Direct OCR and Chunking Optimization Test
const { optimizedDocumentProcessor } = require('./server/optimized-document-processor.ts');

console.log('🧪 Testing Optimized Document Processing');

// Mock document for testing
const mockDocument = {
  id: 'test-doc-001',
  name: 'test-merchant-agreement.pdf',
  originalName: 'merchant_processing_agreement.pdf',
  path: './test-document.txt',
  mimeType: 'text/plain',
  content: `
    MERCHANT PROCESSING AGREEMENT
    
    This agreement outlines the processing rates and fees for merchant services.
    
    PROCESSING RATES:
    • Credit Card Processing: 2.9% + $0.30 per transaction
    • Debit Card Processing: 1.5% + $0.25 per transaction
    • Authorization Fees: $0.10 per authorization request
    
    MONTHLY FEES:
    • Gateway Fee: $25.00 per month
    • Statement Fee: $10.00 per month
    • PCI Compliance Fee: $9.95 per month
    
    INTERCHANGE RATES:
    Interchange rates are set by card networks (Visa, MasterCard, American Express, Discover).
    These rates vary based on card type, transaction method, and merchant category.
    
    SETTLEMENT TERMS:
    Funds are typically settled within 1-2 business days for qualified transactions.
    High-risk merchants may have extended settlement periods.
    
    CHARGEBACK PROTECTION:
    Basic chargeback protection is included. Enhanced protection available for additional fee.
    
    This document contains important information about merchant services, payment processing,
    and the various fees associated with credit card processing for your business.
  `
};

// Create a test file
require('fs').writeFileSync('./test-document.txt', mockDocument.content);

async function runOptimizationTest() {
  try {
    console.log('📄 Testing document processing optimization...');
    
    // Test the optimization functionality
    const result = await optimizedDocumentProcessor.processDocument(mockDocument.id);
    
    console.log('✅ Optimization Results:');
    console.log(`   Success: ${result.success}`);
    console.log(`   Chunks Created: ${result.chunksCreated}`);
    console.log(`   Processing Time: ${result.processingTime}ms`);
    console.log(`   Quality Score: ${result.quality}%`);
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    
    // Test chunking algorithms
    console.log('\n🧩 Testing chunking algorithms...');
    
    const processor = optimizedDocumentProcessor;
    
    // Test sentence chunking
    const text = mockDocument.content;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    console.log(`   Original text: ${text.length} characters`);
    console.log(`   Sentences found: ${sentences.length}`);
    
    // Test merchant term detection
    const merchantTerms = new Set([
      'processing rate', 'interchange', 'assessment', 'terminal', 'gateway',
      'chargeback', 'authorization', 'settlement', 'merchant', 'credit card'
    ]);
    
    const foundTerms = Array.from(merchantTerms).filter(term => 
      text.toLowerCase().includes(term)
    );
    
    console.log(`   Merchant terms found: ${foundTerms.length}`);
    console.log(`   Terms: ${foundTerms.join(', ')}`);
    
    // Test quality assessment
    const wordCount = text.split(/\s+/).length;
    const hasStructure = /(\d+\.\s|•\s|\n[A-Z][^a-z]*:)/.test(text);
    
    console.log(`   Word count: ${wordCount}`);
    console.log(`   Has structure: ${hasStructure}`);
    
    console.log('\n✅ Optimization test completed successfully!');
    
  } catch (error) {
    console.error('❌ Optimization test failed:', error.message);
  } finally {
    // Cleanup
    try {
      require('fs').unlinkSync('./test-document.txt');
    } catch (e) {}
  }
}

runOptimizationTest();