#!/usr/bin/env tsx
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './shared/schema.js';
import ws from "ws";

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

// Setup for both databases
const setupDatabase = (connectionString, label) => {
  console.log(`📡 Setting up ${label} database connection...`);
  
  // Add connection timeout and retry logic
  const pool = new Pool({ 
    connectionString,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 1 // Limit concurrent connections
  });
  
  const db = drizzle({ client: pool, schema });
  return { pool, db };
};

async function directDatabaseMigration() {
  console.log('🚀 Starting DIRECT database migration from JACC 3.1 source...');
  
  try {
    // Current target database (this repl)
    const targetDB = setupDatabase(process.env.DATABASE_URL, 'TARGET');
    
    // You'll need to provide the source database URL
    // I'll check environment variables for source database credentials
    const sourceConnectionString = process.env.SOURCE_DATABASE_URL || 
      process.env.JACC_DATABASE_URL || 
      process.env.ORIGINAL_DATABASE_URL ||
      process.env.OLD_DATABASE_URL;
    
    if (!sourceConnectionString) {
      console.log('❌ Source database URL not found in environment variables.');
      console.log('🔍 Please provide your original JACC 3.1 database connection string.');
      console.log('📝 Looking for environment variables: SOURCE_DATABASE_URL, JACC_DATABASE_URL, ORIGINAL_DATABASE_URL, OLD_DATABASE_URL');
      
      // List available environment variables that might contain database info
      console.log('\n🔧 Available database-related environment variables:');
      Object.keys(process.env)
        .filter(key => key.includes('DATABASE') || key.includes('DB') || key.includes('POSTGRES') || key.includes('PG'))
        .forEach(key => {
          console.log(`  ${key}: ${key.includes('PASSWORD') ? '[HIDDEN]' : process.env[key]?.substring(0, 50) + '...'}`);
        });
      
      return;
    }
    
    const sourceDB = setupDatabase(sourceConnectionString, 'SOURCE');
    
    // Test both connections with detailed error handling
    console.log('🔍 Testing target database connection...');
    try {
      await targetDB.db.execute('SELECT 1 as test');
      console.log('✅ Target database connection successful!');
    } catch (error) {
      console.error('❌ Target database connection failed:', error.message);
      throw new Error(`Target database connection failed: ${error.message}`);
    }
    
    console.log('🔍 Testing source database connection...');
    try {
      await sourceDB.db.execute('SELECT 1 as test');
      console.log('✅ Source database connection successful!');
    } catch (error) {
      console.error('❌ Source database connection failed:', error.message);
      throw new Error(`Source database connection failed: ${error.message}`);
    }
    
    // Get source data counts
    console.log('📊 Analyzing source database...');
    const sourceStats = await getTableStats(sourceDB.db);
    console.log('Source database contents:', sourceStats);
    
    // Get target data counts  
    console.log('📊 Analyzing target database...');
    const targetStats = await getTableStats(targetDB.db);
    console.log('Target database contents:', targetStats);
    
    // Perform migration for each table
    const tables = ['users', 'vendors', 'documents', 'faq_knowledge_base', 'chats', 'messages', 'folders', 'vendor_urls'];
    
    for (const tableName of tables) {
      if (sourceStats[tableName] > 0) {
        console.log(`\n🔄 Migrating ${tableName} (${sourceStats[tableName]} records)...`);
        await migrateTable(sourceDB.db, targetDB.db, tableName);
      }
    }
    
    console.log('\n🎉 Direct migration completed successfully!');
    
    // Final verification
    const finalStats = await getTableStats(targetDB.db);
    console.log('\n📈 Final migration results:', finalStats);
    
    // Close connections
    await sourceDB.pool.end();
    await targetDB.pool.end();
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
}

async function getTableStats(db) {
  const stats = {};
  
  try {
    const tables = ['users', 'vendors', 'documents', 'faq_knowledge_base', 'chats', 'messages', 'folders', 'vendor_urls', 'training_interactions'];
    
    for (const table of tables) {
      try {
        const result = await db.execute(`SELECT COUNT(*) as count FROM ${table}`);
        stats[table] = parseInt(result.rows[0].count);
      } catch (error) {
        stats[table] = 0;
      }
    }
  } catch (error) {
    console.error('Error getting table stats:', error);
  }
  
  return stats;
}

async function migrateTable(sourceDB, targetDB, tableName) {
  try {
    // Get all data from source table
    const sourceData = await sourceDB.execute(`SELECT * FROM ${tableName}`);
    
    if (sourceData.rows.length === 0) {
      console.log(`  ⚠️ No data in source ${tableName}`);
      return;
    }
    
    console.log(`  📥 Found ${sourceData.rows.length} records in source ${tableName}`);
    
    // Clear target table (optional - comment out if you want to preserve existing data)
    // await targetDB.execute(`TRUNCATE TABLE ${tableName} CASCADE`);
    
    // Insert data in batches
    const batchSize = 100;
    let migrated = 0;
    
    for (let i = 0; i < sourceData.rows.length; i += batchSize) {
      const batch = sourceData.rows.slice(i, i + batchSize);
      
      for (const row of batch) {
        try {
          // Build INSERT query dynamically
          const columns = Object.keys(row);
          const values = Object.values(row);
          const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
          
          const insertQuery = `
            INSERT INTO ${tableName} (${columns.join(', ')}) 
            VALUES (${placeholders})
            ON CONFLICT DO NOTHING
          `;
          
          await targetDB.execute(insertQuery, values);
          migrated++;
        } catch (error) {
          console.error(`    ❌ Error inserting row into ${tableName}:`, error.message);
        }
      }
    }
    
    console.log(`  ✅ Migrated ${migrated} records to ${tableName}`);
    
  } catch (error) {
    console.error(`❌ Error migrating ${tableName}:`, error);
  }
}

// Run the migration
directDatabaseMigration()
  .then(() => {
    console.log('🎊 Migration process completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });

export { directDatabaseMigration };