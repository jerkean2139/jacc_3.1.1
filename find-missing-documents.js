#!/usr/bin/env tsx
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './shared/schema.js';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

async function findMissingDocuments() {
  console.log('🔍 Finding missing documents from source database...');
  
  try {
    const sourcePool = new Pool({ connectionString: process.env.SOURCE_DATABASE_URL });
    const targetPool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    const sourceDB = drizzle({ client: sourcePool, schema });
    const targetDB = drizzle({ client: targetPool, schema });
    
    // Get all documents from both databases
    const sourceDocs = await sourceDB.select().from(schema.documents);
    const targetDocs = await targetDB.select().from(schema.documents);
    
    console.log(`Source database: ${sourceDocs.length} documents`);
    console.log(`Target database: ${targetDocs.length} documents`);
    console.log(`Missing: ${sourceDocs.length - targetDocs.length} documents`);
    
    // Create a set of target document identifiers
    const targetDocIds = new Set();
    const targetDocNames = new Set();
    const targetDocHashes = new Set();
    
    targetDocs.forEach(doc => {
      if (doc.id) targetDocIds.add(doc.id);
      if (doc.name) targetDocNames.add(doc.name);
      if (doc.contentHash) targetDocHashes.add(doc.contentHash);
    });
    
    // Find missing documents
    const missingDocs = sourceDocs.filter(doc => {
      return !targetDocIds.has(doc.id) && 
             !targetDocNames.has(doc.name) && 
             !targetDocHashes.has(doc.contentHash);
    });
    
    console.log(`\n📄 Found ${missingDocs.length} missing documents to migrate`);
    
    if (missingDocs.length > 0) {
      console.log('\nSample missing documents:');
      missingDocs.slice(0, 10).forEach((doc, i) => {
        console.log(`${i+1}. ${doc.name} (${doc.mimeType}) - ${doc.category || 'No category'}`);
      });
      
      console.log('\n📥 Starting migration of missing documents...');
      let migrated = 0;
      let failed = 0;
      
      for (const doc of missingDocs) {
        try {
          await targetDB.insert(schema.documents).values(doc).onConflictDoNothing();
          migrated++;
          if (migrated % 10 === 0) {
            console.log(`Migrated ${migrated}/${missingDocs.length} documents...`);
          }
        } catch (error) {
          failed++;
          if (failed <= 5) { // Only show first 5 errors
            console.log(`Failed to migrate ${doc.name}: ${error.message}`);
          }
        }
      }
      
      console.log(`\n✅ Migration completed: ${migrated} successful, ${failed} failed`);
    }
    
    // Final document count
    const finalDocs = await targetDB.select().from(schema.documents);
    console.log(`\n📊 Final document count: ${finalDocs.length}`);
    
    // Show document breakdown by category
    const docsByCategory = {};
    finalDocs.forEach(doc => {
      const category = doc.category || 'uncategorized';
      docsByCategory[category] = (docsByCategory[category] || 0) + 1;
    });
    
    console.log('\n📂 Documents by category:');
    Object.entries(docsByCategory)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`  ${category}: ${count} documents`);
      });
    
    await sourcePool.end();
    await targetPool.end();
    
  } catch (error) {
    console.error('❌ Error finding missing documents:', error);
    throw error;
  }
}

findMissingDocuments()
  .then(() => {
    console.log('🎉 Document migration check completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Document check failed:', error);
    process.exit(1);
  });