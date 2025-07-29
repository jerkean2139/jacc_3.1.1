// Script to distribute ALL documents to appropriate folders based on intelligent analysis
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

const sql = neon(process.env.DATABASE_URL);

async function distributeAllDocuments() {
  console.log('🔄 Starting comprehensive document distribution...');
  
  try {
    // Get all folders
    const folders = await sql`
      SELECT id, name, folder_type
      FROM folders
      ORDER BY name
    `;
    
    console.log('📁 Available folders:');
    folders.forEach(folder => {
      console.log(`  - ${folder.name} (${folder.id})`);
    });
    
    // Get ALL documents regardless of current folder assignment
    const allDocuments = await sql`
      SELECT 
        id, 
        name, 
        original_name, 
        path,
        folder_id,
        mime_type,
        size
      FROM documents 
      ORDER BY created_at DESC
    `;
    
    console.log(`\n📄 Found ${allDocuments.length} total documents to process`);
    
    // Create folder mapping
    const folderMap = new Map();
    folders.forEach(folder => {
      folderMap.set(folder.name.toLowerCase(), folder.id);
    });
    
    let redistributed = 0;
    let errors = 0;
    
    // Process each document
    for (const doc of allDocuments) {
      let targetFolderId = null;
      let targetFolderName = 'Admin'; // Default
      let reason = 'Default assignment';
      
      try {
        // Try to read file content for intelligent categorization
        let content = '';
        let fileName = doc.original_name || doc.name || '';
        
        if (doc.path && fs.existsSync(doc.path)) {
          if (doc.mime_type === 'text/plain' || doc.mime_type === 'text/csv') {
            content = fs.readFileSync(doc.path, 'utf8').toLowerCase();
          } else if (doc.mime_type === 'application/pdf') {
            // For PDFs, use filename only since we don't have PDF parsing
            content = fileName.toLowerCase();
          } else {
            content = fileName.toLowerCase();
          }
        } else {
          content = fileName.toLowerCase();
        }
        
        // Intelligent categorization based on content and filename
        if (content.includes('alliant') || fileName.toLowerCase().includes('alliant')) {
          targetFolderId = folderMap.get('alliant');
          targetFolderName = 'Alliant';
          reason = 'Contains "alliant" reference';
        } else if (content.includes('authorize') || content.includes('authnet') || fileName.toLowerCase().includes('authorize')) {
          targetFolderId = folderMap.get('authorize.net');
          targetFolderName = 'Authorize.Net';
          reason = 'Contains "authorize" reference';
        } else if (content.includes('clearent') || fileName.toLowerCase().includes('clearent')) {
          targetFolderId = folderMap.get('clearent');
          targetFolderName = 'Clearent';
          reason = 'Contains "clearent" reference';
        } else if (content.includes('shift4') || content.includes('shift 4') || fileName.toLowerCase().includes('shift')) {
          targetFolderId = folderMap.get('shift4');
          targetFolderName = 'Shift4';
          reason = 'Contains "shift4" reference';
        } else if (content.includes('micamp') || content.includes('mi-camp') || fileName.toLowerCase().includes('micamp')) {
          targetFolderId = folderMap.get('micamp');
          targetFolderName = 'MiCamp';
          reason = 'Contains "micamp" reference';
        } else if (content.includes('merchant') && content.includes('lynx')) {
          targetFolderId = folderMap.get('merchant lynx');
          targetFolderName = 'Merchant Lynx';
          reason = 'Contains "merchant lynx" reference';
        } else if (content.includes('contract') || content.includes('agreement') || content.includes('terms')) {
          targetFolderId = folderMap.get('contracts');
          targetFolderName = 'Contracts';
          reason = 'Contains contract/agreement terms';
        } else if (content.includes('pricing') || content.includes('rate') || content.includes('fee') || content.includes('cost')) {
          targetFolderId = folderMap.get('pricing sheets');
          targetFolderName = 'Pricing Sheets';
          reason = 'Contains pricing/rate information';
        } else if (content.includes('hardware') || content.includes('pos') || content.includes('terminal')) {
          targetFolderId = folderMap.get('hardware-pos');
          targetFolderName = 'Hardware-POS';
          reason = 'Contains hardware/POS terms';
        } else if (content.includes('tracerauto') || content.includes('tracer auto')) {
          targetFolderId = folderMap.get('tracerauto');
          targetFolderName = 'TracerAuto';
          reason = 'Contains TracerAuto reference';
        } else if (content.includes('tracerflex') || content.includes('tracer flex')) {
          targetFolderId = folderMap.get('tracerflex');
          targetFolderName = 'TracerFlex';
          reason = 'Contains TracerFlex reference';
        } else if (content.includes('tracerpay') || content.includes('tracer pay') || content.includes('accept blue')) {
          targetFolderId = folderMap.get('tracerpay (accept blue white-label)');
          targetFolderName = 'TracerPay (Accept Blue White-Label)';
          reason = 'Contains TracerPay/Accept Blue reference';
        } else if (doc.size > 500000) {
          // Large files likely to be detailed documentation - put in appropriate category
          targetFolderId = folderMap.get('general documents');
          targetFolderName = 'General Documents';
          reason = 'Large file (likely documentation)';
        } else {
          // Default assignment based on content analysis patterns
          if (content.includes('payment') || content.includes('processing') || content.includes('merchant')) {
            targetFolderId = folderMap.get('general documents');
            targetFolderName = 'General Documents';
            reason = 'Contains payment processing terms';
          } else {
            // Keep in Admin for manual review
            targetFolderId = folderMap.get('admin');
            targetFolderName = 'Admin';
            reason = 'No specific category match - admin review';
          }
        }
        
        // Update document folder assignment
        if (targetFolderId && doc.folder_id !== targetFolderId) {
          await sql`
            UPDATE documents 
            SET folder_id = ${targetFolderId}
            WHERE id = ${doc.id}
          `;
          console.log(`✅ Moved "${fileName || doc.id.substring(0,20)}..." to ${targetFolderName} (${reason})`);
          redistributed++;
        } else if (doc.folder_id === targetFolderId) {
          console.log(`🔄 "${fileName || doc.id.substring(0,20)}..." already in ${targetFolderName}`);
        } else {
          console.log(`❓ "${fileName || doc.id.substring(0,20)}..." - no target folder found`);
        }
        
      } catch (docError) {
        console.error(`❌ Error processing document ${doc.id}:`, docError.message);
        errors++;
      }
    }
    
    console.log(`\n📊 Distribution Summary:`);
    console.log(`   Documents redistributed: ${redistributed}`);
    console.log(`   Errors encountered: ${errors}`);
    console.log(`   Total processed: ${allDocuments.length}`);
    
    // Show final distribution
    const finalDistribution = await sql`
      SELECT 
        f.name as folder_name,
        COUNT(d.id) as document_count
      FROM folders f
      LEFT JOIN documents d ON f.id = d.folder_id
      GROUP BY f.id, f.name
      ORDER BY COUNT(d.id) DESC, f.name
    `;
    
    console.log(`\n📁 Final distribution:`);
    finalDistribution.forEach(folder => {
      if (folder.document_count > 0) {
        console.log(`   ${folder.folder_name}: ${folder.document_count} documents`);
      }
    });
    
    // Count unassigned documents
    const unassigned = await sql`
      SELECT COUNT(*) as count FROM documents WHERE folder_id IS NULL
    `;
    
    if (unassigned[0].count > 0) {
      console.log(`   Unassigned: ${unassigned[0].count} documents`);
    }
    
    console.log('\n✅ Document distribution completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during distribution:', error);
    process.exit(1);
  }
}

distributeAllDocuments().then(() => {
  console.log('🎉 Script completed');
  process.exit(0);
});