import { db } from '../db';
import { sql } from 'drizzle-orm';

/**
 * Database query optimization configurations and utilities
 */
export class DatabaseOptimizer {
  // Connection pool configuration for better performance
  static readonly POOL_CONFIG = {
    max: 20, // Maximum number of connections
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    connectionTimeoutMillis: 5000, // Timeout connection attempts after 5 seconds
  };

  /**
   * Create indexes for commonly queried fields
   */
  static async createIndexes() {
    console.log('📊 Creating database indexes for optimization...');
    
    try {
      // Index for messages table (chat_id, created_at)
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_messages_chat_created 
        ON messages(chat_id, created_at DESC)
      `);
      
      // Index for documents table (folder_id, admin_only)
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_documents_folder_admin 
        ON documents(folder_id, admin_only)
      `);
      
      // Index for document_chunks table (document_id, chunk_index)
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_chunks_doc_index 
        ON document_chunks(document_id, chunk_index)
      `);
      
      // Index for faq_knowledge_base (category, priority)
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_faq_category_priority 
        ON faq_knowledge_base(category, priority DESC)
      `);
      
      // Index for chats table (user_id, updated_at)
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_chats_user_updated 
        ON chats(user_id, updated_at DESC)
      `);
      
      // Index for users table (username) for login queries
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_users_username 
        ON users(username)
      `);
      
      console.log('✅ Database indexes created successfully');
    } catch (error) {
      console.error('❌ Error creating indexes:', error);
    }
  }
  
  /**
   * Analyze query performance
   */
  static async analyzeQuery(query: string) {
    try {
      const result = await db.execute(sql`EXPLAIN ANALYZE ${sql.raw(query)}`);
      return result;
    } catch (error) {
      console.error('Query analysis failed:', error);
      return null;
    }
  }
  
  /**
   * Cache frequently accessed data in memory
   */
  static readonly queryCache = new Map<string, { data: any, timestamp: number }>();
  static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  static getCached(key: string): any | null {
    const cached = this.queryCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    this.queryCache.delete(key);
    return null;
  }
  
  static setCached(key: string, data: any) {
    this.queryCache.set(key, { data, timestamp: Date.now() });
    
    // Clean up old cache entries
    if (this.queryCache.size > 100) {
      const oldestKey = Array.from(this.queryCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      this.queryCache.delete(oldestKey);
    }
  }
  
  /**
   * Batch insert optimization
   */
  static async batchInsert<T>(
    table: any,
    records: T[],
    batchSize: number = 100
  ): Promise<void> {
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      await db.insert(table).values(batch);
    }
  }
}

// Initialize indexes when module loads
DatabaseOptimizer.createIndexes().catch(console.error);