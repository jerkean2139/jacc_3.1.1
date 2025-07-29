/**
 * Supabase Vector Store Integration
 * 
 * Alternative vector storage solution using Supabase's vector capabilities.
 * From the original JACC filestack architecture.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface VectorDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
  created_at?: string;
  updated_at?: string;
}

export interface SearchResult {
  document: VectorDocument;
  similarity: number;
}

export class SupabaseVectorStore {
  private client: SupabaseClient | null = null;
  private tableName = 'documents_vector';
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize Supabase client if credentials are available
   */
  private initialize(): void {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        this.client = createClient(supabaseUrl, supabaseKey);
        this.isInitialized = true;
        console.log('[SupabaseVectorStore] Initialized successfully');
      } else {
        console.log('[SupabaseVectorStore] Credentials not found, vector store unavailable');
      }
    } catch (error) {
      console.error('[SupabaseVectorStore] Initialization failed:', error);
    }
  }

  /**
   * Check if Supabase vector store is available
   */
  isAvailable(): boolean {
    return this.isInitialized && this.client !== null;
  }

  /**
   * Create the vector table if it doesn't exist
   */
  async setupTable(): Promise<boolean> {
    if (!this.client) return false;

    try {
      // Enable pgvector extension
      await this.client.rpc('create_extension_if_not_exists', {
        extension_name: 'vector'
      });

      // Create vector table
      const { error } = await this.client.rpc('create_vector_table', {
        table_name: this.tableName
      });

      if (error && !error.message.includes('already exists')) {
        throw error;
      }

      console.log('[SupabaseVectorStore] Vector table setup complete');
      return true;
    } catch (error) {
      console.error('[SupabaseVectorStore] Table setup failed:', error);
      return false;
    }
  }

  /**
   * Store document with vector embedding
   */
  async storeDocument(document: VectorDocument): Promise<boolean> {
    if (!this.client) return false;

    try {
      const { error } = await this.client
        .from(this.tableName)
        .upsert({
          id: document.id,
          content: document.content,
          metadata: document.metadata,
          embedding: document.embedding,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      console.log(`[SupabaseVectorStore] Document ${document.id} stored successfully`);
      return true;
    } catch (error) {
      console.error('[SupabaseVectorStore] Store document failed:', error);
      return false;
    }
  }

  /**
   * Store multiple documents in batch
   */
  async storeBatch(documents: VectorDocument[]): Promise<number> {
    if (!this.client) return 0;

    let successCount = 0;
    const batchSize = 100; // Process in chunks of 100

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      
      try {
        const { error } = await this.client
          .from(this.tableName)
          .upsert(batch.map(doc => ({
            id: doc.id,
            content: doc.content,
            metadata: doc.metadata,
            embedding: doc.embedding,
            updated_at: new Date().toISOString()
          })));

        if (!error) {
          successCount += batch.length;
        } else {
          console.error('[SupabaseVectorStore] Batch store error:', error);
        }
      } catch (error) {
        console.error('[SupabaseVectorStore] Batch processing failed:', error);
      }
    }

    console.log(`[SupabaseVectorStore] Stored ${successCount} documents successfully`);
    return successCount;
  }

  /**
   * Perform vector similarity search
   */
  async searchSimilar(
    queryEmbedding: number[],
    limit = 10,
    threshold = 0.7
  ): Promise<SearchResult[]> {
    if (!this.client) return [];

    try {
      const { data, error } = await this.client.rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit
      });

      if (error) throw error;

      return data.map((result: any) => ({
        document: {
          id: result.id,
          content: result.content,
          metadata: result.metadata,
          embedding: result.embedding,
          created_at: result.created_at,
          updated_at: result.updated_at
        },
        similarity: result.similarity
      }));
    } catch (error) {
      console.error('[SupabaseVectorStore] Vector search failed:', error);
      return [];
    }
  }

  /**
   * Search documents by text content
   */
  async searchByText(
    query: string,
    limit = 10
  ): Promise<VectorDocument[]> {
    if (!this.client) return [];

    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .textSearch('content', query)
        .limit(limit);

      if (error) throw error;

      return data.map(row => ({
        id: row.id,
        content: row.content,
        metadata: row.metadata,
        embedding: row.embedding,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
    } catch (error) {
      console.error('[SupabaseVectorStore] Text search failed:', error);
      return [];
    }
  }

  /**
   * Get document by ID
   */
  async getDocument(id: string): Promise<VectorDocument | null> {
    if (!this.client) return null;

    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        content: data.content,
        metadata: data.metadata,
        embedding: data.embedding,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('[SupabaseVectorStore] Get document failed:', error);
      return null;
    }
  }

  /**
   * Delete document by ID
   */
  async deleteDocument(id: string): Promise<boolean> {
    if (!this.client) return false;

    try {
      const { error } = await this.client
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;

      console.log(`[SupabaseVectorStore] Document ${id} deleted successfully`);
      return true;
    } catch (error) {
      console.error('[SupabaseVectorStore] Delete document failed:', error);
      return false;
    }
  }

  /**
   * Get total document count
   */
  async getDocumentCount(): Promise<number> {
    if (!this.client) return 0;

    try {
      const { count, error } = await this.client
        .from(this.tableName)
        .select('id', { count: 'exact', head: true });

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('[SupabaseVectorStore] Get count failed:', error);
      return 0;
    }
  }

  /**
   * Health check for Supabase connection
   */
  async health(): Promise<any> {
    if (!this.client) {
      return {
        status: 'unavailable',
        error: 'Client not initialized'
      };
    }

    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('id')
        .limit(1);

      return {
        status: error ? 'error' : 'healthy',
        error: error?.message,
        documentCount: await this.getDocumentCount()
      };
    } catch (error) {
      return {
        status: 'error',
        error: (error as Error).message
      };
    }
  }

  /**
   * Clear all documents (use with caution)
   */
  async clearAll(): Promise<boolean> {
    if (!this.client) return false;

    try {
      const { error } = await this.client
        .from(this.tableName)
        .delete()
        .neq('id', ''); // Delete all records

      if (error) throw error;

      console.log('[SupabaseVectorStore] All documents cleared');
      return true;
    } catch (error) {
      console.error('[SupabaseVectorStore] Clear all failed:', error);
      return false;
    }
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<any> {
    if (!this.client) {
      return {
        available: false,
        documentCount: 0
      };
    }

    try {
      const [countResult, sampleResult] = await Promise.all([
        this.getDocumentCount(),
        this.client.from(this.tableName).select('*').limit(1)
      ]);

      return {
        available: true,
        documentCount: countResult,
        hasData: countResult > 0,
        lastUpdated: sampleResult.data?.[0]?.updated_at || null
      };
    } catch (error) {
      return {
        available: false,
        error: (error as Error).message,
        documentCount: 0
      };
    }
  }
}

export default SupabaseVectorStore;