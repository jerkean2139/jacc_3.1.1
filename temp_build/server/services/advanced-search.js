import { db } from '../db';
import { documentChunks } from '../../shared/schema';
import { or, ilike } from 'drizzle-orm';
import OpenAI from 'openai';
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
export class AdvancedSearchService {
    // Enhanced query expansion with semantic understanding
    async expandSearchQuery(query) {
        const synonymMapping = {
            'pricing': ['rates', 'fees', 'costs', 'charges', 'price', 'payment'],
            'clearent': ['clearent', 'clereant', 'clearant', 'clerent'],
            'tsys': ['tsys', 't-sys', 'total system services', 'global payments'],
            'equipment': ['hardware', 'terminal', 'device', 'pos', 'reader'],
            'restaurant': ['dining', 'food service', 'hospitality', 'eatery'],
            'retail': ['merchant', 'store', 'shop', 'business'],
            'support': ['help', 'assistance', 'service', 'contact', 'phone'],
            'integration': ['connect', 'api', 'sync', 'interface', 'link'],
            'alliant': ['alliant', 'aliant', 'alliance'],
            'shift4': ['shift4', 'shift 4', 'shift four'],
            'merchantlynx': ['merchant lynx', 'merchantlynx', 'merchant-lynx'],
            'micamp': ['micamp', 'mi camp', 'mi-camp'],
            'authorizenet': ['authorize.net', 'authnet', 'authorize net']
        };
        const expandedTerms = [query.toLowerCase()];
        // Add direct synonyms
        for (const [key, synonyms] of Object.entries(synonymMapping)) {
            if (query.toLowerCase().includes(key)) {
                expandedTerms.push(...synonyms);
            }
        }
        // Add fuzzy matches for common typos
        const commonTypos = {
            'clereant': 'clearent',
            'clearant': 'clearent',
            'clerent': 'clearent',
            'prcing': 'pricing',
            'equipement': 'equipment',
            'aliant': 'alliant',
            'authnet': 'authorize.net'
        };
        for (const [typo, correct] of Object.entries(commonTypos)) {
            if (query.toLowerCase().includes(typo)) {
                expandedTerms.push(correct);
            }
        }
        return Array.from(new Set(expandedTerms));
    }
    // Generate semantic embedding for query
    async generateEmbedding(text) {
        try {
            if (!openai) {
                console.log('OpenAI not available for embeddings');
                return [];
            }
            const response = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: text,
            });
            return response.data[0].embedding;
        }
        catch (error) {
            console.error('Error generating embedding:', error);
            return [];
        }
    }
    // Highlight matching terms in content
    highlightMatches(content, terms) {
        let highlighted = content;
        terms.forEach(term => {
            const regex = new RegExp(`(${term})`, 'gi');
            highlighted = highlighted.replace(regex, '<mark>$1</mark>');
        });
        return highlighted;
    }
    // Advanced search with semantic understanding
    async searchDocuments(query, limit = 20) {
        try {
            // Expand query terms
            const expandedTerms = await this.expandSearchQuery(query);
            console.log(`🔍 Advanced Search - Expanded terms:`, expandedTerms);
            // Build keyword search conditions
            const searchConditions = expandedTerms.map(term => ilike(documentChunks.content, `%${term}%`));
            // Execute keyword search
            const keywordResults = await db
                .select()
                .from(documentChunks)
                .where(or(...searchConditions))
                .limit(limit);
            console.log(`📊 Advanced Search - Found ${keywordResults.length} keyword matches`);
            // Process results with enhanced metadata
            const enhancedResults = keywordResults.map((chunk, index) => {
                const keywordMatches = expandedTerms.filter(term => chunk.content.toLowerCase().includes(term.toLowerCase()));
                const relevanceScore = this.calculateRelevanceScore(chunk.content, expandedTerms);
                const highlightedContent = this.highlightMatches(chunk.content, keywordMatches);
                return {
                    id: chunk.id,
                    score: relevanceScore,
                    documentId: chunk.documentId,
                    content: chunk.content,
                    highlightedContent,
                    metadata: {
                        documentName: `Document ${chunk.documentId}`,
                        relevanceScore,
                        semanticMatch: false, // Keyword match for now
                        keywordMatches,
                        contextualInfo: this.extractContextualInfo(chunk.content, expandedTerms),
                        chunkIndex: chunk.chunkIndex || 0,
                        mimeType: 'application/pdf'
                    }
                };
            });
            // Sort by relevance score
            enhancedResults.sort((a, b) => b.score - a.score);
            console.log(`✅ Advanced Search - Returning ${enhancedResults.length} enhanced results`);
            return enhancedResults;
        }
        catch (error) {
            console.error('Error in advanced search:', error);
            return [];
        }
    }
    // Calculate relevance score based on multiple factors
    calculateRelevanceScore(content, terms) {
        let score = 0;
        const contentLower = content.toLowerCase();
        terms.forEach(term => {
            const termLower = term.toLowerCase();
            // Count occurrences
            const matches = (contentLower.match(new RegExp(termLower, 'g')) || []).length;
            score += matches * 10;
            // Boost for exact phrase matches
            if (contentLower.includes(termLower)) {
                score += 20;
            }
            // Boost for title/header matches (look for terms at beginning of sentences)
            const sentences = content.split(/[.!?]/);
            sentences.forEach(sentence => {
                if (sentence.trim().toLowerCase().startsWith(termLower)) {
                    score += 30;
                }
            });
        });
        // Normalize by content length
        return Math.min(score / (content.length / 100), 100);
    }
    // Extract contextual information around matches
    extractContextualInfo(content, terms) {
        const contentLower = content.toLowerCase();
        for (const term of terms) {
            const index = contentLower.indexOf(term.toLowerCase());
            if (index !== -1) {
                const start = Math.max(0, index - 100);
                const end = Math.min(content.length, index + term.length + 100);
                const context = content.substring(start, end);
                return start > 0 ? '...' + context : context;
            }
        }
        return content.substring(0, 200);
    }
}
export const advancedSearchService = new AdvancedSearchService();
