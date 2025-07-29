import { 
  users, 
  folders, 
  chats, 
  messages, 
  documents, 
  favorites,
  apiKeys,
  userChatLogs,
  userPrompts,
  userStats,
  achievements,
  userAchievements,
  userSessions,
  promptUsageLog,
  adminSettings,
  type User, 
  type UpsertUser,
<<<<<<< HEAD
  type InsertUser,
=======

>>>>>>> 7bde7c2493f5dfadbacbd14e0de16b792f67f2d8
  type Folder,
  type Chat,
  type Message,
  type Document,
  type Favorite,
  type ApiKey,
  type InsertApiKey,
  type InsertFolder,
  type InsertChat,
  type InsertMessage,
  type InsertDocument,
  type InsertFavorite,
  type InsertUserChatLog,
  type UserChatLog,
  type UserPrompt,
  type InsertUserPrompt,
  type UserStats,
  type InsertUserStats,
  type Achievement,
  type UserAchievement,
  type UserSession,
  type InsertUserSession,
  type PromptUsageLog,
  type InsertPromptUsageLog,
  type AdminSetting,
<<<<<<< HEAD
  type InsertAdminSetting
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
=======
  type InsertAdminSetting,
  personalDocuments,
  personalFolders
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, inArray, gte } from "drizzle-orm";
>>>>>>> 7bde7c2493f5dfadbacbd14e0de16b792f67f2d8

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
<<<<<<< HEAD
=======
  updateUser(id: string, updates: Partial<User>): Promise<User>;
>>>>>>> 7bde7c2493f5dfadbacbd14e0de16b792f67f2d8
  upsertUser(user: UpsertUser): Promise<User>;
  
  // API Key operations
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined>;
  getUserApiKeys(userId: string): Promise<ApiKey[]>;
  updateApiKeyUsage(id: string): Promise<void>;
  deleteApiKey(id: string): Promise<void>;
  
  // Chat operations
  getUserChats(userId: string): Promise<Chat[]>;
  createChat(chat: InsertChat): Promise<Chat>;
  getChat(id: string): Promise<Chat | undefined>;
  updateChat(id: string, updates: Partial<Chat>): Promise<Chat>;
<<<<<<< HEAD
  updateChatTitle(id: string, title: string): Promise<Chat>;
=======
  updateChatTitle(chatId: string, title: string): Promise<void>;
>>>>>>> 7bde7c2493f5dfadbacbd14e0de16b792f67f2d8
  deleteChat(id: string): Promise<void>;
  
  // Message operations
  getChatMessages(chatId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Folder operations
  getUserFolders(userId: string): Promise<Folder[]>;
  createFolder(folder: InsertFolder): Promise<Folder>;
  getFolder(id: string): Promise<Folder | undefined>;
  deleteFolder(id: string): Promise<void>;
  
  // Document operations
  getUserDocuments(userId: string): Promise<Document[]>;
<<<<<<< HEAD
  getDocuments(): Promise<Document[]>;
=======
>>>>>>> 7bde7c2493f5dfadbacbd14e0de16b792f67f2d8
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: string): Promise<Document | undefined>;
  deleteDocument(id: string): Promise<void>;
  
<<<<<<< HEAD
=======
  // Personal document operations
  getUserPersonalDocuments(userId: string): Promise<any[]>;
  createPersonalDocument(document: any): Promise<any>;
  getPersonalDocument(id: string): Promise<any | undefined>;
  deletePersonalDocument(id: string): Promise<void>;
  getUserPersonalFolders(userId: string): Promise<any[]>;
  createPersonalFolder(folder: any): Promise<any>;
  
>>>>>>> 7bde7c2493f5dfadbacbd14e0de16b792f67f2d8
  // Favorite operations
  getUserFavorites(userId: string): Promise<Favorite[]>;
  createFavorite(favorite: InsertFavorite): Promise<Favorite>;
  deleteFavorite(id: string, userId: string): Promise<void>;
  
  // Admin logging operations
  logUserChatRequest(chatLog: InsertUserChatLog): Promise<UserChatLog>;
  getUserChatLogs(userId?: string): Promise<UserChatLog[]>;

  // Gamification operations
  getLeaderboard(limit: number): Promise<any[]>;
  getUserStatsWithRank(userId: string): Promise<any>;
  getUserStats(userId: string): Promise<UserStats | null>;
  updateUserStats(userId: string, updates: Partial<UserStats>): Promise<void>;

<<<<<<< HEAD
  // FAQ operations
  getFaq(): Promise<any[]>;
  getFaqByQuestion(question: string): Promise<any | undefined>;
  createFaq(faq: any): Promise<any>;
  updateFaq(id: number, updates: any): Promise<any>;
  deleteFaq(id: number): Promise<void>;

  // Admin operations
  getAllUsers(): Promise<User[]>;
  deleteUser(userId: string): Promise<void>;
  getAllDocuments(): Promise<Document[]>;
=======
  // Admin operations
  getUsers(): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  deleteUser(userId: string): Promise<void>;
  getAllDocuments(): Promise<Document[]>;
  updateDocument(documentId: string, updates: any): Promise<Document>;
>>>>>>> 7bde7c2493f5dfadbacbd14e0de16b792f67f2d8
  updateDocumentPermissions(documentId: string, permissions: any): Promise<Document>;
  getAllPrompts(): Promise<any[]>;
  createPrompt(prompt: any): Promise<any>;
  updatePrompt(promptId: string, updates: any): Promise<any>;
  deletePrompt(promptId: string): Promise<void>;
  getAdminSettings(): Promise<any>;
  updateAdminSettings(settings: any): Promise<any>;
<<<<<<< HEAD
=======
  
  // Training and feedback
  createTrainingFeedback(feedback: any): Promise<any>;
  
  // Analytics
  getChatCount(): Promise<number>;
  getDocumentCount(): Promise<number>;
  getActiveUserCount(): Promise<number>;
  getRecentActivity(): Promise<any[]>;
>>>>>>> 7bde7c2493f5dfadbacbd14e0de16b792f67f2d8

  // Simplified admin operations for existing data
  getAllChats(): Promise<Chat[]>;
  getAllMessages(): Promise<Message[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

<<<<<<< HEAD
=======
  async updateUser(id: string, updates: Partial<User>): Promise<User> {
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

>>>>>>> 7bde7c2493f5dfadbacbd14e0de16b792f67f2d8
  async upsertUser(userData: UpsertUser): Promise<User> {
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
  async createApiKey(apiKeyData: InsertApiKey): Promise<ApiKey> {
    const [apiKey] = await db
      .insert(apiKeys)
      .values(apiKeyData)
      .returning();
    return apiKey;
  }

  async getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined> {
    const [apiKey] = await db.select().from(apiKeys).where(eq(apiKeys.keyHash, keyHash));
    return apiKey;
  }

  async getUserApiKeys(userId: string): Promise<ApiKey[]> {
    return await db.select().from(apiKeys).where(eq(apiKeys.userId, userId));
  }

  async updateApiKeyUsage(id: string): Promise<void> {
    await db.update(apiKeys)
      .set({ lastUsed: new Date() })
      .where(eq(apiKeys.id, id));
  }

  async deleteApiKey(id: string): Promise<void> {
    await db.delete(apiKeys).where(eq(apiKeys.id, id));
  }

  // Chat operations
  async getUserChats(userId: string): Promise<Chat[]> {
    return await db
      .select()
      .from(chats)
      .where(eq(chats.userId, userId))
      .orderBy(desc(chats.updatedAt));
  }

  async createChat(chatData: InsertChat): Promise<Chat> {
    const [chat] = await db
      .insert(chats)
      .values(chatData)
      .returning();
    return chat;
  }

  async getChat(id: string): Promise<Chat | undefined> {
    const [chat] = await db.select().from(chats).where(eq(chats.id, id));
    return chat;
  }

  async updateChat(id: string, updates: Partial<Chat>): Promise<Chat> {
    const [chat] = await db
      .update(chats)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(chats.id, id))
      .returning();
    return chat;
  }

<<<<<<< HEAD
  async updateChatTitle(id: string, title: string): Promise<Chat> {
    const [chat] = await db
      .update(chats)
      .set({ title, updatedAt: new Date() })
      .where(eq(chats.id, id))
      .returning();
    return chat;
=======
  async updateChatTitle(chatId: string, title: string): Promise<void> {
    await db
      .update(chats)
      .set({ title, updatedAt: new Date() })
      .where(eq(chats.id, chatId));
>>>>>>> 7bde7c2493f5dfadbacbd14e0de16b792f67f2d8
  }

  async deleteChat(id: string): Promise<void> {
    await db.delete(chats).where(eq(chats.id, id));
  }

  // Message operations
  async getChatMessages(chatId: string): Promise<Message[]> {
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

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(messageData)
      .returning();
    return message;
  }

  // Folder operations
  async getUserFolders(userId: string): Promise<Folder[]> {
    return await db
      .select()
      .from(folders)
      .where(eq(folders.userId, userId))
      .orderBy(folders.name);
  }

  async createFolder(folderData: InsertFolder): Promise<Folder> {
    const [folder] = await db
      .insert(folders)
      .values(folderData)
      .returning();
    return folder;
  }

  async getFolder(id: string): Promise<Folder | undefined> {
    const [folder] = await db
      .select()
      .from(folders)
      .where(eq(folders.id, id));
    return folder || undefined;
  }

  async deleteFolder(id: string): Promise<void> {
    await db
      .delete(folders)
      .where(eq(folders.id, id));
  }

  // Document operations
  async getUserDocuments(userId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.createdAt));
  }

<<<<<<< HEAD
  async getDocuments(): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .orderBy(desc(documents.createdAt));
  }

=======
>>>>>>> 7bde7c2493f5dfadbacbd14e0de16b792f67f2d8
  async createDocument(documentData: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values(documentData)
      .returning();
    return document;
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id));
    return document || undefined;
  }

  async deleteDocument(id: string): Promise<void> {
    await db
      .delete(documents)
      .where(eq(documents.id, id));
  }

<<<<<<< HEAD
=======
  // Personal document operations
  async getUserPersonalDocuments(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(personalDocuments)
      .where(eq(personalDocuments.userId, userId))
      .orderBy(desc(personalDocuments.createdAt));
  }

  async createPersonalDocument(documentData: any): Promise<any> {
    const [document] = await db
      .insert(personalDocuments)
      .values(documentData)
      .returning();
    return document;
  }

  async getPersonalDocument(id: string): Promise<any | undefined> {
    const [document] = await db
      .select()
      .from(personalDocuments)
      .where(eq(personalDocuments.id, id));
    return document || undefined;
  }

  async deletePersonalDocument(id: string): Promise<void> {
    await db
      .delete(personalDocuments)
      .where(eq(personalDocuments.id, id));
  }

  async getUserPersonalFolders(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(personalFolders)
      .where(eq(personalFolders.userId, userId))
      .orderBy(personalFolders.name);
  }

  async createPersonalFolder(folderData: any): Promise<any> {
    const [folder] = await db
      .insert(personalFolders)
      .values(folderData)
      .returning();
    return folder;
  }

>>>>>>> 7bde7c2493f5dfadbacbd14e0de16b792f67f2d8
  // Favorite operations
  async getUserFavorites(userId: string): Promise<Favorite[]> {
    return await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));
  }

  async createFavorite(favoriteData: InsertFavorite): Promise<Favorite> {
    const [favorite] = await db
      .insert(favorites)
      .values(favoriteData)
      .returning();
    return favorite;
  }

  async deleteFavorite(id: string, userId: string): Promise<void> {
    await db
      .delete(favorites)
      .where(eq(favorites.id, id));
  }

  // Admin logging operations
  async logUserChatRequest(chatLogData: InsertUserChatLog): Promise<UserChatLog> {
    const [chatLog] = await db
      .insert(userChatLogs)
      .values(chatLogData)
      .returning();
    return chatLog;
  }

  async getUserChatLogs(userId?: string): Promise<UserChatLog[]> {
    if (userId) {
      return await db
        .select()
        .from(userChatLogs)
        .where(eq(userChatLogs.userId, userId))
        .orderBy(desc(userChatLogs.timestamp));
    } else {
      return await db
        .select()
        .from(userChatLogs)
        .orderBy(desc(userChatLogs.timestamp));
    }
  }

  // Prompt customization operations
  async getUserPrompts(userId: string): Promise<UserPrompt[]> {
<<<<<<< HEAD
    const prompts = await db.select().from(userPrompts).where(eq(userPrompts.userId, userId));
    return prompts;
=======
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
    } catch (error) {
      console.log("UserPrompts table not yet migrated, returning empty array");
      return [];
    }
>>>>>>> 7bde7c2493f5dfadbacbd14e0de16b792f67f2d8
  }

  async createUserPrompt(promptData: InsertUserPrompt): Promise<UserPrompt> {
    const [prompt] = await db
      .insert(userPrompts)
      .values(promptData)
      .returning();
    return prompt;
  }

  async updateUserPrompt(promptId: string, updates: Partial<UserPrompt>): Promise<UserPrompt> {
    const [prompt] = await db
      .update(userPrompts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userPrompts.id, promptId))
      .returning();
    return prompt;
  }

  async deleteUserPrompt(promptId: string): Promise<void> {
    await db.delete(userPrompts).where(eq(userPrompts.id, promptId));
  }

  async getUserDefaultPrompt(userId: string, category?: string): Promise<UserPrompt | undefined> {
<<<<<<< HEAD
    const query = db.select().from(userPrompts)
      .where(and(
        eq(userPrompts.userId, userId),
        eq(userPrompts.isDefault, true)
      ));
    
    if (category) {
      query.where(eq(userPrompts.category, category));
    }
    
    const [prompt] = await query;
    return prompt;
=======
    try {
      // Return the first prompt for the user (schema doesn't have isActive or isDefault)
      let query = db.select().from(userPrompts)
        .where(eq(userPrompts.userId, userId));
      
      if (category) {
        query = db.select().from(userPrompts)
          .where(and(
            eq(userPrompts.userId, userId),
            eq(userPrompts.category, category)
          ));
      }
      
      const results = await query.limit(1);
      return results[0];
    } catch (error) {
      console.error('Error fetching user default prompt:', error);
      return undefined;
    }
>>>>>>> 7bde7c2493f5dfadbacbd14e0de16b792f67f2d8
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async deleteUser(userId: string): Promise<void> {
    await db.delete(users).where(eq(users.id, userId));
  }

  async getAllDocuments(): Promise<Document[]> {
    return await db.select().from(documents).orderBy(documents.createdAt);
  }

  async updateDocumentPermissions(documentId: string, permissions: any): Promise<Document> {
    const [document] = await db
      .update(documents)
      .set(permissions)
      .where(eq(documents.id, documentId))
      .returning();
    return document;
  }

  async getAllPrompts(): Promise<any[]> {
    return await db.select().from(userPrompts).orderBy(userPrompts.createdAt);
  }

  async createPrompt(prompt: any): Promise<any> {
    const [newPrompt] = await db
      .insert(userPrompts)
      .values(prompt)
      .returning();
    return newPrompt;
  }

  async updatePrompt(promptId: string, updates: any): Promise<any> {
    const [prompt] = await db
      .update(userPrompts)
      .set(updates)
      .where(eq(userPrompts.id, promptId))
      .returning();
    return prompt;
  }

  async deletePrompt(promptId: string): Promise<void> {
    await db.delete(userPrompts).where(eq(userPrompts.id, promptId));
  }

<<<<<<< HEAD
=======
  // Missing method implementations
  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async updateDocument(documentId: string, updates: any): Promise<Document> {
    const [document] = await db
      .update(documents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(documents.id, documentId))
      .returning();
    return document;
  }

  async createTrainingFeedback(feedback: any): Promise<any> {
    // For now, return the feedback as-is since we don't have a dedicated table
    return { id: crypto.randomUUID(), ...feedback, createdAt: new Date() };
  }

  async getChatCount(): Promise<number> {
    const result = await db.select({ count: chats.id }).from(chats);
    return result.length;
  }

  async getDocumentCount(): Promise<number> {
    const result = await db.select({ count: documents.id }).from(documents);
    return result.length;
  }

  async getActiveUserCount(): Promise<number> {
    const result = await db.select({ count: users.id }).from(users).where(eq(users.isActive, true));
    return result.length;
  }

  async getRecentActivity(): Promise<any[]> {
    // Get recent chats and messages as activity
    const recentChats = await db.select().from(chats).orderBy(desc(chats.createdAt)).limit(10);
    const recentMessages = await db.select().from(messages).orderBy(desc(messages.createdAt)).limit(10);
    
    return [
      ...recentChats.map(chat => ({ type: 'chat', ...chat })),
      ...recentMessages.map(message => ({ type: 'message', ...message }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20);
  }

>>>>>>> 7bde7c2493f5dfadbacbd14e0de16b792f67f2d8
  async getAdminSettings(): Promise<any> {
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

  async updateAdminSettings(settingsData: any): Promise<any> {
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
  async getLeaderboard(limit: number): Promise<any[]> {
    const leaderboardData = await db
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
<<<<<<< HEAD
      })
      .from(users)
      .leftJoin(userStats, eq(users.id, userStats.userId))
=======
        role: users.role
      })
      .from(users)
      .leftJoin(userStats, eq(users.id, userStats.userId))
      .where(
        and(
          inArray(users.role, ['client', 'manager', 'sales-agent']),
          gte(userStats.totalPoints, 1) // Only show users with some activity
        )
      )
>>>>>>> 7bde7c2493f5dfadbacbd14e0de16b792f67f2d8
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

  async getUserStatsWithRank(userId: string): Promise<any> {
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

    if (userWithStats.length === 0) return null;

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

  async getUserStats(userId: string): Promise<UserStats | null> {
    const [stats] = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, userId));
    return stats || null;
  }

  async updateUserStats(userId: string, updates: Partial<UserStats>): Promise<void> {
    await db
      .insert(userStats)
      .values({ userId, ...updates })
      .onConflictDoUpdate({
        target: userStats.userId,
        set: updates
      });
  }

  // Admin analytics methods
  async getAllChats(): Promise<Chat[]> {
    return await db.select().from(chats).orderBy(desc(chats.createdAt));
  }

  async getAllMessages(): Promise<Message[]> {
    return await db.select().from(messages).orderBy(desc(messages.createdAt));
  }
<<<<<<< HEAD

  // FAQ operations implementation
  async getFaq(): Promise<any[]> {
    const result = await db.select().from(faqKnowledgeBase).orderBy(faqKnowledgeBase.id);
    return result;
  }

  async getFaqByQuestion(question: string): Promise<any | undefined> {
    const [result] = await db.select()
      .from(faqKnowledgeBase)
      .where(eq(faqKnowledgeBase.question, question));
    return result;
  }

  async createFaq(faq: any): Promise<any> {
    const [result] = await db.insert(faqKnowledgeBase)
      .values(faq)
      .returning();
    return result;
  }

  async updateFaq(id: number, updates: any): Promise<any> {
    const [result] = await db.update(faqKnowledgeBase)
      .set(updates)
      .where(eq(faqKnowledgeBase.id, id))
      .returning();
    return result;
  }

  async deleteFaq(id: number): Promise<void> {
    await db.delete(faqKnowledgeBase).where(eq(faqKnowledgeBase.id, id));
  }
=======
>>>>>>> 7bde7c2493f5dfadbacbd14e0de16b792f67f2d8
}

export const storage = new DatabaseStorage();