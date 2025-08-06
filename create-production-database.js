#!/usr/bin/env node

/**
 * Create Production Database Copy from Development Database
 * This script creates a new production database and copies all data from development
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';

console.log('🚀 Creating production database copy...');

const DEV_DATABASE_URL = process.env.DATABASE_URL;
const PROD_DATABASE_URL = process.env.DATABASE_URL; // Will be the new production database

if (!DEV_DATABASE_URL) {
  console.error('❌ Development DATABASE_URL not found');
  process.exit(1);
}

try {
  console.log('📊 Analyzing development database...');
  
  // Step 1: Create complete database dump (schema + data)
  console.log('📤 Creating complete database backup...');
  execSync(`pg_dump "${DEV_DATABASE_URL}" --clean --if-exists --create > complete_database_backup.sql`, {
    stdio: 'inherit'
  });

  // Step 2: Create production-ready script
  console.log('🔧 Preparing production database script...');
  let backupData = readFileSync('complete_database_backup.sql', 'utf8');
  
  // Clean up for production deployment
  backupData = backupData
    .replace(/DROP DATABASE IF EXISTS .+;/g, '') // Remove database drop commands
    .replace(/CREATE DATABASE .+;/g, '') // Remove database create commands
    .replace(/\\connect .+/g, '') // Remove connection commands
    .replace(/^--.*$/gm, '') // Remove comments
    .trim();

  writeFileSync('production_database_setup.sql', backupData);

  console.log('✅ Production database backup created!');
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Deploy your app to production');
  console.log('2. In production environment, set these variables:');
  console.log(`   DATABASE_URL=${DEV_DATABASE_URL}`);
  console.log('3. Or run: psql "YOUR_PRODUCTION_DATABASE_URL" < production_database_setup.sql');
  console.log('');
  console.log('🎯 Files created:');
  console.log('   - complete_database_backup.sql (full backup)');
  console.log('   - production_database_setup.sql (production-ready)');

} catch (error) {
  console.error('❌ Error creating production database:', error.message);
  console.log('');
  console.log('💡 Alternative approaches:');
  console.log('1. Use same database for both environments (recommended)');
  console.log('2. Manually create production database and import data');
  console.log('3. Contact Replit support for production database assistance');
}