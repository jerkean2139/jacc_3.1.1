/**
 * RAG (Retrieval Augmented Generation) Manager
 * Coordinates vector search, caching, and AI response generation for optimal performance
 */
import { pineconeService } from './pinecone-service';
import { vectorCache } from './vector-cache';
import { queryOptimizer } from './query-optimizer';
import { reranker } from './reranker';
class RAGManager {
    stats = {
        totalQueries: 0,
        cacheHits: 0,
        vectorSearchQueries: 0,
        averageResponseTime: 0,
        successRate: 0
    };
    config = {
        useVectorSearch: true,
        cacheEnabled: true,
        rerankEnabled: true,
        maxResults: 20,
        confidenceThreshold: 0.7,
        fallbackToDatabase: true
    };
    /**
     * Main RAG pipeline for document retrieval and response generation
     */
    async processQuery(query, userId, options = {}) {
        const startTime = Date.now();
        const searchPath = [];
        const effectiveConfig = { ...this.config, ...options };
        this.stats.totalQueries++;
        try {
            // Phase 1: Check cache if enabled
            let results = [];
            if (effectiveConfig.cacheEnabled) {
                const cached = await vectorCache.get(query);
                if (cached) {
                    searchPath.push('cache');
                    this.stats.cacheHits++;
                    results = cached.documentIds.map(id => ({
                        id,
                        score: cached.score,
                        documentId: id,
                        content: cached.metadata?.content || '',
                        metadata: {
                            documentName: cached.metadata?.documentName || `Document ${id}`,
                            webViewLink: `/documents/${id}`,
                            chunkIndex: 0,
                            mimeType: cached.metadata?.mimeType || 'application/pdf'
                        }
                    }));
                }
            }
            // Phase 2: Vector search if no cache results
            if (results.length === 0 && effectiveConfig.useVectorSearch) {
                try {
                    const isHealthy = await pineconeService.isHealthy();
                    if (isHealthy) {
                        searchPath.push('pinecone');
                        this.stats.vectorSearchQueries++;
                        // Optimize query before vector search
                        const optimizedQuery = await queryOptimizer.optimizeQuery(query);
                        results = await pineconeService.search(optimizedQuery, effectiveConfig.maxResults);
                    }
                }
                catch (vectorError) {
                    console.warn('Vector search failed, continuing to fallback:', vectorError);
                }
            }
            // Phase 3: Database fallback if enabled
            if (results.length === 0 && effectiveConfig.fallbackToDatabase) {
                searchPath.push('database');
                // Database search implementation would go here
                // results = await unifiedAIService.searchDocuments(query, effectiveConfig.maxResults);
            }
            // Phase 4: Rerank results if enabled
            if (results.length > 1 && effectiveConfig.rerankEnabled) {
                try {
                    results = await reranker.rerank(query, results);
                    searchPath.push('rerank');
                }
                catch (rerankError) {
                    console.warn('Reranking failed:', rerankError);
                }
            }
            // Phase 5: Filter by confidence threshold
            const highConfidenceResults = results.filter(r => r.score >= effectiveConfig.confidenceThreshold);
            const finalResults = highConfidenceResults.length > 0 ? highConfidenceResults : results.slice(0, 5);
            // Phase 6: Generate AI response
            // const aiResponse = await unifiedAIService.generateResponse(query, [], userId, {
            //   useWebSearch: false
            // });
            const aiResponse = { response: 'AI response placeholder' };
            // Phase 7: Cache results for future queries
            if (effectiveConfig.cacheEnabled && finalResults.length > 0) {
                const documentIds = finalResults.map(r => r.id);
                const avgScore = finalResults.reduce((sum, r) => sum + r.score, 0) / finalResults.length;
                await vectorCache.set(query, [], documentIds, avgScore, {
                    searchPath: searchPath.join('→'),
                    timestamp: Date.now()
                });
            }
            const executionTime = Date.now() - startTime;
            const confidence = finalResults.length > 0 ?
                finalResults.reduce((sum, r) => sum + r.score, 0) / finalResults.length : 0;
            // Update stats
            this.updateStats(executionTime, finalResults.length > 0);
            return {
                response: aiResponse.response,
                sources: finalResults,
                confidence,
                executionTime,
                searchPath
            };
        }
        catch (error) {
            console.error('RAG pipeline failed:', error);
            this.updateStats(Date.now() - startTime, false);
            // Return basic response in case of failure
            // const fallbackResponse = await unifiedAIService.generateResponse(query, [], userId, {
            //   useWebSearch: false
            // });
            const fallbackResponse = { response: 'Fallback response due to error' };
            return {
                response: fallbackResponse.response,
                sources: [],
                confidence: 0,
                executionTime: Date.now() - startTime,
                searchPath: ['fallback']
            };
        }
    }
    /**
     * Update configuration for RAG pipeline
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Get performance statistics
     */
    getStats() {
        return {
            ...this.stats,
            cacheHitRate: this.stats.totalQueries > 0 ? (this.stats.cacheHits / this.stats.totalQueries) * 100 : 0
        };
    }
    /**
     * Reset statistics
     */
    resetStats() {
        this.stats = {
            totalQueries: 0,
            cacheHits: 0,
            vectorSearchQueries: 0,
            averageResponseTime: 0,
            successRate: 0
        };
    }
    /**
     * Get system health status
     */
    async getHealthStatus() {
        const components = {
            pinecone: await pineconeService.isHealthy(),
            cache: true, // Vector cache is memory-based, always available
            queryOptimizer: true, // Query optimizer is always available
            reranker: true // Reranker is always available
        };
        const healthyComponents = Object.values(components).filter(Boolean).length;
        const totalComponents = Object.keys(components).length;
        let overall;
        if (healthyComponents === totalComponents) {
            overall = 'healthy';
        }
        else if (healthyComponents >= totalComponents / 2) {
            overall = 'degraded';
        }
        else {
            overall = 'unhealthy';
        }
        const recommendations = [];
        if (!components.pinecone) {
            recommendations.push('Check Pinecone API key and connection');
        }
        if (this.stats.successRate < 80 && this.stats.totalQueries > 10) {
            recommendations.push('Consider adjusting confidence threshold or improving document quality');
        }
        if (this.stats.cacheHits / this.stats.totalQueries < 0.3 && this.stats.totalQueries > 20) {
            recommendations.push('Cache hit rate is low - consider increasing cache TTL or improving query optimization');
        }
        return {
            overall,
            components,
            recommendations
        };
    }
    updateStats(executionTime, success) {
        // Update average response time
        this.stats.averageResponseTime =
            (this.stats.averageResponseTime * (this.stats.totalQueries - 1) + executionTime) / this.stats.totalQueries;
        // Update success rate
        const successfulQueries = Math.round(this.stats.successRate * (this.stats.totalQueries - 1) / 100) + (success ? 1 : 0);
        this.stats.successRate = (successfulQueries / this.stats.totalQueries) * 100;
    }
}
export const ragManager = new RAGManager();
