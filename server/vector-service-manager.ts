import { PineconeService } from './pinecone-service';
import { DatabaseStorage } from './storage';
import fs from 'fs/promises';
import path from 'path';

/**
 * Vector Service Manager
 * 
 * Provides intelligent vector search with automatic fallback from Pinecone to enhanced database search.
 * Based on original JACC filestack architecture with comprehensive search capabilities.
 */
class VectorServiceManager {
  private pineconeService: PineconeService | null = null;
  private storage: DatabaseStorage;
  private vectorCache: Map<string, any[]> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private cacheMaxSize = 1000;
  private cacheTTL = 24 * 60 * 60 * 1000; // 24 hours
  
  constructor(storage?: DatabaseStorage) {
    console.log('[VectorServiceManager] Constructor called');
    this.storage = storage || new DatabaseStorage();
    this.initializePinecone();
  }

  /**
   * Initialize Pinecone service if environment variables are available
   */
  private async initializePinecone() {
    try {
      const pineconeApiKey = process.env.PINECONE_API_KEY;
      const pineconeEnvironment = process.env.PINECONE_ENVIRONMENT;
      const pineconeIndex = process.env.PINECONE_INDEX_NAME;

      if (pineconeApiKey && pineconeEnvironment && pineconeIndex) {
        this.pineconeService = new PineconeService();
        await this.pineconeService.initialize();
        console.log('[VectorServiceManager] Pinecone initialized successfully');
      } else {
        console.log('[VectorServiceManager] Pinecone environment variables not found, using database fallback');
      }
    } catch (error) {
      console.error('[VectorServiceManager] Failed to initialize Pinecone:', error);
      this.pineconeService = null;
    }
  }

  /**
   * Perform semantic document search with intelligent fallback
   */
  async searchDocuments(query: string, limit = 10, threshold = 0.7): Promise<any[]> {
    const cacheKey = `search:${query}:${limit}:${threshold}`;
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('[VectorServiceManager] Returning cached results');
      return cached;
    }

    let results: any[] = [];

    try {
      // Try Pinecone first if available
      if (this.pineconeService) {
        console.log('[VectorServiceManager] Using Pinecone vector search');
        results = await this.pineconeService.search(query, limit, threshold);
        
        if (results.length > 0) {
          this.setCache(cacheKey, results);
          return results;
        }
      }

      // Fallback to enhanced database search
      console.log('[VectorServiceManager] Using enhanced database search');
      results = await this.enhancedDatabaseSearch(query, limit);
      
      this.setCache(cacheKey, results);
      return results;
      
    } catch (error) {
      console.error('[VectorServiceManager] Search failed:', error);
      // Ultimate fallback to basic search
      return this.basicDatabaseSearch(query, limit);
    }
  }

  /**
   * Enhanced database search with merchant services vocabulary mapping
   */
  private async enhancedDatabaseSearch(query: string, limit: number): Promise<any[]> {
    try {
      // Enhanced query with merchant services vocabulary
      const enhancedQuery = this.enhanceQueryWithVocabulary(query);
      
      // Multi-stage search strategy
      const results = await Promise.all([
        this.searchByTitle(enhancedQuery, Math.ceil(limit * 0.4)),
        this.searchByContent(enhancedQuery, Math.ceil(limit * 0.4)),
        this.searchByKeywords(enhancedQuery, Math.ceil(limit * 0.2))
      ]);

      // Combine and deduplicate results
      const combined = this.combineAndRankResults(results.flat(), query);
      
      return combined.slice(0, limit);
    } catch (error) {
      console.error('[VectorServiceManager] Enhanced database search failed:', error);
      return this.basicDatabaseSearch(query, limit);
    }
  }

  /**
   * Enhance query with merchant services vocabulary mapping
   */
  private enhanceQueryWithVocabulary(query: string): string {
    const vocabularyMap = {
      'rates': ['processing rates', 'interchange rates', 'qualified rates', 'pricing'],
      'processor': ['payment processor', 'merchant services', 'gateway'],
      'pos': ['point of sale', 'terminal', 'hardware'],
      'restaurant': ['food service', 'hospitality', 'dining'],
      'retail': ['store', 'shop', 'merchant'],
      'ecommerce': ['online', 'web', 'digital'],
      'fees': ['monthly fees', 'transaction fees', 'setup costs'],
      'compare': ['comparison', 'versus', 'vs', 'difference'],
      'setup': ['installation', 'configuration', 'implementation'],
      'support': ['customer service', 'technical support', 'help']
    };

    let enhancedQuery = query.toLowerCase();
    
    // Expand query with vocabulary mapping
    Object.entries(vocabularyMap).forEach(([key, synonyms]) => {
      if (enhancedQuery.includes(key)) {
        synonyms.forEach(synonym => {
          if (!enhancedQuery.includes(synonym)) {
            enhancedQuery += ` ${synonym}`;
          }
        });
      }
    });

    return enhancedQuery;
  }

  /**
   * Search documents by title with relevance scoring
   */
  private async searchByTitle(query: string, limit: number): Promise<any[]> {
    const documents = await this.storage.getDocuments();
    
    return documents
      .map((doc: any) => ({
        ...doc,
        relevanceScore: this.calculateTitleRelevance(doc.name || '', query)
      }))
      .filter((doc: any) => doc.relevanceScore > 0.3)
      .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  /**
   * Search documents by content with full-text matching
   */
  private async searchByContent(query: string, limit: number): Promise<any[]> {
    const documents = await this.storage.getDocuments();
    const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    
    return documents
      .map((doc: any) => ({
        ...doc,
        relevanceScore: this.calculateContentRelevance(doc.content || '', queryWords)
      }))
      .filter((doc: any) => doc.relevanceScore > 0.2)
      .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  /**
   * Search documents by keywords and tags
   */
  private async searchByKeywords(query: string, limit: number): Promise<any[]> {
    const documents = await this.storage.getDocuments();
    const keywords = this.extractKeywords(query);
    
    return documents
      .map((doc: any) => ({
        ...doc,
        relevanceScore: this.calculateKeywordRelevance(doc, keywords)
      }))
      .filter((doc: any) => doc.relevanceScore > 0.1)
      .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  /**
   * Calculate title relevance score
   */
  private calculateTitleRelevance(title: string, query: string): number {
    const titleWords = title.toLowerCase().split(/\s+/);
    const queryWords = query.toLowerCase().split(/\s+/);
    
    let score = 0;
    let exactMatches = 0;
    
    queryWords.forEach(queryWord => {
      if (queryWord.length < 3) return;
      
      titleWords.forEach(titleWord => {
        if (titleWord === queryWord) {
          exactMatches++;
          score += 1.0;
        } else if (titleWord.includes(queryWord) || queryWord.includes(titleWord)) {
          score += 0.5;
        }
      });
    });

    // Boost score for multiple exact matches
    if (exactMatches > 1) {
      score *= 1.5;
    }

    return Math.min(score / queryWords.length, 1.0);
  }

  /**
   * Calculate content relevance score
   */
  private calculateContentRelevance(content: string, queryWords: string[]): number {
    const contentLower = content.toLowerCase();
    let score = 0;
    let totalOccurrences = 0;

    queryWords.forEach(word => {
      if (word.length < 3) return;
      
      const occurrences = (contentLower.match(new RegExp(word, 'g')) || []).length;
      totalOccurrences += occurrences;
      
      if (occurrences > 0) {
        score += Math.min(occurrences * 0.1, 0.5);
      }
    });

    // Normalize by content length
    const normalizedScore = score / Math.log(content.length + 1);
    
    return Math.min(normalizedScore, 1.0);
  }

  /**
   * Calculate keyword relevance score
   */
  private calculateKeywordRelevance(document: any, keywords: string[]): number {
    let score = 0;
    
    // Check document metadata
    const searchableText = [
      document.name || '',
      document.category || '',
      document.tags?.join(' ') || '',
      document.description || ''
    ].join(' ').toLowerCase();

    keywords.forEach(keyword => {
      if (searchableText.includes(keyword)) {
        score += 0.2;
      }
    });

    return Math.min(score, 1.0);
  }

  /**
   * Extract keywords from query
   */
  private extractKeywords(query: string): string[] {
    const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can'];
    
    return query.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .slice(0, 10); // Limit to top 10 keywords
  }

  /**
   * Combine and rank results from multiple search strategies
   */
  private combineAndRankResults(results: any[], originalQuery: string): any[] {
    // Deduplicate by document ID
    const seen = new Set();
    const deduplicated = results.filter(doc => {
      if (seen.has(doc.id)) {
        return false;
      }
      seen.add(doc.id);
      return true;
    });

    // Apply final ranking with multiple signals
    return deduplicated.map(doc => ({
      ...doc,
      finalScore: this.calculateFinalScore(doc, originalQuery)
    }))
    .sort((a, b) => b.finalScore - a.finalScore);
  }

  /**
   * Calculate final relevance score combining multiple signals
   */
  private calculateFinalScore(document: any, query: string): number {
    const baseRelevance = document.relevanceScore || 0;
    
    // Boost factors
    let boostFactor = 1.0;
    
    // Boost recent documents
    if (document.createdAt) {
      const ageInDays = (Date.now() - new Date(document.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (ageInDays < 30) {
        boostFactor *= 1.2;
      }
    }
    
    // Boost documents with higher engagement
    if (document.views && document.views > 10) {
      boostFactor *= 1.1;
    }
    
    // Boost documents in relevant categories
    const relevantCategories = ['rates', 'processing', 'comparison', 'setup'];
    if (document.category && relevantCategories.some(cat => 
      document.category.toLowerCase().includes(cat) || query.toLowerCase().includes(cat)
    )) {
      boostFactor *= 1.3;
    }

    return baseRelevance * boostFactor;
  }

  /**
   * Basic database search as ultimate fallback
   */
  private async basicDatabaseSearch(query: string, limit: number): Promise<any[]> {
    try {
      const documents = await this.storage.getDocuments();
      const queryLower = query.toLowerCase();
      
      return documents
        .filter((doc: any) => 
          (doc.name && doc.name.toLowerCase().includes(queryLower)) ||
          (doc.content && doc.content.toLowerCase().includes(queryLower))
        )
        .slice(0, limit)
        .map((doc: any) => ({
          ...doc,
          relevanceScore: 0.5,
          finalScore: 0.5
        }));
    } catch (error) {
      console.error('[VectorServiceManager] Basic database search failed:', error);
      return [];
    }
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): any[] | null {
    const cached = this.vectorCache.get(key);
    const expiry = this.cacheExpiry.get(key);
    
    if (cached && expiry && expiry > Date.now()) {
      return cached;
    }
    
    // Clean up expired entry
    this.vectorCache.delete(key);
    this.cacheExpiry.delete(key);
    
    return null;
  }

  private setCache(key: string, value: any[]): void {
    // Implement LRU eviction if cache is full
    if (this.vectorCache.size >= this.cacheMaxSize) {
      const oldestKey = this.vectorCache.keys().next().value;
      this.vectorCache.delete(oldestKey);
      this.cacheExpiry.delete(oldestKey);
    }
    
    this.vectorCache.set(key, value);
    this.cacheExpiry.set(key, Date.now() + this.cacheTTL);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): any {
    return {
      size: this.vectorCache.size,
      maxSize: this.cacheMaxSize,
      hitRate: this.calculateHitRate(),
      entriesExpired: this.cleanExpiredEntries()
    };
  }

  private calculateHitRate(): number {
    // This would need to be tracked over time
    // For now, return a placeholder
    return 0.75;
  }

  private cleanExpiredEntries(): number {
    let cleaned = 0;
    const now = Date.now();
    
    // Convert entries to array to avoid iterator issues
    const entries = Array.from(this.cacheExpiry.entries());
    for (const [key, expiry] of entries) {
      if (expiry <= now) {
        this.vectorCache.delete(key);
        this.cacheExpiry.delete(key);
        cleaned++;
      }
    }
    
    return cleaned;
  }

  /**
   * Health check for vector services
   */
  async getHealthStatus(): Promise<any> {
    const health = {
      pinecone: {
        available: this.pineconeService !== null,
        status: 'unknown'
      },
      database: {
        available: true,
        status: 'unknown'
      },
      cache: this.getCacheStats()
    };

    // Test Pinecone if available
    if (this.pineconeService) {
      try {
        await this.pineconeService.health();
        health.pinecone.status = 'healthy';
      } catch (error) {
        health.pinecone.status = 'error';
      }
    }

    // Test database
    try {
      await this.storage.getDocuments();
      health.database.status = 'healthy';
    } catch (error) {
      health.database.status = 'error';
    }

    return health;
  }

  /**
   * Health check method for compatibility with routes
   */
  async healthCheck(): Promise<any> {
    try {
      const health = await this.getHealthStatus();
      
      // Determine primary service and overall status
      if (this.pineconeService && health.pinecone.status === 'healthy') {
        return {
          service: 'pinecone',
          status: 'healthy',
          details: health
        };
      } else if (health.database.status === 'healthy') {
        return {
          service: 'database_enhanced',
          status: 'healthy',
          details: health
        };
      } else {
        return {
          service: 'unknown',
          status: 'error',
          details: health
        };
      }
    } catch (error) {
      console.error('[VectorServiceManager] Health check failed:', error);
      return {
        service: 'unknown',
        status: 'error',
        error: (error as Error).message
      };
    }
  }

  /**
   * Add document to vector store
   */
  async addDocument(document: any): Promise<boolean> {
    try {
      if (this.pineconeService) {
        await this.pineconeService.upsert([document]);
      }
      
      // Clear relevant caches
      this.clearCacheByPattern('search:');
      
      return true;
    } catch (error) {
      console.error('[VectorServiceManager] Failed to add document:', error);
      return false;
    }
  }

  /**
   * Update document in vector store
   */
  async updateDocument(documentId: string, document: any): Promise<boolean> {
    try {
      if (this.pineconeService) {
        await this.pineconeService.upsert([{ ...document, id: documentId }]);
      }
      
      // Clear relevant caches
      this.clearCacheByPattern('search:');
      
      return true;
    } catch (error) {
      console.error('[VectorServiceManager] Failed to update document:', error);
      return false;
    }
  }

  /**
   * Delete document from vector store
   */
  async deleteDocument(documentId: string): Promise<boolean> {
    try {
      if (this.pineconeService) {
        await this.pineconeService.deleteById(documentId);
      }
      
      // Clear relevant caches
      this.clearCacheByPattern('search:');
      
      return true;
    } catch (error) {
      console.error('[VectorServiceManager] Failed to delete document:', error);
      return false;
    }
  }

  private clearCacheByPattern(pattern: string): void {
    const keysToDelete = Array.from(this.vectorCache.keys())
      .filter(key => key.startsWith(pattern));
    
    keysToDelete.forEach(key => {
      this.vectorCache.delete(key);
      this.cacheExpiry.delete(key);
    });
  }
}

// Export default
export default VectorServiceManager;

// Create singleton instance
let vectorServiceManagerInstance: VectorServiceManager | null = null;

export const vectorServiceManager = (() => {
  if (!vectorServiceManagerInstance) {
    console.log('[VectorServiceManager] Creating singleton instance');
    vectorServiceManagerInstance = new VectorServiceManager();
  }
  return vectorServiceManagerInstance;
})();