// MEMORY OPTIMIZATION: Lazy load OpenAI (9.7MB)
// import OpenAI from "openai";
let OpenAI: any = null;
let openai: any = null;

import { aiFallbackService } from "./ai-fallback-service";

// User has specifically requested using GPT-4.1 mini model, updated from previous gpt-4.1-mini configuration
// const openai = new OpenAI({ 
//   apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
// });

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  message: string;
  suggestions?: string[];
  actions?: Array<{
    type: 'save_to_folder' | 'download' | 'create_proposal' | 'find_documents';
    label: string;
    data?: any;
  }>;
}

export async function generateChatResponse(
  messages: ChatMessage[],
  context?: {
    userRole?: string;
    documents?: Array<{ name: string; content?: string }>;
    spreadsheetData?: any;
  }
): Promise<AIResponse> {
  try {
    const systemPrompt = `You are JACC, an expert AI assistant for merchant services sales agents with advanced document analysis capabilities. You excel at:

CORE CAPABILITIES:
- Analyzing merchant statements, contracts, and business documents
- Processing payment data, transaction reports, and rate comparisons
- Extracting key information from uploaded files and documents
- Calculating processing costs, savings opportunities, and rate optimizations
- Generating merchant proposals and competitive analysis reports
- Providing instant insights from complex financial documents

MERCHANT SERVICES EXPERTISE:
- Credit card processing solutions and payment gateway comparisons
- Point-of-sale systems (SkyTab, Clover, terminals) and equipment recommendations
- Cash discounting programs and surcharge implementations
- Merchant account applications and underwriting requirements
- Industry-specific processing solutions and rate structures

DOCUMENT ANALYSIS POWERS:
- Instantly analyze merchant statements to identify cost-saving opportunities
- Extract transaction data and calculate effective processing rates
- Compare current processing costs with competitive alternatives
- Generate detailed savings projections and ROI calculations
- Create professional merchant proposals from analyzed data

RESPONSE STYLE:
- Direct, actionable insights with specific recommendations
- Professional tone with merchant services expertise
- Focus on helping businesses reduce processing costs
- Provide concrete next steps and implementation guidance

User context: ${context?.userRole || 'Merchant Services Sales Agent'}
Available documents: ${context?.documents?.map(d => d.name).join(', ') || 'Extensive merchant services documentation'}`;

    // Use AI fallback service for enhanced reliability
    const fallbackResult = await aiFallbackService.generateResponseWithFallback(
      messages,
      systemPrompt,
      {
        maxTokens: 500,
        temperature: 0.3
      }
    );

    let content = fallbackResult.content;
    
    // Log fallback usage for monitoring
    if (fallbackResult.hadFallback) {
      console.log(`⚠️ AI Fallback Used: ${fallbackResult.usedModel.toUpperCase()} after primary model failed`);
    } else {
      console.log(`✅ AI Response Generated: ${fallbackResult.usedModel.toUpperCase()}`);
    }
    
    // Skip Hormozi formatting - allow conversational workflows to handle marketing requests
    console.log('🎨 Skipping Hormozi formatting to allow conversational workflow for marketing requests');
    // content = applyHormoziFormatting(content, messages[messages.length - 1]?.content || '');
    
    // Parse response for potential actions
    const actions = [];
    if (content.toLowerCase().includes('save') || content.toLowerCase().includes('folder')) {
      actions.push({
        type: 'save_to_folder' as const,
        label: 'Save to Folder',
        data: { content }
      });
    }
    if (content.toLowerCase().includes('download') || content.toLowerCase().includes('comparison')) {
      actions.push({
        type: 'download' as const,
        label: 'Download Comparison',
        data: { content }
      });
    }
    if (content.toLowerCase().includes('proposal') || content.toLowerCase().includes('client')) {
      actions.push({
        type: 'create_proposal' as const,
        label: 'Create Client Proposal',
        data: { content }
      });
    }

    return {
      message: content,
      actions: actions.length > 0 ? actions : undefined,
      suggestions: [
        "Show me rate comparisons",
        "Find Medicare documents",
        "Create a client proposal",
        "Calculate savings projections"
      ]
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate AI response. Please check your OpenAI API key and try again.");
  }
}

export async function analyzeDocument(
  base64Content: string,
  mimeType: string,
  fileName: string
): Promise<string> {
  try {
    if (mimeType.startsWith('image/')) {
      const response = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this insurance-related document or image. Extract key information like rates, terms, coverage details, or client information that would be useful for a sales agent."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Content}`
                }
              }
            ],
          },
        ],
        max_tokens: 500,
      });

      return response.choices[0].message.content || "Unable to analyze image content.";
    } else {
      // For non-image files, we'd need to extract text content first
      // This would require additional libraries for PDF parsing, etc.
      return `Document "${fileName}" uploaded successfully. Content analysis requires additional text extraction capabilities.`;
    }
  } catch (error) {
    console.error("Document analysis error:", error);
    return `Unable to analyze document "${fileName}". Please try again.`;
  }
}

export async function generateTitle(content: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "Generate a short, descriptive title (max 6 words) for this conversation based on the content. Focus on the main topic or request."
        },
        {
          role: "user",
          content: `Generate a title for this conversation content: ${content.substring(0, 200)}...`
        }
      ],
      max_tokens: 20,
      temperature: 0.5,
    });

    return response.choices[0].message.content?.trim() || "New Chat";
  } catch (error) {
    console.error("Title generation error:", error);
    return "New Chat";
  }
}

// Helper function to clean markdown content
function cleanMarkdownContent(content: string): string {
  if (!content || typeof content !== 'string') return '';
  
  try {
    return content
      // Convert markdown headers to plain text
      .replace(/^#{1,3}\s+/gm, '')
      // Remove markdown bold/italic syntax safely
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      // Clean up extra whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  } catch (error) {
    console.error('Error cleaning markdown content:', error);
    return content; // Return original content if cleaning fails
  }
}

// Alex Hormozi Visual Formatting System
function applyHormoziFormatting(content: string, userMessage: string): string {
  console.log('🔧 Starting Alex Hormozi formatting transformation');
  console.log('🔍 Original content length:', content.length);
  console.log('🔍 User message:', userMessage);
  
  // Remove any existing HTML code blocks that shouldn't be there
  content = content.replace(/```html[\s\S]*?```/g, '').trim();
  console.log('🔧 After HTML removal:', content.length);
  
  // Enhanced patterns for different content types
  const isStyleQuery = /style|format|design|visual|template|hormozi/i.test(userMessage);
  const isListContent = /^[\d\-\*•]/.test(content) || content.includes('\n-') || content.includes('\n*');
  const isStepByStep = /step|process|how to|guide|tutorial/i.test(content);
  const hasMultipleSections = (content.match(/\n\n/g) || []).length > 2;
  
  console.log('🎯 Pattern analysis:', { isStyleQuery, isListContent, isStepByStep, hasMultipleSections });
  
  if (isStyleQuery) {
    console.log('✨ Applying Hormozi Style Template');
    return createHormoziStyleTemplate(content);
  }
  
  if (isStepByStep || hasMultipleSections) {
    console.log('✨ Applying Process Template');
    return createProcessTemplate(content);
  }
  
  if (isListContent) {
    console.log('✨ Applying List Template');
    return createListTemplate(content);
  }
  
  console.log('✨ Applying Default Template');
  return createDefaultTemplate(content);
}

function createHormoziStyleTemplate(content: string): string {
  return `
<div class="hormozi-container">
  <div class="hormozi-header">
    <h1 class="hormozi-title">🎯 ALEX HORMOZI STYLE RESPONSE</h1>
    <div class="hormozi-accent-bar"></div>
  </div>
  
  <div class="hormozi-content">
    <div class="hormozi-highlight-box">
      <h2 class="hormozi-section-title">💰 KEY INSIGHT</h2>
      <p class="hormozi-emphasis">${content.split('\n')[0] || content.substring(0, 150)}...</p>
    </div>
    
    <div class="hormozi-action-section">
      <h3 class="hormozi-action-title">🚀 ACTION ITEMS</h3>
      <ul class="hormozi-action-list">
        <li class="hormozi-action-item">Review the complete template structure</li>
        <li class="hormozi-action-item">Implement visual hierarchy elements</li>
        <li class="hormozi-action-item">Test responsive design components</li>
      </ul>
    </div>
    
    <div class="hormozi-results-box">
      <h3 class="hormozi-results-title">📊 EXPECTED RESULTS</h3>
      <p class="hormozi-results-text">Professional, engaging visual presentation that captures attention and drives action</p>
    </div>
  </div>
</div>`;
}

function createProcessTemplate(content: string): string {
  try {
    // Clean and parse content
    let cleanContent = cleanMarkdownContent(content);
    const sections = cleanContent.split('\n\n').filter(s => s.trim());
    const firstSection = sections[0] || cleanContent.substring(0, 200);
    
    // Extract step content with simple cleaning
    const stepSections = sections.slice(1).map((section, index) => {
      // Simple cleanup without complex regex
      let cleanSection = section
        .replace(/^Step \d+/, '')
        .replace(/^\d+\./, '')
        .replace(/^###/, '')
        .replace(/^##/, '')
        .replace(/^#/, '')
        .trim();
      
      return cleanSection;
    }).filter(section => section.length > 0);
    
    return `
<div class="hormozi-container">
  <div class="hormozi-header">
    <h1 class="hormozi-title">🎯 STEP-BY-STEP PROCESS</h1>
    <div class="hormozi-accent-bar"></div>
  </div>
  
  <div class="hormozi-overview">
    <p class="hormozi-intro">${firstSection}</p>
  </div>
  
  <div class="hormozi-steps">
    ${stepSections.map((section, index) => `
      <div class="hormozi-step">
        <div class="hormozi-step-number">${index + 1}</div>
        <div class="hormozi-step-content">
          <p>${section}</p>
        </div>
      </div>
    `).join('')}
  </div>
  
  <div class="hormozi-cta-box">
    <h3 class="hormozi-cta-title">🚀 TAKE ACTION NOW</h3>
    <p class="hormozi-cta-text">Implementation is everything. Start with step 1 today.</p>
  </div>
</div>`;
  } catch (error) {
    console.error('Error in createProcessTemplate:', error);
    return createDefaultTemplate(content);
  }
}

function createListTemplate(content: string): string {
  const cleanContent = cleanMarkdownContent(content);
  const lines = cleanContent.split('\n').filter(line => line.trim());
  const title = lines[0] || "Key Points";
  const items = lines.slice(1).map(item => {
    // Remove numbering, bullets, and markdown formatting
    return item
      .replace(/^\d+\.\s*/, '')
      .replace(/^[-*•]\s*/, '')
      .replace(/^\*\*([^*]+)\*\*:?\s*/, '$1: ')
      .trim();
  }).filter(item => item.length > 0);
  
  return `
<div class="hormozi-container">
  <div class="hormozi-header">
    <h1 class="hormozi-title">💎 ${title.toUpperCase()}</h1>
    <div class="hormozi-accent-bar"></div>
  </div>
  
  <div class="hormozi-list-grid">
    ${items.map((item, index) => `
      <div class="hormozi-list-item">
        <div class="hormozi-item-icon">${index + 1}</div>
        <div class="hormozi-item-content">
          <p class="hormozi-item-text">${item}</p>
        </div>
      </div>
    `).join('')}
  </div>
  
  <div class="hormozi-bottom-banner">
    <p class="hormozi-banner-text">🎯 Focus on execution, not perfection</p>
  </div>
</div>`;
}

function createDefaultTemplate(content: string): string {
  const cleanContent = cleanMarkdownContent(content);
  const paragraphs = cleanContent.split('\n\n').filter(p => p.trim());
  
  return `
<div class="hormozi-container">
  <div class="hormozi-header">
    <h1 class="hormozi-title">💰 MERCHANT SERVICES INSIGHT</h1>
    <div class="hormozi-accent-bar"></div>
  </div>
  
  <div class="hormozi-content">
    ${paragraphs.map(paragraph => `
      <div class="hormozi-paragraph">
        <p class="hormozi-text">${paragraph}</p>
      </div>
    `).join('')}
  </div>
  
  <div class="hormozi-action-bar">
    <p class="hormozi-action-prompt">🚀 Ready to implement? Let's make it happen.</p>
  </div>
</div>`;
}
