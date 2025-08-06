import { users, folders, chats, messages, documents, favorites, apiKeys, userChatLogs, userPrompts, userStats, adminSettings, personalDocuments, personalFolders } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, inArray, gte } from "drizzle-orm";
export class DatabaseStorage {
    // User operations
    async getUser(id) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user;
    }
    async getUserByUsername(username) {
        const [user] = await db.select().from(users).where(eq(users.username, username));
        return user;
    }
    async getUserByEmail(email) {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        return user;
    }
    async createUser(userData) {
        const [user] = await db
            .insert(users)
            .values(userData)
            .returning();
        return user;
    }
    async updateUser(id, updates) {
        const [user] = await db
            .update(users)
            .set({
            ...updates,
            updatedAt: new Date(),
        })
            .where(eq(users.id, id))
            .returning();
        return user;
    }
    async upsertUser(userData) {
        const [user] = await db
            .insert(users)
            .values(userData)
            .onConflictDoUpdate({
            target: users.id,
            set: {
                ...userData,
                updatedAt: new Date(),
            },
        })
            .returning();
        return user;
    }
    // API Key operations
    async createApiKey(apiKeyData) {
        const [apiKey] = await db
            .insert(apiKeys)
            .values(apiKeyData)
            .returning();
        return apiKey;
    }
    async getApiKeyByHash(keyHash) {
        const [apiKey] = await db.select().from(apiKeys).where(eq(apiKeys.keyHash, keyHash));
        return apiKey;
    }
    async getUserApiKeys(userId) {
        return await db.select().from(apiKeys).where(eq(apiKeys.userId, userId));
    }
    async updateApiKeyUsage(id) {
        await db.update(apiKeys)
            .set({ lastUsed: new Date() })
            .where(eq(apiKeys.id, id));
    }
    async deleteApiKey(id) {
        await db.delete(apiKeys).where(eq(apiKeys.id, id));
    }
    // Chat operations
    async getUserChats(userId) {
        return await db
            .select()
            .from(chats)
            .where(eq(chats.userId, userId))
            .orderBy(desc(chats.updatedAt));
    }
    async createChat(chatData) {
        const [chat] = await db
            .insert(chats)
            .values(chatData)
            .returning();
        return chat;
    }
    async getChat(id) {
        const [chat] = await db.select().from(chats).where(eq(chats.id, id));
        return chat;
    }
    async updateChat(id, updates) {
        const [chat] = await db
            .update(chats)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(chats.id, id))
            .returning();
        return chat;
    }
    async updateChatTitle(id, title) {
        const [chat] = await db
            .update(chats)
            .set({ title, updatedAt: new Date() })
            .where(eq(chats.id, id))
            .returning();
        return chat;
    }
    async deleteChat(id) {
        await db.delete(chats).where(eq(chats.id, id));
    }
    // Message operations
    async getChatMessages(chatId) {
        const result = await db
            .select()
            .from(messages)
            .where(eq(messages.chatId, chatId))
            .orderBy(messages.createdAt);
        console.log(`Database: Found ${result.length} messages for chat ${chatId}`);
        if (result.length > 0) {
            console.log(`First message: ${result[0].content.substring(0, 50)}...`);
            console.log(`Last message: ${result[result.length - 1].content.substring(0, 50)}...`);
        }
        return result;
    }
    async createMessage(messageData) {
        const [message] = await db
            .insert(messages)
            .values(messageData)
            .returning();
        return message;
    }
    // Folder operations
    async getUserFolders(userId) {
        return await db
            .select()
            .from(folders)
            .where(eq(folders.userId, userId))
            .orderBy(folders.name);
    }
    async createFolder(folderData) {
        const [folder] = await db
            .insert(folders)
            .values(folderData)
            .returning();
        return folder;
    }
    async getFolder(id) {
        const [folder] = await db
            .select()
            .from(folders)
            .where(eq(folders.id, id));
        return folder || undefined;
    }
    async deleteFolder(id) {
        await db
            .delete(folders)
            .where(eq(folders.id, id));
    }
    // Document operations
    async getUserDocuments(userId) {
        return await db
            .select()
            .from(documents)
            .where(eq(documents.userId, userId))
            .orderBy(desc(documents.createdAt));
    }
    async getDocuments() {
        return await db
            .select()
            .from(documents)
            .orderBy(desc(documents.createdAt));
    }
    async createDocument(documentData) {
        const [document] = await db
            .insert(documents)
            .values(documentData)
            .returning();
        return document;
    }
    async getDocument(id) {
        const [document] = await db
            .select()
            .from(documents)
            .where(eq(documents.id, id));
        return document || undefined;
    }
    async deleteDocument(id) {
        await db
            .delete(documents)
            .where(eq(documents.id, id));
    }
    // Personal document operations
    async getUserPersonalDocuments(userId) {
        return await db
            .select()
            .from(personalDocuments)
            .where(eq(personalDocuments.userId, userId))
            .orderBy(desc(personalDocuments.createdAt));
    }
    async createPersonalDocument(documentData) {
        const [document] = await db
            .insert(personalDocuments)
            .values(documentData)
            .returning();
        return document;
    }
    async getPersonalDocument(id) {
        const [document] = await db
            .select()
            .from(personalDocuments)
            .where(eq(personalDocuments.id, id));
        return document || undefined;
    }
    async deletePersonalDocument(id) {
        await db
            .delete(personalDocuments)
            .where(eq(personalDocuments.id, id));
    }
    async getUserPersonalFolders(userId) {
        return await db
            .select()
            .from(personalFolders)
            .where(eq(personalFolders.userId, userId))
            .orderBy(personalFolders.name);
    }
    async createPersonalFolder(folderData) {
        const [folder] = await db
            .insert(personalFolders)
            .values(folderData)
            .returning();
        return folder;
    }
    // Favorite operations
    async getUserFavorites(userId) {
        return await db
            .select()
            .from(favorites)
            .where(eq(favorites.userId, userId))
            .orderBy(desc(favorites.createdAt));
    }
    async createFavorite(favoriteData) {
        const [favorite] = await db
            .insert(favorites)
            .values(favoriteData)
            .returning();
        return favorite;
    }
    async deleteFavorite(id, userId) {
        await db
            .delete(favorites)
            .where(eq(favorites.id, id));
    }
    // Admin logging operations
    async logUserChatRequest(chatLogData) {
        const [chatLog] = await db
            .insert(userChatLogs)
            .values(chatLogData)
            .returning();
        return chatLog;
    }
    async getUserChatLogs(userId) {
        if (userId) {
            return await db
                .select()
                .from(userChatLogs)
                .where(eq(userChatLogs.userId, userId))
                .orderBy(desc(userChatLogs.timestamp));
        }
        else {
            return await db
                .select()
                .from(userChatLogs)
                .orderBy(desc(userChatLogs.timestamp));
        }
    }
    // Prompt customization operations
    async getUserPrompts(userId) {
        const prompts = await db.select().from(userPrompts).where(eq(userPrompts.userId, userId));
        return prompts;
        try {
            const prompts = await db.select({
                id: userPrompts.id,
                userId: userPrompts.userId,
                name: userPrompts.name,
                description: userPrompts.description,
                category: userPrompts.category,
                content: userPrompts.content,
                createdAt: userPrompts.createdAt,
                updatedAt: userPrompts.updatedAt
            }).from(userPrompts).where(eq(userPrompts.userId, userId));
            return prompts;
        }
        catch (error) {
            console.log("UserPrompts table not yet migrated, returning empty array");
            return [];
        }
    }
    async createUserPrompt(promptData) {
        const [prompt] = await db
            .insert(userPrompts)
            .values(promptData)
            .returning();
        return prompt;
    }
    async updateUserPrompt(promptId, updates) {
        const [prompt] = await db
            .update(userPrompts)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(userPrompts.id, promptId))
            .returning();
        return prompt;
    }
    async deleteUserPrompt(promptId) {
        await db.delete(userPrompts).where(eq(userPrompts.id, promptId));
    }
    async getUserDefaultPrompt(userId, category) {
        const query = db.select().from(userPrompts)
            .where(and(eq(userPrompts.userId, userId), eq(userPrompts.isDefault, true)));
        if (category) {
            query.where(eq(userPrompts.category, category));
        }
        const [prompt] = await query;
        return prompt;
        try {
            // Return the first prompt for the user (schema doesn't have isActive or isDefault)
            let query = db.select().from(userPrompts)
                .where(eq(userPrompts.userId, userId));
            if (category) {
                query = db.select().from(userPrompts)
                    .where(and(eq(userPrompts.userId, userId), eq(userPrompts.category, category)));
            }
            const results = await query.limit(1);
            return results[0];
        }
        catch (error) {
            console.error('Error fetching user default prompt:', error);
            return undefined;
        }
    }
    // Admin operations
    async getAllUsers() {
        return await db.select().from(users).orderBy(users.createdAt);
    }
    async deleteUser(userId) {
        await db.delete(users).where(eq(users.id, userId));
    }
    async getAllDocuments() {
        return await db.select().from(documents).orderBy(documents.createdAt);
    }
    async updateDocumentPermissions(documentId, permissions) {
        const [document] = await db
            .update(documents)
            .set(permissions)
            .where(eq(documents.id, documentId))
            .returning();
        return document;
    }
    async getAllPrompts() {
        return await db.select().from(userPrompts).orderBy(userPrompts.createdAt);
    }
    async createPrompt(prompt) {
        const [newPrompt] = await db
            .insert(userPrompts)
            .values(prompt)
            .returning();
        return newPrompt;
    }
    async updatePrompt(promptId, updates) {
        const [prompt] = await db
            .update(userPrompts)
            .set(updates)
            .where(eq(userPrompts.id, promptId))
            .returning();
        return prompt;
    }
    async deletePrompt(promptId) {
        await db.delete(userPrompts).where(eq(userPrompts.id, promptId));
    }
    // Missing method implementations
    async getUsers() {
        return await db.select().from(users).orderBy(users.createdAt);
    }
    async updateDocument(documentId, updates) {
        const [document] = await db
            .update(documents)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(documents.id, documentId))
            .returning();
        return document;
    }
    async createTrainingFeedback(feedback) {
        // For now, return the feedback as-is since we don't have a dedicated table
        return { id: crypto.randomUUID(), ...feedback, createdAt: new Date() };
    }
    async getChatCount() {
        const result = await db.select({ count: chats.id }).from(chats);
        return result.length;
    }
    async getDocumentCount() {
        const result = await db.select({ count: documents.id }).from(documents);
        return result.length;
    }
    async getActiveUserCount() {
        const result = await db.select({ count: users.id }).from(users).where(eq(users.isActive, true));
        return result.length;
    }
    async getRecentActivity() {
        // Get recent chats and messages as activity
        const recentChats = await db.select().from(chats).orderBy(desc(chats.createdAt)).limit(10);
        const recentMessages = await db.select().from(messages).orderBy(desc(messages.createdAt)).limit(10);
        return [
            ...recentChats.map(chat => ({ type: 'chat', ...chat })),
            ...recentMessages.map(message => ({ type: 'message', ...message }))
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20);
    }
    async getAdminSettings() {
        const [settings] = await db.select().from(adminSettings).where(eq(adminSettings.id, 'default'));
        return settings || {
            defaultTemperature: 0.7,
            maxTokens: 1000,
            enableExternalSearch: true,
            enableDocumentAnalysis: true,
            enableProposalGeneration: true,
            systemPrompt: ''
        };
    }
    async updateAdminSettings(settingsData) {
        const [settings] = await db
            .insert(adminSettings)
            .values({ id: 'default', ...settingsData })
            .onConflictDoUpdate({
            target: adminSettings.id,
            set: settingsData
        })
            .returning();
        return settings;
    }
    // Gamification operations
    async getLeaderboard(limit) {
        const leaderboardData = await db
            .select({
            id: users.id,
            username: users.username,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
            role: users.role,
            totalChats: userStats.totalChats,
            totalMessages: userStats.totalMessages,
            calculationsPerformed: userStats.calculationsPerformed,
            documentsAnalyzed: userStats.documentsAnalyzed,
            proposalsGenerated: userStats.proposalsGenerated,
            currentStreak: userStats.currentStreak,
            longestStreak: userStats.longestStreak,
            totalPoints: userStats.totalPoints,
            level: userStats.level,
        })
            .from(users)
            .leftJoin(userStats, eq(users.id, userStats.userId))
            .where(and(inArray(users.role, ['client', 'manager', 'sales-agent']), gte(userStats.totalPoints, 1) // Only show users with some activity
        ))
            .orderBy(desc(userStats.totalPoints))
            .limit(limit);
        return leaderboardData.map((user, index) => ({
            ...user,
            rank: index + 1,
            stats: {
                totalChats: user.totalChats || 0,
                totalMessages: user.totalMessages || 0,
                calculationsPerformed: user.calculationsPerformed || 0,
                documentsAnalyzed: user.documentsAnalyzed || 0,
                proposalsGenerated: user.proposalsGenerated || 0,
                currentStreak: user.currentStreak || 0,
                longestStreak: user.longestStreak || 0,
                totalPoints: user.totalPoints || 0,
                level: user.level || 1,
            }
        }));
    }
    async getUserStatsWithRank(userId) {
        const userWithStats = await db
            .select({
            id: users.id,
            username: users.username,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
            totalChats: userStats.totalChats,
            totalMessages: userStats.totalMessages,
            calculationsPerformed: userStats.calculationsPerformed,
            documentsAnalyzed: userStats.documentsAnalyzed,
            proposalsGenerated: userStats.proposalsGenerated,
            currentStreak: userStats.currentStreak,
            longestStreak: userStats.longestStreak,
            totalPoints: userStats.totalPoints,
            level: userStats.level,
        })
            .from(users)
            .leftJoin(userStats, eq(users.id, userStats.userId))
            .where(eq(users.id, userId));
        if (userWithStats.length === 0)
            return null;
        const user = userWithStats[0];
        // Calculate rank by counting users with higher points
        const higherRankedUsers = await db
            .select({ count: userStats.totalPoints })
            .from(userStats)
            .where(desc(userStats.totalPoints));
        const rank = higherRankedUsers.filter(u => (u.count || 0) > (user.totalPoints || 0)).length + 1;
        return {
            ...user,
            rank,
            stats: {
                totalChats: user.totalChats || 0,
                totalMessages: user.totalMessages || 0,
                calculationsPerformed: user.calculationsPerformed || 0,
                documentsAnalyzed: user.documentsAnalyzed || 0,
                proposalsGenerated: user.proposalsGenerated || 0,
                currentStreak: user.currentStreak || 0,
                longestStreak: user.longestStreak || 0,
                totalPoints: user.totalPoints || 0,
                level: user.level || 1,
            }
        };
    }
    async getUserStats(userId) {
        const [stats] = await db
            .select()
            .from(userStats)
            .where(eq(userStats.userId, userId));
        return stats || null;
    }
    async updateUserStats(userId, updates) {
        await db
            .insert(userStats)
            .values({ userId, ...updates })
            .onConflictDoUpdate({
            target: userStats.userId,
            set: updates
        });
    }
    // Admin analytics methods
    async getAllChats() {
        return await db.select().from(chats).orderBy(desc(chats.createdAt));
    }
    async getAllMessages() {
        return await db.select().from(messages).orderBy(desc(messages.createdAt));
    }
    // FAQ operations implementation
    async getFaq() {
        const result = await db.select().from(faqKnowledgeBase).orderBy(faqKnowledgeBase.id);
        return result;
    }
    async getFaqByQuestion(question) {
        const [result] = await db.select()
            .from(faqKnowledgeBase)
            .where(eq(faqKnowledgeBase.question, question));
        return result;
    }
    async createFaq(faq) {
        const [result] = await db.insert(faqKnowledgeBase)
            .values(faq)
            .returning();
        return result;
    }
    async updateFaq(id, updates) {
        const [result] = await db.update(faqKnowledgeBase)
            .set(updates)
            .where(eq(faqKnowledgeBase.id, id))
            .returning();
        return result;
    }
    async deleteFaq(id) {
        await db.delete(faqKnowledgeBase).where(eq(faqKnowledgeBase.id, id));
    }
}
export const storage = new DatabaseStorage();
