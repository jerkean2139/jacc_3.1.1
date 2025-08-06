// Quick OCR test script
const path = require('path');
const fs = require('fs').promises;

async function testOCR() {
  try {
    // Import the OCR service
    const { AdvancedOCRService } = await import('./advanced-ocr-service.js');
    const ocrService = AdvancedOCRService.getInstance();
    
    // Create a test text file
    const testFile = '/tmp/ocr-test.txt';
    await fs.writeFile(testFile, 'This is a test document for OCR processing.\nIt contains sample text to verify the system works.');
    
    console.log('Testing OCR with text file...');
    const result = await ocrService.extractWithMultipleEngines(testFile);
    
    console.log('OCR Result:');
    console.log('Text:', result.text);
    console.log('Method:', result.method);
    console.log('Confidence:', result.confidence);
    console.log('Words:', result.processedWords);
    console.log('Improvements:', result.improvements);
    
  } catch (error) {
    console.error('OCR test failed:', error.message);
  }
}

testOCR();