#!/usr/bin/env node

/**
 * Data Migration Script for JACC Production Deployment
 * Transfers data from development database to production database
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

// Configuration
const DEV_DATABASE_URL = process.env.DATABASE_URL; // Your current dev database
const PROD_DATABASE_URL = process.env.PRODUCTION_DATABASE_URL; // Your production database URL

console.log('🚀 Starting JACC data migration to production...');

try {
  // Step 1: Export development data
  console.log('📤 Exporting development data...');
  execSync(`pg_dump "${DEV_DATABASE_URL}" --data-only --inserts > dev_data_export.sql`, {
    stdio: 'inherit'
  });

  // Step 2: Clean up the export (remove problematic statements)
  console.log('🧹 Cleaning up export file...');
  let exportData = readFileSync('dev_data_export.sql', 'utf8');
  
  // Remove SET statements and other potential issues
  exportData = exportData
    .replace(/^SET .+;$/gm, '')
    .replace(/^SELECT pg_catalog\.set_config.+;$/gm, '')
    .replace(/^--.*$/gm, '')
    .trim();

  writeFileSync('cleaned_data_export.sql', exportData);

  // Step 3: Import to production (if PROD_DATABASE_URL is provided)
  if (PROD_DATABASE_URL) {
    console.log('📥 Importing data to production database...');
    execSync(`psql "${PROD_DATABASE_URL}" < cleaned_data_export.sql`, {
      stdio: 'inherit'
    });
    console.log('✅ Data migration completed successfully!');
  } else {
    console.log('⚠️  Production DATABASE_URL not provided.');
    console.log('📋 Export file created: cleaned_data_export.sql');
    console.log('👉 Upload this file to your production database manually.');
  }

} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.log('\n💡 Alternative: Use the same database for both environments');
  console.log('   Set PRODUCTION_DATABASE_URL to your current DATABASE_URL');
}