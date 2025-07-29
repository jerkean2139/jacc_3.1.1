#!/usr/bin/env tsx
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './shared/schema.js';
import ws from "ws";

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

const { users, vendors, documents, faqKnowledgeBase, chats, messages, folders, vendorUrls, trainingInteractions } = schema;

async function drizzleMigration() {
  console.log('🚀 Starting Drizzle ORM migration...');
  
  try {
    // Setup databases
    const sourcePool = new Pool({ connectionString: process.env.SOURCE_DATABASE_URL });
    const targetPool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    const sourceDB = drizzle({ client: sourcePool, schema });
    const targetDB = drizzle({ client: targetPool, schema });
    
    console.log('✅ Database connections established');
    
    // 1. Migrate Users
    console.log('\n👥 Migrating users...');
    const sourceUsers = await sourceDB.select().from(users);
    console.log(`Found ${sourceUsers.length} users in source`);
    
    for (const user of sourceUsers) {
      try {
        await targetDB.insert(users).values(user).onConflictDoNothing();
      } catch (error) {
        console.log(`Skipping user ${user.id}: ${error.message}`);
      }
    }
    
    // 2. Migrate Vendors
    console.log('\n🏢 Migrating vendors...');
    const sourceVendors = await sourceDB.select().from(vendors);
    console.log(`Found ${sourceVendors.length} vendors in source`);
    
    for (const vendor of sourceVendors) {
      try {
        await targetDB.insert(vendors).values(vendor).onConflictDoNothing();
      } catch (error) {
        console.log(`Skipping vendor ${vendor.id}: ${error.message}`);
      }
    }
    
    // 3. Migrate Folders  
    console.log('\n📁 Migrating folders...');
    const sourceFolders = await sourceDB.select().from(folders);
    console.log(`Found ${sourceFolders.length} folders in source`);
    
    for (const folder of sourceFolders) {
      try {
        await targetDB.insert(folders).values(folder).onConflictDoNothing();
      } catch (error) {
        console.log(`Skipping folder ${folder.id}: ${error.message}`);
      }
    }
    
    // 4. Migrate Documents
    console.log('\n📄 Migrating documents...');
    const sourceDocuments = await sourceDB.select().from(documents);
    console.log(`Found ${sourceDocuments.length} documents in source`);
    
    for (const doc of sourceDocuments) {
      try {
        await targetDB.insert(documents).values(doc).onConflictDoNothing();
      } catch (error) {
        console.log(`Skipping document ${doc.id}: ${error.message}`);
      }
    }
    
    // 5. Migrate FAQ Knowledge Base
    console.log('\n❓ Migrating FAQ entries...');
    const sourceFAQs = await sourceDB.select().from(faqKnowledgeBase);
    console.log(`Found ${sourceFAQs.length} FAQ entries in source`);
    
    for (const faq of sourceFAQs) {
      try {
        await targetDB.insert(faqKnowledgeBase).values(faq).onConflictDoNothing();
      } catch (error) {
        console.log(`Skipping FAQ ${faq.id}: ${error.message}`);
      }
    }
    
    // 6. Migrate Chats
    console.log('\n💬 Migrating chats...');
    const sourceChats = await sourceDB.select().from(chats);
    console.log(`Found ${sourceChats.length} chats in source`);
    
    for (const chat of sourceChats) {
      try {
        await targetDB.insert(chats).values(chat).onConflictDoNothing();
      } catch (error) {
        console.log(`Skipping chat ${chat.id}: ${error.message}`);
      }
    }
    
    // 7. Migrate Messages
    console.log('\n💌 Migrating messages...');
    const sourceMessages = await sourceDB.select().from(messages);
    console.log(`Found ${sourceMessages.length} messages in source`);
    
    let batchSize = 50;
    for (let i = 0; i < sourceMessages.length; i += batchSize) {
      const batch = sourceMessages.slice(i, i + batchSize);
      try {
        await targetDB.insert(messages).values(batch).onConflictDoNothing();
        console.log(`Migrated batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(sourceMessages.length/batchSize)}`);
      } catch (error) {
        console.log(`Error in batch ${Math.floor(i/batchSize) + 1}: ${error.message}`);
      }
    }
    
    // 8. Migrate Vendor URLs
    console.log('\n🔗 Migrating vendor URLs...');
    const sourceVendorUrls = await sourceDB.select().from(vendorUrls);
    console.log(`Found ${sourceVendorUrls.length} vendor URLs in source`);
    
    for (const vendorUrl of sourceVendorUrls) {
      try {
        await targetDB.insert(vendorUrls).values(vendorUrl).onConflictDoNothing();
      } catch (error) {
        console.log(`Skipping vendor URL ${vendorUrl.id}: ${error.message}`);
      }
    }
    
    // 9. Migrate Training Interactions
    console.log('\n🎓 Migrating training interactions...');
    const sourceTraining = await sourceDB.select().from(trainingInteractions);
    console.log(`Found ${sourceTraining.length} training interactions in source`);
    
    for (const training of sourceTraining) {
      try {
        await targetDB.insert(trainingInteractions).values(training).onConflictDoNothing();
      } catch (error) {
        console.log(`Skipping training ${training.id}: ${error.message}`);
      }
    }
    
    // Final verification
    console.log('\n📊 Final migration statistics:');
    const finalStats = {
      users: (await targetDB.select().from(users)).length,
      vendors: (await targetDB.select().from(vendors)).length,
      documents: (await targetDB.select().from(documents)).length,
      faqKnowledgeBase: (await targetDB.select().from(faqKnowledgeBase)).length,
      chats: (await targetDB.select().from(chats)).length,
      messages: (await targetDB.select().from(messages)).length,
      folders: (await targetDB.select().from(folders)).length,
      vendorUrls: (await targetDB.select().from(vendorUrls)).length,
      trainingInteractions: (await targetDB.select().from(trainingInteractions)).length
    };
    
    console.log('Target database final counts:', finalStats);
    
    // Close connections
    await sourcePool.end();
    await targetPool.end();
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

drizzleMigration()
  .then(() => {
    console.log('✨ JACC 3.1 migration complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });