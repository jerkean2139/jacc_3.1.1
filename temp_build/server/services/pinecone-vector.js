import { Pinecone } from '@pinecone-database/pinecone';
import Anthropic from '@anthropic-ai/sdk';
import { documentEncryption } from '../encryption';
export class PineconeVectorService {
    pinecone;
    anthropic;
    indexName = 'merchant-docs';
    constructor() {
        if (!process.env.PINECONE_API_KEY) {
            throw new Error('PINECONE_API_KEY environment variable is required');
        }
        this.pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        });
        this.anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });
    }
    async createEmbedding(text) {
        // Create a simple embedding using text similarity
        // This is a fallback since we don't have embedding API
        const words = text.toLowerCase().split(/\s+/);
        const embedding = new Array(384).fill(0);
        for (let i = 0; i < words.length && i < 384; i++) {
            embedding[i] = words[i].charCodeAt(0) / 255;
        }
        return embedding;
    }
    async ensureIndexExists() {
        try {
            // Check if index exists, if not create it
            try {
                await this.pinecone.describeIndex(this.indexName);
                console.log(`Index ${this.indexName} already exists`);
            }
            catch (error) {
                console.log(`Creating index ${this.indexName}...`);
                await this.pinecone.createIndex({
                    name: this.indexName,
                    dimension: 384,
                    metric: 'cosine',
                    spec: {
                        serverless: {
                            cloud: 'aws',
                            region: 'us-east-1'
                        }
                    }
                });
                console.log(`Index ${this.indexName} created successfully`);
                // Wait a moment for index to be ready
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
        catch (error) {
            console.error('Error ensuring index exists:', error);
        }
    }
    async indexDocument(document, namespace = 'default') {
        try {
            await this.ensureIndexExists();
            const index = this.pinecone.Index(this.indexName);
            const vectors = [];
            for (const chunk of document.chunks) {
                const embedding = await this.createEmbedding(chunk.content);
                // Encrypt sensitive content before storing
                const { encrypted, iv } = documentEncryption.encrypt(chunk.content);
                vectors.push({
                    id: chunk.id,
                    values: embedding,
                    metadata: {
                        documentId: document.id,
                        documentName: document.name,
                        webViewLink: document.metadata.webViewLink,
                        chunkIndex: chunk.chunkIndex,
                        mimeType: document.metadata.mimeType,
                        content: encrypted, // Store encrypted content
                        contentIv: iv, // Store IV for decryption
                        namespace: namespace,
                        folderType: document.folderType || 'custom',
                        encrypted: true // Flag to indicate encryption
                    }
                });
            }
            await index.namespace(namespace).upsert(vectors);
            console.log(`Indexed ${vectors.length} encrypted chunks for document: ${document.name} in namespace: ${namespace}`);
        }
        catch (error) {
            console.error('Error indexing document:', error);
        }
    }
    async searchDocuments(query, topK = 5, namespaces = ['default']) {
        try {
            await this.ensureIndexExists();
            const index = this.pinecone.Index(this.indexName);
            const queryEmbedding = await this.createEmbedding(query);
            const results = [];
            // Search across specified namespaces
            for (const namespace of namespaces) {
                try {
                    const searchResponse = await index.namespace(namespace).query({
                        vector: queryEmbedding,
                        topK: Math.ceil(topK / namespaces.length),
                        includeMetadata: true,
                        includeValues: false
                    });
                    // Transform results to our format
                    for (const match of searchResponse.matches || []) {
                        if (match.metadata) {
                            // Decrypt content if it was encrypted
                            let content = match.metadata.content;
                            if (match.metadata.encrypted && match.metadata.contentIv) {
                                try {
                                    content = documentEncryption.decrypt(content, match.metadata.contentIv);
                                }
                                catch (decryptError) {
                                    console.error('Failed to decrypt content:', decryptError);
                                    continue; // Skip this result if decryption fails
                                }
                            }
                            results.push({
                                id: match.id,
                                score: match.score || 0,
                                documentId: match.metadata.documentId,
                                content: content,
                                metadata: {
                                    documentName: match.metadata.documentName,
                                    webViewLink: match.metadata.webViewLink,
                                    chunkIndex: match.metadata.chunkIndex,
                                    mimeType: match.metadata.mimeType,
                                }
                            });
                        }
                    }
                }
                catch (namespaceError) {
                    console.log(`Namespace ${namespace} not found or empty, skipping...`);
                }
            }
            // Sort by score and return top results
            return results.sort((a, b) => b.score - a.score).slice(0, topK);
        }
        catch (error) {
            console.error('Error searching documents:', error);
            return [];
        }
    }
}
export const pineconeVectorService = new PineconeVectorService();
