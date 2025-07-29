import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { vendorUrls } from './shared/schema.ts';
import crypto from 'crypto';

// Initialize database connection
const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

// Sample vendor URLs that should exist in JACC system
const sampleVendorUrls = [
  {
    vendorName: 'Clearent',
    url: 'https://help.clearent.com/',
    urlTitle: 'Clearent Support Documentation',
    urlType: 'support',
    category: 'payment-processing',
    autoUpdate: true,
    updateFrequency: 'weekly',
    isActive: true,
    scrapingStatus: 'completed',
    lastScraped: new Date('2024-12-15'),
    wordCount: 150
  },
  {
    vendorName: 'Alliant Payment Systems',
    url: 'https://help.alliantpaymentsystems.com/',
    urlTitle: 'Alliant Payment Systems Knowledge Base',
    urlType: 'help_guide',
    category: 'payment-processing',
    autoUpdate: true,
    updateFrequency: 'weekly',
    isActive: true,
    scrapingStatus: 'completed',
    lastScraped: new Date('2024-12-15'),
    wordCount: 200
  },
  {
    vendorName: 'Merchant Lynx',
    url: 'https://support.merchantlynx.com/',
    urlTitle: 'Merchant Lynx Support Center',
    urlType: 'support',
    category: 'payment-processing',
    autoUpdate: true,
    updateFrequency: 'weekly',
    isActive: true,
    scrapingStatus: 'completed',
    lastScraped: new Date('2024-12-15'),
    wordCount: 180
  },
  {
    vendorName: 'Authorize.Net',
    url: 'https://support.authorize.net/',
    urlTitle: 'Authorize.Net Developer Documentation',
    urlType: 'api',
    category: 'integration',
    autoUpdate: true,
    updateFrequency: 'weekly',
    isActive: true,
    scrapingStatus: 'completed',
    lastScraped: new Date('2024-12-15'),
    wordCount: 300
  },
  {
    vendorName: 'Shift4',
    url: 'https://shift4.zendesk.com/hc/en-us',
    urlTitle: 'Shift4 Help Center',
    urlType: 'support',
    category: 'payment-processing',
    autoUpdate: true,
    updateFrequency: 'weekly',
    isActive: true,
    scrapingStatus: 'completed',
    lastScraped: new Date('2024-12-15'),
    wordCount: 220
  },
  {
    vendorName: 'MiCamp Solutions',
    url: 'https://help.micampsolutions.com/',
    urlTitle: 'MiCamp Solutions Support',
    urlType: 'support',
    category: 'payment-processing',
    autoUpdate: true,
    updateFrequency: 'weekly',
    isActive: true,
    scrapingStatus: 'completed',
    lastScraped: new Date('2024-12-15'),
    wordCount: 190
  },
  {
    vendorName: 'TracerPay',
    url: 'https://tracerpay.com/support',
    urlTitle: 'TracerPay Support Center',
    urlType: 'support',
    category: 'payment-processing',
    autoUpdate: true,
    updateFrequency: 'daily',
    isActive: true,
    scrapingStatus: 'completed',
    lastScraped: new Date('2024-12-20'),
    wordCount: 250
  },
  {
    vendorName: 'Clover',
    url: 'https://help.clover.com/',
    urlTitle: 'Clover Help Center',
    urlType: 'support',
    category: 'pos',
    autoUpdate: true,
    updateFrequency: 'weekly',
    isActive: true,
    scrapingStatus: 'completed',
    lastScraped: new Date('2024-12-15'),
    wordCount: 280
  },
  {
    vendorName: 'Square',
    url: 'https://squareup.com/help/us/en',
    urlTitle: 'Square Help Center',
    urlType: 'support',
    category: 'pos',
    autoUpdate: false,
    updateFrequency: 'monthly',
    isActive: true,
    scrapingStatus: 'pending',
    lastScraped: null,
    wordCount: 0
  },
  {
    vendorName: 'First Data',
    url: 'https://docs.firstdata.com/',
    urlTitle: 'First Data API Documentation',
    urlType: 'api',
    category: 'integration',
    autoUpdate: true,
    updateFrequency: 'weekly',
    isActive: true,
    scrapingStatus: 'completed',
    lastScraped: new Date('2024-12-10'),
    wordCount: 400
  }
];

async function importVendorUrls() {
  console.log('🔄 Starting vendor URL import...');
  
  try {
    // Check if vendor URLs already exist
    const existing = await db.select().from(vendorUrls).limit(1);
    
    if (existing.length > 0) {
      console.log('⚠️  Vendor URLs already exist. Skipping import to prevent duplicates.');
      console.log(`Current vendor URL count: ${existing.length}`);
      return;
    }

    // Import vendor URLs
    const vendorUrlsWithIds = sampleVendorUrls.map(url => ({
      id: crypto.randomUUID(),
      ...url,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    const result = await db.insert(vendorUrls).values(vendorUrlsWithIds).returning();
    
    console.log(`✅ Successfully imported ${result.length} vendor URLs:`);
    result.forEach(url => {
      console.log(`   - ${url.vendorName}: ${url.url}`);
    });
    
    console.log('\n🎉 Vendor URL import completed successfully!');
    
  } catch (error) {
    console.error('❌ Error importing vendor URLs:', error);
    throw error;
  }
}

// Run the import
importVendorUrls()
  .then(() => {
    console.log('✅ Vendor URL import process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Vendor URL import failed:', error);
    process.exit(1);
  });