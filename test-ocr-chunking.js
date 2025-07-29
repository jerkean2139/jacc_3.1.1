#!/usr/bin/env node

// Comprehensive OCR and Chunking Test Script
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './server/db.js';
import { documents, documentChunks } from './shared/schema.js';
import { eq } from 'drizzle-orm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class OCRChunkingTest {
  constructor() {
    this.uploadsDir = path.join(__dirname, 'uploads');
    this.testResults = {
      total: 0,
      processed: 0,
      failed: 0,
      chunksCreated: 0,
      errors: []
    };
  }

  async runTests() {
    console.log('🔍 Starting OCR and Chunking Review...\n');
    
    try {
      // Test 1: Check uploaded files
      await this.testUploadedFiles();
      
      // Test 2: Check database documents
      await this.testDatabaseDocuments();
      
      // Test 3: Test chunking algorithms
      await this.testChunkingAlgorithms();
      
      // Test 4: Check OCR capabilities
      await this.testOCRCapabilities();
      
      // Test 5: Verify chunk storage
      await this.testChunkStorage();
      
      this.printResults();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }

  async testUploadedFiles() {
    console.log('📁 Testing uploaded files...');
    
    if (!fs.existsSync(this.uploadsDir)) {
      console.log('❌ Uploads directory does not exist');
      return;
    }
    
    const files = fs.readdirSync(this.uploadsDir);
    console.log(`Found ${files.length} uploaded files`);
    
    for (const file of files.slice(0, 5)) { // Test first 5 files
      const filePath = path.join(this.uploadsDir, file);
      const stats = fs.statSync(filePath);
      
      console.log(`  📄 ${file} (${(stats.size / 1024).toFixed(1)}KB)`);
      
      // Test file accessibility
      try {
        const buffer = fs.readFileSync(filePath);
        console.log(`    ✅ File readable: ${buffer.length} bytes`);
        this.testResults.processed++;
      } catch (error) {
        console.log(`    ❌ File read error: ${error.message}`);
        this.testResults.failed++;
        this.testResults.errors.push(`File read: ${file} - ${error.message}`);
      }
      
      this.testResults.total++;
    }
  }

  async testDatabaseDocuments() {
    console.log('\n📊 Testing database documents...');
    
    try {
      const dbDocuments = await db.select().from(documents).limit(10);
      console.log(`Found ${dbDocuments.length} documents in database`);
      
      for (const doc of dbDocuments) {
        console.log(`  📄 ${doc.title || doc.name} (${doc.contentType})`);
        
        // Check if file exists
        if (doc.filePath) {
          const exists = fs.existsSync(doc.filePath);
          console.log(`    📁 File path: ${exists ? '✅ exists' : '❌ missing'} - ${doc.filePath}`);
        }
        
        // Check text content
        if (doc.content) {
          const wordCount = doc.content.split(/\s+/).length;
          console.log(`    📝 Content: ${wordCount} words`);
        } else {
          console.log(`    📝 Content: ❌ No extracted text`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Database query error: ${error.message}`);
      this.testResults.errors.push(`Database query: ${error.message}`);
    }
  }

  async testChunkingAlgorithms() {
    console.log('\n🧩 Testing chunking algorithms...');
    
    const testText = `
    Merchant processing rates vary significantly across different payment processors. 
    The interchange rate is set by card networks like Visa and MasterCard. 
    Assessment fees are additional charges imposed by card networks.
    Authorization fees apply to each transaction processed.
    Monthly fees include gateway costs and statement fees.
    PCI compliance is mandatory for all merchants processing card payments.
    `;
    
    try {
      // Test basic chunking
      const basicChunks = this.basicChunkText(testText, 200);
      console.log(`  📝 Basic chunking: ${basicChunks.length} chunks`);
      basicChunks.forEach((chunk, i) => {
        console.log(`    Chunk ${i + 1}: ${chunk.length} chars`);
      });
      
      this.testResults.chunksCreated += basicChunks.length;
      
      // Test sentence-boundary chunking
      const sentenceChunks = this.sentenceBoundaryChunk(testText, 150);
      console.log(`  📝 Sentence boundary: ${sentenceChunks.length} chunks`);
      sentenceChunks.forEach((chunk, i) => {
        console.log(`    Chunk ${i + 1}: ${chunk.content.length} chars`);
      });
      
      this.testResults.chunksCreated += sentenceChunks.length;
      
    } catch (error) {
      console.log(`❌ Chunking test error: ${error.message}`);
      this.testResults.errors.push(`Chunking: ${error.message}`);
    }
  }

  async testOCRCapabilities() {
    console.log('\n🔍 Testing OCR capabilities...');
    
    try {
      // Check for required OCR dependencies
      const dependencies = ['pdf-parse', 'tesseract.js', 'pdf2pic'];
      
      for (const dep of dependencies) {
        try {
          await import(dep);
          console.log(`  ✅ ${dep} available`);
        } catch (error) {
          console.log(`  ❌ ${dep} not available: ${error.message}`);
          this.testResults.errors.push(`OCR dependency: ${dep} missing`);
        }
      }
      
      // Test PDF processing if available
      try {
        const pdfParse = await import('pdf-parse');
        console.log('  📄 PDF parsing capability: ✅ Available');
        
        // Find a PDF file to test
        const pdfFiles = fs.readdirSync(this.uploadsDir).filter(f => f.endsWith('.pdf'));
        if (pdfFiles.length > 0) {
          const testPdfPath = path.join(this.uploadsDir, pdfFiles[0]);
          const buffer = fs.readFileSync(testPdfPath);
          
          try {
            const result = await pdfParse.default(buffer);
            console.log(`    📄 Test PDF extraction: ${result.text.length} chars, ${result.numpages} pages`);
          } catch (parseError) {
            console.log(`    ❌ PDF parse error: ${parseError.message}`);
          }
        }
        
      } catch (error) {
        console.log(`  📄 PDF parsing: ❌ Not available`);
      }
      
    } catch (error) {
      console.log(`❌ OCR test error: ${error.message}`);
      this.testResults.errors.push(`OCR test: ${error.message}`);
    }
  }

  async testChunkStorage() {
    console.log('\n💾 Testing chunk storage...');
    
    try {
      const chunks = await db.select().from(documentChunks).limit(10);
      console.log(`Found ${chunks.length} chunks in database`);
      
      if (chunks.length > 0) {
        for (const chunk of chunks.slice(0, 3)) {
          console.log(`  🧩 Chunk ${chunk.chunkIndex}: ${chunk.content?.length || 0} chars`);
          if (chunk.metadata) {
            console.log(`    📊 Metadata: ${Object.keys(chunk.metadata).join(', ')}`);
          }
        }
      } else {
        console.log('  ⚠️  No chunks found - documents may not be processed yet');
      }
      
    } catch (error) {
      console.log(`❌ Chunk storage test error: ${error.message}`);
      this.testResults.errors.push(`Chunk storage: ${error.message}`);
    }
  }

  basicChunkText(text, maxSize) {
    const chunks = [];
    let current = '';
    
    const words = text.split(/\s+/);
    for (const word of words) {
      if (current.length + word.length > maxSize && current.length > 0) {
        chunks.push(current.trim());
        current = word + ' ';
      } else {
        current += word + ' ';
      }
    }
    
    if (current.trim()) {
      chunks.push(current.trim());
    }
    
    return chunks;
  }

  sentenceBoundaryChunk(text, maxSize) {
    const chunks = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let current = '';
    let chunkIndex = 0;
    
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (current.length + trimmed.length > maxSize && current.length > 0) {
        chunks.push({
          index: chunkIndex++,
          content: current.trim(),
          length: current.trim().length
        });
        current = trimmed + '. ';
      } else {
        current += trimmed + '. ';
      }
    }
    
    if (current.trim()) {
      chunks.push({
        index: chunkIndex,
        content: current.trim(),
        length: current.trim().length
      });
    }
    
    return chunks;
  }

  printResults() {
    console.log('\n📋 OCR and Chunking Test Results');
    console.log('═'.repeat(50));
    console.log(`Total files tested: ${this.testResults.total}`);
    console.log(`Successfully processed: ${this.testResults.processed}`);
    console.log(`Failed: ${this.testResults.failed}`);
    console.log(`Chunks created: ${this.testResults.chunksCreated}`);
    console.log(`Errors encountered: ${this.testResults.errors.length}`);
    
    if (this.testResults.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.testResults.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }
    
    const successRate = this.testResults.total > 0 
      ? ((this.testResults.processed / this.testResults.total) * 100).toFixed(1)
      : 0;
    
    console.log(`\n📊 Success Rate: ${successRate}%`);
    
    if (successRate >= 80) {
      console.log('✅ OCR and chunking functionality appears to be working well');
    } else if (successRate >= 50) {
      console.log('⚠️  OCR and chunking functionality has some issues');
    } else {
      console.log('❌ OCR and chunking functionality needs significant attention');
    }
  }
}

// Run the test
const test = new OCRChunkingTest();
test.runTests().catch(console.error);