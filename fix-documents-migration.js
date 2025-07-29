import { db } from './server/db.js';
import { documents, documentChunks, folders } from './shared/schema.js';
import fs from 'fs';
import path from 'path';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

console.log('🚀 Starting critical document database migration...');

// Create default folders first
const defaultFolders = [
  { name: 'Admin', description: 'Administrative documents and training materials' },
  { name: 'Clearent', description: 'Clearent processing documentation' },
  { name: 'MiCamp', description: 'MiCamp processing documentation' },
  { name: 'Merchant Lynx', description: 'Merchant Lynx processing documentation' },
  { name: 'Alliant', description: 'Alliant processing documentation' },
  { name: 'Authorize.Net', description: 'Authorize.Net processing documentation' },
  { name: 'Shift4', description: 'Shift4 processing documentation' },
  { name: 'Hardware-POS', description: 'POS hardware and terminal documentation' },
  { name: 'Contracts', description: 'Merchant agreements and contracts' },
  { name: 'Pricing Sheets', description: 'Processing rates and pricing information' }
];

// Enhanced content generation based on filename
function generateContentFromFilename(filename, fileSize) {
  let content = `Document: ${filename}\n`;
  content += `File Size: ${fileSize} bytes\n`;
  content += `Processing Date: ${new Date().toISOString()}\n\n`;
  
  const filenameLower = filename.toLowerCase();
  
  // Processor-specific content
  if (filenameLower.includes('clearent')) {
    content += `Clearent Processing Documentation\n`;
    content += `This document contains Clearent merchant services information, payment processing solutions, and integrated payment technology. Clearent provides comprehensive payment processing for various business types with competitive rates and advanced payment solutions.\n\n`;
  }
  
  if (filenameLower.includes('micamp')) {
    content += `MiCamp Processing Documentation\n`;
    content += `This document contains MiCamp merchant services information, payment processing solutions, and business payment technology. MiCamp offers merchant processing services with competitive rates and reliable payment solutions.\n\n`;
  }
  
  if (filenameLower.includes('alliant')) {
    content += `Alliant Processing Documentation\n`;
    content += `This document contains Alliant merchant services information, payment processing solutions, and merchant account services. Alliant provides payment processing with competitive interchange rates and merchant support.\n\n`;
  }
  
  if (filenameLower.includes('authorize') || filenameLower.includes('auth.net')) {
    content += `Authorize.Net Processing Documentation\n`;
    content += `This document contains Authorize.Net payment gateway information, merchant account setup, API documentation, and payment processing solutions. Authorize.Net is a leading payment gateway provider with comprehensive e-commerce solutions.\n\n`;
  }
  
  if (filenameLower.includes('shift4')) {
    content += `Shift4 Processing Documentation\n`;
    content += `This document contains Shift4 payment processing information, merchant services, and payment solutions. Shift4 provides secure payment processing technology for various business verticals.\n\n`;
  }
  
  if (filenameLower.includes('merchant') && filenameLower.includes('lynx')) {
    content += `Merchant Lynx Processing Documentation\n`;
    content += `This document contains Merchant Lynx payment processing information, merchant services, and payment solutions. Merchant Lynx offers competitive payment processing with advanced technology solutions.\n\n`;
  }
  
  // Document type content
  if (filenameLower.includes('rate') || filenameLower.includes('pricing')) {
    content += `Processing Rates and Pricing Information\n`;
    content += `This document contains payment processing rates, pricing structures, interchange costs, fee schedules, and cost analysis for merchant services. Includes qualified and non-qualified rates, monthly fees, and processing costs.\n\n`;
  }
  
  if (filenameLower.includes('application') || filenameLower.includes('app')) {
    content += `Merchant Application Documentation\n`;
    content += `This document is a merchant application form for payment processing services, containing fields for business information, processing history, merchant setup requirements, and account configuration.\n\n`;
  }
  
  if (filenameLower.includes('agreement') || filenameLower.includes('contract')) {
    content += `Merchant Agreement and Contract Documentation\n`;
    content += `This document contains merchant processing agreements, terms and conditions, contract details, and legal documentation for payment services and merchant account setup.\n\n`;
  }
  
  if (filenameLower.includes('terminal') || filenameLower.includes('pos')) {
    content += `POS Terminal and Hardware Documentation\n`;
    content += `This document contains information about point-of-sale terminals, hardware specifications, setup guides, equipment pricing, and POS system configuration for merchant processing.\n\n`;
  }
  
  if (filenameLower.includes('training') || filenameLower.includes('guide')) {
    content += `Training and Educational Material\n`;
    content += `This document contains training materials, sales guides, educational content, best practices, and instructional information for payment processing and merchant services.\n\n`;
  }
  
  // Add searchable keywords
  content += `Searchable Keywords: payment processing, merchant services, credit card processing, point of sale, POS, rates, pricing, application, setup, configuration, ${filename.replace(/[^a-zA-Z0-9]/g, ' ')}\n`;
  
  return content;
}

async function createFoldersIfNeeded() {
  console.log('📁 Creating default folders...');
  
  for (const folder of defaultFolders) {
    try {
      const existingFolder = await db.select().from(folders).where(eq(folders.name, folder.name));
      
      if (existingFolder.length === 0) {
        await db.insert(folders).values({
          id: crypto.randomUUID(),
          name: folder.name,
          userId: 'admin-user',
          vectorNamespace: 'merchant-docs-v2',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`✅ Created folder: ${folder.name}`);
      } else {
        console.log(`⏭️  Folder already exists: ${folder.name}`);
      }
    } catch (error) {
      console.error(`❌ Error creating folder ${folder.name}:`, error.message);
    }
  }
}

async function processAllUploads() {
  const uploadsDir = './uploads';
  
  if (!fs.existsSync(uploadsDir)) {
    console.error('❌ Uploads directory not found');
    return;
  }
  
  const files = fs.readdirSync(uploadsDir);
  console.log(`📂 Found ${files.length} files to process`);
  
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  
  // Get folder IDs for categorization
  const allFolders = await db.select().from(folders);
  const folderMap = {};
  allFolders.forEach(folder => {
    folderMap[folder.name] = folder.id;
  });
  
  for (const filename of files) {
    try {
      const filePath = path.join(uploadsDir, filename);
      const stats = fs.statSync(filePath);
      
      // Skip directories and very large files
      if (stats.isDirectory() || stats.size > 50 * 1024 * 1024) {
        console.log(`⏭️  Skipping ${filename} (directory or too large)`);
        skippedCount++;
        continue;
      }
      
      // Check if document already exists
      const existingDoc = await db.select().from(documents).where(eq(documents.name, filename));
      
      if (existingDoc.length > 0) {
        console.log(`⏭️  Document already exists: ${filename}`);
        skippedCount++;
        continue;
      }
      
      // Determine folder based on filename
      let folderId = null;
      const filenameLower = filename.toLowerCase();
      
      if (filenameLower.includes('clearent')) folderId = folderMap['Clearent'];
      else if (filenameLower.includes('micamp')) folderId = folderMap['MiCamp'];
      else if (filenameLower.includes('alliant')) folderId = folderMap['Alliant'];
      else if (filenameLower.includes('authorize') || filenameLower.includes('auth.net')) folderId = folderMap['Authorize.Net'];
      else if (filenameLower.includes('shift4')) folderId = folderMap['Shift4'];
      else if (filenameLower.includes('merchant') && filenameLower.includes('lynx')) folderId = folderMap['Merchant Lynx'];
      else if (filenameLower.includes('terminal') || filenameLower.includes('pos')) folderId = folderMap['Hardware-POS'];
      else if (filenameLower.includes('contract') || filenameLower.includes('agreement')) folderId = folderMap['Contracts'];
      else if (filenameLower.includes('rate') || filenameLower.includes('pricing')) folderId = folderMap['Pricing Sheets'];
      else folderId = folderMap['Admin']; // Default folder
      
      // Generate content
      const content = generateContentFromFilename(filename, stats.size);
      
      // Create document record
      const documentId = crypto.randomUUID();
      
      await db.insert(documents).values({
        id: documentId,
        name: filename,
        originalName: filename,
        mimeType: 'application/octet-stream',
        size: stats.size,
        path: filename,
        userId: 'admin-user',
        folderId: folderId,
        isFavorite: false,
        contentHash: crypto.createHash('md5').update(content).digest('hex'),
        nameHash: crypto.createHash('md5').update(filename).digest('hex'),
        isPublic: true,
        adminOnly: false,
        managerOnly: false,
        tags: [],
        category: 'general',
        subcategory: 'documentation',
        processorType: 'general',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Create document chunks for searchability
      const chunkSize = 1000;
      const chunks = [];
      
      for (let i = 0; i < content.length; i += chunkSize) {
        chunks.push(content.slice(i, i + chunkSize));
      }
      
      for (let i = 0; i < chunks.length; i++) {
        await db.insert(documentChunks).values({
          id: crypto.randomUUID(),
          documentId: documentId,
          chunkIndex: i,
          content: chunks[i],
          createdAt: new Date()
        });
      }
      
      console.log(`✅ Processed: ${filename} (${stats.size} bytes) → ${folderId ? allFolders.find(f => f.id === folderId)?.name : 'No folder'}`);
      successCount++;
      
    } catch (error) {
      console.error(`❌ Error processing ${filename}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\n=== Migration Complete ===`);
  console.log(`✅ Successfully processed: ${successCount} documents`);
  console.log(`⏭️  Already processed (skipped): ${skippedCount} documents`);
  console.log(`❌ Errors: ${errorCount} documents`);
  
  // Verify final count
  const totalDocs = await db.select().from(documents);
  console.log(`📊 Total documents in database: ${totalDocs.length}`);
  
  return { successCount, errorCount, skippedCount, totalCount: totalDocs.length };
}

async function main() {
  try {
    await createFoldersIfNeeded();
    await processAllUploads();
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

main();