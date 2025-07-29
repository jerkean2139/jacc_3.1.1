import { z } from 'zod';

// Document result schema for reranking
const documentResultSchema = z.object({
  id: z.string(),
  content: z.string(),
  title: z.string().optional(),
  score: z.number(),
  metadata: z.record(z.any()).optional(),
  relevanceSignals: z.object({
    titleMatch: z.number(),
    contentMatch: z.number(),
    freshness: z.number(),
    popularity: z.number(),
    contextMatch: z.number()
  }).optional()
});

type DocumentResult = z.infer<typeof documentResultSchema>;

export class Reranker {
  private weights: {
    titleMatch: number;
    contentMatch: number;
    freshness: number;
    popularity: number;
    contextMatch: number;
    originalScore: number;
  };
  
  constructor() {
    // Weights for different relevance signals
    this.weights = {
      titleMatch: 0.25,
      contentMatch: 0.20,
      freshness: 0.10,
      popularity: 0.10,
      contextMatch: 0.15,
      originalScore: 0.20
    };
  }
  
  /**
   * Rerank search results based on multiple signals
   */
  async rerank(
    results: DocumentResult[],
    query: string,
    context?: string[]
  ): Promise<DocumentResult[]> {
    console.log(`🎯 Reranking ${results.length} results for query: "${query}"`);
    
    // Calculate relevance signals for each result
    const enhancedResults = results.map(doc => {
      const signals = this.calculateRelevanceSignals(doc, query, context);
      return {
        ...doc,
        relevanceSignals: signals,
        score: this.calculateFinalScore(doc.score, signals)
      };
    });
    
    // Sort by final score
    const reranked = enhancedResults.sort((a, b) => b.score - a.score);
    
    // Log reranking impact
    const originalTop = results[0]?.id;
    const rerankedTop = reranked[0]?.id;
    if (originalTop !== rerankedTop) {
      console.log(`🔄 Reranking changed top result from ${originalTop} to ${rerankedTop}`);
    }
    
    return reranked;
  }
  
  /**
   * Calculate relevance signals for a document
   */
  private calculateRelevanceSignals(
    doc: DocumentResult,
    query: string,
    context?: string[]
  ): DocumentResult['relevanceSignals'] {
    const queryLower = query.toLowerCase();
    const contentLower = doc.content.toLowerCase();
    const titleLower = (doc.title || '').toLowerCase();
    
    return {
      titleMatch: this.calculateTitleMatch(titleLower, queryLower),
      contentMatch: this.calculateContentMatch(contentLower, queryLower),
      freshness: this.calculateFreshness(doc.metadata?.createdAt),
      popularity: this.calculatePopularity(doc.metadata),
      contextMatch: this.calculateContextMatch(doc, context || [])
    };
  }
  
  /**
   * Calculate title match score
   */
  private calculateTitleMatch(title: string, query: string): number {
    if (!title) return 0;
    
    // Exact match
    if (title === query) return 1.0;
    
    // Contains full query
    if (title.includes(query)) return 0.8;
    
    // Contains all query words
    const queryWords = query.split(' ');
    const allWordsPresent = queryWords.every(word => title.includes(word));
    if (allWordsPresent) return 0.6;
    
    // Partial word matches
    const matchedWords = queryWords.filter(word => title.includes(word));
    return matchedWords.length / queryWords.length * 0.5;
  }
  
  /**
   * Calculate content match score
   */
  private calculateContentMatch(content: string, query: string): number {
    const queryWords = query.split(' ');
    const contentWords = content.split(' ');
    
    // Calculate term frequency
    let totalMatches = 0;
    for (const queryWord of queryWords) {
      const matches = contentWords.filter(word => 
        word.toLowerCase().includes(queryWord)
      ).length;
      totalMatches += matches;
    }
    
    // Normalize by content length (prevent bias toward longer documents)
    const normalizedScore = totalMatches / Math.sqrt(contentWords.length);
    
    // Cap at 1.0
    return Math.min(normalizedScore, 1.0);
  }
  
  /**
   * Calculate freshness score
   */
  private calculateFreshness(createdAt?: string | Date): number {
    if (!createdAt) return 0.5; // Neutral score if no date
    
    const date = new Date(createdAt);
    const now = new Date();
    const ageInDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    
    // Exponential decay: fresher documents score higher
    if (ageInDays < 7) return 1.0;
    if (ageInDays < 30) return 0.8;
    if (ageInDays < 90) return 0.6;
    if (ageInDays < 365) return 0.4;
    
    return 0.2;
  }
  
  /**
   * Calculate popularity score based on metadata
   */
  private calculatePopularity(metadata?: Record<string, any>): number {
    if (!metadata) return 0.5;
    
    let score = 0.5; // Base score
    
    // Boost for frequently accessed documents
    if (metadata.viewCount) {
      const views = metadata.viewCount;
      if (views > 100) score += 0.3;
      else if (views > 50) score += 0.2;
      else if (views > 10) score += 0.1;
    }
    
    // Boost for documents with high ratings
    if (metadata.rating && metadata.rating > 4) {
      score += 0.2;
    }
    
    return Math.min(score, 1.0);
  }
  
  /**
   * Calculate context match score
   */
  private calculateContextMatch(doc: DocumentResult, context: string[]): number {
    if (context.length === 0) return 0.5;
    
    const content = doc.content.toLowerCase();
    let matches = 0;
    
    for (const term of context) {
      if (content.includes(term.toLowerCase())) {
        matches++;
      }
    }
    
    return matches / context.length;
  }
  
  /**
   * Calculate final score combining all signals
   */
  private calculateFinalScore(
    originalScore: number,
    signals?: DocumentResult['relevanceSignals']
  ): number {
    if (!signals) return originalScore;
    
    return (
      this.weights.originalScore * originalScore +
      this.weights.titleMatch * signals.titleMatch +
      this.weights.contentMatch * signals.contentMatch +
      this.weights.freshness * signals.freshness +
      this.weights.popularity * signals.popularity +
      this.weights.contextMatch * signals.contextMatch
    );
  }
  
  /**
   * Adjust weights for specific use cases
   */
  adjustWeights(newWeights: Partial<typeof this.weights>): void {
    this.weights = { ...this.weights, ...newWeights };
    console.log('📊 Reranker weights updated:', this.weights);
  }
}

// Export singleton instance
export const reranker = new Reranker();