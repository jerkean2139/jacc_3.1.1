/**
 * Ultra-fast response cache for common queries
 * Provides instant responses to reduce server load
 */

export interface FastResponseData {
  message: string;
  responseTime: number;
  sources?: Array<{
    name: string;
    url: string;
    relevanceScore: number;
  }>;
}

export class FastResponseCache {
  private responses = new Map<string, FastResponseData>();
  
  constructor() {
    this.initializeResponses();
  }
  
  private initializeResponses() {
    // Pre-computed responses for ultra-fast delivery
    this.responses.set('calculate processing rates', {
      message: `<h2>Processing Rate Calculator</h2>
      <p>I'll help you calculate competitive processing rates for your merchant.</p>
      <ul>
        <li><strong>Interchange Plus:</strong> Most transparent - typically 0.15% + $0.05 above interchange</li>
        <li><strong>Tiered Rates:</strong> Qualified/Mid-Qualified/Non-Qualified structure</li>
        <li><strong>Flat Rate:</strong> Single rate like 2.9% + $0.30 per transaction</li>
      </ul>
      <p><strong>Quick Examples:</strong></p>
      <ul>
        <li>Restaurant: 2.65% + 10¢ average</li>
        <li>Retail: 2.45% + 10¢ average</li>
        <li>E-commerce: 2.9% + 30¢ average</li>
      </ul>
      <p>What type of business and monthly volume are you working with?</p>`,
      responseTime: 45
    });
    
    this.responses.set('compare payment processors', {
      message: `<h2>Payment Processor Comparison</h2>
      <p>Here are our top processor partners with their key strengths:</p>
      <ul>
        <li><strong>Alliant:</strong> 2.4%+10¢ average rates, excellent customer support</li>
        <li><strong>Merchant Lynx:</strong> Advanced POS systems, great for retail</li>
        <li><strong>Clearent:</strong> Transparent interchange-plus pricing</li>
        <li><strong>MiCamp:</strong> Specialized solutions for specific industries</li>
        <li><strong>Authorize.Net:</strong> Robust online payment processing</li>
      </ul>
      <p><strong>Key Factors to Consider:</strong></p>
      <ul>
        <li>Industry specialization</li>
        <li>Technology requirements</li>
        <li>Processing volume tiers</li>
        <li>Integration capabilities</li>
      </ul>
      <p>What's most important for this merchant - lowest rates, technology, or industry expertise?</p>`,
      responseTime: 50
    });
    
    this.responses.set('create merchant proposal', {
      message: `<h2>Competitive Proposal Builder</h2>
      <p>Let me guide you through creating a winning proposal:</p>
      <ul>
        <li><strong>Business Analysis:</strong> Industry type, processing volume, average ticket</li>
        <li><strong>Rate Structure:</strong> Competitive pricing that beats their current rates</li>
        <li><strong>Equipment Package:</strong> POS terminals, card readers, software</li>
        <li><strong>Value Adds:</strong> Customer support, reporting tools, integrations</li>
        <li><strong>Implementation:</strong> Setup timeline and training plan</li>
      </ul>
      <p><strong>Proposal Components:</strong></p>
      <ul>
        <li>Executive summary with savings projection</li>
        <li>Detailed rate breakdown vs current processor</li>
        <li>Equipment and software recommendations</li>
        <li>Implementation timeline and support plan</li>
      </ul>
      <p>Tell me about this merchant - what industry and what are their current rates?</p>`,
      responseTime: 55
    });
    
    this.responses.set('tracerpay rates', {
      message: `<h2>TracerPay Competitive Rates</h2>
      <p>TracerPay offers highly competitive merchant services:</p>
      <ul>
        <li><strong>Qualified Transactions:</strong> 2.25% + 10¢</li>
        <li><strong>Mid-Qualified:</strong> 2.75% + 10¢</li>
        <li><strong>Non-Qualified:</strong> 3.25% + 10¢</li>
        <li><strong>Debit Cards:</strong> 1.65% + 25¢</li>
      </ul>
      <p><strong>Value-Added Services:</strong></p>
      <ul>
        <li>Free terminal placement with qualifying accounts</li>
        <li>24/7 customer support</li>
        <li>Next-day funding available</li>
        <li>Transparent pricing with no hidden fees</li>
        <li>Quick approval and setup process</li>
      </ul>
      <p>Would you like specific rates for a particular industry or processing volume?</p>`,
      responseTime: 40
    });
  }
  
  get(query: string): FastResponseData | null {
    const normalizedQuery = query.toLowerCase().trim();
    
    // Direct matches
    if (this.responses.has(normalizedQuery)) {
      return this.responses.get(normalizedQuery)!;
    }
    
    // Partial matches for flexibility
    for (const [key, response] of this.responses.entries()) {
      if (this.isQueryMatch(normalizedQuery, key)) {
        return response;
      }
    }
    
    return null;
  }
  
  private isQueryMatch(query: string, templateKey: string): boolean {
    const queryWords = query.split(' ');
    const keyWords = templateKey.split(' ');
    
    // Check if query contains key concepts from template
    const matches = keyWords.filter(keyWord => 
      queryWords.some(queryWord => 
        queryWord.includes(keyWord) || keyWord.includes(queryWord)
      )
    );
    
    // Require at least 50% word match for flexibility
    return matches.length >= Math.ceil(keyWords.length * 0.5);
  }
  
  // Add new fast response
  addResponse(key: string, response: FastResponseData) {
    this.responses.set(key.toLowerCase(), response);
  }
  
  // Get all available fast responses
  getAllKeys(): string[] {
    return Array.from(this.responses.keys());
  }
}

export const fastResponseCache = new FastResponseCache();