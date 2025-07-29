#!/usr/bin/env node
/**
 * MongoDB to PostgreSQL Migration Script
 * Migrates data from TRACER MongoDB cluster to JEREMY PostgreSQL database
 */

import { MongoClient } from 'mongodb';
import { db } from './server/db.js';
import { users, documents, chats, messages, folders, faqKnowledgeBase } from './shared/schema.js';
import crypto from 'crypto';

// Configuration - Replace with your TRACER MongoDB details
const MONGODB_CONFIG = {
  connectionString: 'mongodb://[TRACER_CONNECTION_STRING]',
  databaseName: 'tracer_database',
  collections: {
    users: 'users',
    documents: 'documents', 
    chats: 'chats',
    messages: 'messages',
    folders: 'folders',
    faq: 'faq_entries'
  }
};

class DatabaseMigrator {
  constructor() {
    this.mongoClient = null;
    this.mongoDB = null;
    this.migrationStats = {
      users: 0,
      documents: 0,
      chats: 0,
      messages: 0,
      folders: 0,
      faq: 0,
      errors: []
    };
  }

  async connect() {
    console.log('🔗 Connecting to TRACER MongoDB...');
    this.mongoClient = new MongoClient(MONGODB_CONFIG.connectionString);
    await this.mongoClient.connect();
    this.mongoDB = this.mongoClient.db(MONGODB_CONFIG.databaseName);
    console.log('✅ Connected to MongoDB');

    console.log('🔗 Testing PostgreSQL connection...');
    await db.execute('SELECT 1');
    console.log('✅ Connected to PostgreSQL');
  }

  async disconnect() {
    if (this.mongoClient) {
      await this.mongoClient.close();
      console.log('🔒 Disconnected from MongoDB');
    }
  }

  transformUser(mongoUser) {
    return {
      id: mongoUser._id?.toString() || crypto.randomUUID(),
      username: mongoUser.username,
      email: mongoUser.email,
      passwordHash: mongoUser.passwordHash || mongoUser.password_hash,
      firstName: mongoUser.firstName || mongoUser.first_name,
      lastName: mongoUser.lastName || mongoUser.last_name,
      role: mongoUser.role || 'sales-agent',
      isActive: mongoUser.isActive !== false,
      createdAt: mongoUser.createdAt || new Date(),
      updatedAt: mongoUser.updatedAt || new Date()
    };
  }

  transformDocument(mongoDoc) {
    return {
      id: mongoDoc._id?.toString() || crypto.randomUUID(),
      filename: mongoDoc.filename,
      originalName: mongoDoc.originalName || mongoDoc.filename,
      mimeType: mongoDoc.mimeType || 'application/pdf',
      size: mongoDoc.size || 0,
      content: mongoDoc.content,
      folderId: mongoDoc.folderId?.toString(),
      userId: mongoDoc.userId?.toString(),
      adminOnly: mongoDoc.adminOnly || false,
      createdAt: mongoDoc.createdAt || new Date(),
      updatedAt: mongoDoc.updatedAt || new Date()
    };
  }

  transformChat(mongoChat) {
    return {
      id: mongoChat._id?.toString() || crypto.randomUUID(),
      userId: mongoChat.userId?.toString(),
      title: mongoChat.title || 'Untitled Chat',
      createdAt: mongoChat.createdAt || new Date(),
      updatedAt: mongoChat.updatedAt || new Date()
    };
  }

  transformMessage(mongoMessage) {
    return {
      id: mongoMessage._id?.toString() || crypto.randomUUID(),
      chatId: mongoMessage.chatId?.toString(),
      content: mongoMessage.content,
      role: mongoMessage.role || 'user',
      createdAt: mongoMessage.createdAt || new Date()
    };
  }

  transformFolder(mongoFolder) {
    return {
      id: mongoFolder._id?.toString() || crypto.randomUUID(),
      name: mongoFolder.name,
      adminOnly: mongoFolder.adminOnly || false,
      createdAt: mongoFolder.createdAt || new Date()
    };
  }

  transformFAQ(mongoFAQ) {
    return {
      id: mongoFAQ._id?.toString() || crypto.randomUUID(),
      question: mongoFAQ.question,
      answer: mongoFAQ.answer,
      category: mongoFAQ.category || 'general',
      priority: mongoFAQ.priority || 'medium',
      createdAt: mongoFAQ.createdAt || new Date(),
      updatedAt: mongoFAQ.updatedAt || new Date()
    };
  }

  async migrateCollection(collectionName, transformFn, pgTable) {
    try {
      console.log(`📦 Migrating ${collectionName}...`);
      
      const collection = this.mongoDB.collection(MONGODB_CONFIG.collections[collectionName]);
      const documents = await collection.find({}).toArray();
      
      console.log(`   Found ${documents.length} ${collectionName} records`);
      
      if (documents.length === 0) {
        console.log(`   ⚠️  No ${collectionName} to migrate`);
        return;
      }

      const transformedData = documents.map(transformFn.bind(this));
      
      // Batch insert to PostgreSQL
      const batchSize = 100;
      for (let i = 0; i < transformedData.length; i += batchSize) {
        const batch = transformedData.slice(i, i + batchSize);
        await db.insert(pgTable).values(batch);
        console.log(`   📝 Inserted batch ${Math.floor(i/batchSize) + 1}`);
      }
      
      this.migrationStats[collectionName] = documents.length;
      console.log(`   ✅ Migrated ${documents.length} ${collectionName}`);
      
    } catch (error) {
      console.error(`   ❌ Error migrating ${collectionName}:`, error.message);
      this.migrationStats.errors.push({
        collection: collectionName,
        error: error.message
      });
    }
  }

  async runMigration() {
    console.log('🚀 Starting MongoDB → PostgreSQL Migration');
    console.log('=' .repeat(50));

    await this.connect();

    // Migrate in dependency order
    await this.migrateCollection('users', this.transformUser, users);
    await this.migrateCollection('folders', this.transformFolder, folders);
    await this.migrateCollection('documents', this.transformDocument, documents);
    await this.migrateCollection('chats', this.transformChat, chats);
    await this.migrateCollection('messages', this.transformMessage, messages);
    await this.migrateCollection('faq', this.transformFAQ, faqKnowledgeBase);

    await this.disconnect();

    console.log('\n📊 Migration Summary:');
    console.log('=' .repeat(30));
    Object.entries(this.migrationStats).forEach(([key, value]) => {
      if (key !== 'errors') {
        console.log(`${key}: ${value} records`);
      }
    });

    if (this.migrationStats.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.migrationStats.errors.forEach(error => {
        console.log(`   ${error.collection}: ${error.error}`);
      });
    }

    console.log('\n🎉 Migration completed!');
  }
}

// Usage instructions
if (process.argv.includes('--help')) {
  console.log(`
MongoDB to PostgreSQL Migration Tool

Setup:
1. Install MongoDB driver: npm install mongodb
2. Update MONGODB_CONFIG with your TRACER connection details
3. Run: node mongodb-to-postgresql-migrator.js

Configuration required:
- TRACER MongoDB connection string
- Database name
- Collection names mapping
  `);
  process.exit(0);
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const migrator = new DatabaseMigrator();
  migrator.runMigration().catch(console.error);
}

export { DatabaseMigrator };