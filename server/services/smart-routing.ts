import { db } from "../db";
import { folders } from "../../shared/schema";
import { eq } from "drizzle-orm";

export interface FolderRoute {
  namespace: string;
  priority: number;
  folderType: string;
  confidence: number;
}

export interface QueryClassification {
  intent: 'processor_info' | 'gateway_info' | 'hardware_info' | 'sales_material' | 'rate_comparison' | 'general';
  processors: string[];
  gateways: string[];
  hardwareTypes: string[];
  confidence: number;
  suggestedNamespaces: string[];
}

export class SmartRoutingService {
  private processorKeywords = {
    'clearent': ['clearent', 'clearant', 'clear', 'ent'],
    'alliant': ['alliant', 'aliant', 'alliance'],
    'shift4': ['shift4', 'shift 4', 'shift four', 'shift'],
    'micamp': ['micamp', 'mi camp', 'mi-camp'],
    'merchant_lynx': ['merchant lynx', 'merchantlynx', 'merchant-lynx', 'lynx'],
    'authorize_net': ['authorize.net', 'authnet', 'authorize net', 'auth net'],
    'tracerpay': ['tracerpay', 'tracer pay', 'tracer', 'tpay'],
    'tsys': ['tsys', 'total system services', 'total systems'],
    'first_data': ['first data', 'firstdata', 'fd', 'fiserv'],
    'worldpay': ['worldpay', 'world pay', 'wp'],
    'square': ['square', 'sqr'],
    'stripe': ['stripe', 'payment processing'],
    'chase': ['chase paymentech', 'chase', 'paymentech'],
  };

  private gatewayKeywords = {
    'authorize_net': ['authorize.net', 'authnet', 'authorize net', 'auth net'],
    'stripe': ['stripe gateway', 'stripe api'],
    'paypal': ['paypal', 'pay pal', 'pp'],
    'square': ['square api', 'square gateway'],
    'braintree': ['braintree', 'brain tree'],
  };

  private hardwareKeywords = {
    'terminals': ['terminal', 'pos', 'point of sale', 'credit card reader', 'chip reader'],
    'mobile': ['mobile reader', 'mobile payment', 'smartphone', 'tablet'],
    'online': ['virtual terminal', 'online payment', 'e-commerce', 'web payment'],
    'pinpad': ['pin pad', 'pinpad', 'pin entry'],
    'clover': ['clover', 'clover pos', 'clover system'],
  };

  private salesKeywords = {
    'presentations': ['presentation', 'pitch', 'proposal', 'deck', 'slides'],
    'comparisons': ['comparison', 'compare', 'vs', 'versus', 'rates'],
    'pricing': ['pricing', 'cost', 'fee', 'rate', 'price'],
    'contracts': ['contract', 'agreement', 'terms', 'conditions'],
    'marketing': ['marketing', 'sales strategy', 'outreach', 'prospecting'],
  };

  async classifyQuery(query: string): Promise<QueryClassification> {
    const lowerQuery = query.toLowerCase();
    const classification: QueryClassification = {
      intent: 'general',
      processors: [],
      gateways: [],
      hardwareTypes: [],
      confidence: 0,
      suggestedNamespaces: [],
    };

    let confidencePoints = 0;

    // Check for processor mentions
    for (const [processor, keywords] of Object.entries(this.processorKeywords)) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        classification.processors.push(processor);
        classification.suggestedNamespaces.push(`processors/${processor}`);
        confidencePoints += 20;
      }
    }

    // Check for gateway mentions
    for (const [gateway, keywords] of Object.entries(this.gatewayKeywords)) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        classification.gateways.push(gateway);
        classification.suggestedNamespaces.push(`gateways/${gateway}`);
        confidencePoints += 15;
      }
    }

    // Check for hardware mentions
    for (const [hardware, keywords] of Object.entries(this.hardwareKeywords)) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        classification.hardwareTypes.push(hardware);
        classification.suggestedNamespaces.push(`hardware/${hardware}`);
        confidencePoints += 10;
      }
    }

    // Determine intent based on context
    if (classification.processors.length > 0 || classification.gateways.length > 0) {
      if (lowerQuery.includes('rate') || lowerQuery.includes('pricing') || lowerQuery.includes('cost')) {
        classification.intent = 'rate_comparison';
        confidencePoints += 25;
      } else {
        classification.intent = 'processor_info';
        confidencePoints += 20;
      }
    } else if (classification.hardwareTypes.length > 0) {
      classification.intent = 'hardware_info';
      confidencePoints += 15;
    } else {
      // Check for sales material intent
      for (const [category, keywords] of Object.entries(this.salesKeywords)) {
        if (keywords.some(keyword => lowerQuery.includes(keyword))) {
          classification.intent = 'sales_material';
          classification.suggestedNamespaces.push(`sales/${category}`);
          confidencePoints += 10;
          break;
        }
      }
    }

    // Calculate final confidence (0-100)
    classification.confidence = Math.min(confidencePoints, 100);

    return classification;
  }

  async suggestFolders(query: string): Promise<FolderRoute[]> {
    const classification = await this.classifyQuery(query);
    const routes: FolderRoute[] = [];

    try {
      const allFolders = await db.select().from(folders);
      
      // Score folders based on classification
      for (const folder of allFolders) {
        const folderNameLower = folder.name.toLowerCase();
        let priority = 0;

        // Processor-specific folders
        if (classification.processors.length > 0) {
          classification.processors.forEach(processor => {
            if (folderNameLower.includes(processor.replace('_', ' ')) || 
                folderNameLower.includes(processor.replace('_', ''))) {
              priority += 80;
            }
          });
        }

        // Hardware-specific folders
        if (classification.hardwareTypes.length > 0) {
          classification.hardwareTypes.forEach(hardware => {
            if (folderNameLower.includes(hardware)) {
              priority += 60;
            }
          });
        }

        // General category matching
        if (classification.intent === 'rate_comparison' && 
            (folderNameLower.includes('pricing') || folderNameLower.includes('rates'))) {
          priority += 70;
        }

        if (classification.intent === 'sales_material' && 
            (folderNameLower.includes('sales') || folderNameLower.includes('marketing'))) {
          priority += 65;
        }

        if (priority > 0) {
          routes.push({
            namespace: folder.name,
            priority,
            folderType: this.determineFolderType(folder.name),
            confidence: Math.min(priority, 100)
          });
        }
      }

      // Sort by priority
      routes.sort((a, b) => b.priority - a.priority);

      return routes.slice(0, 5); // Return top 5 matches

    } catch (error) {
      console.error('Error suggesting folders:', error);
      return [];
    }
  }

  private determineFolderType(folderName: string): string {
    const nameLower = folderName.toLowerCase();
    
    if (nameLower.includes('pricing') || nameLower.includes('rates')) {
      return 'pricing';
    }
    if (nameLower.includes('hardware') || nameLower.includes('pos') || nameLower.includes('terminal')) {
      return 'hardware';
    }
    if (nameLower.includes('sales') || nameLower.includes('marketing')) {
      return 'sales';
    }
    if (nameLower.includes('contract') || nameLower.includes('agreement')) {
      return 'contracts';
    }
    
    // Check if it's a processor name
    for (const processorKeywords of Object.values(this.processorKeywords)) {
      if (processorKeywords.some(keyword => nameLower.includes(keyword))) {
        return 'processor';
      }
    }
    
    return 'general';
  }

  // Enhanced method to get contextual search suggestions
  async getSearchSuggestions(query: string): Promise<string[]> {
    const classification = await this.classifyQuery(query);
    const suggestions: string[] = [];

    // Add processor-specific suggestions
    if (classification.processors.length > 0) {
      classification.processors.forEach(processor => {
        suggestions.push(`${processor} rates and fees`);
        suggestions.push(`${processor} equipment options`);
        suggestions.push(`${processor} integration guide`);
      });
    }

    // Add intent-based suggestions
    switch (classification.intent) {
      case 'rate_comparison':
        suggestions.push('processor rate comparison chart');
        suggestions.push('interchange plus pricing');
        suggestions.push('payment processing fees breakdown');
        break;
      case 'hardware_info':
        suggestions.push('POS terminal options');
        suggestions.push('credit card reader compatibility');
        suggestions.push('mobile payment solutions');
        break;
      case 'sales_material':
        suggestions.push('sales presentation templates');
        suggestions.push('client proposal examples');
        suggestions.push('marketing strategies');
        break;
    }

    return suggestions.slice(0, 5);
  }
}

export const smartRoutingService = new SmartRoutingService();