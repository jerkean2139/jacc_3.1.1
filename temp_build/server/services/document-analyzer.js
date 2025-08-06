import fs from 'fs/promises';
import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
export class DocumentAnalyzer {
    static instance;
    openai;
    anthropic;
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        this.anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY || ''
        });
    }
    static getInstance() {
        if (!DocumentAnalyzer.instance) {
            DocumentAnalyzer.instance = new DocumentAnalyzer();
        }
        return DocumentAnalyzer.instance;
    }
    /**
     * Analyze document using Claude's vision and document capabilities
     */
    async analyzeDocument(filePath, mimeType) {
        try {
            // Read file content
            const fileBuffer = await fs.readFile(filePath);
            const base64Content = fileBuffer.toString('base64');
            // Determine media type for Claude
            let mediaType = 'application/pdf';
            if (mimeType) {
                mediaType = mimeType;
            }
            else if (filePath.endsWith('.png')) {
                mediaType = 'image/png';
            }
            else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
                mediaType = 'image/jpeg';
            }
            else if (filePath.endsWith('.txt')) {
                mediaType = 'text/plain';
            }
            // For text files, analyze directly
            if (mediaType === 'text/plain') {
                const textContent = fileBuffer.toString('utf-8');
                return this.analyzeTextContent(textContent);
            }
            // Use Claude 4 Sonnet for superior document analysis with vision capabilities
            const response = await this.anthropic.messages.create({
                model: 'claude-4-sonnet-20250109',
                max_tokens: 8000,
                messages: [{
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: `Analyze this merchant services document and extract:

1. Full text content
2. Document type (statement, contract, marketing material, etc.)
3. Key business insights relevant to merchant services
4. Processing rates, fees, and pricing information
5. Merchant information and competitive intelligence
6. Summary of important findings

Please provide structured analysis focusing on actionable business intelligence for sales agents.`
                            },
                            {
                                type: 'image',
                                source: {
                                    type: 'base64',
                                    media_type: mediaType,
                                    data: base64Content
                                }
                            }
                        ]
                    }],
                system: 'You are an expert merchant services analyst with deep expertise in payment processing industry intelligence. Extract comprehensive business intelligence from documents with focus on competitive analysis, pricing structures, fee schedules, merchant data, and actionable insights for sales professionals. Provide detailed analysis that enables competitive positioning and strategic decision-making.'
            });
            const analysisText = response.content[0].type === 'text' ? response.content[0].text : '';
            return this.parseClaudeAnalysis(analysisText);
        }
        catch (error) {
            console.error('Document analysis failed:', error);
            // Fallback to basic file reading for text files
            if (filePath.endsWith('.txt')) {
                try {
                    const textContent = await fs.readFile(filePath, 'utf-8');
                    return this.analyzeTextContent(textContent);
                }
                catch (fallbackError) {
                    console.error('Fallback text analysis failed:', fallbackError);
                }
            }
            return {
                content: 'Document analysis failed - please try again or contact support.',
                summary: 'Analysis unavailable',
                keyInsights: ['Analysis failed due to technical error'],
                documentType: 'unknown',
                confidence: 0,
                wordCount: 0
            };
        }
    }
    /**
     * Parse Claude's analysis response into structured format
     */
    parseClaudeAnalysis(analysisText) {
        const lines = analysisText.split('\n');
        let content = '';
        let summary = '';
        let keyInsights = [];
        let documentType = 'document';
        let extractedData = {};
        // Extract sections from Claude's response
        let currentSection = '';
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.toLowerCase().includes('document type:')) {
                documentType = trimmed.split(':')[1]?.trim().toLowerCase() || 'document';
            }
            else if (trimmed.toLowerCase().includes('summary:')) {
                currentSection = 'summary';
            }
            else if (trimmed.toLowerCase().includes('key insights:') || trimmed.toLowerCase().includes('insights:')) {
                currentSection = 'insights';
            }
            else if (trimmed.toLowerCase().includes('processing rates:') || trimmed.toLowerCase().includes('rates:')) {
                currentSection = 'rates';
            }
            else if (trimmed.toLowerCase().includes('fees:')) {
                currentSection = 'fees';
            }
            else if (trimmed.toLowerCase().includes('content:') || trimmed.toLowerCase().includes('text:')) {
                currentSection = 'content';
            }
            else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
                const insight = trimmed.substring(2);
                if (currentSection === 'insights') {
                    keyInsights.push(insight);
                }
                else if (currentSection === 'rates') {
                    extractedData.processingRates = extractedData.processingRates || [];
                    extractedData.processingRates.push(insight);
                }
                else if (currentSection === 'fees') {
                    extractedData.fees = extractedData.fees || [];
                    extractedData.fees.push(insight);
                }
            }
            else if (trimmed && !trimmed.endsWith(':')) {
                if (currentSection === 'summary') {
                    summary += trimmed + ' ';
                }
                else if (currentSection === 'content') {
                    content += trimmed + '\n';
                }
            }
        }
        // If no structured content found, use the full analysis as content
        if (!content && !summary) {
            content = analysisText;
            summary = analysisText.substring(0, 200) + '...';
        }
        // Generate insights if none found
        if (keyInsights.length === 0) {
            keyInsights = [
                'Document processed successfully',
                'Content extracted for business analysis',
                'Available for competitive intelligence review'
            ];
        }
        const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
        return {
            content: content.trim(),
            summary: summary.trim(),
            keyInsights,
            documentType,
            confidence: 95, // High confidence with Claude analysis
            wordCount,
            extractedData
        };
    }
    /**
     * Analyze plain text content using AI
     */
    async analyzeTextContent(textContent) {
        try {
            const response = await this.anthropic.messages.create({
                model: 'claude-4-sonnet-20250109',
                max_tokens: 4000,
                messages: [{
                        role: 'user',
                        content: `Analyze this merchant services text and provide:

1. Document type classification
2. Key business insights
3. Processing rates and fees mentioned
4. Competitive intelligence
5. Brief summary

Text content:
${textContent}`
                    }],
                system: 'You are a senior merchant services business analyst with expertise in payment processing, competitive intelligence, and business strategy. Focus on extracting actionable insights, detailed pricing information, fee structures, merchant profiles, and competitive intelligence that sales professionals can immediately use for strategic advantage.'
            });
            const analysisText = response.content[0].type === 'text' ? response.content[0].text : '';
            const result = this.parseClaudeAnalysis(analysisText);
            result.content = textContent; // Keep original text as content
            return result;
        }
        catch (error) {
            console.error('Text analysis failed:', error);
            // Basic fallback analysis
            const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length;
            return {
                content: textContent,
                summary: textContent.substring(0, 200) + (textContent.length > 200 ? '...' : ''),
                keyInsights: ['Document content extracted', 'Ready for manual review'],
                documentType: 'text',
                confidence: 85,
                wordCount
            };
        }
    }
}
