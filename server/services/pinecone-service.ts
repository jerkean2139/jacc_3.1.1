/**
 * Pinecone Vector Database Service
 * Handles vector embeddings and semantic search functionality
 */

import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAI } from 'openai';

// Initialize OpenAI for embeddings
const openaiClient = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export interface VectorDocument {
  id: string;
  documentId: string;
  content: string;
  metadata: {
    documentName: string;
    webViewLink?: string;
    chunkIndex: number;
    mimeType: string;
    category?: string;
    userId?: string;
  };
}

export interface VectorSearchResult {
  id: string;
  score: number;
  documentId: string;
  content: string;
  metadata: {
    documentName: string;
    webViewLink?: string;
    chunkIndex: number;
    mimeType: string;
    category?: string;
    userId?: string;
  };
}

export class PineconeService {
  private pinecone: Pinecone | null = null;
  private index: any = null;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      if (!process.env.PINECONE_API_KEY) {
        console.log('🚫 Pinecone API key not found - vector search disabled');
        return;
      }

      this.pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
      });

      const indexName = process.env.PINECONE_INDEX_NAME || 'merchant-docs-v2';
      this.index = this.pinecone.index(indexName);
      this.initialized = true;

      console.log('✅ Pinecone vector service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Pinecone service:', error);
    }
  }

  async isHealthy(): Promise<boolean> {
    if (!this.initialized || !this.index) {
      return false;
    }

    try {
      // Test with a simple query
      await this.index.query({
        vector: new Array(1536).fill(0),
        topK: 1,
        includeMetadata: true
      });
      return true;
    } catch (error) {
      console.error('Pinecone health check failed:', error);
      return false;
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    if (!openaiClient) {
      throw new Error('OpenAI client not initialized - cannot generate embeddings');
    }

    try {
      const response = await openaiClient.embeddings.create({
        model: 'text-embedding-3-small',
        input: text.slice(0, 8000), // Limit input length
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw error;
    }
  }

  async upsertDocument(document: VectorDocument): Promise<boolean> {
    if (!this.initialized || !this.index) {
      console.log('Pinecone not initialized - skipping vector upsert');
      return false;
    }

    try {
      const embedding = await this.generateEmbedding(document.content);
      
      await this.index.upsert([{
        id: document.id,
        values: embedding,
        metadata: {
          ...document.metadata,
          content: document.content.slice(0, 1000), // Store snippet
          documentId: document.documentId
        }
      }]);

      return true;
    } catch (error) {
      console.error('Failed to upsert document to Pinecone:', error);
      return false;
    }
  }

  async searchDocuments(query: string, topK: number = 10, filters?: any): Promise<VectorSearchResult[]> {
    if (!this.initialized || !this.index) {
      console.log('Pinecone not initialized - returning empty results');
      return [];
    }

    try {
      const queryEmbedding = await this.generateEmbedding(query);
      
      const searchParams: any = {
        vector: queryEmbedding,
        topK,
        includeMetadata: true
      };

      if (filters) {
        searchParams.filter = filters;
      }

      const response = await this.index.query(searchParams);
      
      return response.matches?.map((match: any) => ({
        id: match.id,
        score: match.score,
        documentId: match.metadata?.documentId || match.id,
        content: match.metadata?.content || '',
        metadata: {
          documentName: match.metadata?.documentName || 'Unknown Document',
          webViewLink: match.metadata?.webViewLink || '',
          chunkIndex: match.metadata?.chunkIndex || 0,
          mimeType: match.metadata?.mimeType || 'text/plain',
          category: match.metadata?.category,
          userId: match.metadata?.userId
        }
      })) || [];
    } catch (error) {
      console.error('Failed to search Pinecone:', error);
      return [];
    }
  }

  async deleteById(id: string): Promise<boolean> {
    if (!this.initialized || !this.index) {
      return false;
    }

    try {
      await this.index.deleteOne(id);
      return true;
    } catch (error) {
      console.error('Failed to delete from Pinecone:', error);
      return false;
    }
  }

  async batchUpsert(documents: VectorDocument[]): Promise<boolean> {
    if (!this.initialized || !this.index || documents.length === 0) {
      return false;
    }

    try {
      // Process in batches of 100 (Pinecone limit)
      const batchSize = 100;
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        
        const vectorData = await Promise.all(batch.map(async (doc) => ({
          id: doc.id,
          values: await this.generateEmbedding(doc.content),
          metadata: {
            ...doc.metadata,
            content: doc.content.slice(0, 1000),
            documentId: doc.documentId
          }
        })));

        await this.index.upsert(vectorData);
      }

      return true;
    } catch (error) {
      console.error('Failed batch upsert to Pinecone:', error);
      return false;
    }
  }

  async getStats(): Promise<any> {
    if (!this.initialized || !this.index) {
      return { status: 'disabled', totalVectors: 0 };
    }

    try {
      const stats = await this.index.describeIndexStats();
      return {
        status: 'healthy',
        totalVectors: stats.totalVectorCount || 0,
        namespaces: stats.namespaces || {}
      };
    } catch (error) {
      console.error('Failed to get Pinecone stats:', error);
      return { status: 'error', totalVectors: 0 };
    }
  }
}

// Export singleton instance
export const pineconeService = new PineconeService();
export const pineconeVectorService = pineconeService;