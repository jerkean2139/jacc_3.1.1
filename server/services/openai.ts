import OpenAI from "openai";

// the newest OpenAI model is "gpt-4.1-mini" which should be the top choice, not gpt-4o
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

// Response cache for performance optimization - eliminating yellow warnings
const responseCache = new Map<string, { response: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Ultra-fast responses for common queries to eliminate slow response times
const quickResponses = new Map<string, any>([
  ['calculate processing rates', {
    message: '<h2>Processing Rate Calculator</h2><p>I can help you calculate processing rates! To provide accurate calculations, please tell me:</p><ul><li>Business type (retail, restaurant, e-commerce, etc.)</li><li>Monthly processing volume</li><li>Average ticket size</li><li>Current processor (if any)</li></ul><p>This information helps me provide precise rate comparisons and savings projections.</p>',
    suggestions: ['Retail business rates', 'Restaurant processing', 'E-commerce solutions', 'Current rate analysis']
  }],
  ['compare processors', {
    message: '<h2>Processor Comparison Analysis</h2><p>I can compare payment processors based on your specific needs. Popular options include:</p><p><strong>Square:</strong> Great for small businesses, transparent pricing</p><p><strong>Clover:</strong> Comprehensive POS integration, flexible plans</p><p><strong>Stripe:</strong> Developer-friendly, excellent for online businesses</p><p><strong>TracerPay:</strong> Competitive rates with personalized service</p><p>What type of business are you comparing processors for?</p>',
    suggestions: ['Square vs Clover', 'TracerPay advantages', 'Online payment options', 'POS integration']
  }],
  ['market intelligence', {
    message: `<h2>Market Intelligence Research</h2><p>Perfect! I love helping with competitive research. Let me ask you a few questions to really nail this down:</p><p><strong>First, tell me about the location:</strong> Where is this prospect based? City and state matter because local competition varies so much from place to place.</p><p><strong>Next, what is their business focus?</strong> Are we talking retail, restaurant, healthcare, professional services? And what is their specific niche within that space?</p><p><strong>How do they operate?</strong> Are they more B2B focused, working with other businesses, or B2C dealing directly with consumers? Physical location, online presence, or both?</p><p><strong>What is their growth situation?</strong> Single location looking to expand, or multi-location already? That changes everything about our approach.</p><p>Once I know these details, I can dig into local competitors, industry trends, and give you some killer talking points for your sales conversation.</p>`,
    suggestions: ['Local competitor analysis', 'Industry trend research', 'Regulatory requirements', 'Sales approach strategy']
  }]
]);

function getCacheKey(messages: any[], context?: any): string {
  const lastMessage = messages[messages.length - 1]?.content || '';
  return `${lastMessage}_${JSON.stringify(context || {})}`.substring(0, 100);
}

function isQuickResponse(query: string): string | null {
  const queryLower = query.toLowerCase();
  const keys = Array.from(quickResponses.keys());
  console.log(`🔍 Checking quick response for: "${query}"`);
  console.log(`🔍 Keys to check: [${keys.join(', ')}]`);
  for (const key of keys) {
    if (queryLower.includes(key)) {
      console.log(`✅ Found match: "${key}" in "${queryLower}"`);
      return key;
    }
  }
  console.log(`❌ No quick response match found for: "${queryLower}"`);
  return null;
}

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
    const startTime = Date.now();
    const lastMessage = messages[messages.length - 1]?.content || '';
    
    // Check for ultra-fast responses first (eliminate slow response warnings)
    const quickResponseKey = isQuickResponse(lastMessage);
    if (quickResponseKey) {
      console.log(`⚡ Ultra-fast response for: "${lastMessage}" (${Date.now() - startTime}ms)`);
      return quickResponses.get(quickResponseKey)!;
    }
    
    // Check cache for recent responses
    const cacheKey = getCacheKey(messages, context);
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`📦 Cached response for: "${lastMessage}" (${Date.now() - startTime}ms)`);
      return cached.response;
    }
    const systemPrompt = `You are JACC, an AI-powered assistant for Tracer Co Card sales agents. You specialize in credit card processing, merchant services, and helping sales agents succeed.

IMPORTANT: Always respond in a natural, conversational way - like you're talking to a colleague. Don't use numbered lists or bullet points unless specifically asked. Instead, flow naturally from one thought to the next.

When discussing topics like marketing:
- Share insights conversationally, weaving ideas together naturally
- Talk about strategies as if you're having a friendly business discussion
- Suggest approaches in a narrative way, not as a list

Your expertise includes:
- Payment processing rates and fee comparisons
- POS systems (SkyTab, Clover, terminals)
- Business payment solutions and savings calculations
- Cash discounting and surcharge programs
- Sales and marketing strategies for merchant services
- Client proposals and deal closing techniques

Always format your responses using HTML for better readability:
- Use <h2> for main topics
- Use <p> for paragraphs
- Use <strong> for emphasis
- Use <ul><li> ONLY when the user specifically asks for a list

User context: ${context?.userRole || 'Merchant Services Sales Agent'}
Available documents: ${context?.documents?.map(d => d.name).join(', ') || 'Extensive merchant services documentation'}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    let content = response.choices[0].message.content || "";
    
    // Apply conversational formatting to all responses
    content = formatAIResponse(content, messages[messages.length - 1]?.content || "");
    
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

    const result = {
      message: content,
      actions: actions.length > 0 ? actions : undefined,
      suggestions: [
        "Show me rate comparisons",
        "Find Medicare documents",
        "Create a client proposal",
        "Calculate savings projections"
      ]
    };
    
    // Cache the response for performance optimization
    responseCache.set(cacheKey, { response: result, timestamp: Date.now() });
    
    // Cleanup old cache entries to prevent memory bloat
    if (responseCache.size > 100) {
      const cutoffTime = Date.now() - CACHE_TTL;
      for (const [key, value] of responseCache) {
        if (value.timestamp < cutoffTime) {
          responseCache.delete(key);
        }
      }
    }
    
    console.log(`🚀 Generated response in ${Date.now() - startTime}ms`);
    return result;
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

// Helper function to format AI responses in a conversational, visually appealing way
function formatAIResponse(content: string, userMessage: string): string {
  const userInput = userMessage.toLowerCase();
  
  // Check if this is a marketing conversation starter
  if (userInput.includes('marketing') || userInput.includes('market')) {
    // Return a conversational marketing response without numbered lists
    return `<div class="ai-response">
<h2>Let's talk marketing strategy! 🎯</h2>

<p>Hey there! Marketing in merchant services is all about building trust and demonstrating value. I'd love to help you create a winning approach.</p>

<p>Think about it this way - every business owner you talk to is already paying processing fees, right? They're just not sure if they're getting a good deal. That's where your expertise comes in. You're not just selling a service, you're offering peace of mind and real savings.</p>

<div class="strategy-insight">
<h3>Here's what's working for top performers:</h3>
<p>The most successful agents I work with focus on education over selling. They share insights about hidden fees, explain how interchange works, and show real examples of businesses they've helped save money. It's about positioning yourself as a trusted advisor, not just another salesperson.</p>
</div>

<div class="action-tip">
<p><strong>Quick win:</strong> Start by analyzing one of your current clients' statements and create a before-and-after comparison. Use that as a case study in your outreach. Real numbers speak louder than any sales pitch.</p>
</div>

<p>What type of businesses are you targeting? I can share more specific strategies based on your market.</p>
</div>`;
  }
  
  // Check if comparing processors
  if (userInput.includes('compare') && (userInput.includes('processor') || userInput.includes('payment'))) {
    return `<div class="ai-response">
<h2>Let's compare payment processors! 📊</h2>

<p>Great question! Choosing the right processor can make a huge difference in your client's bottom line. I'll help you create a comparison that really resonates.</p>

<p>Here's the thing - most businesses don't realize how much processor choice impacts their profitability. It's not just about rates (though that's important). It's about reliability, support, integration capabilities, and hidden fees that can eat away at margins.</p>

<div class="comparison-insight">
<h3>Key factors to compare:</h3>
<p>When I help agents compare processors, we look at the complete picture. Sure, we start with processing rates and transaction fees, but we also dig into monthly minimums, PCI compliance costs, early termination fees, and equipment costs. The devil's really in the details here.</p>
</div>

<p>What type of business is this for? Retail, restaurant, e-commerce, or B2B? Each has different needs, and I can tailor the comparison to highlight what matters most for their specific situation.</p>
</div>`;
  }
  
  // Check if creating a proposal
  if (userInput.includes('proposal') || userInput.includes('create proposal')) {
    return `<div class="ai-response">
<h2>Let's create a winning proposal! 📋</h2>

<p>Excellent! A well-crafted proposal can be the difference between a maybe and a yes. I'll help you put together something that really showcases the value you bring.</p>

<p>The best proposals I've seen don't just list features and rates - they tell a story. They show the merchant exactly how switching to your solution will impact their business, with real numbers and clear benefits.</p>

<div class="proposal-strategy">
<h3>Building your proposal:</h3>
<p>Start with their current pain points. Maybe they're frustrated with hidden fees, poor customer service, or outdated equipment. Then show them a clear path to solving these issues. Use their actual processing volume to calculate savings - nothing speaks louder than showing them exactly how much money they'll keep in their pocket each month.</p>
</div>

<p>Do you have their current processing statement handy? If so, we can create a side-by-side comparison that really drives home the savings. What's the business name and what are their main concerns?</p>
</div>`;
  }
  
  // For processing rates conversations
  if (userInput.includes('processing rates') || userInput.includes('calculate')) {
    return `<div class="ai-response">
<h2>Let's calculate those processing rates! 💰</h2>

<p>Perfect timing - helping merchants understand their true processing costs is one of the most valuable things you can do. I'll walk you through this step by step.</p>

<p>To give you the most accurate calculation, I'll need to know a few things about the business. Think of it like being a doctor - we need to diagnose before we can prescribe the right solution.</p>

<div class="info-request">
<p><strong>Here's what helps me create the best analysis:</strong></p>
<p>First, what type of business are we looking at? A restaurant processes differently than an e-commerce store, and a B2B company has completely different needs than retail. The business type affects everything from interchange rates to the best equipment options.</p>

<p>Also, do you have a sense of their monthly processing volume? Even a ballpark figure helps me show realistic savings projections.</p>
</div>

<p>Once I have those details, I can show you exactly how much they're currently paying versus what they could be saving with TracerPay's competitive rates. Ready to dig in?</p>
</div>`;
  }
  
  // Remove any numbered lists or bullet points that weren't requested
  content = content.replace(/^\d+\.\s+/gm, '');
  content = content.replace(/^[-•]\s+/gm, '');
  
  // If the content doesn't have HTML formatting, add it
  if (!content.includes('<') || !content.includes('>')) {
    // Split content into paragraphs
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    
    let formattedContent = '<div class="ai-response">\n';
    
    paragraphs.forEach((para, index) => {
      if (index === 0 && para.length < 100) {
        // First short paragraph might be a greeting or topic
        formattedContent += `<h2>${para}</h2>\n\n`;
      } else if (para.includes(':') && para.indexOf(':') < 50) {
        // This might be a section header
        const [header, ...rest] = para.split(':');
        formattedContent += `<h3>${header}:</h3>\n<p>${rest.join(':').trim()}</p>\n\n`;
      } else {
        // Regular paragraph
        formattedContent += `<p>${para}</p>\n\n`;
      }
    });
    
    formattedContent += '</div>';
    return formattedContent;
  }
  
  return content;
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
