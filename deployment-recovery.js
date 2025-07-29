#!/usr/bin/env node

/**
 * JACC Deployment Recovery Script
 * 
 * This script provides multiple deployment recovery options
 * when platform-level migration issues occur during Replit deployment.
 */

import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  try {
    const result = await db.execute(sql`SELECT 1 as test`);
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function verifySchemaIntegrity() {
  console.log('🔍 Verifying schema integrity...');
  try {
    // Test key tables exist
    const tables = [
      'users', 'sessions', 'chats', 'messages', 'documents', 
      'folders', 'vendors', 'api_keys'
    ];
    
    for (const table of tables) {
      await db.execute(sql`SELECT 1 FROM ${sql.identifier(table)} LIMIT 1`);
      console.log(`✅ Table ${table} exists and accessible`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Schema verification failed:', error.message);
    return false;
  }
}

async function forceSchemaReset() {
  console.log('⚠️  Attempting emergency schema reset...');
  console.log('This will recreate all database tables (data will be preserved where possible)');
  
  try {
    // Import the latest schema
    const { execSync } = await import('child_process');
    
    console.log('Running drizzle-kit push...');
    execSync('npm run db:push', { stdio: 'inherit' });
    
    console.log('✅ Schema reset completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Schema reset failed:', error.message);
    return false;
  }
}

async function generateDeploymentDiagnostics() {
  console.log('📊 Generating deployment diagnostics...');
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    databaseUrl: process.env.DATABASE_URL ? 'Present' : 'Missing',
    nodeVersion: process.version,
    databaseConnection: false,
    schemaIntegrity: false,
    platform: 'Replit',
    deploymentMode: process.env.NODE_ENV || 'unknown'
  };
  
  // Test database connection
  diagnostics.databaseConnection = await testDatabaseConnection();
  
  if (diagnostics.databaseConnection) {
    diagnostics.schemaIntegrity = await verifySchemaIntegrity();
  }
  
  console.log('\n📋 Deployment Diagnostics Report:');
  console.log('=====================================');
  console.log(JSON.stringify(diagnostics, null, 2));
  
  return diagnostics;
}

async function main() {
  console.log('🚀 JACC Deployment Recovery Tool');
  console.log('==================================');
  
  const command = process.argv[2] || 'diagnose';
  
  switch (command) {
    case 'diagnose':
      await generateDeploymentDiagnostics();
      break;
      
    case 'test':
      const connected = await testDatabaseConnection();
      const schemaValid = connected ? await verifySchemaIntegrity() : false;
      console.log(`\n📊 Results: Connection=${connected}, Schema=${schemaValid}`);
      break;
      
    case 'reset':
      const resetResult = await forceSchemaReset();
      if (resetResult) {
        await generateDeploymentDiagnostics();
      }
      break;
      
    default:
      console.log('Available commands:');
      console.log('  diagnose - Generate deployment diagnostics');
      console.log('  test     - Test database connection and schema');
      console.log('  reset    - Force schema reset (emergency use)');
  }
}

main().catch(console.error);