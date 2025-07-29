/**
 * Shared types for JACC application
 */

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp?: string;
}

export interface AIResponse {
  response: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  executionTime?: number;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  documentId: string;
  content: string;
  metadata: {
    documentName: string;
    webViewLink: string;
    chunkIndex: number;
    mimeType: string;
  };
}

export interface UnifiedAIResponse {
  response: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  executionTime?: number;
  sources?: any[];
  suggestions?: string[];
  actionItems?: string[];
  followupTasks?: string[];
}