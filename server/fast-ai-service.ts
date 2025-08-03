import Anthropic from '@anthropic-ai/sdk';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class FastAIService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async generateFastResponse(
    messages: ChatMessage[],
    systemPrompt: string
  ): Promise<string> {
    const startTime = Date.now();
    
    try {
      console.log('🚀 FastAI: Generating ultra-fast response with Claude Sonnet 4');
      
      const response = await this.anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        system: systemPrompt,
        messages: messages.map(msg => ({
          role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
        })),
        temperature: 0.1,  // Very low for speed and consistency
        max_tokens: 800,   // Increased for complete HTML responses
      });

      const duration = Date.now() - startTime;
      console.log(`⚡ FastAI: Response generated in ${duration}ms`);

      return response.content[0].type === 'text' ? response.content[0].text : "";
    } catch (error) {
      console.error('❌ FastAI service error:', error);
      throw error;
    }
  }
}

export const fastAIService = new FastAIService();