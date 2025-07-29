import express from 'express';
import { optimizedDocumentProcessor } from './optimized-document-processor';
import { storage } from './storage';
import { db } from './db';
import { documents, documentChunks } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

export function setupOptimizationRoutes(app: express.Application) {
  // Test optimized processing endpoint
  app.post('/api/admin/optimize-document', async (req, res) => {
    try {
      const { documentId } = req.body;
      
      if (!documentId) {
        return res.status(400).json({ error: 'Document ID required' });
      }
      
      console.log(`🚀 Starting optimized processing for document: ${documentId}`);
      
      const result = await optimizedDocumentProcessor.processDocument(documentId);
      
      res.json({
        success: result.success,
        documentId: result.documentId,
        chunksCreated: result.chunksCreated,
        processingTime: result.processingTime,
        quality: result.quality,
        error: result.error
      });
      
    } catch (error) {
      console.error('Optimization error:', error);
      res.status(500).json({ 
        error: 'Optimization failed', 
        message: error.message 
      });
    }
  });

  // Batch optimize multiple documents
  app.post('/api/admin/batch-optimize', async (req, res) => {
    try {
      const { documentIds, maxDocuments = 10 } = req.body;
      
      if (!documentIds || !Array.isArray(documentIds)) {
        return res.status(400).json({ error: 'Document IDs array required' });
      }
      
      // Limit batch size for performance
      const limitedIds = documentIds.slice(0, maxDocuments);
      
      console.log(`🚀 Starting batch optimization for ${limitedIds.length} documents`);
      
      const results = await optimizedDocumentProcessor.batchProcessDocuments(limitedIds);
      
      const summary = {
        totalDocuments: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        totalChunks: results.reduce((sum, r) => sum + r.chunksCreated, 0),
        averageQuality: results.reduce((sum, r) => sum + r.quality, 0) / results.length,
        totalProcessingTime: results.reduce((sum, r) => sum + r.processingTime, 0),
        results: results
      };
      
      res.json(summary);
      
    } catch (error) {
      console.error('Batch optimization error:', error);
      res.status(500).json({ 
        error: 'Batch optimization failed', 
        message: error.message 
      });
    }
  });

  // Get optimization status and metrics
  app.get('/api/admin/optimization-status', async (req, res) => {
    try {
      // Get document counts
      const [documentStats] = await db
        .select({
          totalDocuments: sql<number>`count(*)`,
          documentsWithContent: sql<number>`count(*) filter (where path is not null)`,
          avgContentLength: sql<number>`avg(size)`
        })
        .from(documents);

      // Get chunk stats - handle if table doesn't exist yet
      let chunkStats = { totalChunks: 0, avgChunkSize: 0, highQualityChunks: 0 };
      let recentChunks = [];
      
      try {
        const [chunks] = await db
          .select({
            totalChunks: sql<number>`count(*)`,
            avgChunkSize: sql<number>`avg(length(content))`,
            highQualityChunks: sql<number>`count(*) filter (where (metadata->>'quality')::text = 'high')`
          })
          .from(documentChunks);
        chunkStats = chunks;

        // Get processing performance metrics
        recentChunks = await db
          .select({
            processingTime: sql<number>`(metadata->>'processingTime')::bigint`,
            quality: sql<string>`metadata->>'quality'`,
            documentName: sql<string>`metadata->>'documentName'`
          })
          .from(documentChunks)
          .limit(100);
      } catch (error) {
        console.log('📄 Chunks table not ready yet, showing document stats only');
      }

      const qualityDistribution = {
        high: recentChunks.filter(c => c.quality === 'high').length,
        medium: recentChunks.filter(c => c.quality === 'medium').length,
        low: recentChunks.filter(c => c.quality === 'low').length
      };

      res.json({
        documents: {
          total: documentStats.totalDocuments || 0,
          withContent: documentStats.documentsWithContent || 0,
          averageContentLength: Math.round(documentStats.avgContentLength || 0),
          processingRate: documentStats.documentsWithContent / documentStats.totalDocuments * 100
        },
        chunks: {
          total: chunkStats.totalChunks || 0,
          averageSize: Math.round(chunkStats.avgChunkSize || 0),
          highQuality: chunkStats.highQualityChunks || 0,
          qualityDistribution
        },
        performance: {
          recentSamples: recentChunks.length,
          qualityScore: (qualityDistribution.high * 3 + qualityDistribution.medium * 2 + qualityDistribution.low) / 
                      (recentChunks.length * 3) * 100
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Status check error:', error);
      res.status(500).json({ 
        error: 'Failed to get optimization status', 
        message: error.message 
      });
    }
  });

  // Get chunk analysis for a specific document
  app.get('/api/admin/document-chunks/:documentId', async (req, res) => {
    try {
      const { documentId } = req.params;
      
      const chunks = await db
        .select()
        .from(documentChunks)
        .where(eq(documentChunks.documentId, documentId))
        .orderBy(documentChunks.chunkIndex);

      if (chunks.length === 0) {
        return res.json({
          documentId,
          chunks: [],
          analysis: {
            chunkCount: 0,
            totalLength: 0,
            averageChunkSize: 0,
            qualityDistribution: { high: 0, medium: 0, low: 0 }
          }
        });
      }

      const analysis = {
        chunkCount: chunks.length,
        totalLength: chunks.reduce((sum, chunk) => sum + chunk.content.length, 0),
        averageChunkSize: chunks.reduce((sum, chunk) => sum + chunk.content.length, 0) / chunks.length,
        qualityDistribution: {
          high: chunks.filter(c => c.metadata?.quality === 'high').length,
          medium: chunks.filter(c => c.metadata?.quality === 'medium').length,
          low: chunks.filter(c => c.metadata?.quality === 'low').length
        }
      };

      res.json({
        documentId,
        chunks: chunks.map(chunk => ({
          id: chunk.id,
          chunkIndex: chunk.chunkIndex,
          content: chunk.content.substring(0, 200) + (chunk.content.length > 200 ? '...' : ''),
          fullLength: chunk.content.length,
          quality: chunk.metadata?.quality || 'unknown',
          processingTime: chunk.metadata?.processingTime,
          startChar: chunk.metadata?.startChar,
          endChar: chunk.metadata?.endChar
        })),
        analysis
      });

    } catch (error) {
      console.error('Chunk analysis error:', error);
      res.status(500).json({ 
        error: 'Failed to analyze document chunks', 
        message: error.message 
      });
    }
  });

  // Reprocess specific document with new settings
  app.post('/api/admin/reprocess-document', async (req, res) => {
    try {
      const { documentId, settings = {} } = req.body;
      
      if (!documentId) {
        return res.status(400).json({ error: 'Document ID required' });
      }

      // Delete existing chunks for this document
      await db
        .delete(documentChunks)
        .where(eq(documentChunks.documentId, documentId));

      console.log(`🔄 Deleted existing chunks for document ${documentId}`);
      
      // Reprocess with optimization
      const result = await optimizedDocumentProcessor.processDocument(documentId);
      
      res.json({
        message: 'Document reprocessed successfully',
        result: {
          success: result.success,
          chunksCreated: result.chunksCreated,
          processingTime: result.processingTime,
          quality: result.quality,
          error: result.error
        }
      });

    } catch (error) {
      console.error('Reprocessing error:', error);
      res.status(500).json({ 
        error: 'Reprocessing failed', 
        message: error.message 
      });
    }
  });

  // OCR Test endpoint with real document
  app.post('/api/admin/test-ocr', async (req, res) => {
    try {
      const { documentId } = req.body;
      
      if (!documentId) {
        return res.status(400).json({ error: 'Document ID required for OCR test' });
      }

      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      console.log(`🔍 Testing OCR on document: ${document.originalName}`);
      
      // Force OCR processing regardless of file type
      const processor = optimizedDocumentProcessor as any;
      let ocrResult = '';
      
      if (document.mimeType === 'application/pdf') {
        ocrResult = await processor.extractWithOCR(document.path);
      } else {
        return res.status(400).json({ error: 'OCR test only supports PDF files' });
      }

      const analysis = {
        documentName: document.originalName,
        fileSize: require('fs').statSync(document.path).size,
        extractedLength: ocrResult.length,
        wordCount: ocrResult.split(/\s+/).length,
        hasContent: ocrResult.length > 100,
        sampleText: ocrResult.substring(0, 300) + (ocrResult.length > 300 ? '...' : ''),
        merchantTermsFound: Array.from(processor.merchantTerms).filter(term => 
          ocrResult.toLowerCase().includes(term)
        )
      };

      res.json({
        success: ocrResult.length > 0,
        analysis,
        message: ocrResult.length > 0 ? 'OCR extraction successful' : 'OCR extraction failed or no text found'
      });

    } catch (error) {
      console.error('OCR test error:', error);
      res.status(500).json({ 
        error: 'OCR test failed', 
        message: error.message 
      });
    }
  });

  console.log('✅ Document optimization routes registered');
}