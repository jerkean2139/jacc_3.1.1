// Script to redistribute documents from Admin folder to appropriate category folders
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function redistributeDocuments() {
  console.log('🔄 Starting document redistribution...');
  
  try {
    // Get all folders with their IDs and names
    const folders = await sql`
      SELECT id, name, folder_type
      FROM folders
      ORDER BY name
    `;
    
    console.log('📁 Available folders:');
    folders.forEach(folder => {
      console.log(`  - ${folder.name} (${folder.id})`);
    });
    
    // Get all documents currently in Admin folder
    const adminFolderId = 'ca09f485-9bff-41ee-a09e-e7c3555b355d';
    const documentsInAdmin = await sql`
      SELECT id, name, original_name, path
      FROM documents 
      WHERE folder_id = ${adminFolderId}
      ORDER BY original_name
    `;
    
    console.log(`\n📄 Found ${documentsInAdmin.length} documents in Admin folder to redistribute`);
    
    // Create folder mapping based on document names
    const folderMapping = new Map();
    
    // Find folder IDs for redistribution
    const alliantFolder = folders.find(f => f.name === 'Alliant')?.id;
    const authorizeFolder = folders.find(f => f.name === 'Authorize.Net')?.id;
    const clearentFolder = folders.find(f => f.name === 'Clearent')?.id;
    const contractsFolder = folders.find(f => f.name === 'Contracts')?.id;
    const hardwareFolder = folders.find(f => f.name === 'Hardware-POS')?.id;
    const merchantLynxFolder = folders.find(f => f.name === 'Merchant Lynx')?.id;
    const micampFolder = folders.find(f => f.name === 'MiCamp')?.id;
    const pricingFolder = folders.find(f => f.name === 'Pricing Sheets')?.id;
    const shift4Folder = folders.find(f => f.name === 'Shift4')?.id;
    const tracerAutoFolder = folders.find(f => f.name === 'TracerAuto')?.id;
    const tracerFlexFolder = folders.find(f => f.name === 'TracerFlex')?.id;
    const tracerPayFolder = folders.find(f => f.name === 'TracerPay (Accept Blue White-Label)')?.id;
    
    let redistributed = 0;
    let remainInAdmin = 0;
    
    // Process each document and determine appropriate folder
    for (const doc of documentsInAdmin) {
      const name = (doc.original_name || doc.name || '').toLowerCase();
      let targetFolderId = null;
      let targetFolderName = 'Admin'; // Default to staying in Admin
      
      // Check document name patterns for folder assignment
      if (name.includes('alliant')) {
        targetFolderId = alliantFolder;
        targetFolderName = 'Alliant';
      } else if (name.includes('authorize') || name.includes('authnet')) {
        targetFolderId = authorizeFolder;
        targetFolderName = 'Authorize.Net';
      } else if (name.includes('clearent')) {
        targetFolderId = clearentFolder;
        targetFolderName = 'Clearent';
      } else if (name.includes('contract') || name.includes('agreement')) {
        targetFolderId = contractsFolder;
        targetFolderName = 'Contracts';
      } else if (name.includes('hardware') || name.includes('pos') || name.includes('terminal')) {
        targetFolderId = hardwareFolder;
        targetFolderName = 'Hardware-POS';
      } else if (name.includes('merchant') && name.includes('lynx')) {
        targetFolderId = merchantLynxFolder;
        targetFolderName = 'Merchant Lynx';
      } else if (name.includes('micamp') || name.includes('mi-camp')) {
        targetFolderId = micampFolder;
        targetFolderName = 'MiCamp';
      } else if (name.includes('pricing') || name.includes('rate') || name.includes('fee')) {
        targetFolderId = pricingFolder;
        targetFolderName = 'Pricing Sheets';
      } else if (name.includes('shift4') || name.includes('shift 4')) {
        targetFolderId = shift4Folder;
        targetFolderName = 'Shift4';
      } else if (name.includes('tracerauto') || name.includes('tracer auto')) {
        targetFolderId = tracerAutoFolder;
        targetFolderName = 'TracerAuto';
      } else if (name.includes('tracerflex') || name.includes('tracer flex')) {
        targetFolderId = tracerFlexFolder;
        targetFolderName = 'TracerFlex';
      } else if (name.includes('tracerpay') || name.includes('tracer pay') || name.includes('accept blue')) {
        targetFolderId = tracerPayFolder;
        targetFolderName = 'TracerPay (Accept Blue White-Label)';
      }
      
      // Move document if target folder found
      if (targetFolderId && targetFolderId !== adminFolderId) {
        await sql`
          UPDATE documents 
          SET folder_id = ${targetFolderId}
          WHERE id = ${doc.id}
        `;
        console.log(`✅ Moved "${doc.original_name || doc.name}" to ${targetFolderName}`);
        redistributed++;
      } else {
        console.log(`🔄 Keeping "${doc.original_name || doc.name}" in Admin`);
        remainInAdmin++;
      }
    }
    
    console.log(`\n📊 Redistribution Summary:`);
    console.log(`   Documents moved: ${redistributed}`);
    console.log(`   Documents remaining in Admin: ${remainInAdmin}`);
    console.log(`   Total processed: ${documentsInAdmin.length}`);
    
    // Verify final distribution
    const finalDistribution = await sql`
      SELECT 
        f.name as folder_name,
        COUNT(d.id) as document_count
      FROM folders f
      LEFT JOIN documents d ON f.id = d.folder_id
      GROUP BY f.id, f.name
      HAVING COUNT(d.id) > 0
      ORDER BY COUNT(d.id) DESC, f.name
    `;
    
    console.log(`\n📁 Final distribution:`);
    finalDistribution.forEach(folder => {
      console.log(`   ${folder.folder_name}: ${folder.document_count} documents`);
    });
    
    console.log('\n✅ Document redistribution completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during redistribution:', error);
    process.exit(1);
  }
}

redistributeDocuments().then(() => {
  console.log('🎉 Script completed');
  process.exit(0);
});