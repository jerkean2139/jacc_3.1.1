import { z } from 'zod';
import crypto from 'crypto';

// Vector cache entry schema
const vectorCacheEntrySchema = z.object({
  id: z.string(),
  query: z.string(),
  queryHash: z.string(),
  embeddings: z.array(z.number()),
  metadata: z.record(z.any()).optional(),
  documentIds: z.array(z.string()),
  score: z.number(),
  hitCount: z.number().default(0),
  lastAccessed: z.date(),
  createdAt: z.date(),
  expiresAt: z.date().optional()
});

type VectorCacheEntry = z.infer<typeof vectorCacheEntrySchema>;

export class VectorCache {
  private cache: Map<string, VectorCacheEntry>;
  private maxSize: number;
  private ttl: number; // Time to live in milliseconds
  
  constructor(maxSize: number = 1000, ttlHours: number = 24) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttlHours * 60 * 60 * 1000;
    
    // Start cleanup interval
    setInterval(() => this.cleanup(), 60 * 60 * 1000); // Every hour
  }
  
  /**
   * Generate a hash for the query to use as cache key
   */
  private generateQueryHash(query: string): string {
    return crypto
      .createHash('sha256')
      .update(query.toLowerCase().trim())
      .digest('hex');
  }
  
  /**
   * Get cached embeddings for a query
   */
  async get(query: string): Promise<VectorCacheEntry | null> {
    const queryHash = this.generateQueryHash(query);
    const entry = this.cache.get(queryHash);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (entry.expiresAt && entry.expiresAt < new Date()) {
      this.cache.delete(queryHash);
      return null;
    }
    
    // Update access stats
    entry.hitCount++;
    entry.lastAccessed = new Date();
    
    console.log(`📊 Vector cache hit for query: "${query}" (hits: ${entry.hitCount})`);
    return entry;
  }
  
  /**
   * Store embeddings in cache
   */
  async set(
    query: string,
    embeddings: number[],
    documentIds: string[],
    score: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    const queryHash = this.generateQueryHash(query);
    
    // Check cache size and evict if necessary
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed();
    }
    
    const entry: VectorCacheEntry = {
      id: crypto.randomUUID(),
      query,
      queryHash,
      embeddings,
      documentIds,
      score,
      metadata,
      hitCount: 0,
      lastAccessed: new Date(),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.ttl)
    };
    
    this.cache.set(queryHash, entry);
    console.log(`💾 Cached vector for query: "${query}"`);
  }
  
  /**
   * Evict least recently used entries
   */
  private evictLeastUsed(): void {
    let leastUsed: VectorCacheEntry | null = null;
    let leastUsedKey: string | null = null;
    
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (!leastUsed || entry.lastAccessed < leastUsed.lastAccessed) {
        leastUsed = entry;
        leastUsedKey = key;
      }
    }
    
    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
      console.log(`🗑️ Evicted cache entry for: "${leastUsed?.query}"`);
    }
  }
  
  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = new Date();
    let cleaned = 0;
    
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} expired cache entries`);
    }
  }
  
  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    totalHits: number;
    totalQueries: number;
  } {
    let totalHits = 0;
    let totalQueries = 0;
    
    for (const entry of Array.from(this.cache.values())) {
      totalHits += entry.hitCount;
      totalQueries += entry.hitCount + 1; // +1 for initial cache miss
    }
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: totalQueries > 0 ? totalHits / totalQueries : 0,
      totalHits,
      totalQueries
    };
  }
  
  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    console.log('🗑️ Vector cache cleared');
  }
  
  /**
   * Check if similar query exists (fuzzy matching)
   */
  async findSimilar(query: string, threshold: number = 0.85): Promise<VectorCacheEntry | null> {
    const normalizedQuery = query.toLowerCase().trim();
    
    for (const entry of Array.from(this.cache.values())) {
      const similarity = this.calculateSimilarity(
        normalizedQuery,
        entry.query.toLowerCase().trim()
      );
      
      if (similarity >= threshold) {
        console.log(`🔍 Found similar cached query: "${entry.query}" (similarity: ${similarity.toFixed(2)})`);
        return entry;
      }
    }
    
    return null;
  }
  
  /**
   * Calculate string similarity using Jaccard index
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const set1 = new Set(str1.split(' '));
    const set2 = new Set(str2.split(' '));
    
    const intersection = new Set(Array.from(set1).filter(x => set2.has(x)));
    const union = new Set([...Array.from(set1), ...Array.from(set2)]);
    
    return intersection.size / union.size;
  }
}

// Export singleton instance
export const vectorCache = new VectorCache(1000, 24);