import { unifiedAIService } from "./unified-ai-service";
import { smartRoutingService, QueryClassification } from "./smart-routing";
import type { VectorSearchResult } from "../../shared/types";

export interface ChainStep {
  step: number;
  prompt: string;
  response: string;
  reasoning: string;
  nextAction?: 'search_documents' | 'web_search' | 'synthesize' | 'complete';
  searchNamespaces?: string[];
  searchResults?: VectorSearchResult[];
}

export interface ChainedResponse {
  steps: ChainStep[];
  finalResponse: string;
  sources: Array<{
    name: string;
    url: string;
    relevanceScore: number;
    snippet: string;
    type: string;
  }>;
  reasoning: string;
  confidence: number;
}

export class PromptChainService {
  
  async executeChain(
    query: string, 
    userId: string, 
    conversationHistory: Array<{role: string, content: string}> = []
  ): Promise<ChainedResponse> {
    
    const steps: ChainStep[] = [];
    
    // Step 1: Query Classification and Intent Recognition
    const classificationStep = await this.classifyQueryIntent(query, conversationHistory);
    steps.push(classificationStep);
    
    // Extract JSON from response that might contain markdown code blocks
    const cleanClassificationResponse = classificationStep.response.replace(/```json\n?|\n?```/g, '').trim();
    let classification: QueryClassification;
    
    try {
      classification = JSON.parse(cleanClassificationResponse);
    } catch (error) {
      // Fallback classification if parsing fails
      classification = {
        intent: 'informational',
        confidence: 0.7,
        suggestedFolders: [],
        processorMentioned: null,
        requiresCalculation: false,
        businessContext: 'general'
      };
    }
    
    // Step 2: Smart Folder Routing
    const routingStep = await this.determineFolderRouting(classification, userId);
    steps.push(routingStep);
    
    // Extract JSON from response that might contain markdown code blocks
    const cleanRoutingResponse = routingStep.response.replace(/```json\n?|\n?```/g, '').trim();
    let namespaces: string[] = [];
    
    try {
      const routingData = JSON.parse(cleanRoutingResponse);
      namespaces = routingData.suggestedNamespaces || [];
    } catch (error) {
      // Fallback to default search
      namespaces = ['general'];
    }
    
    // Step 3: Document Search with Smart Routing
    const searchStep = await this.executeSmartDocumentSearch(query, namespaces);
    steps.push(searchStep);
    
    // Step 4: Synthesize Final Response
    const synthesisStep = await this.synthesizeFinalResponse(
      query, 
      searchStep.searchResults || [], 
      conversationHistory,
      classification
    );
    steps.push(synthesisStep);
    
    return {
      steps,
      finalResponse: synthesisStep.response,
      sources: this.extractSources(searchStep.searchResults || []),
      reasoning: this.buildReasoningChain(steps),
      confidence: this.calculateConfidence(steps)
    };
  }
  
  private async classifyQueryIntent(
    query: string, 
    conversationHistory: Array<{role: string, content: string}>
  ): Promise<ChainStep> {
    
    const contextHistory = conversationHistory.slice(-3).map(msg => 
      `${msg.role}: ${msg.content}`
    ).join('\n');
    
    const prompt = `
    Analyze this merchant services query and classify its intent:
    
    Query: "${query}"
    
    Recent conversation context:
    ${contextHistory}
    
    Return a JSON object with this structure:
    {
      "intent": "informational|transactional|navigational|comparison",
      "confidence": 0.0-1.0,
      "suggestedFolders": ["folder1", "folder2"],
      "processorMentioned": "processor_name or null",
      "requiresCalculation": boolean,
      "businessContext": "restaurant|retail|ecommerce|general"
    }
    
    Consider these processors: Clearent, Alliant, MiCamp, Shift4, Authorize.Net, TracerPay
    `;
    
    try {
      const response = await unifiedAIService.generateResponse(prompt);
      
      return {
        step: 1,
        prompt,
        response: response.response,
        reasoning: "Classified query intent and extracted key parameters for intelligent routing",
        nextAction: 'search_documents'
      };
    } catch (error) {
      console.error('Classification step error:', error);
      return {
        step: 1,
        prompt,
        response: JSON.stringify({
          intent: 'informational',
          confidence: 0.5,
          suggestedFolders: ['general'],
          processorMentioned: null,
          requiresCalculation: false,
          businessContext: 'general'
        }),
        reasoning: "Fallback classification due to AI service error",
        nextAction: 'search_documents'
      };
    }
  }
  
  private async determineFolderRouting(
    classification: QueryClassification, 
    userId: string
  ): Promise<ChainStep> {
    
    const prompt = `
    Based on this query classification, determine the best document folders to search:
    
    Classification:
    - Intent: ${classification.intent}
    - Processor: ${classification.processorMentioned || 'none'}
    - Business Context: ${classification.businessContext}
    - Requires Calculation: ${classification.requiresCalculation}
    
    Available folders: Admin, Clearent, Alliant, MiCamp, Merchant Lynx, Authorize.Net, 
    Shift4, Hardware-POS, Contracts, Pricing Sheets, Sales & Marketing
    
    Return JSON with suggested search namespaces:
    {
      "suggestedNamespaces": ["namespace1", "namespace2"],
      "reasoning": "Why these folders were selected",
      "priority": "high|medium|low"
    }
    `;
    
    try {
      const response = await unifiedAIService.generateResponse(prompt);
      
      return {
        step: 2,
        prompt,
        response: response.response,
        reasoning: "Determined optimal folder routing based on query classification",
        nextAction: 'search_documents'
      };
    } catch (error) {
      console.error('Routing step error:', error);
      return {
        step: 2,
        prompt,
        response: JSON.stringify({
          suggestedNamespaces: ['general'],
          reasoning: 'Fallback to general search due to error',
          priority: 'medium'
        }),
        reasoning: "Fallback routing due to AI service error",
        nextAction: 'search_documents'
      };
    }
  }
  
  private async executeSmartDocumentSearch(
    query: string, 
    namespaces: string[]
  ): Promise<ChainStep> {
    
    try {
      // Use the enhanced search service with smart routing
      const { advancedSearchService } = await import('./advanced-search');
      const searchResults = await advancedSearchService.searchDocuments(query, 10);
      
      // Convert to VectorSearchResult format
      const vectorResults: VectorSearchResult[] = searchResults.map(result => ({
        id: result.id,
        score: result.score / 100,
        documentId: result.documentId,
        content: result.content,
        metadata: {
          documentName: result.metadata.documentName,
          webViewLink: `/documents/${result.documentId}`,
          chunkIndex: result.metadata.chunkIndex,
          mimeType: result.metadata.mimeType
        }
      }));
      
      return {
        step: 3,
        prompt: `Search documents in namespaces: ${namespaces.join(', ')} for query: "${query}"`,
        response: `Found ${vectorResults.length} relevant document chunks`,
        reasoning: `Searched ${namespaces.length} namespaces and found ${vectorResults.length} relevant results`,
        nextAction: 'synthesize',
        searchNamespaces: namespaces,
        searchResults: vectorResults
      };
    } catch (error) {
      console.error('Search step error:', error);
      return {
        step: 3,
        prompt: `Search documents for query: "${query}"`,
        response: 'Search failed - using fallback',
        reasoning: 'Document search encountered an error',
        nextAction: 'synthesize',
        searchNamespaces: namespaces,
        searchResults: []
      };
    }
  }
  
  private async synthesizeFinalResponse(
    query: string,
    searchResults: VectorSearchResult[],
    conversationHistory: Array<{role: string, content: string}>,
    classification: QueryClassification
  ): Promise<ChainStep> {
    
    const relevantContent = searchResults.slice(0, 5).map(result => 
      `Document: ${result.metadata?.documentName || 'Unknown'}\nContent: ${result.content.substring(0, 500)}...`
    ).join('\n\n');
    
    const contextHistory = conversationHistory.slice(-2).map(msg => 
      `${msg.role}: ${msg.content}`
    ).join('\n');
    
    const prompt = `
    You are a knowledgeable merchant services expert. Answer this query comprehensively using the provided context.
    
    Query: "${query}"
    Query Intent: ${classification.intent}
    Business Context: ${classification.businessContext}
    
    Recent conversation:
    ${contextHistory}
    
    Relevant document content:
    ${relevantContent}
    
    Provide a detailed, helpful response that:
    1. Directly answers the user's question
    2. References specific information from the documents when available
    3. Provides actionable insights for merchant services
    4. Uses professional but conversational tone
    5. Includes document links when referencing specific sources
    
    Format your response with proper HTML structure including headings, lists, and emphasis.
    `;
    
    try {
      const response = await unifiedAIService.generateResponse(prompt);
      
      return {
        step: 4,
        prompt,
        response: response.response,
        reasoning: "Synthesized comprehensive response using document context and conversation history",
        nextAction: 'complete'
      };
    } catch (error) {
      console.error('Synthesis step error:', error);
      return {
        step: 4,
        prompt,
        response: "I apologize, but I'm experiencing technical difficulties. Please try your question again.",
        reasoning: "Synthesis failed due to AI service error",
        nextAction: 'complete'
      };
    }
  }
  
  private extractSources(searchResults: VectorSearchResult[]): Array<{
    name: string;
    url: string;
    relevanceScore: number;
    snippet: string;
    type: string;
  }> {
    
    return searchResults.slice(0, 5).map(result => ({
      name: result.metadata?.documentName || 'Document',
      url: result.metadata?.webViewLink || '#',
      relevanceScore: result.score,
      snippet: result.content.substring(0, 200) + '...',
      type: result.metadata?.mimeType || 'text/plain'
    }));
  }
  
  private buildReasoningChain(steps: ChainStep[]): string {
    return steps.map(step => 
      `Step ${step.step}: ${step.reasoning}`
    ).join(' → ');
  }
  
  private calculateConfidence(steps: ChainStep[]): number {
    // Calculate confidence based on successful steps and search results
    const successfulSteps = steps.filter(step => !step.response.includes('error') && !step.response.includes('failed'));
    const searchStep = steps.find(step => step.searchResults);
    const hasResults = searchStep?.searchResults && searchStep.searchResults.length > 0;
    
    let confidence = (successfulSteps.length / steps.length) * 0.7;
    
    if (hasResults) {
      confidence += 0.2;
    }
    
    if (searchStep?.searchResults && searchStep.searchResults.length >= 3) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }
}

export const promptChainService = new PromptChainService();