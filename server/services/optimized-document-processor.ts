import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Worker } from 'worker_threads';
import { storage } from '../storage';
import { pineconeVectorService } from './pinecone-vector';
import { db } from '../db';
import { documentChunks, documents } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface OptimizedChunk {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  tokens: number;
  semanticScore: number;
  keyTerms: string[];
  metadata: {
    documentName: string;
    originalName: string;
    mimeType: string;
    startChar: number;
    endChar: number;
    processingTime: number;
    quality: 'high' | 'medium' | 'low';
  };
}

interface ProcessingResult {
  success: boolean;
  documentId: string;
  chunksCreated: number;
  processingTime: number;
  quality: number;
  error?: string;
}

export class OptimizedDocumentProcessor {
  private readonly maxConcurrency = 3;
  private readonly merchantTerms = new Set([
    'processing rate', 'interchange', 'assessment', 'terminal', 'gateway',
    'chargeback', 'authorization', 'settlement', 'underwriting', 'PCI',
    'EMV', 'contactless', 'mobile payment', 'e-commerce', 'card present',
    'card not present', 'risk management', 'fraud prevention', 'ISO',
    'merchant account', 'acquirer', 'processor', 'payment facilitator',
    'merchant services', 'credit card', 'debit card', 'transaction fee'
  ]);

  constructor() {
    console.log('🚀 Initialized Optimized Document Processor');
  }

  async processDocument(documentId: string): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      console.log(`📄 Processing document ${documentId} with optimization...`);
      
      // Get document from database
      const document = await storage.getDocument(documentId);
      if (!document) {
        throw new Error(`Document ${documentId} not found`);
      }

      // Enhanced text extraction with caching
      const textContent = await this.extractTextWithCache(document);
      
      if (!textContent || textContent.trim().length < 50) {
        console.log(`⚠️ Insufficient content for document ${document.originalName}`);
        return {
          success: false,
          documentId,
          chunksCreated: 0,
          processingTime: Date.now() - startTime,
          quality: 0,
          error: 'Insufficient content'
        };
      }

      // Intelligent chunking with quality scoring
      const chunks = await this.intelligentChunking(textContent, document);
      
      // Parallel processing for vectorization and storage
      await this.parallelVectorizeAndStore(chunks);
      
      const processingTime = Date.now() - startTime;
      const quality = this.calculateProcessingQuality(chunks, textContent);
      
      console.log(`✅ Successfully processed ${chunks.length} chunks for ${document.originalName} (${processingTime}ms)`);
      
      return {
        success: true,
        documentId,
        chunksCreated: chunks.length,
        processingTime,
        quality
      };
      
    } catch (error) {
      console.error(`❌ Error processing document ${documentId}:`, error);
      return {
        success: false,
        documentId,
        chunksCreated: 0,
        processingTime: Date.now() - startTime,
        quality: 0,
        error: error.message
      };
    }
  }

  private async extractTextWithCache(document: any): Promise<string> {
    const cacheKey = this.generateCacheKey(document);
    
    // Check if we already have content
    if (document.content && document.content.length > 0) {
      console.log(`📄 Using cached content for ${document.originalName}`);
      return document.content;
    }

    console.log(`🔍 Extracting text from ${document.originalName} (${document.mimeType})`);
    
    try {
      // Enhanced extraction based on file type
      let extractedText = '';
      
      if (document.mimeType === 'application/pdf') {
        extractedText = await this.extractFromPDF(document.path);
      } else if (document.mimeType.includes('wordprocessingml')) {
        extractedText = await this.extractFromWord(document.path);
      } else if (document.mimeType.includes('text/') || document.mimeType.includes('csv')) {
        extractedText = fs.readFileSync(document.path, 'utf8');
      } else {
        extractedText = await this.fallbackExtraction(document.path, document.mimeType);
      }

      // Clean and enhance extracted text
      extractedText = this.cleanExtractedText(extractedText);
      
      // Update document with extracted content
      if (extractedText.length > 0) {
        await this.updateDocumentContent(document.id, extractedText);
      }
      
      return extractedText;
      
    } catch (error) {
      console.error(`Error extracting text from ${document.path}:`, error);
      return '';
    }
  }

  private async extractFromPDF(filePath: string): Promise<string> {
    try {
      // Primary: Use pdf-parse for digital PDFs
      const pdfParse = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const result = await pdfParse(dataBuffer);
      
      // If text extraction is poor, try OCR
      if (result.text.length < 100 || this.isScannedPDF(result.text)) {
        console.log('📸 PDF appears to be scanned, attempting OCR...');
        return await this.extractWithOCR(filePath);
      }
      
      return result.text;
    } catch (error) {
      console.log('📸 PDF parsing failed, trying OCR fallback...');
      return await this.extractWithOCR(filePath);
    }
  }

  private async extractFromWord(filePath: string): Promise<string> {
    try {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      console.error('Word extraction failed:', error);
      return '';
    }
  }

  private async extractWithOCR(filePath: string): Promise<string> {
    try {
      // Convert PDF pages to images
      const { fromPath } = require('pdf2pic');
      const convert = fromPath(filePath, {
        density: 200,
        saveFilename: "ocr_page",
        savePath: "./temp/",
        format: "png"
      });

      const results = await convert.bulk(-1); // All pages
      let extractedText = '';

      // Process each page with Tesseract
      for (const result of results) {
        if (result && result.path) {
          try {
            const { createWorker } = require('tesseract.js');
            const worker = await createWorker();
            
            await worker.loadLanguage('eng');
            await worker.initialize('eng');
            
            const { data: { text } } = await worker.recognize(result.path);
            extractedText += text + '\n\n';
            
            await worker.terminate();
            
            // Cleanup image file
            if (fs.existsSync(result.path)) {
              fs.unlinkSync(result.path);
            }
          } catch (ocrError) {
            console.error('OCR processing failed for page:', ocrError);
          }
        }
      }

      return extractedText;
    } catch (error) {
      console.error('OCR extraction failed:', error);
      return '';
    }
  }

  private isScannedPDF(text: string): boolean {
    // Heuristics to detect scanned PDFs
    const wordCount = text.split(/\s+/).length;
    const charCount = text.length;
    const avgWordLength = charCount / wordCount;
    
    // Very short text or unusual character patterns suggest scanned content
    return wordCount < 50 || avgWordLength < 2 || /[^\w\s.,!?-]/.test(text.slice(0, 100));
  }

  private cleanExtractedText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s{2,}/g, ' ')
      .replace(/[^\w\s.,!?;:()\-$%]/g, ' ')
      .trim();
  }

  private async intelligentChunking(text: string, document: any): Promise<OptimizedChunk[]> {
    const chunks: OptimizedChunk[] = [];
    
    // Analyze document for optimal chunking strategy
    const strategy = this.determineChunkingStrategy(text);
    
    console.log(`🧩 Using ${strategy.type} chunking for ${document.originalName}`);
    
    switch (strategy.type) {
      case 'semantic':
        return await this.semanticChunking(text, document, strategy);
      case 'paragraph':
        return await this.paragraphChunking(text, document, strategy);
      default:
        return await this.sentenceChunking(text, document, strategy);
    }
  }

  private determineChunkingStrategy(text: string): any {
    const wordCount = text.split(/\s+/).length;
    const paragraphCount = text.split(/\n\s*\n/).length;
    const sentenceCount = text.split(/[.!?]+/).length;
    
    // Merchant services documents often have structured content
    const hasStructure = /(\d+\.\s|•\s|\n[A-Z][^a-z]*:|\n#{1,3}\s)/.test(text);
    const hasMerchantTerms = Array.from(this.merchantTerms).some(term => 
      text.toLowerCase().includes(term)
    );
    
    if (hasStructure && hasMerchantTerms && wordCount > 1000) {
      return { type: 'semantic', maxSize: 800, overlap: 100 };
    } else if (paragraphCount > 5 && wordCount > 500) {
      return { type: 'paragraph', maxSize: 600, overlap: 50 };
    } else {
      return { type: 'sentence', maxSize: 400, overlap: 30 };
    }
  }

  private async semanticChunking(text: string, document: any, strategy: any): Promise<OptimizedChunk[]> {
    const chunks: OptimizedChunk[] = [];
    
    // Split by semantic boundaries (headers, sections, etc.)
    const sections = text.split(/\n(?=[A-Z][^a-z]*:|\d+\.\s|#{1,3}\s)/);
    
    let chunkIndex = 0;
    let charOffset = 0;
    
    for (const section of sections) {
      if (section.trim().length < 50) continue;
      
      if (section.length <= strategy.maxSize) {
        // Single chunk
        const chunk = await this.createOptimizedChunk(
          section.trim(),
          document,
          chunkIndex++,
          charOffset,
          'high'
        );
        chunks.push(chunk);
        charOffset += section.length;
      } else {
        // Split large sections
        const subChunks = await this.splitLargeSection(
          section,
          document,
          chunkIndex,
          charOffset,
          strategy
        );
        chunks.push(...subChunks);
        chunkIndex += subChunks.length;
        charOffset += section.length;
      }
    }
    
    return chunks;
  }

  private async sentenceChunking(text: string, document: any, strategy: any): Promise<OptimizedChunk[]> {
    const chunks: OptimizedChunk[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let currentChunk = '';
    let chunkIndex = 0;
    let startChar = 0;
    
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      const potentialChunk = currentChunk + (currentChunk ? '. ' : '') + trimmed;
      
      if (potentialChunk.length <= strategy.maxSize) {
        currentChunk = potentialChunk;
      } else if (currentChunk.length > 0) {
        // Create chunk
        const chunk = await this.createOptimizedChunk(
          currentChunk + '.',
          document,
          chunkIndex++,
          startChar,
          this.assessChunkQuality(currentChunk)
        );
        chunks.push(chunk);
        
        startChar += currentChunk.length;
        currentChunk = trimmed;
      }
    }
    
    // Final chunk
    if (currentChunk.length > 0) {
      const chunk = await this.createOptimizedChunk(
        currentChunk + '.',
        document,
        chunkIndex,
        startChar,
        this.assessChunkQuality(currentChunk)
      );
      chunks.push(chunk);
    }
    
    return chunks;
  }

  private async paragraphChunking(text: string, document: any, strategy: any): Promise<OptimizedChunk[]> {
    const chunks: OptimizedChunk[] = [];
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    let chunkIndex = 0;
    let charOffset = 0;
    
    for (const paragraph of paragraphs) {
      if (paragraph.length <= strategy.maxSize) {
        const chunk = await this.createOptimizedChunk(
          paragraph.trim(),
          document,
          chunkIndex++,
          charOffset,
          'medium'
        );
        chunks.push(chunk);
      } else {
        // Split large paragraphs by sentences
        const subChunks = await this.sentenceChunking(paragraph, document, strategy);
        chunks.push(...subChunks);
        chunkIndex += subChunks.length;
      }
      charOffset += paragraph.length + 2; // +2 for paragraph breaks
    }
    
    return chunks;
  }

  private async createOptimizedChunk(
    content: string,
    document: any,
    chunkIndex: number,
    startChar: number,
    quality: 'high' | 'medium' | 'low'
  ): Promise<OptimizedChunk> {
    const keyTerms = this.extractKeyTerms(content);
    const semanticScore = this.calculateSemanticScore(content, keyTerms);
    
    return {
      id: `${document.id}-chunk-${chunkIndex}`,
      documentId: document.id,
      content: content.trim(),
      chunkIndex,
      tokens: this.estimateTokens(content),
      semanticScore,
      keyTerms,
      metadata: {
        documentName: document.name,
        originalName: document.originalName,
        mimeType: document.mimeType,
        startChar,
        endChar: startChar + content.length,
        processingTime: Date.now(),
        quality
      }
    };
  }

  private extractKeyTerms(content: string): string[] {
    const words = content.toLowerCase().split(/\W+/);
    const termCounts = new Map<string, number>();
    
    // Count merchant service terms
    for (const word of words) {
      if (this.merchantTerms.has(word) || word.length > 4) {
        termCounts.set(word, (termCounts.get(word) || 0) + 1);
      }
    }
    
    // Return top terms
    return Array.from(termCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([term]) => term);
  }

  private calculateSemanticScore(content: string, keyTerms: string[]): number {
    let score = 0.5; // Base score
    
    // Boost for merchant service terms
    const merchantTermCount = keyTerms.filter(term => this.merchantTerms.has(term)).length;
    score += merchantTermCount * 0.1;
    
    // Boost for structured content
    if (/(\d+\.\s|•\s|\$\d|%\d)/.test(content)) score += 0.2;
    
    // Penalty for very short content
    if (content.length < 100) score -= 0.2;
    
    return Math.min(1, Math.max(0, score));
  }

  private assessChunkQuality(content: string): 'high' | 'medium' | 'low' {
    const wordCount = content.split(/\s+/).length;
    const merchantTerms = Array.from(this.merchantTerms).filter(term => 
      content.toLowerCase().includes(term)
    ).length;
    
    if (merchantTerms >= 2 && wordCount >= 50) return 'high';
    if (merchantTerms >= 1 || wordCount >= 30) return 'medium';
    return 'low';
  }

  private estimateTokens(text: string): number {
    // Rough token estimation (1 token ≈ 4 characters)
    return Math.ceil(text.length / 4);
  }

  private async parallelVectorizeAndStore(chunks: OptimizedChunk[]): Promise<void> {
    console.log(`🔄 Processing ${chunks.length} chunks in parallel...`);
    
    // Process chunks in batches to avoid overwhelming the system
    const batchSize = this.maxConcurrency;
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (chunk) => {
          try {
            // Store in database
            await db.insert(documentChunks).values({
              id: chunk.id,
              documentId: chunk.documentId,
              content: chunk.content,
              chunkIndex: chunk.chunkIndex,
              metadata: chunk.metadata,
              embedding: null // Will be populated by vector service
            });
            
            // Create vector embedding
            await pineconeVectorService.indexDocumentChunk({
              id: chunk.id,
              documentId: chunk.documentId,
              content: chunk.content,
              chunkIndex: chunk.chunkIndex,
              metadata: chunk.metadata
            });
            
          } catch (error) {
            console.error(`Error processing chunk ${chunk.id}:`, error);
          }
        })
      );
      
      console.log(`✅ Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`);
    }
  }

  private calculateProcessingQuality(chunks: OptimizedChunk[], originalText: string): number {
    if (chunks.length === 0) return 0;
    
    const totalChunkLength = chunks.reduce((sum, chunk) => sum + chunk.content.length, 0);
    const coverageRatio = totalChunkLength / originalText.length;
    const avgSemanticScore = chunks.reduce((sum, chunk) => sum + chunk.semanticScore, 0) / chunks.length;
    const qualityDistribution = chunks.filter(chunk => chunk.metadata.quality === 'high').length / chunks.length;
    
    return (coverageRatio * 0.4 + avgSemanticScore * 0.4 + qualityDistribution * 0.2) * 100;
  }

  private generateCacheKey(document: any): string {
    return crypto
      .createHash('md5')
      .update(`${document.id}-${document.path}-${document.mimeType}`)
      .digest('hex');
  }

  private async updateDocumentContent(documentId: string, content: string): Promise<void> {
    try {
      await db
        .update(documents)
        .set({ content, updatedAt: new Date() })
        .where(eq(documents.id, documentId));
    } catch (error) {
      console.error('Failed to update document content:', error);
    }
  }

  private async splitLargeSection(
    section: string,
    document: any,
    startIndex: number,
    charOffset: number,
    strategy: any
  ): Promise<OptimizedChunk[]> {
    // Split by sentences when section is too large
    return await this.sentenceChunking(section, document, strategy);
  }

  private async fallbackExtraction(filePath: string, mimeType: string): Promise<string> {
    // Last resort: try to read as text
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch {
      return `Document content from ${path.basename(filePath)} - Content type: ${mimeType}`;
    }
  }

  async batchProcessDocuments(documentIds: string[]): Promise<ProcessingResult[]> {
    console.log(`🚀 Starting batch processing of ${documentIds.length} documents...`);
    
    const results: ProcessingResult[] = [];
    const batchSize = this.maxConcurrency;
    
    for (let i = 0; i < documentIds.length; i += batchSize) {
      const batch = documentIds.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(id => this.processDocument(id))
      );
      
      results.push(...batchResults);
      
      console.log(`📊 Completed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(documentIds.length / batchSize)}`);
    }
    
    const successful = results.filter(r => r.success).length;
    const totalChunks = results.reduce((sum, r) => sum + r.chunksCreated, 0);
    const avgQuality = results.reduce((sum, r) => sum + r.quality, 0) / results.length;
    
    console.log(`✅ Batch processing complete: ${successful}/${documentIds.length} documents, ${totalChunks} chunks, ${avgQuality.toFixed(1)}% avg quality`);
    
    return results;
  }
}

export const optimizedDocumentProcessor = new OptimizedDocumentProcessor();