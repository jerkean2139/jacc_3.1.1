/**
 * Unified Vector Store Interface
 * 
 * Provides a common interface for different vector storage backends
 * (Pinecone, Supabase, local storage) from original JACC filestack architecture.
 */

export interface VectorDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

export interface VectorSearchResult {
  document: VectorDocument;
  similarity: number;
  relevanceScore?: number;
}

export interface VectorStoreConfig {
  provider: 'pinecone' | 'supabase' | 'local';
  apiKey?: string;
  environment?: string;
  indexName?: string;
  url?: string;
}

export abstract class VectorStore {
  protected config: VectorStoreConfig;
  
  constructor(config: VectorStoreConfig) {
    this.config = config;
  }

  abstract initialize(): Promise<void>;
  abstract isAvailable(): boolean;
  abstract store(document: VectorDocument): Promise<boolean>;
  abstract storeBatch(documents: VectorDocument[]): Promise<number>;
  abstract search(query: string, limit?: number, threshold?: number): Promise<VectorSearchResult[]>;
  abstract searchByVector(embedding: number[], limit?: number, threshold?: number): Promise<VectorSearchResult[]>;
  abstract get(id: string): Promise<VectorDocument | null>;
  abstract delete(id: string): Promise<boolean>;
  abstract clear(): Promise<boolean>;
  abstract getStats(): Promise<any>;
  abstract health(): Promise<any>;
}

/**
 * Local Vector Store Implementation
 * Fallback storage using local files and simple similarity calculations
 */
export class LocalVectorStore extends VectorStore {
  private documents: Map<string, VectorDocument> = new Map();
  private isInitialized = false;

  async initialize(): Promise<void> {
    try {
      // In a real implementation, this might load from local files
      this.isInitialized = true;
      console.log('[LocalVectorStore] Initialized successfully');
    } catch (error) {
      console.error('[LocalVectorStore] Initialization failed:', error);
      throw error;
    }
  }

  isAvailable(): boolean {
    return this.isInitialized;
  }

  async store(document: VectorDocument): Promise<boolean> {
    try {
      this.documents.set(document.id, document);
      return true;
    } catch (error) {
      console.error('[LocalVectorStore] Store failed:', error);
      return false;
    }
  }

  async storeBatch(documents: VectorDocument[]): Promise<number> {
    let stored = 0;
    for (const doc of documents) {
      if (await this.store(doc)) {
        stored++;
      }
    }
    return stored;
  }

  async search(query: string, limit = 10, threshold = 0.5): Promise<VectorSearchResult[]> {
    const results: VectorSearchResult[] = [];
    const queryWords = query.toLowerCase().split(/\s+/);

    for (const [id, document] of this.documents) {
      const similarity = this.calculateTextSimilarity(document.content, queryWords);
      
      if (similarity >= threshold) {
        results.push({
          document,
          similarity,
          relevanceScore: similarity
        });
      }
    }

    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  async searchByVector(embedding: number[], limit = 10, threshold = 0.5): Promise<VectorSearchResult[]> {
    const results: VectorSearchResult[] = [];

    for (const [id, document] of this.documents) {
      if (!document.embedding) continue;

      const similarity = this.calculateCosineSimilarity(embedding, document.embedding);
      
      if (similarity >= threshold) {
        results.push({
          document,
          similarity,
          relevanceScore: similarity
        });
      }
    }

    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  async get(id: string): Promise<VectorDocument | null> {
    return this.documents.get(id) || null;
  }

  async delete(id: string): Promise<boolean> {
    return this.documents.delete(id);
  }

  async clear(): Promise<boolean> {
    this.documents.clear();
    return true;
  }

  async getStats(): Promise<any> {
    return {
      provider: 'local',
      documentCount: this.documents.size,
      memoryUsage: JSON.stringify([...this.documents.values()]).length,
      available: this.isInitialized
    };
  }

  async health(): Promise<any> {
    return {
      status: this.isInitialized ? 'healthy' : 'unavailable',
      documentCount: this.documents.size
    };
  }

  private calculateTextSimilarity(content: string, queryWords: string[]): number {
    const contentWords = content.toLowerCase().split(/\s+/);
    let matches = 0;

    queryWords.forEach(queryWord => {
      if (contentWords.some(contentWord => 
        contentWord.includes(queryWord) || queryWord.includes(contentWord)
      )) {
        matches++;
      }
    });

    return matches / queryWords.length;
  }

  private calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }
}

/**
 * Vector Store Factory
 * Creates appropriate vector store based on configuration
 */
export class VectorStoreFactory {
  static async create(config: VectorStoreConfig): Promise<VectorStore> {
    let store: VectorStore;

    switch (config.provider) {
      case 'pinecone':
        // Dynamic import to avoid loading if not needed
        const { PineconeVectorStore } = await import('./pinecone-vector-store');
        store = new PineconeVectorStore(config);
        break;
      
      case 'supabase':
        const { SupabaseVectorStore } = await import('./supabase-vector');
        store = new SupabaseVectorStore();
        break;
      
      case 'local':
      default:
        store = new LocalVectorStore(config);
        break;
    }

    await store.initialize();
    return store;
  }

  static async createWithFallback(primaryConfig: VectorStoreConfig, fallbackConfig?: VectorStoreConfig): Promise<VectorStore> {
    try {
      const primaryStore = await this.create(primaryConfig);
      if (primaryStore.isAvailable()) {
        console.log(`[VectorStoreFactory] Using primary store: ${primaryConfig.provider}`);
        return primaryStore;
      }
    } catch (error) {
      console.error(`[VectorStoreFactory] Primary store ${primaryConfig.provider} failed:`, error);
    }

    if (fallbackConfig) {
      try {
        const fallbackStore = await this.create(fallbackConfig);
        console.log(`[VectorStoreFactory] Using fallback store: ${fallbackConfig.provider}`);
        return fallbackStore;
      } catch (error) {
        console.error(`[VectorStoreFactory] Fallback store ${fallbackConfig.provider} failed:`, error);
      }
    }

    // Ultimate fallback to local storage
    console.log('[VectorStoreFactory] Using ultimate fallback: local storage');
    const localStore = new LocalVectorStore({ provider: 'local' });
    await localStore.initialize();
    return localStore;
  }
}

export default VectorStore;