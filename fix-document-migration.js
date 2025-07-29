#!/usr/bin/env tsx
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './shared/schema.js';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

async function fixDocumentMigration() {
  console.log('🔧 Fixing document migration with proper user assignments...');
  
  try {
    const sourcePool = new Pool({ connectionString: process.env.SOURCE_DATABASE_URL });
    const targetPool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    const sourceDB = drizzle({ client: sourcePool, schema });
    const targetDB = drizzle({ client: targetPool, schema });
    
    // Get available target users
    const targetUsers = await targetDB.select().from(schema.users);
    console.log(`Available users in target: ${targetUsers.length}`);
    
    // Find a suitable admin user for document ownership
    const adminUser = targetUsers.find(u => u.role === 'dev-admin' || u.role === 'client-admin') || targetUsers[0];
    console.log(`Using user: ${adminUser.email} (${adminUser.role})`);
    
    // Get source documents
    const sourceDocs = await sourceDB.select().from(schema.documents);
    const targetDocs = await targetDB.select().from(schema.documents);
    
    // Create sets for comparison
    const targetDocNames = new Set(targetDocs.map(doc => doc.name));
    const missingDocs = sourceDocs.filter(doc => !targetDocNames.has(doc.name));
    
    console.log(`Source documents: ${sourceDocs.length}`);
    console.log(`Target documents: ${targetDocs.length}`);
    console.log(`Missing documents: ${missingDocs.length}`);
    
    if (missingDocs.length === 0) {
      console.log('No missing documents found!');
      return;
    }
    
    console.log('\n📥 Migrating missing documents with corrected user assignments...');
    let migrated = 0;
    let failed = 0;
    
    for (const doc of missingDocs) {
      try {
        // Create a copy of the document with the correct user_id
        const fixedDoc = {
          ...doc,
          userId: adminUser.id, // Assign to our admin user
          folderId: null, // Clear folder assignment initially to avoid FK issues
        };
        
        await targetDB.insert(schema.documents).values(fixedDoc).onConflictDoNothing();
        migrated++;
        
        if (migrated % 20 === 0) {
          console.log(`Migrated ${migrated}/${missingDocs.length} documents...`);
        }
        
      } catch (error) {
        failed++;
        if (failed <= 3) { // Only show first 3 errors
          console.log(`Failed to migrate ${doc.name}: ${error.message}`);
        }
      }
    }
    
    console.log(`\n✅ Document migration completed:`);
    console.log(`  Successfully migrated: ${migrated}`);
    console.log(`  Failed: ${failed}`);
    
    // Final verification
    const finalDocs = await targetDB.select().from(schema.documents);
    console.log(`\n📊 Final document count: ${finalDocs.length} (target was 149)`);
    
    // Show document categories
    const categoryCount = {};
    finalDocs.forEach(doc => {
      const cat = doc.category || 'uncategorized';
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });
    
    console.log('\n📂 Documents by category:');
    Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .forEach(([cat, count]) => {
        console.log(`  ${cat}: ${count} docs`);
      });
    
    // Check completion rate
    const completionRate = Math.round((finalDocs.length / 149) * 100);
    console.log(`\n📈 Document migration completion: ${completionRate}% (${finalDocs.length}/149)`);
    
    await sourcePool.end();
    await targetPool.end();
    
  } catch (error) {
    console.error('❌ Error fixing document migration:', error);
    throw error;
  }
}

fixDocumentMigration()
  .then(() => {
    console.log('🎉 Document migration fix completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Document fix failed:', error);
    process.exit(1);
  });