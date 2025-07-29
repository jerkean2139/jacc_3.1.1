import { z } from 'zod';

// Query expansion schema
const queryExpansionSchema = z.object({
  original: z.string(),
  expanded: z.array(z.string()),
  synonyms: z.array(z.string()),
  relatedTerms: z.array(z.string()),
  intent: z.enum(['informational', 'transactional', 'navigational', 'comparison']),
  confidence: z.number()
});

type QueryExpansion = z.infer<typeof queryExpansionSchema>;

export class QueryOptimizer {
  private synonymMap: Map<string, string[]>;
  private merchantTerms: Map<string, string[]>;
  
  constructor() {
    // Initialize merchant services specific synonyms
    this.synonymMap = new Map([
      ['rate', ['pricing', 'cost', 'fee', 'percentage', 'markup']],
      ['processor', ['provider', 'company', 'merchant services', 'payment processor']],
      ['tracerpay', ['tracer pay', 'tracer', 'tracerpay solution']],
      ['pos', ['point of sale', 'terminal', 'card reader', 'payment terminal']],
      ['gateway', ['payment gateway', 'online gateway', 'ecommerce gateway']],
      ['interchange', ['interchange fee', 'interchange rate', 'card brand fee']],
      ['chargeback', ['dispute', 'reversal', 'customer dispute']],
      ['batch', ['settlement', 'batch settlement', 'daily batch']],
      ['emv', ['chip card', 'chip reader', 'emv terminal']],
      ['ach', ['bank transfer', 'direct debit', 'echeck']]
    ]);
    
    // Merchant services specific term relationships
    this.merchantTerms = new Map([
      ['clover', ['pos', 'terminal', 'fiserv', 'first data']],
      ['square', ['pos', 'mobile payments', 'card reader']],
      ['stripe', ['gateway', 'online payments', 'api', 'developer']],
      ['authorize.net', ['gateway', 'visa', 'cybersource']],
      ['shift4', ['pos', 'restaurant', 'hospitality']],
      ['clearent', ['processor', 'tsys', 'global payments']],
      ['micamp', ['iso', 'sales agent', 'residuals']]
    ]);
  }
  
  /**
   * Main entry point for query optimization
   */
  optimizeQuery(query: string, includeRelated = true, domain = 'general', intent?: string): QueryExpansion {
    return this.optimize(query);
  }

  /**
   * Optimize a query for better search results
   */
  optimize(query: string): QueryExpansion {
    const normalized = query.toLowerCase().trim();
    const intent = this.detectIntent(normalized);
    const expanded = this.expandQuery(normalized);
    const synonyms = this.findSynonyms(normalized);
    const relatedTerms = this.findRelatedTerms(normalized);
    
    const result: QueryExpansion = {
      original: query,
      expanded,
      synonyms,
      relatedTerms,
      intent,
      confidence: this.calculateConfidence(normalized, intent)
    };
    
    console.log(`🔍 Query optimization:`, {
      original: query,
      intent,
      expansions: expanded.length,
      synonyms: synonyms.length
    });
    
    return result;
  }
  
  /**
   * Detect query intent
   */
  private detectIntent(query: string): QueryExpansion['intent'] {
    const transactionalKeywords = ['calculate', 'compare', 'pricing', 'cost', 'rate', 'fee'];
    const comparisonKeywords = ['vs', 'versus', 'compare', 'difference', 'better'];
    const navigationalKeywords = ['find', 'show', 'where', 'location', 'contact'];
    
    if (transactionalKeywords.some(kw => query.includes(kw))) {
      return 'transactional';
    }
    if (comparisonKeywords.some(kw => query.includes(kw))) {
      return 'comparison';
    }
    if (navigationalKeywords.some(kw => query.includes(kw))) {
      return 'navigational';
    }
    
    return 'informational';
  }
  
  /**
   * Expand query with variations
   */
  private expandQuery(query: string): string[] {
    const expansions: string[] = [];
    const words = query.split(' ');
    
    // Add original query
    expansions.push(query);
    
    // Add word variations
    for (const word of words) {
      // Add plural/singular variations
      if (word.endsWith('s')) {
        expansions.push(query.replace(word, word.slice(0, -1)));
      } else {
        expansions.push(query.replace(word, word + 's'));
      }
    }
    
    // Add common merchant services patterns
    if (query.includes('rate')) {
      expansions.push(query.replace('rate', 'pricing'));
      expansions.push(query.replace('rate', 'cost'));
    }
    
    if (query.includes('pos')) {
      expansions.push(query.replace('pos', 'point of sale'));
    }
    
    // Remove duplicates
    return Array.from(new Set(expansions));
  }
  
  /**
   * Find synonyms for query terms
   */
  private findSynonyms(query: string): string[] {
    const synonyms: string[] = [];
    const words = query.split(' ');
    
    for (const word of words) {
      const wordSynonyms = this.synonymMap.get(word);
      if (wordSynonyms) {
        synonyms.push(...wordSynonyms);
      }
    }
    
    return Array.from(new Set(synonyms));
  }
  
  /**
   * Find related merchant services terms
   */
  private findRelatedTerms(query: string): string[] {
    const related: string[] = [];
    const words = query.split(' ');
    
    for (const word of words) {
      const relatedTerms = this.merchantTerms.get(word);
      if (relatedTerms) {
        related.push(...relatedTerms);
      }
    }
    
    return Array.from(new Set(related));
  }
  
  /**
   * Calculate confidence score for the query
   */
  private calculateConfidence(query: string, intent: QueryExpansion['intent']): number {
    let confidence = 0.5; // Base confidence
    
    // Boost confidence for specific patterns
    if (intent === 'transactional' && query.includes('calculate')) {
      confidence += 0.3;
    }
    
    // Boost for known merchant terms
    const knownTerms = ['tracerpay', 'clover', 'square', 'stripe', 'clearent'];
    if (knownTerms.some(term => query.includes(term))) {
      confidence += 0.2;
    }
    
    return Math.min(confidence, 1.0);
  }
  
  /**
   * Rewrite query for better search performance
   */
  rewrite(query: string, expansion: QueryExpansion): string {
    // For transactional queries, focus on action words
    if (expansion.intent === 'transactional') {
      return `${query} ${expansion.relatedTerms.slice(0, 2).join(' ')}`;
    }
    
    // For comparisons, include both terms
    if (expansion.intent === 'comparison') {
      return `${query} ${expansion.synonyms.slice(0, 2).join(' ')}`;
    }
    
    // Default: add most relevant synonym
    if (expansion.synonyms.length > 0) {
      return `${query} ${expansion.synonyms[0]}`;
    }
    
    return query;
  }
}

// Export singleton instance
export const queryOptimizer = new QueryOptimizer();