#!/usr/bin/env tsx
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './shared/schema.js';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const { vendors, faqKnowledgeBase, documents } = schema;

async function cleanupDuplicates() {
  console.log('🧹 Starting duplicate cleanup...');
  
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle({ client: pool, schema });
    
    // 1. Clean up duplicate FAQs - keep only the first occurrence
    console.log('\n❓ Cleaning up duplicate FAQ entries...');
    const duplicateFAQs = await db.execute(`
      DELETE FROM faq_knowledge_base 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM faq_knowledge_base 
        GROUP BY question
      )
    `);
    console.log(`Removed ${duplicateFAQs.rowCount} duplicate FAQ entries`);
    
    // 2. Clean up duplicate vendors - keep only the first occurrence
    console.log('\n🏢 Cleaning up duplicate vendors...');
    const duplicateVendors = await db.execute(`
      DELETE FROM vendors 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM vendors 
        GROUP BY name
      )
    `);
    console.log(`Removed ${duplicateVendors.rowCount} duplicate vendor entries`);
    
    // 3. Check for documents from source database that we might have missed
    console.log('\n📄 Checking document migration status...');
    
    // Get current document count and details
    const currentDocs = await db.select().from(documents);
    console.log(`Current documents: ${currentDocs.length}`);
    
    // Check if we need to get more documents from source
    if (process.env.SOURCE_DATABASE_URL) {
      console.log('📥 Checking source database for missing documents...');
      const sourcePool = new Pool({ connectionString: process.env.SOURCE_DATABASE_URL });
      const sourceDB = drizzle({ client: sourcePool, schema });
      
      const sourceDocs = await sourceDB.select().from(documents);
      console.log(`Source documents: ${sourceDocs.length}`);
      
      // Find documents that exist in source but not in target
      const currentDocHashes = new Set(currentDocs.map(doc => doc.contentHash || doc.name));
      const missingDocs = sourceDocs.filter(doc => 
        !currentDocHashes.has(doc.contentHash || doc.name)
      );
      
      console.log(`Missing documents: ${missingDocs.length}`);
      
      if (missingDocs.length > 0) {
        console.log('📥 Migrating missing documents...');
        let migrated = 0;
        
        for (const doc of missingDocs) {
          try {
            await db.insert(documents).values(doc).onConflictDoNothing();
            migrated++;
          } catch (error) {
            console.log(`Skipping document ${doc.name}: ${error.message}`);
          }
        }
        
        console.log(`Successfully migrated ${migrated} additional documents`);
      }
      
      await sourcePool.end();
    }
    
    // Final counts
    console.log('\n📊 Final cleanup results:');
    const finalStats = {
      faq_entries: (await db.select().from(faqKnowledgeBase)).length,
      vendors: (await db.select().from(vendors)).length,
      documents: (await db.select().from(documents)).length
    };
    
    console.log('Cleaned database counts:', finalStats);
    
    await pool.end();
    console.log('✅ Duplicate cleanup completed!');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
}

cleanupDuplicates()
  .then(() => {
    console.log('🎉 Cleanup process completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Cleanup failed:', error);
    process.exit(1);
  });