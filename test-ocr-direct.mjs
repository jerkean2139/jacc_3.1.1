// Direct OCR test on existing file
import { AdvancedOCRService } from './server/advanced-ocr-service.js';
import fs from 'fs/promises';
import path from 'path';

async function testOCR() {
  try {
    console.log('Testing OCR service directly...');
    const ocrService = AdvancedOCRService.getInstance();
    
    // Test with a simple text file first
    const testFile = '/home/runner/workspace/uploads/ocr-test-verification.txt';
    console.log('Processing file:', testFile);
    
    const result = await ocrService.extractWithMultipleEngines(testFile);
    
    console.log('=== OCR Result ===');
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