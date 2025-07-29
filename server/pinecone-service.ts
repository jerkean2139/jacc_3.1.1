import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

export interface VectorSearchResult {
  id: string;
  score: number;
  documentId: string;
  content: string;
  metadata: {
    documentName: string;
    webViewLink: string;
    chunkIndex: number;
    mimeType: string;
  };
}

export class PineconeService {
  private pinecone: Pinecone;
  private openai: OpenAI | null = null;
  private indexName: string;
  private environment: string;
  private isInitialized: boolean = false;

  constructor() {
    // Check if Pinecone is properly configured
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY is required');
    }
    
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY!,
      });
    }

    this.indexName = process.env.PINECONE_INDEX_NAME || 'jacc-documents';
    this.environment = process.env.PINECONE_ENVIRONMENT || 'us-east-1-gcp';
  }

  async initialize(): Promise<void> {
    try {
      await this.ensureIndexExists();
      this.isInitialized = true;
      console.log('[PineconeService] Initialized successfully');
    } catch (error) {
      console.error('[PineconeService] Initialization failed:', error);
      throw error;
    }
  }

  async createEmbedding(text: string): Promise<number[]> {
    if (!this.openai) {
      throw new Error('OpenAI client not available for embeddings');
    }

    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text.replace(/\n/g, ' ').trim(),
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error creating embedding:', error);
      throw new Error('Failed to create text embedding');
    }
  }

  async ensureIndexExists(): Promise<void> {
    try {
      const indexList = await this.pinecone.listIndexes();
      const indexExists = indexList.indexes?.some(index => index.name === this.indexName);
      
      if (!indexExists) {
        console.log(`Creating Pinecone index: ${this.indexName}`);
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension: 1536, // text-embedding-3-small dimension
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1'
            }
          }
        });
        
        // Wait for index to be ready
        await this.waitForIndexReady();
      }
    } catch (error) {
      console.error('Error ensuring index exists:', error);
      throw error;
    }
  }

  async waitForIndexReady(): Promise<void> {
    const maxRetries = 10;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        const indexStats = await this.pinecone.index(this.indexName).describeIndexStats();
        if (indexStats) {
          console.log(`Index ${this.indexName} is ready`);
          return;
        }
      } catch (error) {
        console.log(`Waiting for index to be ready... (${retries + 1}/${maxRetries})`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      retries++;
    }
    
    throw new Error(`Index ${this.indexName} did not become ready within timeout`);
  }

  async search(query: string, limit: number = 10, threshold: number = 0.7): Promise<VectorSearchResult[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const embedding = await this.createEmbedding(query);
      const index = this.pinecone.index(this.indexName);
      
      const queryResponse = await index.query({
        vector: embedding,
        topK: limit,
        includeMetadata: true,
        includeValues: false
      });

      return queryResponse.matches
        ?.filter(match => (match.score || 0) >= threshold)
        .map(match => ({
          id: match.id,
          score: match.score || 0,
          documentId: match.id,
          content: (match.metadata?.content as string) || '',
          metadata: {
            documentName: (match.metadata?.documentName as string) || `Document ${match.id}`,
            webViewLink: (match.metadata?.webViewLink as string) || `/documents/${match.id}`,
            chunkIndex: (match.metadata?.chunkIndex as number) || 0,
            mimeType: (match.metadata?.mimeType as string) || 'application/pdf'
          }
        })) || [];
    } catch (error) {
      console.error('Pinecone search failed:', error);
      return [];
    }
  }

  async upsert(documents: Array<{
    id: string;
    content: string;
    metadata?: Record<string, any>;
  }>): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const index = this.pinecone.index(this.indexName);
      
      // Process documents in batches
      const batchSize = 100;
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        
        const vectors = await Promise.all(
          batch.map(async (doc) => ({
            id: doc.id,
            values: await this.createEmbedding(doc.content),
            metadata: {
              content: doc.content.substring(0, 1000), // Limit metadata size
              documentName: doc.metadata?.documentName || `Document ${doc.id}`,
              webViewLink: doc.metadata?.webViewLink || `/documents/${doc.id}`,
              chunkIndex: doc.metadata?.chunkIndex || 0,
              mimeType: doc.metadata?.mimeType || 'application/pdf'
            }
          }))
        );

        await index.upsert(vectors);
        console.log(`Upserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(documents.length / batchSize)}`);
      }
    } catch (error) {
      console.error('Pinecone upsert failed:', error);
      throw error;
    }
  }

  async deleteById(id: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const index = this.pinecone.index(this.indexName);
      await index.deleteOne(id);
      console.log(`Deleted document ${id} from Pinecone`);
    } catch (error) {
      console.error('Pinecone delete failed:', error);
      throw error;
    }
  }

  async health(): Promise<any> {
    try {
      const indexStats = await this.pinecone.index(this.indexName).describeIndexStats();
      return {
        status: 'healthy',
        indexName: this.indexName,
        vectorCount: indexStats.totalRecordCount || 0,
        environment: this.environment,
        dimension: indexStats.dimension || 1536
      };
    } catch (error) {
      return {
        status: 'error',
        error: (error as Error).message
      };
    }
  }

  async clear(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const index = this.pinecone.index(this.indexName);
      await index.deleteAll();
      console.log(`Cleared all vectors from index ${this.indexName}`);
    } catch (error) {
      console.error('Failed to clear Pinecone index:', error);
      throw error;
    }
  }

  isAvailable(): boolean {
    return this.isInitialized && !!process.env.PINECONE_API_KEY;
  }
}

export default PineconeService;