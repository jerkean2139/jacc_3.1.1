import { pgTable, text, varchar, timestamp, jsonb, index, serial, integer, boolean, uuid, real, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable("sessions", {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
}, (table) => [index("IDX_session_expire").on(table.expire)]);
// User storage table with authentication
export const users = pgTable("users", {
    id: varchar("id").primaryKey().notNull(),
    username: varchar("username").unique().notNull(),
    email: varchar("email").unique().notNull(),
    passwordHash: varchar("password_hash").notNull(),
    firstName: varchar("first_name"),
    lastName: varchar("last_name"),
    profileImageUrl: varchar("profile_image_url"),
    role: varchar("role").default("sales-agent"), // sales-agent, agent, manager, client-admin, dev-admin
    isActive: boolean("is_active").default(true),
    // ISO Hub integration fields
    isoHubId: varchar("iso_hub_id"),
    isoHubToken: text("iso_hub_token"),
    isoHubTokenEncrypted: jsonb("iso_hub_token_encrypted"), // Encrypted token storage
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
// Enhanced vendor intelligence fields for existing vendors table
// Note: This extends the existing vendors table defined above
export const vendorIntelligence = pgTable("vendor_intelligence", {
    id: uuid("id").primaryKey().defaultRandom(),
    vendorId: uuid("vendor_id").references(() => vendors.id),
    contentType: varchar("content_type").notNull(), // pricing, feature, press_release, blog_post
    title: varchar("title"),
    content: text("content").notNull(),
    contentEncrypted: jsonb("content_encrypted"), // Encrypted sensitive content
    sourceUrl: varchar("source_url"),
    publishedAt: timestamp("published_at"),
    impact: varchar("impact").default("medium"), // low, medium, high
    confidence: real("confidence").default(0.5),
    actionRequired: boolean("action_required").default(false),
    tags: text("tags").array(),
    aiAnalysis: jsonb("ai_analysis"), // AI-generated insights
    aiAnalysisEncrypted: jsonb("ai_analysis_encrypted"), // Encrypted AI insights
    createdAt: timestamp("created_at").defaultNow(),
});
export const vendorComparisons = pgTable("vendor_comparisons", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id").references(() => users.id),
    vendorIds: uuid("vendor_ids").array(),
    criteria: jsonb("criteria"), // Comparison parameters
    results: jsonb("results"), // Comparison outcomes
    createdAt: timestamp("created_at").defaultNow(),
});
// User session tracking for admin analytics
export const userSessions = pgTable("user_sessions", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    sessionStart: timestamp("session_start").defaultNow(),
    sessionEnd: timestamp("session_end"),
    firstMessage: text("first_message"),
    messageCount: integer("message_count").default(0),
    promptsUsed: integer("prompts_used").default(0),
    ipAddress: varchar("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow(),
});
// User prompts management
export const userPrompts = pgTable("user_prompts", {
    id: varchar("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name").notNull(),
    content: text("content").notNull(),
    temperature: decimal("temperature"),
    maxTokens: integer("max_tokens"),
    isDefault: boolean("is_default").default(false),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    writingStyle: text("writing_style"),
    systemRules: text("system_rules"),
    promptTemplate: text("prompt_template"),
    category: varchar("category"),
});
// Prompt usage analytics
export const promptUsageLog = pgTable("prompt_usage_log", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id").references(() => userSessions.id, { onDelete: "cascade" }),
    promptId: varchar("prompt_id").references(() => userPrompts.id, { onDelete: "set null" }),
    promptName: varchar("prompt_name").notNull(),
    promptCategory: varchar("prompt_category"),
    usedAt: timestamp("used_at").defaultNow(),
    executionTime: integer("execution_time_ms"),
    success: boolean("success").default(true),
    errorMessage: text("error_message"),
});
// Admin settings and configurations
export const adminSettings = pgTable("admin_settings", {
    id: uuid("id").primaryKey().defaultRandom(),
    settingKey: varchar("setting_key").unique().notNull(),
    settingValue: text("setting_value"),
    description: text("description"),
    category: varchar("category").default("general"),
    isActive: boolean("is_active").default(true),
    updatedBy: varchar("updated_by").references(() => users.id),
    updatedAt: timestamp("updated_at").defaultNow(),
});
// API Keys for external tool integration  
// API Keys for external tool integration
export const apiKeys = pgTable("api_keys", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name").notNull(),
    keyHash: varchar("key_hash").notNull(),
    keyEncrypted: jsonb("key_encrypted"), // Encrypted API key storage
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    permissions: text("permissions").array().default([]), // ['read', 'write', 'admin']
    isActive: boolean("is_active").default(true),
    lastUsed: timestamp("last_used"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow(),
});
// Vendors table for payment processors and POS systems
export const vendors = pgTable("vendors", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    type: varchar("type", { length: 50 }).notNull(), // 'processor', 'gateway', 'pos', 'hardware'
    category: varchar("category", { length: 100 }), // 'restaurant', 'retail', 'high-risk', etc.
    description: text("description"),
    strengths: text("strengths").array().default([]),
    weaknesses: text("weaknesses").array().default([]),
    industries: text("industries").array().default([]),
    contactInfo: text("contact_info"),
    supportNumber: varchar("support_number", { length: 50 }),
    website: varchar("website", { length: 255 }),
    integrations: text("integrations").array().default([]),
    features: jsonb("features"),
    pricing: jsonb("pricing"),
    isActive: boolean("is_active").default(true),
    priority: integer("priority").default(50),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
// Folders for organizing documents and chats with vector namespaces
export const folders = pgTable("folders", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references(() => folders.id, { onDelete: "cascade" }),
    color: varchar("color", { length: 50 }).default("blue"),
    vectorNamespace: varchar("vector_namespace", { length: 255 }).notNull(), // Pinecone namespace
    folderType: varchar("folder_type", { length: 50 }).default("custom"), // processor, gateway, hardware, sales, custom
    priority: integer("priority").default(50), // For AI routing priority
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
// Chat conversations
export const chats = pgTable("chats", {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 255 }).notNull(),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    folderId: uuid("folder_id").references(() => folders.id, { onDelete: "set null" }),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
// Individual messages within chats
export const messages = pgTable("messages", {
    id: uuid("id").primaryKey().defaultRandom(),
    chatId: uuid("chat_id").notNull().references(() => chats.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    role: varchar("role", { length: 20 }).notNull(), // 'user' or 'assistant'
    metadata: jsonb("metadata"), // For storing additional data like file references
    createdAt: timestamp("created_at").defaultNow(),
});
// Content Quality Management - Chunks needing human attention
export const contentQualityFlags = pgTable("content_quality_flags", {
    id: uuid("id").primaryKey().defaultRandom(),
    chunkId: varchar("chunk_id").notNull().references(() => documentChunks.id, { onDelete: "cascade" }),
    documentId: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
    flagType: varchar("flag_type").notNull(), // 'generic_template', 'too_short', 'needs_details', 'low_quality'
    flagReason: text("flag_reason").notNull(),
    priority: varchar("priority").default("medium"), // 'low', 'medium', 'high', 'critical'
    status: varchar("status").default("pending"), // 'pending', 'in_review', 'enhanced', 'dismissed'
    assignedTo: varchar("assigned_to").references(() => users.id),
    aiSuggestion: text("ai_suggestion"), // AI-generated improvement suggestions
    humanNotes: text("human_notes"),
    originalContent: text("original_content").notNull(),
    enhancedContent: text("enhanced_content"),
    reviewCount: integer("review_count").default(0),
    lastReviewAt: timestamp("last_review_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
// Content Enhancement Workflow - Track improvement sessions
export const contentEnhancementSessions = pgTable("content_enhancement_sessions", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    sessionName: varchar("session_name").notNull(),
    description: text("description"),
    chunksProcessed: integer("chunks_processed").default(0),
    chunksEnhanced: integer("chunks_enhanced").default(0),
    timeSpent: integer("time_spent_minutes").default(0),
    status: varchar("status").default("active"), // 'active', 'paused', 'completed'
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
// Chat monitoring for analytics and debugging
export const chatMonitoring = pgTable("chat_monitoring", {
    id: uuid("id").primaryKey().defaultRandom(),
    chatId: uuid("chat_id").notNull().references(() => chats.id, { onDelete: "cascade" }),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    firstMessage: text("first_message"),
    messageCount: integer("message_count").default(0),
    sessionDuration: integer("session_duration").default(0),
    aiResponseTime: integer("ai_response_time").default(0),
    documentsReferenced: integer("documents_referenced").default(0),
    calculatorUsed: boolean("calculator_used").default(false),
    errorCount: integer("error_count").default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
// Uploaded documents and files
export const documents = pgTable("documents", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    originalName: varchar("original_name", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    size: integer("size").notNull(),
    path: text("path").notNull(),
    userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
    folderId: uuid("folder_id").references(() => folders.id, { onDelete: "set null" }),
    isFavorite: boolean("is_favorite").default(false),
    contentHash: varchar("content_hash", { length: 64 }), // SHA256 hash for duplicate detection
    nameHash: varchar("name_hash", { length: 32 }), // MD5 hash of normalized filename
    // Permission settings
    isPublic: boolean("is_public").default(true), // Visible to all users
    adminOnly: boolean("admin_only").default(false), // Only admins can view
    managerOnly: boolean("manager_only").default(false), // Admins and managers can view
    // AI training and processing settings
    trainingData: boolean("training_data").default(false), // Use for AI training
    autoVectorize: boolean("auto_vectorize").default(false), // Auto-vectorize for search
    // Tagging system for enhanced organization
    tags: text("tags").array().default([]), // Array of tag strings
    category: varchar("category", { length: 100 }), // Primary category
    subcategory: varchar("subcategory", { length: 100 }), // Secondary classification
    processorType: varchar("processor_type", { length: 50 }), // Payment processor related
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
// Personal documents - user-specific documents with separate folder structure
export const personalDocuments = pgTable("personal_documents", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    originalName: varchar("original_name", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    size: integer("size").notNull(),
    path: text("path").notNull(),
    content: text("content"), // Extracted text content for search
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    personalFolderId: uuid("personal_folder_id").references(() => personalFolders.id, { onDelete: "set null" }),
    isFavorite: boolean("is_favorite").default(false),
    tags: text("tags").array().default([]),
    notes: text("notes"), // User's personal notes about the document
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
// Personal folders - user-specific folder structure
export const personalFolders = pgTable("personal_folders", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    color: varchar("color", { length: 7 }).default("#3B82F6"), // Hex color code
    icon: varchar("icon", { length: 50 }).default("Folder"), // Lucide icon name
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references(() => personalFolders.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
// Scheduled URLs for automatic scraping
export const scheduledUrls = pgTable("scheduled_urls", {
    id: uuid("id").primaryKey().defaultRandom(),
    url: text("url").notNull(),
    type: varchar("type", { length: 50 }).notNull(), // 'knowledge_base', 'document_center'
    frequency: varchar("frequency", { length: 20 }).notNull().default("weekly"), // 'daily', 'weekly', 'monthly'
    enabled: boolean("enabled").notNull().default(true),
    lastScraped: timestamp("last_scraped"),
    nextScheduled: timestamp("next_scheduled"),
    scrapeCount: integer("scrape_count").notNull().default(0),
    lastStatus: varchar("last_status", { length: 20 }).default("pending"), // 'success', 'failed', 'pending'
    lastError: text("last_error"),
    createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
// User favorites (chats, documents, etc.)
export const favorites = pgTable("favorites", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    itemType: varchar("item_type", { length: 50 }).notNull(), // 'chat', 'document', 'folder'
    itemId: uuid("item_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});
// Consolidated admin settings table that includes both analytics and system configuration
export const adminSettingsLegacy = pgTable("admin_settings_legacy", {
    id: varchar("id").primaryKey().notNull().default("default"),
    systemPrompt: text("system_prompt"),
    userInstructions: text("user_instructions"),
    assistantPrompt: text("assistant_prompt"),
    temperature: text("temperature").default("0.7"),
    maxTokens: integer("max_tokens").default(1500),
    topP: text("top_p").default("1.0"),
    frequencyPenalty: text("frequency_penalty").default("0.0"),
    presencePenalty: text("presence_penalty").default("0.0"),
    enableVoice: boolean("enable_voice").default(true),
    enableDocumentSearch: boolean("enable_document_search").default(true),
    enableRateComparisons: boolean("enable_rate_comparisons").default(true),
    googleDriveFolderId: varchar("google_drive_folder_id"),
    model: varchar("model").default("claude-3-7-sonnet-20250219"),
    enablePromptChaining: boolean("enable_prompt_chaining").default(true),
    enableSmartRouting: boolean("enable_smart_routing").default(true),
    folderRoutingThreshold: real("folder_routing_threshold").default(0.7),
    updatedAt: timestamp("updated_at").defaultNow(),
    updatedBy: varchar("updated_by"),
});
// Gamification - Achievements System
export const achievements = pgTable("achievements", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description").notNull(),
    icon: varchar("icon", { length: 50 }).notNull(), // Lucide icon name
    category: varchar("category", { length: 50 }).notNull(), // 'chat', 'calculator', 'documents', 'social', 'streaks'
    rarity: varchar("rarity", { length: 20 }).notNull().default("common"), // 'common', 'rare', 'epic', 'legendary'
    points: integer("points").notNull().default(10),
    requirement: jsonb("requirement").notNull(), // JSON object defining unlock criteria
    isHidden: boolean("is_hidden").notNull().default(false), // Hidden until unlocked
    createdAt: timestamp("created_at").defaultNow(),
});
export const userAchievements = pgTable("user_achievements", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    achievementId: uuid("achievement_id").notNull().references(() => achievements.id, { onDelete: "cascade" }),
    unlockedAt: timestamp("unlocked_at").defaultNow(),
    progress: jsonb("progress"), // Optional progress tracking
});
export const userStats = pgTable("user_stats", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    totalMessages: integer("total_messages").notNull().default(0),
    totalChats: integer("total_chats").notNull().default(0),
    calculationsPerformed: integer("calculations_performed").notNull().default(0),
    documentsAnalyzed: integer("documents_analyzed").notNull().default(0),
    proposalsGenerated: integer("proposals_generated").notNull().default(0),
    currentStreak: integer("current_streak").notNull().default(0),
    longestStreak: integer("longest_streak").notNull().default(0),
    lastActiveDate: timestamp("last_active_date"),
    totalPoints: integer("total_points").notNull().default(0),
    level: integer("level").notNull().default(1),
    averageRating: real("average_rating").default(0),
    totalRatings: integer("total_ratings").default(0),
    weeklyMessages: integer("weekly_messages").default(0),
    monthlyMessages: integer("monthly_messages").default(0),
    updatedAt: timestamp("updated_at").defaultNow(),
});
// Chat ratings and feedback system
export const chatRatings = pgTable("chat_ratings", {
    id: uuid("id").primaryKey().defaultRandom(),
    chatId: uuid("chat_id").notNull().references(() => chats.id, { onDelete: "cascade" }),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(), // 1-5 stars
    feedback: text("feedback"), // Optional user feedback
    sessionNotes: text("session_notes"), // Admin notes about why rating was low
    improvementAreas: text("improvement_areas").array(), // Areas flagged for improvement
    messageCount: integer("message_count").default(0),
    sessionDuration: integer("session_duration_minutes"),
    wasHelpful: boolean("was_helpful"),
    createdAt: timestamp("created_at").defaultNow(),
});
// AI prompt templates for admin management
export const promptTemplates = pgTable("prompt_templates", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 100 }).notNull(), // system, user_facing, training, marketing
    template: text("template").notNull(),
    temperature: decimal("temperature", { precision: 3, scale: 2 }).default("0.70"),
    maxTokens: integer("max_tokens").default(1500),
    isActive: boolean("is_active").default(true),
    usageCount: integer("usage_count").default(0),
    successRate: decimal("success_rate", { precision: 5, scale: 2 }).default("0.00"),
    lastUsed: timestamp("last_used"),
    createdBy: varchar("created_by").references(() => users.id),
    updatedBy: varchar("updated_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
// Knowledge base Q&A entries
export const knowledgeBase = pgTable("knowledge_base", {
    id: serial("id").primaryKey(),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    priority: integer("priority").default(1), // 1=high, 2=medium, 3=low
    isActive: boolean("is_active").default(true),
    tags: text("tags").array(),
    searchCount: integer("search_count").default(0),
    effectiveness: decimal("effectiveness", { precision: 3, scale: 2 }).default("0.00"),
    createdBy: varchar("created_by").references(() => users.id),
    updatedBy: varchar("updated_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
// Daily usage tracking for streaks and engagement
export const dailyUsage = pgTable("daily_usage", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    date: timestamp("date").notNull(),
    messagesCount: integer("messages_count").default(0),
    chatsCreated: integer("chats_created").default(0),
    timeSpentMinutes: integer("time_spent_minutes").default(0),
    featuresUsed: text("features_used").array(), // ['calculator', 'documents', 'proposals']
    pointsEarned: integer("points_earned").default(0),
    createdAt: timestamp("created_at").defaultNow(),
});
// Leaderboard periods (weekly, monthly, all-time)
export const leaderboards = pgTable("leaderboards", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    period: varchar("period").notNull(), // 'weekly', 'monthly', 'all_time'
    rank: integer("rank").notNull(),
    score: integer("score").notNull(),
    metric: varchar("metric").notNull(), // 'messages', 'rating', 'streak', 'points'
    periodStart: timestamp("period_start").notNull(),
    periodEnd: timestamp("period_end").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});
// Q&A Knowledge Base Management
export const qaKnowledgeBase = pgTable("qa_knowledge_base", {
    id: uuid("id").primaryKey().defaultRandom(),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    category: varchar("category").notNull(),
    tags: text("tags").array(),
    isActive: boolean("is_active").default(true),
    priority: integer("priority").default(0),
    createdBy: varchar("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
// Document Tags
export const documentTags = pgTable("document_tags", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name").notNull(),
    color: varchar("color").notNull(),
    description: text("description"),
    createdBy: varchar("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
});
// Document Tag Relationships
export const documentTagRelations = pgTable("document_tag_relations", {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id").notNull().references(() => documents.id),
    tagId: uuid("tag_id").notNull().references(() => documentTags.id),
    createdAt: timestamp("created_at").defaultNow(),
});
// Document Chunks for Search
export const documentChunks = pgTable("document_chunks", {
    id: varchar("id").primaryKey(),
    documentId: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    chunkIndex: integer("chunk_index").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow(),
});
// ISO AMP Integration Data
export const merchantApplications = pgTable("merchant_applications", {
    id: uuid("id").primaryKey().defaultRandom(),
    businessName: varchar("business_name").notNull(),
    contactName: varchar("contact_name").notNull(),
    email: varchar("email").notNull(),
    phone: varchar("phone").notNull(),
    businessType: varchar("business_type").notNull(),
    monthlyVolume: text("monthly_volume").notNull(),
    averageTicket: text("average_ticket").notNull(),
    status: varchar("status").notNull(),
    applicationData: jsonb("application_data"),
    proposalData: jsonb("proposal_data"),
    assignedAgent: varchar("assigned_agent").references(() => users.id),
    priority: varchar("priority").default("medium"),
    notes: text("notes").array(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
// Help Content for Contextual Bubbles
export const helpContent = pgTable("help_content", {
    id: uuid("id").primaryKey().defaultRandom(),
    pageRoute: varchar("page_route").notNull(),
    elementSelector: varchar("element_selector").notNull(),
    title: varchar("title").notNull(),
    content: text("content").notNull(),
    position: varchar("position").default("bottom"),
    isActive: boolean("is_active").default(true),
    order: integer("order").default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
// Web Search Log for Admin Notifications
export const webSearchLogs = pgTable("web_search_logs", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id").references(() => users.id),
    userQuery: text("user_query").notNull(),
    webResponse: text("web_response").notNull(),
    reason: varchar("reason").notNull(),
    shouldAddToDocuments: boolean("should_add_to_documents").default(false),
    adminReviewed: boolean("admin_reviewed").default(false),
    reviewedBy: varchar("reviewed_by").references(() => users.id),
    reviewNotes: text("review_notes"),
    createdAt: timestamp("created_at").defaultNow(),
});
// FAQ Categories for structured organization
export const faqCategories = pgTable("faq_categories", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    description: text("description"),
    color: varchar("color", { length: 7 }).default("#3B82F6"), // Hex color code
    icon: varchar("icon", { length: 50 }).default("HelpCircle"), // Lucide icon name
    displayOrder: integer("display_order").default(0),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
// FAQ Knowledge Base for structured Q&A content
export const faqKnowledgeBase = pgTable("faq_knowledge_base", {
    id: serial("id").primaryKey(),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    category: varchar("category").notNull(), // pos, integration, support, contact, etc.
    categoryId: integer("category_id").references(() => faqCategories.id, { onDelete: "set null" }),
    tags: text("tags").array().default([]),
    priority: integer("priority").default(1),
    isActive: boolean("is_active").default(true),
    lastUpdated: timestamp("last_updated").defaultNow(),
    createdAt: timestamp("created_at").defaultNow(),
    createdBy: varchar("created_by").default("admin"),
    googleSheetRowId: varchar("google_sheet_row_id"), // Track which row this came from
    sourceType: varchar("source_type").default("manual"), // "manual" or "google_sheets"
});
// Google Sheets Sync Configuration
export const googleSheetsSyncConfig = pgTable("google_sheets_sync_config", {
    id: serial("id").primaryKey(),
    spreadsheetId: varchar("spreadsheet_id").notNull(), // Google Sheets ID
    sheetName: varchar("sheet_name").default("Sheet1"), // Sheet tab name
    questionColumn: varchar("question_column").default("A"), // Column for questions
    answerColumn: varchar("answer_column").default("B"), // Column for answers
    categoryColumn: varchar("category_column").default("C"), // Column for category
    tagsColumn: varchar("tags_column").default("D"), // Column for tags (comma-separated)
    priorityColumn: varchar("priority_column").default("E"), // Column for priority
    isActiveColumn: varchar("is_active_column").default("F"), // Column for active status
    headerRow: integer("header_row").default(1), // Which row contains headers
    syncEnabled: boolean("sync_enabled").default(true),
    syncFrequency: varchar("sync_frequency").default("manual"), // "manual", "hourly", "daily"
    lastSyncAt: timestamp("last_sync_at"),
    lastSyncStatus: varchar("last_sync_status"), // "success", "error", "in_progress"
    lastSyncError: text("last_sync_error"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    createdBy: varchar("created_by").references(() => users.id),
});
// Google Sheets Sync Log
export const googleSheetsSyncLog = pgTable("google_sheets_sync_log", {
    id: serial("id").primaryKey(),
    configId: integer("config_id").references(() => googleSheetsSyncConfig.id),
    syncType: varchar("sync_type").notNull(), // "manual", "scheduled"
    status: varchar("status").notNull(), // "success", "error", "partial"
    itemsProcessed: integer("items_processed").default(0),
    itemsAdded: integer("items_added").default(0),
    itemsUpdated: integer("items_updated").default(0),
    itemsSkipped: integer("items_skipped").default(0),
    errorDetails: text("error_details"),
    duration: integer("duration"), // milliseconds
    startedAt: timestamp("started_at").notNull(),
    completedAt: timestamp("completed_at"),
    triggeredBy: varchar("triggered_by").references(() => users.id),
});
// Vendor URL Management for automatic training
export const vendorUrls = pgTable("vendor_urls", {
    id: uuid("id").primaryKey().defaultRandom(),
    vendorName: varchar("vendor_name", { length: 100 }).notNull(),
    urlTitle: varchar("url_title", { length: 200 }).notNull(),
    url: text("url").notNull(),
    urlType: varchar("url_type", { length: 50 }).notNull(), // help_guide, support, documentation, api
    category: varchar("category", { length: 100 }), // Same as FAQ categories
    tags: text("tags").array().default([]),
    isActive: boolean("is_active").default(true),
    autoUpdate: boolean("auto_update").default(false), // Enable automatic content updates
    updateFrequency: varchar("update_frequency", { length: 20 }).default("weekly"), // daily, weekly, monthly
    lastScraped: timestamp("last_scraped"),
    lastContentHash: varchar("last_content_hash", { length: 64 }), // SHA256 of content
    scrapingStatus: varchar("scraping_status", { length: 20 }).default("pending"), // pending, success, failed
    errorMessage: text("error_message"),
    wordCount: integer("word_count").default(0),
    createdBy: varchar("created_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
// Admin logging table for tracking all first user chat requests
export const userChatLogs = pgTable("user_chat_logs", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    sessionId: varchar("session_id"),
    firstMessage: text("first_message").notNull(),
    chatId: uuid("chat_id").notNull().references(() => chats.id, { onDelete: "cascade" }),
    userRole: varchar("user_role"),
    ipAddress: varchar("ip_address"),
    userAgent: text("user_agent"),
    timestamp: timestamp("timestamp").defaultNow(),
});
// AI Training & Feedback Management Tables
export const aiTrainingFeedback = pgTable("ai_training_feedback", {
    id: uuid("id").primaryKey().defaultRandom(),
    chatId: uuid("chat_id").references(() => chats.id, { onDelete: "cascade" }),
    messageId: uuid("message_id").references(() => messages.id, { onDelete: "cascade" }),
    userQuery: text("user_query").notNull(),
    aiResponse: text("ai_response").notNull(),
    correctResponse: text("correct_response"),
    feedbackType: varchar("feedback_type").notNull(), // "incorrect", "incomplete", "good", "needs_training"
    adminNotes: text("admin_notes"),
    sourceDocs: jsonb("source_docs"), // Documents that were referenced
    knowledgeGaps: text("knowledge_gaps").array(), // What information was missing
    suggestedPromptChanges: text("suggested_prompt_changes"),
    status: varchar("status").default("pending"), // "pending", "reviewed", "trained", "resolved"
    reviewedBy: varchar("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at"),
    priority: integer("priority").default(1), // 1=low, 2=medium, 3=high, 4=critical
    createdBy: varchar("created_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
export const aiPromptTemplates = pgTable("ai_prompt_templates", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name").notNull(),
    description: text("description"),
    category: varchar("category").notNull(), // "system", "user", "document_analysis", "business_intelligence"
    template: text("template").notNull(),
    variables: jsonb("variables"), // Variables that can be substituted
    isActive: boolean("is_active").default(true),
    version: integer("version").default(1),
    temperature: real("temperature").default(0.3),
    maxTokens: integer("max_tokens").default(300),
    createdBy: varchar("created_by").references(() => users.id),
    lastModifiedBy: varchar("last_modified_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
export const aiKnowledgeCorrections = pgTable("ai_knowledge_corrections", {
    id: uuid("id").primaryKey().defaultRandom(),
    feedbackId: uuid("feedback_id").references(() => aiTrainingFeedback.id, { onDelete: "cascade" }),
    incorrectInformation: text("incorrect_information").notNull(),
    correctInformation: text("correct_information").notNull(),
    sourceDocuments: text("source_documents").array(),
    category: varchar("category").notNull(), // "processor_info", "pricing", "equipment", "compliance"
    appliedToSystem: boolean("applied_to_system").default(false),
    adminVerified: boolean("admin_verified").default(false),
    verifiedBy: varchar("verified_by").references(() => users.id),
    verifiedAt: timestamp("verified_at"),
    createdAt: timestamp("created_at").defaultNow(),
});
export const aiTrainingMaterials = pgTable("ai_training_materials", {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title").notNull(),
    content: text("content").notNull(),
    materialType: varchar("material_type").notNull(), // "faq", "procedure", "policy", "rate_sheet"
    category: varchar("category").notNull(),
    tags: text("tags").array(),
    priority: integer("priority").default(1),
    isVerified: boolean("is_verified").default(false),
    verifiedBy: varchar("verified_by").references(() => users.id),
    sourceDocument: varchar("source_document"),
    lastReviewed: timestamp("last_reviewed"),
    reviewNotes: text("review_notes"),
    createdBy: varchar("created_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
// Add missing columns to userStats table
export const userStatsExtended = pgTable("user_stats_extended", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    averageRating: real("average_rating").default(0),
    totalRatings: integer("total_ratings").default(0),
    averageResponseTime: real("average_response_time").default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
// Interchange rates management (updated by Visa/MC twice yearly)
export const interchangeRates = pgTable("interchange_rates", {
    id: varchar("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
    category: varchar("category").notNull().unique(), // CPS/Retail, CPS/Restaurant, etc.
    rate: decimal("rate", { precision: 6, scale: 4 }).notNull(),
    effectiveDate: timestamp("effective_date").notNull(),
    network: varchar("network").notNull(), // Visa, Mastercard
    cardType: varchar("card_type").notNull(), // credit, debit, prepaid, business
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
// Processor markup intelligence (competitive analysis)
export const processorMarkups = pgTable("processor_markups", {
    id: varchar("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
    processorName: varchar("processor_name").notNull(),
    merchantType: varchar("merchant_type").notNull(), // restaurant, retail, ecommerce, etc.
    volumeTier: varchar("volume_tier").notNull(), // 0-10k, 10k-50k, 50k-250k, 250k+
    creditMarkup: decimal("credit_markup", { precision: 6, scale: 4 }).notNull(),
    debitMarkup: decimal("debit_markup", { precision: 6, scale: 4 }).notNull(),
    authFeeMarkup: decimal("auth_fee_markup", { precision: 6, scale: 4 }).notNull(),
    averageEffectiveRate: decimal("average_effective_rate", { precision: 6, scale: 4 }).notNull(),
    competitivePosition: varchar("competitive_position").notNull(), // aggressive, competitive, premium
    dataSource: varchar("data_source").notNull(), // market_research, client_analysis, industry_report
    confidenceLevel: integer("confidence_level").notNull(), // 1-10 scale
    lastUpdated: timestamp("last_updated").defaultNow(),
    updatedBy: varchar("updated_by").notNull(),
});
// Security tables for bank-level protection
export const loginAttempts = pgTable('login_attempts', {
    id: serial('id').primaryKey(),
    username: varchar('username').notNull(),
    ipAddress: varchar('ip_address').notNull(),
    userAgent: text('user_agent'),
    attemptTime: timestamp('attempt_time').defaultNow().notNull(),
    success: boolean('success').default(false)
}, (table) => [
    index('idx_login_username').on(table.username),
    index('idx_login_ip').on(table.ipAddress),
    index('idx_login_time').on(table.attemptTime)
]);
export const userSecuritySettings = pgTable('user_security_settings', {
    userId: varchar('user_id').primaryKey().references(() => users.id),
    totpEnabled: boolean('totp_enabled').default(false),
    totpSecret: varchar('totp_secret'),
    backupCodes: text('backup_codes').array(),
    lastPasswordChange: timestamp('last_password_change').defaultNow(),
    passwordHistory: text('password_history').array(),
    securityQuestions: jsonb('security_questions'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});
export const documentAccessLogs = pgTable('document_access_logs', {
    id: serial('id').primaryKey(),
    userId: varchar('user_id').notNull(),
    documentId: varchar('document_id').notNull(),
    accessType: varchar('access_type').notNull(), // view, download, edit
    allowed: boolean('allowed').notNull(),
    reason: varchar('reason'),
    ipAddress: varchar('ip_address').notNull(),
    userAgent: text('user_agent'),
    timestamp: timestamp('timestamp').defaultNow().notNull()
}, (table) => [
    index('idx_doc_access_user').on(table.userId),
    index('idx_doc_access_doc').on(table.documentId),
    index('idx_doc_access_time').on(table.timestamp)
]);
// Security sessions for bank-level authentication
export const securitySessions = pgTable('security_sessions', {
    id: varchar('id').primaryKey(),
    userId: varchar('user_id').notNull().references(() => users.id),
    ipAddress: varchar('ip_address').notNull(),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    lastActivity: timestamp('last_activity').defaultNow().notNull(),
    isActive: boolean('is_active').default(true)
}, (table) => [
    index('idx_security_session_user').on(table.userId),
    index('idx_security_session_active').on(table.isActive),
    index('idx_security_session_expires').on(table.expiresAt)
]);
export const documentPermissions = pgTable('document_permissions', {
    id: serial('id').primaryKey(),
    documentId: varchar('document_id').notNull(),
    userId: varchar('user_id'),
    groupId: varchar('group_id'),
    permissionLevel: varchar('permission_level').notNull(), // read, download, write, admin
    grantedBy: varchar('granted_by').notNull(),
    grantedAt: timestamp('granted_at').defaultNow(),
    expiresAt: timestamp('expires_at')
}, (table) => [
    index('idx_doc_perm_doc').on(table.documentId),
    index('idx_doc_perm_user').on(table.userId),
    index('idx_doc_perm_group').on(table.groupId)
]);
// Define relations
export const vendorsRelations = relations(vendors, ({ many }) => ({
    intelligence: many(vendorIntelligence),
}));
export const vendorIntelligenceRelations = relations(vendorIntelligence, ({ one }) => ({
    vendor: one(vendors, { fields: [vendorIntelligence.vendorId], references: [vendors.id] }),
}));
export const vendorComparisonsRelations = relations(vendorComparisons, ({ one }) => ({
    user: one(users, { fields: [vendorComparisons.userId], references: [users.id] }),
}));
export const usersRelations = relations(users, ({ one, many }) => ({
    folders: many(folders),
    chats: many(chats),
    documents: many(documents),
    stats: one(userStats, { fields: [users.id], references: [userStats.userId] }),
    userAchievements: many(userAchievements),
    favorites: many(favorites),
    trainingFeedback: many(aiTrainingFeedback),
    promptTemplates: many(aiPromptTemplates),
    vendorComparisons: many(vendorComparisons),
}));
export const foldersRelations = relations(folders, ({ one, many }) => ({
    user: one(users, { fields: [folders.userId], references: [users.id] }),
    parent: one(folders, { fields: [folders.parentId], references: [folders.id] }),
    children: many(folders),
    chats: many(chats),
    documents: many(documents),
}));
export const personalFoldersRelations = relations(personalFolders, ({ one, many }) => ({
    user: one(users, { fields: [personalFolders.userId], references: [users.id] }),
    parent: one(personalFolders, { fields: [personalFolders.parentId], references: [personalFolders.id] }),
    children: many(personalFolders),
    documents: many(personalDocuments),
}));
export const personalDocumentsRelations = relations(personalDocuments, ({ one }) => ({
    user: one(users, { fields: [personalDocuments.userId], references: [users.id] }),
    folder: one(personalFolders, { fields: [personalDocuments.personalFolderId], references: [personalFolders.id] }),
}));
export const chatsRelations = relations(chats, ({ one, many }) => ({
    user: one(users, { fields: [chats.userId], references: [users.id] }),
    folder: one(folders, { fields: [chats.folderId], references: [folders.id] }),
    messages: many(messages),
}));
export const messagesRelations = relations(messages, ({ one }) => ({
    chat: one(chats, { fields: [messages.chatId], references: [chats.id] }),
}));
export const documentsRelations = relations(documents, ({ one }) => ({
    user: one(users, { fields: [documents.userId], references: [users.id] }),
    folder: one(folders, { fields: [documents.folderId], references: [folders.id] }),
}));
export const favoritesRelations = relations(favorites, ({ one }) => ({
    user: one(users, { fields: [favorites.userId], references: [users.id] }),
}));
// Insert schemas
export const insertFolderSchema = createInsertSchema(folders).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
export const insertChatSchema = createInsertSchema(chats).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
export const insertMessageSchema = createInsertSchema(messages).omit({
    id: true,
    createdAt: true,
});
export const insertDocumentSchema = createInsertSchema(documents).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
export const insertFavoriteSchema = createInsertSchema(favorites).omit({
    id: true,
    createdAt: true,
});
// Insert schemas for new tables
export const insertUserSchema = createInsertSchema(users).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    passwordHash: true,
}).extend({
    password: z.string().min(6),
});
export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
    id: true,
    createdAt: true,
    lastUsed: true,
});
// Learning System Tables
export const learningPaths = pgTable("learning_paths", {
    id: varchar("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
    name: varchar("name").notNull(),
    description: text("description").notNull(),
    category: varchar("category").notNull(),
    estimatedDuration: integer("estimated_duration").notNull(), // in hours
    difficulty: varchar("difficulty").notNull(), // beginner, intermediate, advanced
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
export const learningModules = pgTable("learning_modules", {
    id: varchar("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
    title: varchar("title").notNull(),
    description: text("description").notNull(),
    content: text("content").notNull(),
    category: varchar("category").notNull(),
    difficulty: varchar("difficulty").notNull(),
    estimatedTime: integer("estimated_time").notNull(), // in minutes
    xpReward: integer("xp_reward").notNull(),
    prerequisites: jsonb("prerequisites").default([]), // array of module IDs
    skills: jsonb("skills").default([]), // array of skill names
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
export const userSkills = pgTable("user_skills", {
    id: varchar("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id").notNull().references(() => users.id),
    skillName: varchar("skill_name").notNull(),
    category: varchar("category").notNull(),
    level: integer("level").default(1),
    xp: integer("xp").default(0),
    lastUpdated: timestamp("last_updated").defaultNow(),
});
export const learningAchievements = pgTable("learning_achievements", {
    id: varchar("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
    title: varchar("title").notNull(),
    description: text("description").notNull(),
    icon: varchar("icon").notNull(),
    xpReward: integer("xp_reward").notNull(),
    rarity: varchar("rarity").notNull(), // common, uncommon, rare, epic, legendary
    criteria: jsonb("criteria").notNull(), // achievement unlock criteria
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
});
export const userLearningAchievements = pgTable("user_learning_achievements", {
    id: varchar("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id").notNull().references(() => users.id),
    achievementId: varchar("achievement_id").notNull().references(() => learningAchievements.id),
    unlockedAt: timestamp("unlocked_at").defaultNow(),
});
export const userModuleProgress = pgTable("user_module_progress", {
    id: varchar("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id").notNull().references(() => users.id),
    moduleId: varchar("module_id").notNull().references(() => learningModules.id),
    status: varchar("status").notNull(), // not_started, in_progress, completed
    score: integer("score"), // completion score (0-100)
    timeSpent: integer("time_spent").default(0), // in minutes
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow(),
});
export const userPathProgress = pgTable("user_path_progress", {
    id: varchar("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id").notNull().references(() => users.id),
    pathId: varchar("path_id").notNull().references(() => learningPaths.id),
    currentModuleIndex: integer("current_module_index").default(0),
    completionRate: integer("completion_rate").default(0), // percentage
    startedAt: timestamp("started_at").defaultNow(),
    completedAt: timestamp("completed_at"),
});
export const pathModules = pgTable("path_modules", {
    id: varchar("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
    pathId: varchar("path_id").notNull().references(() => learningPaths.id),
    moduleId: varchar("module_id").notNull().references(() => learningModules.id),
    orderIndex: integer("order_index").notNull(),
});
export const userLearningStats = pgTable("user_learning_stats", {
    id: varchar("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id").notNull().references(() => users.id).unique(),
    totalXP: integer("total_xp").default(0),
    currentLevel: integer("current_level").default(1),
    modulesCompleted: integer("modules_completed").default(0),
    achievementsUnlocked: integer("achievements_unlocked").default(0),
    totalTimeSpent: integer("total_time_spent").default(0), // in minutes
    streak: integer("streak").default(0), // consecutive days
    lastActivityDate: timestamp("last_activity_date"),
    updatedAt: timestamp("updated_at").defaultNow(),
});
// Training interactions for unified learning system
export const trainingInteractions = pgTable("training_interactions", {
    id: varchar("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
    query: text("query").notNull(),
    response: text("response").notNull(),
    source: varchar("source").notNull(), // user_chat, admin_test, admin_correction
    userId: varchar("user_id").references(() => users.id),
    sessionId: varchar("session_id"),
    wasCorrect: boolean("was_correct"),
    correctedResponse: text("corrected_response"),
    metadata: jsonb("metadata").$type().default({}),
    createdAt: timestamp("created_at").defaultNow(),
});
// Personal documents types
export const insertPersonalDocumentSchema = createInsertSchema(personalDocuments).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
export const insertPersonalFolderSchema = createInsertSchema(personalFolders).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
// Processor pricing management
export const processorPricing = pgTable("processor_pricing", {
    id: varchar("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
    processorName: varchar("processor_name").notNull().unique(),
    pricingType: varchar("pricing_type").notNull(), // interchange_plus, tiered, flat_rate, subscription
    qualifiedRate: decimal("qualified_rate", { precision: 6, scale: 4 }).notNull(),
    midQualifiedRate: decimal("mid_qualified_rate", { precision: 6, scale: 4 }),
    nonQualifiedRate: decimal("non_qualified_rate", { precision: 6, scale: 4 }),
    interchangePlus: decimal("interchange_plus", { precision: 6, scale: 4 }),
    authFee: decimal("auth_fee", { precision: 6, scale: 4 }).notNull(),
    monthlyFee: decimal("monthly_fee", { precision: 8, scale: 2 }).notNull(),
    statementFee: decimal("statement_fee", { precision: 6, scale: 2 }).notNull(),
    batchFee: decimal("batch_fee", { precision: 6, scale: 4 }).notNull(),
    gatewayFee: decimal("gateway_fee", { precision: 6, scale: 2 }),
    pciFee: decimal("pci_fee", { precision: 6, scale: 2 }),
    setupFee: decimal("setup_fee", { precision: 8, scale: 2 }),
    earlyTerminationFee: decimal("early_termination_fee", { precision: 8, scale: 2 }),
    contractLength: integer("contract_length").notNull().default(12),
    features: jsonb("features").$type().default([]),
    compatibleHardware: jsonb("compatible_hardware").$type().default([]),
    isActive: boolean("is_active").notNull().default(true),
    lastUpdated: timestamp("last_updated").defaultNow(),
    updatedBy: varchar("updated_by").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});
// Hardware options management
export const hardwareOptions = pgTable("hardware_options", {
    id: varchar("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
    name: varchar("name").notNull(),
    category: varchar("category").notNull(), // terminal, mobile, virtual, gateway, pos_system
    manufacturer: varchar("manufacturer").notNull(),
    model: varchar("model").notNull(),
    purchasePrice: decimal("purchase_price", { precision: 8, scale: 2 }).notNull(),
    monthlyLease: decimal("monthly_lease", { precision: 6, scale: 2 }),
    setupFee: decimal("setup_fee", { precision: 6, scale: 2 }),
    features: jsonb("features").$type().default([]),
    compatibleProcessors: jsonb("compatible_processors").$type().default([]),
    specifications: jsonb("specifications").$type().default({}),
    isActive: boolean("is_active").notNull().default(true),
    lastUpdated: timestamp("last_updated").defaultNow(),
    updatedBy: varchar("updated_by").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});
// PDF reports tracking
export const pdfReports = pgTable("pdf_reports", {
    id: varchar("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
    reportType: varchar("report_type").notNull(), // comparison, savings, proposal
    merchantName: varchar("merchant_name").notNull(),
    processorName: varchar("processor_name"),
    generatedBy: varchar("generated_by").notNull(),
    emailSent: boolean("email_sent").default(false),
    emailRecipient: varchar("email_recipient"),
    reportData: jsonb("report_data").$type(),
    createdAt: timestamp("created_at").defaultNow(),
});
export const insertVendorSchema = createInsertSchema(vendors).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
export const insertVendorIntelligenceSchema = createInsertSchema(vendorIntelligence).omit({
    id: true,
    createdAt: true,
});
export const insertVendorComparisonSchema = createInsertSchema(vendorComparisons).omit({
    id: true,
    createdAt: true,
});
// API Usage Tracking for cost calculation
export const apiUsageLogs = pgTable("api_usage_logs", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id").references(() => users.id),
    provider: varchar("provider").notNull(), // anthropic, openai, pinecone
    model: varchar("model").notNull(), // claude-3.5-sonnet, gpt-4o, text-embedding-ada-002
    operation: varchar("operation").notNull(), // chat, embedding, search
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    totalTokens: integer("total_tokens"),
    requestCount: integer("request_count").default(1),
    estimatedCost: decimal("estimated_cost", { precision: 10, scale: 6 }), // USD cents
    requestData: jsonb("request_data"), // For debugging and analysis
    responseTime: integer("response_time"), // milliseconds
    success: boolean("success").default(true),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").defaultNow(),
});
// Monthly Usage Summary for dashboard display  
export const monthlyUsageSummary = pgTable("monthly_usage_summary", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id").references(() => users.id),
    year: integer("year").notNull(),
    month: integer("month").notNull(), // 1-12
    provider: varchar("provider").notNull(),
    model: varchar("model").notNull(),
    totalRequests: integer("total_requests").default(0),
    totalInputTokens: integer("total_input_tokens").default(0),
    totalOutputTokens: integer("total_output_tokens").default(0),
    totalTokens: integer("total_tokens").default(0),
    totalCost: decimal("total_cost", { precision: 10, scale: 2 }), // USD
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
    index("idx_monthly_usage_user_date").on(table.userId, table.year, table.month),
    index("idx_monthly_usage_provider").on(table.provider, table.model),
]);
// Insert schemas for admin tables
export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
    id: true,
    createdAt: true,
});
export const insertPromptUsageLogSchema = createInsertSchema(promptUsageLog).omit({
    id: true,
    usedAt: true,
});
// Enhanced AI Model Configuration
export const aiModels = pgTable("ai_models", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name").notNull(),
    provider: varchar("provider").notNull(), // 'openai', 'anthropic'
    modelId: varchar("model_id").notNull(),
    isActive: boolean("is_active").default(true),
    maxTokens: integer("max_tokens").default(4000),
    costPerToken: real("cost_per_token").default(0.0),
    isDefault: boolean("is_default").default(false),
    capabilities: jsonb("capabilities"), // {vision: true, functions: true, etc}
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow(),
});
// Model Performance Tracking
export const modelPerformance = pgTable("model_performance", {
    id: uuid("id").primaryKey().defaultRandom(),
    modelId: uuid("model_id").references(() => aiModels.id),
    date: varchar("date").notNull(),
    totalRequests: integer("total_requests").default(0),
    successfulRequests: integer("successful_requests").default(0),
    averageResponseTime: real("average_response_time").default(0),
    averageTokensUsed: real("average_tokens_used").default(0),
    totalCost: real("total_cost").default(0),
    userSatisfactionScore: real("user_satisfaction_score").default(0),
    createdAt: timestamp("created_at").defaultNow(),
});
// Vector Database Management
export const vectorIndices = pgTable("vector_indices", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name").notNull(),
    description: text("description"),
    dimensions: integer("dimensions").default(1536),
    indexType: varchar("index_type").default('cosine'), // cosine, euclidean, dot_product
    documentCount: integer("document_count").default(0),
    lastOptimized: timestamp("last_optimized"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
// Document Processing Pipeline
export const documentProcessingJobs = pgTable("document_processing_jobs", {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id").references(() => documents.id),
    status: varchar("status").default('pending'), // pending, processing, completed, failed
    jobType: varchar("job_type").notNull(), // extract, vectorize, analyze, reindex
    priority: integer("priority").default(1),
    attempts: integer("attempts").default(0),
    maxAttempts: integer("max_attempts").default(3),
    errorMessage: text("error_message"),
    processingTime: integer("processing_time_ms"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
// Prompt Template Versioning
export const promptVersions = pgTable("prompt_versions", {
    id: uuid("id").primaryKey().defaultRandom(),
    templateId: varchar("template_id").notNull(),
    version: integer("version").notNull(),
    content: text("content").notNull(),
    changes: text("changes"),
    performanceScore: real("performance_score"),
    isActive: boolean("is_active").default(false),
    createdBy: varchar("created_by").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});
// AI Response Quality Tracking
export const responseQuality = pgTable("response_quality", {
    id: uuid("id").primaryKey().defaultRandom(),
    chatId: uuid("chat_id").references(() => chats.id),
    messageId: uuid("message_id").references(() => messages.id),
    modelUsed: varchar("model_used").notNull(),
    promptVersion: varchar("prompt_version"),
    relevanceScore: real("relevance_score"),
    accuracyScore: real("accuracy_score"),
    helpfulnessScore: real("helpfulness_score"),
    responseTime: integer("response_time_ms"),
    tokenCount: integer("token_count"),
    userFeedback: varchar("user_feedback"), // positive, negative, neutral
    adminReview: text("admin_review"),
    createdAt: timestamp("created_at").defaultNow(),
});
// System Analytics
export const systemAnalytics = pgTable("system_analytics", {
    id: uuid("id").primaryKey().defaultRandom(),
    date: varchar("date").notNull(),
    metric: varchar("metric").notNull(), // daily_users, document_uploads, ai_requests, etc
    value: real("value").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow(),
});
// Chat Review Status for Admin Review Center
export const chatReviews = pgTable("chat_reviews", {
    id: uuid("id").primaryKey().defaultRandom(),
    chatId: uuid("chat_id").notNull().references(() => chats.id, { onDelete: "cascade" }),
    reviewedBy: varchar("reviewed_by").references(() => users.id, { onDelete: "set null" }),
    reviewStatus: varchar("review_status").notNull().default("pending"), // pending, approved, needs_correction, skipped
    reviewNotes: text("review_notes"),
    correctionsMade: integer("corrections_made").default(0),
    totalMessages: integer("total_messages").default(0),
    lastReviewedAt: timestamp("last_reviewed_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
// Message Corrections for tracking admin improvements
export const messageCorrections = pgTable("message_corrections", {
    id: uuid("id").primaryKey().defaultRandom(),
    messageId: uuid("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
    chatId: uuid("chat_id").notNull().references(() => chats.id, { onDelete: "cascade" }),
    originalContent: text("original_content").notNull(),
    correctedContent: text("corrected_content").notNull(),
    correctedBy: varchar("corrected_by").notNull().references(() => users.id, { onDelete: "cascade" }),
    improvementType: varchar("improvement_type").notNull(), // accuracy, completeness, tone, factual_error
    createdAt: timestamp("created_at").defaultNow(),
});
// Chat Review Center relations (defined after tables)
export const chatReviewsRelations = relations(chatReviews, ({ one }) => ({
    chat: one(chats, { fields: [chatReviews.chatId], references: [chats.id] }),
    reviewer: one(users, { fields: [chatReviews.reviewedBy], references: [users.id] }),
}));
export const messageCorrectionsRelations = relations(messageCorrections, ({ one }) => ({
    message: one(messages, { fields: [messageCorrections.messageId], references: [messages.id] }),
    chat: one(chats, { fields: [messageCorrections.chatId], references: [chats.id] }),
    corrector: one(users, { fields: [messageCorrections.correctedBy], references: [users.id] }),
}));
// Chat Review Center schema exports
export const insertChatReviewSchema = createInsertSchema(chatReviews).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
export const insertMessageCorrectionSchema = createInsertSchema(messageCorrections).omit({
    id: true,
    createdAt: true,
});
// Document Retrieval Configuration
export const retrievalConfigs = pgTable("retrieval_configs", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name").notNull(),
    similarityThreshold: real("similarity_threshold").default(0.7),
    maxResults: integer("max_results").default(10),
    chunkSize: integer("chunk_size").default(1000),
    chunkOverlap: integer("chunk_overlap").default(200),
    searchStrategy: varchar("search_strategy").default('hybrid'),
    embeddingModel: varchar("embedding_model").default('text-embedding-3-large'),
    isDefault: boolean("is_default").default(false),
    createdAt: timestamp("created_at").defaultNow(),
});
// Content Filtering Rules
export const contentFilters = pgTable("content_filters", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name").notNull(),
    filterType: varchar("filter_type").notNull(), // profanity, bias, compliance
    pattern: text("pattern").notNull(),
    severity: varchar("severity").default('medium'), // low, medium, high, critical
    action: varchar("action").default('flag'), // flag, block, modify
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
});
export const insertAdminSettingSchema = createInsertSchema(adminSettings).omit({
    id: true,
    updatedAt: true,
});
export const insertAdminSettingsSchema = createInsertSchema(adminSettings).omit({
    id: true,
    updatedAt: true,
});
export const insertQAKnowledgeBaseSchema = createInsertSchema(qaKnowledgeBase).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
export const insertDocumentTagSchema = createInsertSchema(documentTags).omit({
    id: true,
    createdAt: true,
});
export const insertMerchantApplicationSchema = createInsertSchema(merchantApplications).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
// Gamification Schema Exports
export const insertAchievementSchema = createInsertSchema(achievements).omit({
    id: true,
    createdAt: true,
});
export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
    id: true,
    unlockedAt: true,
});
export const insertUserStatsSchema = createInsertSchema(userStats).omit({
    id: true,
    updatedAt: true,
});
export const insertChatRatingSchema = createInsertSchema(chatRatings).omit({
    id: true,
    createdAt: true,
});
export const insertDailyUsageSchema = createInsertSchema(dailyUsage).omit({
    id: true,
    createdAt: true,
});
export const insertLeaderboardSchema = createInsertSchema(leaderboards).omit({
    id: true,
    createdAt: true,
});
export const insertFaqCategorySchema = createInsertSchema(faqCategories).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
export const insertFaqSchema = createInsertSchema(faqKnowledgeBase).omit({
    id: true,
    createdAt: true,
    lastUpdated: true,
});
export const insertVendorUrlSchema = createInsertSchema(vendorUrls).omit({
    id: true,
    lastScraped: true,
    lastContentHash: true,
    createdAt: true,
    updatedAt: true,
});
export const insertHelpContentSchema = createInsertSchema(helpContent).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
export const insertUserChatLogSchema = createInsertSchema(userChatLogs).omit({
    id: true,
    timestamp: true,
});
// Vendor Intelligence Tables - Note: vendors table defined above
export const vendorDocuments = pgTable("vendor_documents", {
    id: varchar("id").primaryKey().notNull(),
    vendorId: uuid("vendor_id").notNull().references(() => vendors.id),
    url: varchar("url").notNull(),
    directDownloadUrl: varchar("direct_download_url"), // Direct PDF/file link
    title: varchar("title").notNull(),
    contentHash: varchar("content_hash").notNull(),
    content: text("content"),
    documentType: varchar("document_type"), // 'rate_sheet', 'api_doc', 'compliance', 'guide', 'terminal_guide', 'integration_manual'
    category: varchar("category"), // 'pricing', 'technical', 'compliance', 'marketing', 'support'
    publicationDate: timestamp("publication_date"), // Actual publication date from vendor
    effectiveDate: timestamp("effective_date"), // When changes take effect
    version: varchar("version"), // Document version number
    fileSize: integer("file_size"), // File size in bytes
    fileFormat: varchar("file_format"), // 'pdf', 'doc', 'html', 'xml'
    downloadCount: integer("download_count").default(0),
    discoveredAt: timestamp("discovered_at").defaultNow(),
    lastChecked: timestamp("last_checked").defaultNow(),
    lastModified: timestamp("last_modified"),
    isActive: boolean("is_active").default(true),
});
export const documentChanges = pgTable("document_changes", {
    id: varchar("id").primaryKey().notNull(),
    documentId: varchar("document_id").notNull().references(() => vendorDocuments.id),
    changeType: varchar("change_type").notNull(), // 'new', 'updated', 'removed'
    changeDetails: jsonb("change_details"), // Detailed diff information
    detectedAt: timestamp("detected_at").defaultNow(),
    notified: boolean("notified").default(false),
});
// Document approval workflow tables
export const pendingDocumentApprovals = pgTable("pending_document_approvals", {
    id: varchar("id").primaryKey().notNull(),
    vendorId: uuid("vendor_id").notNull().references(() => vendors.id),
    documentTitle: varchar("document_title").notNull(),
    documentUrl: varchar("document_url").notNull(),
    documentType: varchar("document_type").notNull(), // 'pdf', 'sales_flyer', 'product_announcement', 'blog_post', 'news', 'promotion'
    contentPreview: text("content_preview"), // First 500 chars of content
    aiRecommendation: varchar("ai_recommendation").notNull(), // 'recommend', 'review_needed', 'skip'
    aiReasoning: text("ai_reasoning"), // Why AI recommends this action
    suggestedFolder: varchar("suggested_folder"), // AI suggested folder placement
    newsWorthiness: integer("news_worthiness").default(0), // 1-10 scale
    detectedAt: timestamp("detected_at").defaultNow(),
    status: varchar("status").default('pending'), // 'pending', 'approved', 'rejected', 'archived'
});
export const documentApprovalDecisions = pgTable("document_approval_decisions", {
    id: varchar("id").primaryKey().notNull(),
    approvalId: varchar("approval_id").notNull().references(() => pendingDocumentApprovals.id),
    adminUserId: varchar("admin_user_id").notNull(),
    decision: varchar("decision").notNull(), // 'approve', 'reject'
    selectedFolder: varchar("selected_folder"), // Admin chosen folder
    permissionLevel: varchar("permission_level"), // 'public', 'admin_only', 'manager_access', 'training_data'
    decidedAt: timestamp("decided_at").defaultNow(),
    notes: text("notes"), // Admin notes
});
// News and updates dashboard
export const vendorNews = pgTable("vendor_news", {
    id: varchar("id").primaryKey().notNull(),
    vendorId: uuid("vendor_id").notNull().references(() => vendors.id),
    title: varchar("title").notNull(),
    summary: text("summary"),
    content: text("content"),
    url: varchar("url").notNull(),
    newsType: varchar("news_type").notNull(), // 'product_announcement', 'rate_change', 'policy_update', 'promotion', 'blog_post'
    importance: integer("importance").default(5), // 1-10 scale for prioritization
    publishedAt: timestamp("published_at"),
    detectedAt: timestamp("detected_at").defaultNow(),
    isVisible: boolean("is_visible").default(true),
    tags: jsonb("tags"), // Array of relevant tags
});
export const vendorRelations = relations(vendors, ({ many }) => ({
    documents: many(vendorDocuments),
}));
export const vendorDocumentRelations = relations(vendorDocuments, ({ one, many }) => ({
    vendor: one(vendors, {
        fields: [vendorDocuments.vendorId],
        references: [vendors.id],
    }),
    changes: many(documentChanges),
}));
export const documentChangeRelations = relations(documentChanges, ({ one }) => ({
    document: one(vendorDocuments, {
        fields: [documentChanges.documentId],
        references: [vendorDocuments.id],
    }),
}));
// Additional vendor document schema types (insertVendorSchema already defined above)
export const insertVendorDocumentSchema = createInsertSchema(vendorDocuments).omit({
    id: true,
    discoveredAt: true,
    lastChecked: true,
});
export const insertDocumentChangeSchema = createInsertSchema(documentChanges).omit({
    id: true,
    detectedAt: true,
});
// Security audit logs table
export const auditLogs = pgTable("audit_logs", {
    id: uuid("id").primaryKey().defaultRandom(),
    eventType: varchar("event_type").notNull(),
    userId: varchar("user_id"),
    userEmail: varchar("user_email"),
    ipAddress: varchar("ip_address").notNull(),
    userAgent: text("user_agent"),
    resourceId: varchar("resource_id"),
    resourceType: varchar("resource_type"),
    action: varchar("action").notNull(),
    details: jsonb("details"),
    success: boolean("success").notNull(),
    errorMessage: text("error_message"),
    status: varchar("status"),
    timestamp: timestamp("timestamp").defaultNow(),
    createdAt: timestamp("created_at").defaultNow(),
});
export const insertAuditLogSchema = createInsertSchema(auditLogs);
