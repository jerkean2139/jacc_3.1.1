import Anthropic from '@anthropic-ai/sdk';
import OpenAI from "openai";
import { pineconeService, type VectorSearchResult } from "./pinecone-service";
import { perplexitySearchService, type ExternalSearchResult } from "./perplexity-search";
import { promptChainService } from "./prompt-chain";
import { apiCostTracker } from "./api-cost-tracker";
import { db } from "../db";
import { webSearchLogs, adminSettings, faqKnowledgeBase, documents, documentChunks } from "@shared/schema";
import { eq, desc, or, ilike, sql } from "drizzle-orm";
import type { ChatMessage, AIResponse } from "../../shared/types";
import { vectorCache } from './vector-cache';
import { queryOptimizer } from './query-optimizer';
import { reranker } from './reranker';
import { batchProcessor } from './batch-processor';
// Import services with proper initialization
let advancedSearchService: any = null;
let smartRoutingService: any = null;

// Initialize services lazily to avoid circular dependencies
const getAdvancedSearchService = () => {
  if (!advancedSearchService) {
    try {
      const { AdvancedSearchService } = require('./advanced-search');
      advancedSearchService = new AdvancedSearchService();
    } catch (error) {
      console.warn('Advanced search service not available:', error);
      advancedSearchService = null;
    }
  }
  return advancedSearchService;
};

const getSmartRoutingService = () => {
  if (!smartRoutingService) {
    try {
      const { SmartRoutingService } = require('./smart-routing');
      smartRoutingService = new SmartRoutingService();
    } catch (error) {
      console.warn('Smart routing service not available:', error);
      smartRoutingService = null;
    }
  }
  return smartRoutingService;
};

// Initialize AI clients
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ 
  apiKey: process.env.ANTHROPIC_API_KEY
}) : null;

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export interface UnifiedAIResponse extends AIResponse {
  sources?: DocumentSource[];
  reasoning?: string;
  needsExternalSearchPermission?: boolean;
  suggestions?: string[];
  actionItems?: Array<{
    task: string;
    priority: 'high' | 'medium' | 'low';
    assignee?: string;
    dueDate?: string;
    category: string;
  }>;
  followupTasks?: Array<{
    task: string;
    timeframe: string;
    type: 'call' | 'email' | 'meeting' | 'document' | 'other';
  }>;
}

export interface DocumentSource {
  name: string;
  url: string;
  relevanceScore: number;
  snippet: string;
  type: string;
}

/**
 * Unified AI Service that consolidates all AI-related functionality
 * Combines: EnhancedAIService, AIEnhancedSearchService, SmartRoutingService
 */
export class UnifiedAIService {
  private responseCache = new Map<string, { response: UnifiedAIResponse, timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  // Ultra-fast responses for common queries to eliminate yellow warning times
  private fastResponses = new Map<string, { message: string }>([
    ['calculate processing rates', {
      message: '<h2>Processing Rate Calculator</h2><p>I can help you calculate processing rates! To provide accurate calculations, please tell me:</p><ul><li>Business type (retail, restaurant, e-commerce, etc.)</li><li>Monthly processing volume</li><li>Average ticket size</li><li>Current processor (if any)</li></ul><p>This information helps me provide precise rate comparisons and savings projections.</p>'
    }],
    ['compare processors', {
      message: '<h2>Processor Comparison Analysis</h2><p>I can compare payment processors based on your specific needs. Popular options include:</p><p><strong>Square:</strong> Great for small businesses, transparent pricing</p><p><strong>Clover:</strong> Comprehensive POS integration, flexible plans</p><p><strong>Stripe:</strong> Developer-friendly, excellent for online businesses</p><p><strong>TracerPay:</strong> Competitive rates with personalized service</p><p>What type of business are you comparing processors for?</p>'
    }],
    ['market intelligence', {
      message: '<h2>Market Intelligence Research</h2><p>I can help you research competitive intelligence for your prospect. Market positioning varies significantly by industry and location, so understanding the specific business context is crucial for effective competitive analysis.</p><p>What type of business are you researching?</p>'
    }],
    ['create proposal', {
      message: '<h2>Proposal Creation Assistant</h2><p>Great! Let me help you build a compelling proposal. What details do you have about this prospect so far?</p><p><strong>Business basics:</strong> What type of business, location, and approximate monthly volume?</p><p><strong>Current situation:</strong> Who are they with now and what rates are they paying?</p><p><strong>Pain points:</strong> Any specific issues or goals they mentioned?</p><p>With these details, I can help you craft a proposal that addresses their specific needs and positions us competitively.</p>'
    }]
  ]);
  
  private getFastResponse(query: string): { message: string } | null {
    const queryLower = query.toLowerCase();
    const keys = Array.from(this.fastResponses.keys());
    console.log(`🔍 Ultra-fast response check for: "${query}"`);
    console.log(`🔍 Available keys: [${keys.join(', ')}]`);
    for (const key of keys) {
      console.log(`🔍 Checking if "${queryLower}" includes "${key}"`);
      if (queryLower.includes(key)) {
        console.log(`✅ ULTRA-FAST MATCH FOUND: "${key}"`);
        return this.fastResponses.get(key) || null;
      }
    }
    console.log(`❌ No ultra-fast response match found for: "${queryLower}"`);
    return null;
  }
  
  /**
   * Main entry point for AI responses with performance optimizations
   */
  async generateResponse(
    message: string,
    conversationHistory: ChatMessage[],
    userId: string,
    options?: {
      useWebSearch?: boolean;
      customPrompt?: any;
      userRole?: string;
    }
  ): Promise<UnifiedAIResponse> {
    try {
      const startTime = Date.now();
      
      // ULTRA-FAST PATH: Check for instant responses first
      const fastResponse = this.getFastResponse(message);
      if (fastResponse) {
        console.log(`⚡ Ultra-fast response served in ${Date.now() - startTime}ms`);
        return {
          response: fastResponse.message,
          usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
          executionTime: Date.now() - startTime,
          sources: [],
          suggestions: ["Would you like more specific information?", "Shall we dive deeper into rates or features?"],
          actionItems: [],
          followupTasks: []
        };
      }
      
      // Check response cache for complex queries
      const cacheKey = `${userId}:${message}`;
      const cached = this.responseCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        console.log(`📊 Using cached AI response (${Date.now() - startTime}ms)`);
        return cached.response;
      }
      
      // ULTRA-FAST PATH: Search FAQ first, skip heavy vector search if FAQ matches
      console.log(`🔍 Executing ultra-fast FAQ search for user ${userId}`);
      const faqResults = await this.searchFAQKnowledgeBase(message);
      
      let allResults: any[] = [];
      
      // Add FAQ results as high-priority sources
      faqResults.forEach((faq: any) => {
        allResults.push({
          id: `faq-${faq.id}`,
          score: 0.95, // High priority for FAQ matches
          documentId: `faq-${faq.id}`,
          content: faq.answer,
          metadata: { 
            documentName: faq.question, 
            webViewLink: `/faq/${faq.id}`,
            chunkIndex: 0,
            mimeType: 'text/plain'
          }
        });
      });
      
      // Only do document search if FAQ search found less than 3 results  
      if (allResults.length < 3) {
        console.log(`📄 Adding document search - found only ${allResults.length} FAQ results`);
        const documentResults = await this.searchDocuments(message, 10); // Reduced limit for speed
        allResults.push(...documentResults);
      }
      
      // Generate response with combined context (optimized)
      const response = await this.generateResponseWithContext(
        conversationHistory,
        message,
        {
          searchResults: allResults.slice(0, 5), // Reduced to 5 for faster processing
          customPrompt: options?.customPrompt,
          userRole: options?.userRole || 'Sales Agent',
          useWebSearch: false // Disable web search for speed
        }
      );
      
      // Cache successful responses
      this.responseCache.set(cacheKey, {
        response,
        timestamp: Date.now()
      });
      
      console.log(`✅ AI response generated in ${Date.now() - startTime}ms`);
      return response;
      
    } catch (error) {
      console.error('AI response generation failed:', error);
      throw error;
    }
  }


  
  /**
   * Unified document search with Pinecone vector integration and multi-tier fallback
   */
  async searchDocuments(query: string, limit: number = 20): Promise<VectorSearchResult[]> {
    try {
      const startTime = Date.now();
      
      // Check vector cache first for performance
      const cachedResult = await vectorCache.get(query);
      if (cachedResult) {
        console.log(`⚡ Using cached vector results for query: "${query}" (${Date.now() - startTime}ms)`);
        return cachedResult.documentIds.slice(0, limit).map((id: string, index: number) => ({
          id: id,
          score: cachedResult.score,
          documentId: id,
          content: cachedResult.metadata?.content || '',
          metadata: {
            documentName: cachedResult.metadata?.documentName || `Document ${id}`,
            webViewLink: `/documents/${id}`,
            chunkIndex: index,
            mimeType: cachedResult.metadata?.mimeType || 'application/pdf'
          }
        }));
      }

      let vectorResults: VectorSearchResult[] = [];

      // TIER 1: Try Pinecone vector search first (best semantic matching)
      try {
        const isHealthy = await pineconeService.isHealthy();
        if (isHealthy) {
          console.log(`🔍 Using Pinecone vector search for query: "${query}"`);
          const pineconeResults = await pineconeService.searchDocuments(query, limit);
          vectorResults = pineconeResults.map(result => ({
            id: result.id,
            score: result.score,
            documentId: result.documentId,
            content: result.content,
            metadata: result.metadata
          }));
          console.log(`✅ Pinecone returned ${vectorResults.length} results (${Date.now() - startTime}ms)`);
        }
      } catch (pineconeError) {
        console.log('Pinecone search failed, falling back to enhanced search:', pineconeError);
      }

      // TIER 2: Enhanced search with query optimization
      if (vectorResults.length === 0) {
        console.log(`🔍 Using enhanced search for query: "${query}"`);
        const smartRouting = getSmartRoutingService();
        const advancedSearch = getAdvancedSearchService();
        
        // Optimize query for better results
        const optimizedQuery = await queryOptimizer.optimizeQuery(query);
        console.log(`📈 Query optimized: "${query}" → "${optimizedQuery}"`);
        
        const classification = smartRouting ? await smartRouting.classifyQuery(optimizedQuery) : { intent: 'general' };
        console.log(`📊 Query classification:`, classification);

        const enhancedResults = advancedSearch ? await advancedSearch.searchDocuments(optimizedQuery, limit) : [];
        
        vectorResults = enhancedResults.map((result: any) => ({
          id: result.id,
          score: result.score / 100, // Normalize to 0-1
          documentId: result.documentId,
          content: result.content,
          metadata: {
            documentName: result.metadata.documentName,
            webViewLink: `/documents/${result.documentId}`,
            chunkIndex: result.metadata.chunkIndex,
            mimeType: result.metadata.mimeType
          }
        }));
        console.log(`✅ Enhanced search returned ${vectorResults.length} results (${Date.now() - startTime}ms)`);
      }

      // TIER 3: Database search fallback with merchant services vocabulary
      if (vectorResults.length === 0) {
        console.log(`🔍 Using database search fallback for query: "${query}"`);
        
        // Expand query with merchant services terms for better matching
        const expandedTerms = this.expandMerchantServicesQuery(query);
        
        const dbResults = await db.select()
          .from(documentChunks)
          .where(or(
            ...expandedTerms.map(term => ilike(documentChunks.content, `%${term}%`)),
            ...expandedTerms.map(term => ilike(documentChunks.content, `%${term}%`))
          ))
          .limit(limit);

        vectorResults = dbResults.map((chunk, index) => ({
          id: chunk.id,
          score: 0.7,
          documentId: chunk.documentId,
          content: chunk.content || '',
          metadata: {
            documentName: (chunk as any).title || `Document ${chunk.id}`,
            webViewLink: `/documents/${chunk.documentId}`,
            chunkIndex: chunk.chunkIndex || 0,
            mimeType: 'application/pdf'
          }
        }));
        
        console.log(`✅ Database fallback returned ${vectorResults.length} results (${Date.now() - startTime}ms)`);
      }

      // Apply reranking for better relevance
      if (vectorResults.length > 1) {
        try {
          vectorResults = await this.reranker.rerank(vectorResults, query);
          console.log(`🔄 Applied reranking to ${vectorResults.length} results`);
        } catch (rerankError) {
          console.log('Reranking failed, using original order:', rerankError);
        }
      }

      // Cache successful results for future queries
      if (vectorResults.length > 0) {
        const documentIds = vectorResults.map(r => r.id);
        const avgScore = vectorResults.reduce((sum, r) => sum + r.score, 0) / vectorResults.length;
        await vectorCache.set(query, [], documentIds, avgScore, {
          searchType: 'multi-tier',
          totalResults: vectorResults.length,
          executionTime: Date.now() - startTime
        });
      }

      console.log(`✅ Document search completed: ${vectorResults.length} results in ${Date.now() - startTime}ms`);
      return vectorResults;
      
    } catch (error) {
      console.error('Document search failed:', error);
      return [];
    }
  }

  /**
   * Expand query with merchant services vocabulary for better matching
   */
  private expandMerchantServicesQuery(query: string): string[] {
    const terms = [query.toLowerCase()];
    const synonymMap = {
      'clearent': ['clerent', 'clearant'],
      'processing': ['payment processing', 'card processing'],
      'rates': ['pricing', 'fees', 'costs'],
      'pos': ['point of sale', 'terminal'],
      'merchant': ['business', 'retailer'],
      'interchange': ['interchange plus', 'ic+'],
      'clover': ['clover pos', 'clover system'],
      'square': ['square pos', 'square terminal'],
      'authorize': ['authorize.net', 'authnet']
    };

    Object.entries(synonymMap).forEach(([key, synonyms]) => {
      if (query.toLowerCase().includes(key)) {
        terms.push(...synonyms);
      }
    });

    return [...new Set(terms)]; // Remove duplicates
  }
  
  /**
   * Perform search across multiple sources
   */
  private async performMultiSourceSearch(
    query: string, 
    optimizedQuery: any
  ): Promise<VectorSearchResult[]> {
    const searchTerms = [query, ...optimizedQuery.expanded.slice(0, 2)];
    let allResults: VectorSearchResult[] = [];
    
    console.log(`🔍 SEARCH DEBUG - Query: "${query}", Search Terms: [${searchTerms.join(', ')}]`);
    
    // Search FAQ Knowledge Base
    try {
      const faqResults = await this.searchFAQKnowledgeBase(query);
      console.log(`🔍 FAQ SEARCH RESULT: Found ${faqResults.length} FAQ matches for "${query}"`);
      if (faqResults.length > 0) {
        console.log(`✅ Found ${faqResults.length} FAQ matches:`, faqResults.map(f => f.question));
        allResults.push(...faqResults.map((faq: any) => ({
          id: `faq-${faq.id}`,
          score: 0.95,
          documentId: `faq-${faq.id}`,
          content: `Q: ${faq.question}\nA: ${faq.answer}`,
          metadata: {
            documentName: 'FAQ Knowledge Base',
            webViewLink: `/faq/${faq.id}`,
            chunkIndex: 0,
            mimeType: 'text/plain'
          }
        })));
      }
    } catch (error) {
      console.log('FAQ search failed:', error);
    }
    
    // Search document chunks
    try {
      const chunkResults = await db
        .select()
        .from(documentChunks)
        .where(
          or(
            ...searchTerms.map(term => ilike(documentChunks.content, `%${term}%`))
          )
        )
        .limit(20);
        
      if (chunkResults.length > 0) {
        console.log(`📄 Found ${chunkResults.length} document chunks`);
        allResults.push(...chunkResults.map((chunk: any) => ({
          id: chunk.id,
          score: 0.9,
          documentId: chunk.documentId,
          content: chunk.content.substring(0, 500) + '...',
          metadata: {
            documentName: `Document Chunk ${chunk.id}`,
            webViewLink: `/documents/${chunk.documentId}`,
            chunkIndex: chunk.chunkIndex || 0,
            mimeType: 'application/pdf'
          }
        })));
      }
    } catch (error) {
      console.log('Chunk search failed:', error);
    }
    
    // Search documents by name/metadata
    try {
      const docResults = await db
        .select()
        .from(documents)
        .where(
          or(
            ...searchTerms.map(term => 
              or(
                ilike(documents.name, `%${term}%`),
                ilike(documents.originalName, `%${term}%`)
              )
            )
          )
        )
        .limit(10);
        
      console.log(`🔍 DOCUMENT SEARCH RESULT: Found ${docResults.length} documents for terms [${searchTerms.join(', ')}]`);
      if (docResults.length > 0) {
        console.log(`📁 Found ${docResults.length} documents by name:`, docResults.map(d => d.originalName || d.name));
        allResults.push(...docResults.map((doc: any) => ({
          id: doc.id,
          score: 0.85,
          documentId: doc.id,
          content: `Document: ${doc.originalName || doc.name}`,
          metadata: {
            documentName: doc.originalName || doc.name,
            webViewLink: `/api/documents/${doc.id}/view`,
            chunkIndex: 0,
            mimeType: doc.mimeType || 'application/pdf'
          }
        })));
      }
    } catch (error) {
      console.log('Document search failed:', error);
    }
    
    console.log(`🔍 TOTAL SEARCH RESULTS: Found ${allResults.length} total results before vector fallback`);
    
    // Fallback to vector search if no results
    if (allResults.length === 0 && pineconeService) {
      try {
        const vectorResults = await pineconeService.searchDocuments(query, 10);
        allResults.push(...vectorResults);
      } catch (error) {
        console.log('Vector search failed:', error);
      }
    }
    
    // Remove duplicates
    const uniqueResults = Array.from(
      new Map(allResults.map(r => [r.documentId, r])).values()
    );
    
    console.log(`🔍 FINAL SEARCH RESULTS: Returning ${uniqueResults.length} unique results for "${query}"`);
    uniqueResults.forEach((result, i) => {
      console.log(`  ${i + 1}. ${result.metadata?.documentName || result.id} (score: ${result.score})`);
    });
    
    return uniqueResults;
  }
  
  /**
   * Search FAQ Knowledge Base
   */
  private async searchFAQKnowledgeBase(query: string): Promise<any[]> {
    try {
      const keywords = query.toLowerCase().split(' ').filter(w => w.length > 2);
      
      const results = await db
        .select()
        .from(faqKnowledgeBase)
        .where(
          or(
            ilike(faqKnowledgeBase.question, `%${query}%`),
            ilike(faqKnowledgeBase.answer, `%${query}%`),
            ...keywords.map(keyword => 
              or(
                ilike(faqKnowledgeBase.question, `%${keyword}%`),
                ilike(faqKnowledgeBase.answer, `%${keyword}%`)
              )
            )
          )
        )
        .orderBy(desc(faqKnowledgeBase.priority))
        .limit(5);
        
      return results;
    } catch (error) {
      console.error('FAQ search error:', error);
      return [];
    }
  }
  
  /**
   * Generate response with all context
   */
  private async generateResponseWithContext(
    conversationHistory: ChatMessage[],
    userMessage: string,
    context: {
      searchResults?: VectorSearchResult[];
      customPrompt?: any;
      userRole?: string;
      useWebSearch?: boolean;
    }
  ): Promise<UnifiedAIResponse> {
    const startTime = Date.now();
    try {
      // Ensure conversationHistory is an array and validate messages
    const historyArray = Array.isArray(conversationHistory) ? conversationHistory : [];
    const validatedHistory = historyArray.filter(msg => 
      msg && typeof msg === 'object' && msg.role && msg.content
    ).map(msg => ({
      role: (msg.role === 'user' || msg.role === 'assistant') ? msg.role : 'user',
      content: typeof msg.content === 'string' ? msg.content : String(msg.content || '')
    }));
    
    const messages = [...validatedHistory, { role: 'user' as const, content: userMessage }];
      const searchResults = context.searchResults || [];
      
      // Format document context
      const documentContext = this.formatDocumentContext(searchResults);
      
      // Create document previews
      const documentPreviews = this.createDocumentPreviews(searchResults.slice(0, 3));
      
      // Generate system prompt
      const systemPrompt = this.buildSystemPrompt(context.userRole || 'Sales Agent', documentContext, documentPreviews);
      
      // Use appropriate AI model - Claude Sonnet 4 as primary, GPT-4.1 as fallback
      let content = '';
      let sources: DocumentSource[] = [];
      
      // Primary: Use Claude Sonnet 4 (default and preferred)
      console.log('🤖 AI Service Debug - Anthropic available:', !!anthropic, 'OpenAI available:', !!openai);
      if (anthropic) {
        console.log('🎯 Using Claude Sonnet 4 as primary AI model');
        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514", // The newest Anthropic model is "claude-sonnet-4-20250514", not "claude-3-7-sonnet-20250219", "claude-3-5-sonnet-20241022" nor "claude-3-sonnet-20240229".
          system: systemPrompt,
          messages: messages.map(msg => ({
            role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
            content: msg.content
          })),
          temperature: 0.7,
          max_tokens: 1000,
        });
        
        content = response.content[0].type === 'text' ? response.content[0].text : "";
        
        // Track API usage and costs
        await apiCostTracker.logUsage('admin-user', {
          provider: 'anthropic',
          model: 'claude-sonnet-4',
          operation: 'chat',
          inputTokens: response.usage?.input_tokens || 0,
          outputTokens: response.usage?.output_tokens || 0,
          requestCount: 1,
          responseTime: Date.now() - startTime,
          success: true,
          requestData: { systemPromptLength: systemPrompt.length, messagesCount: messages.length }
        });
      } else if (openai) {
        // Fallback to GPT-4.1 if Claude is not available
        const response = await openai.chat.completions.create({
          model: "gpt-4.1-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.map(msg => ({
              role: (msg.role === 'user' || msg.role === 'assistant') ? msg.role : 'user',
              content: typeof msg.content === 'string' ? msg.content : String(msg.content || '')
            }))
          ],
          temperature: 0.7,
          max_tokens: 1000,
        });
        
        content = response.choices[0]?.message?.content || "";
        
        // Track API usage and costs
        await apiCostTracker.logUsage('admin-user', {
          provider: 'openai',
          model: 'gpt-4.1-mini',
          operation: 'chat',
          inputTokens: response.usage?.prompt_tokens || 0,
          outputTokens: response.usage?.completion_tokens || 0,
          requestCount: 1,
          responseTime: Date.now() - startTime,
          success: true,
          requestData: { systemPromptLength: systemPrompt.length, messagesCount: messages.length }
        });
      } else {
        throw new Error('No AI service available');
      }
      
      // Enhanced HTML formatting for better readability
      content = this.formatResponseWithHTML(content);
      
      // Add document links if found
      if (searchResults.length > 0 && documentPreviews) {
        content += `\n\n<h3>📋 Available Documents</h3>\n${documentPreviews}`;
      }
      
      // Extract metadata
      const actionItems = this.extractActionItems(content);
      const followupTasks = this.extractFollowupTasks(content);
      
      // Format sources
      sources = searchResults.map(result => ({
        name: result.metadata?.documentName || 'Document',
        url: result.metadata?.webViewLink || `/documents/${result.documentId}`,
        relevanceScore: result.score,
        snippet: result.content.substring(0, 150) + '...',
        type: result.metadata?.mimeType || 'document'
      }));
      
      return {
        response: content,
        sources,
        suggestions: this.generateSuggestions(userMessage, searchResults),
        actionItems,
        followupTasks,
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      };
      
    } catch (error) {
      console.error('Response generation error:', error);
      throw error;
    }
  }
  
  /**
   * Format document context for AI prompt
   */
  private formatDocumentContext(searchResults: VectorSearchResult[]): string {
    if (searchResults.length === 0) return "No relevant documents found.";
    
    return searchResults.slice(0, 5).map((result, index) => {
      const name = result.metadata?.documentName || `Document ${index + 1}`;
      const snippet = result.content.substring(0, 200).replace(/\n/g, ' ').trim();
      return `${index + 1}. ${name}: ${snippet}...`;
    }).join('\n');
  }
  
  /**
   * Create document preview HTML
   */
  private createDocumentPreviews(searchResults: VectorSearchResult[]): string {
    return searchResults.map(doc => {
      const docName = doc.metadata?.documentName || 'Document';
      const docType = doc.metadata?.mimeType?.includes('pdf') ? 'PDF' : 
                     doc.metadata?.mimeType?.includes('spreadsheet') ? 'Excel' : 
                     doc.metadata?.mimeType?.includes('document') ? 'Word' : 'Document';
      const snippet = doc.content.substring(0, 150).replace(/\n/g, ' ').trim();
      
      return `<div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 8px 0; background: #f9fafb;">
<h4 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600;">📄 ${docName}</h4>
<p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px; line-height: 1.4;">${docType} • ${snippet}...</p>
<div style="display: flex; gap: 12px;">
<a href="/documents/${doc.documentId}" style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;" target="_blank">
🔗 View Document
</a>
<a href="/api/documents/${doc.documentId}/download" style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: #6b7280; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;" download="${docName}">
⬇️ Download
</a>
</div>
</div>`;
    }).join('\n');
  }
  
  /**
   * Build system prompt
   */
  private buildSystemPrompt(userRole: string, documentContext: string, documentExamples: string): string {
    return `You are JACC, a friendly AI assistant for merchant services sales agents. Think of yourself as a knowledgeable colleague who's been in the industry for years - professional but approachable.

**CRITICAL: USE PROPER HTML FORMATTING FOR ALL RESPONSES**

**HTML FORMATTING REQUIREMENTS:**
- Use <h2> or <h3> for section headers (never markdown ##)
- Use <ul><li> tags for bullet points (never markdown bullets)
- Use <strong> for emphasis (never markdown **)
- Use <p> tags for paragraphs and <br> for line breaks
- Structure responses with clear HTML hierarchy for maximum readability

**PERSONALITY & TONE:**
- Speak like a real person, not a robot
- Use casual-professional language (like talking to a coworker)
- Say "Hey" or "Alright" to start responses naturally
- Use contractions (I'll, you'll, we've) to sound more human
- Be confident but not overly formal

**RESPONSE STYLE: Keep responses SHORT and CONCISE (2-3 paragraphs maximum)**

**HTML BULLET POINT FORMATTING:**
<ul>
<li><strong>Always use HTML ul/li tags</strong> for bullet points</li>
<li><strong>Make key points stand out</strong> with strong tags</li>
<li><strong>Use proper HTML structure</strong> for lists, comparisons, and key takeaways</li>
</ul>

**DOCUMENT-FIRST APPROACH:**
When relevant documents are found in our internal storage:
1. **Give a brief, friendly answer** (1-2 sentences)
2. **Show document previews with clickable links** using this exact format:
${documentExamples ? `\n${documentExamples}\n` : ''}

**DOCUMENT PREVIEW FORMAT:**
📄 **[Document Name]** - [Brief excerpt...]
🔗 [View Document](/documents/[document-id]) | [Download](/api/documents/[document-id]/download)

**MARKET INTELLIGENCE SPECIALIZATION:**
When users ask for market intelligence or competitive research, ALWAYS ask these specific qualifying questions:
- **Geographic Area:** What city/state/region is the prospect located in?
- **Industry Niche:** What specific type of business and industry specialty?
- **Business Category:** Are they retail, wholesale, service-based, B2B, B2C, online, or brick-and-mortar?
- **Competitive Landscape:** Who are their main local competitors?
- **Growth Plans:** Are they expanding or focused on optimization?

**RULES:**
- ALWAYS prioritize internal documents over general knowledge
- Keep explanations brief - let users click through to full documents
- Include working document links when documents are found
- Only give detailed explanations when NO internal documents exist

User context: ${userRole}

DOCUMENT CONTEXT:
${documentContext}

ACTION ITEMS AND TASK EXTRACTION:
- **AUTOMATICALLY IDENTIFY**: Extract action items, follow-up tasks, and deadlines from transcriptions and conversations
- **CATEGORIZE TASKS**: Organize by type (Client Communication, Documentation, Internal Process, Scheduling)
- **PRIORITY ASSESSMENT**: Assign priority levels (high, medium, low) based on urgency indicators
- **FOLLOW-UP TRACKING**: Identify callback requirements, meeting schedules, and document preparation needs
- **TASK FORMATTING**: Present action items with clear assignees, due dates, and next steps`;
  }
  
  /**
   * Extract action items from response
   */
  private extractActionItems(content: string): any[] {
    const actionItems = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.includes('Action:') || line.includes('TODO:') || line.includes('Task:')) {
        actionItems.push({
          task: line.replace(/^.*(Action:|TODO:|Task:)\s*/i, '').trim(),
          priority: 'medium',
          category: 'general'
        });
      }
    }
    
    return actionItems;
  }
  
  /**
   * Extract follow-up tasks
   */
  private extractFollowupTasks(content: string): any[] {
    const tasks = [];
    const patterns = [
      /follow[\s-]?up/i,
      /call back/i,
      /schedule.*meeting/i,
      /send.*email/i,
      /prepare.*document/i
    ];
    
    const lines = content.split('\n');
    for (const line of lines) {
      for (const pattern of patterns) {
        if (pattern.test(line)) {
          tasks.push({
            task: line.trim(),
            timeframe: 'within 48 hours',
            type: 'other'
          });
          break;
        }
      }
    }
    
    return tasks;
  }
  
  /**
   * Format response with proper HTML tags for better readability
   */
  private formatResponseWithHTML(content: string): string {
    // Skip if content already has proper HTML structure
    if (content.includes('<h1>') || content.includes('<h2>') || content.includes('<ul>')) {
      return content;
    }

    let formatted = content;
    
    // Convert markdown headers to HTML
    formatted = formatted.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    formatted = formatted.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    formatted = formatted.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    
    // Convert markdown bold to HTML
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert markdown bullet points to HTML lists
    formatted = this.convertBulletsToHTML(formatted);
    
    // Improve paragraph structure
    formatted = this.improveHTMLStructure(formatted);
    
    return formatted;
  }

  /**
   * Improve HTML structure for better readability
   */
  private improveHTMLStructure(content: string): string {
    let formatted = content;
    
    // Split into sections for better structure
    const sections = formatted.split(/(<h[123]>.*?<\/h[123]>)/g);
    const result = [];
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i].trim();
      if (!section) continue;
      
      if (section.match(/<h[123]>.*<\/h[123]>/)) {
        // This is a header
        result.push(section);
      } else {
        // This is content - wrap in paragraphs if needed
        const paragraphs = section.split(/\n\s*\n/);
        paragraphs.forEach(para => {
          para = para.trim();
          if (para && !para.startsWith('<')) {
            // Add line breaks for hard returns within paragraphs
            para = para.replace(/\n/g, '<br>');
            result.push(`<p>${para}</p>`);
          } else if (para) {
            result.push(para);
          }
        });
      }
    }
    
    return result.join('\n');
  }
  
  /**
   * Convert markdown-style bullet points to proper HTML lists
   */
  private convertBulletsToHTML(content: string): string {
    const lines = content.split('\n');
    let inList = false;
    let result = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if line is a bullet point
      if (line.match(/^[•\-\*]\s+/)) {
        if (!inList) {
          result.push('<ul>');
          inList = true;
        }
        const listItem = line.replace(/^[•\-\*]\s+/, '').trim();
        result.push(`<li>${listItem}</li>`);
      } else {
        if (inList) {
          result.push('</ul>');
          inList = false;
        }
        result.push(line);
      }
    }
    
    // Close list if still open
    if (inList) {
      result.push('</ul>');
    }
    
    return result.join('\n');
  }
  
  /**
   * Generate suggestions based on context
   */
  private generateSuggestions(query: string, searchResults: VectorSearchResult[]): string[] {
    const suggestions = [];
    
    if (searchResults.length === 0) {
      suggestions.push(
        "Try searching with different keywords",
        "Upload relevant documents to the system",
        "Check the FAQ Knowledge Base"
      );
    } else {
      suggestions.push(
        "Review the found documents for more details",
        "Save important information to your personal folder",
        "Create a summary for your client"
      );
    }
    
    return suggestions;
  }
  
  /**
   * Get admin settings
   */
  async getAdminSettings() {
    const [settings] = await db
      .select()
      .from(adminSettings)
      .where(eq(adminSettings.id, 'default'))
      .limit(1);
    
    return settings || {
      id: 'default',
      enableWebSearch: false,
      enableSmartRouting: true,
      maxSearchResults: 10,
      responseStyle: 'professional',
      enableDebugMode: false
    };
  }

  /**
   * Generate response using prompt chain service for enhanced reasoning
   */
  async generateChainedResponse(
    query: string,
    userId: string,
    conversationHistory: Array<{role: string, content: string}> = []
  ): Promise<UnifiedAIResponse> {
    try {
      console.log(`🔗 Using prompt chain service for query: "${query}"`);
      
      const chainedResponse = await promptChainService.executeChain(query, userId, conversationHistory);
      
      return {
        response: chainedResponse.finalResponse,
        sources: chainedResponse.sources,
        reasoning: chainedResponse.reasoning,
        suggestions: [],
        actionItems: [],
        followupTasks: [],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      };
      
    } catch (error) {
      console.error('Chained response generation failed:', error);
      // Fallback to regular response generation
      return this.generateResponseWithContext(query, [{role: 'user', content: query}] as any, {
        searchResults: [],
        userRole: 'Sales Agent'
      });
    }
  }


}

// Export singleton instance
export const unifiedAIService = new UnifiedAIService();