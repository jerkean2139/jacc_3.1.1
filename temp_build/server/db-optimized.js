import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from '@shared/schema';
import { DatabaseOptimizer } from './config/database-optimization';
// Create connection pool with optimized settings
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ...DatabaseOptimizer.POOL_CONFIG
});
// Create drizzle instance with connection pool
export const db = drizzle(pool, { schema });
// Export optimized query functions
export const optimizedQueries = {
    /**
     * Get user chats with optimized query
     */
    async getUserChats(userId) {
        const cacheKey = `user_chats_${userId}`;
        const cached = DatabaseOptimizer.getCached(cacheKey);
        if (cached)
            return cached;
        const result = await db.query.chats.findMany({
            where: (chats, { eq }) => eq(chats.userId, userId),
            orderBy: (chats, { desc }) => [desc(chats.updatedAt)],
            limit: 50
        });
        DatabaseOptimizer.setCached(cacheKey, result);
        return result;
    },
    /**
     * Get chat messages with pagination
     */
    async getChatMessages(chatId, limit = 50, offset = 0) {
        const cacheKey = `chat_messages_${chatId}_${limit}_${offset}`;
        const cached = DatabaseOptimizer.getCached(cacheKey);
        if (cached)
            return cached;
        const result = await db.query.messages.findMany({
            where: (messages, { eq }) => eq(messages.chatId, chatId),
            orderBy: (messages, { desc }) => [desc(messages.createdAt)],
            limit,
            offset
        });
        DatabaseOptimizer.setCached(cacheKey, result);
        return result;
    },
    /**
     * Get documents with folder info (avoid N+1)
     */
    async getDocumentsWithFolders(userId) {
        const cacheKey = `user_documents_${userId}`;
        const cached = DatabaseOptimizer.getCached(cacheKey);
        if (cached)
            return cached;
        const result = await db.query.documents.findMany({
            with: {
                folder: true
            },
            orderBy: (documents, { desc }) => [desc(documents.createdAt)]
        });
        DatabaseOptimizer.setCached(cacheKey, result);
        return result;
    }
};
// Test database connection
export async function testDatabaseConnection() {
    try {
        console.log('Testing database connection...');
        const result = await pool.query('SELECT 1');
        console.log('Database connection test successful');
        return true;
    }
    catch (error) {
        console.error('Database connection test failed:', error);
        return false;
    }
}
