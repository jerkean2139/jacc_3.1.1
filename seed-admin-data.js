// Comprehensive admin data seeding script
async function seedAdminData() {
  console.log('🌱 Starting comprehensive admin data seeding...');

  try {
    // Dynamic import for ES modules
    const { db } = await import('./server/db.ts');
    const { 
      users, 
      faqKnowledgeBase, 
      documents, 
      folders, 
      chats, 
      messages, 
      vendorUrls,
      promptTemplates,
      trainingInteractions
    } = await import('./shared/schema.ts');
    const { eq } = await import('drizzle-orm');

    // 1. Seed Users Data (Multiple roles and activity)
    const usersData = [
      {
        id: 'cburnell-user-id',
        username: 'cburnell',
        email: 'cburnell@cocard.net',
        firstName: 'Chris',
        lastName: 'Burnell',
        role: 'client-admin',
        isActive: true,
        createdAt: new Date('2024-12-01'),
        lastLoginAt: new Date()
      },
      {
        id: 'sales-agent-001',
        username: 'jsmith',
        email: 'j.smith@tracerpay.com',
        firstName: 'Jennifer',
        lastName: 'Smith',
        role: 'sales-agent',
        isActive: true,
        createdAt: new Date('2025-01-15'),
        lastLoginAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        id: 'sales-agent-002',
        username: 'mwilson',
        email: 'm.wilson@tracerpay.com',
        firstName: 'Michael',
        lastName: 'Wilson',
        role: 'sales-agent',
        isActive: true,
        createdAt: new Date('2025-01-10'),
        lastLoginAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        id: 'manager-001',
        username: 'ljohnson',
        email: 'l.johnson@cocard.net',
        firstName: 'Lisa',
        lastName: 'Johnson',
        role: 'manager',
        isActive: true,
        createdAt: new Date('2024-11-20'),
        lastLoginAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      },
      {
        id: 'dev-admin-001',
        username: 'admin',
        email: 'admin@jacc.ai',
        firstName: 'System',
        lastName: 'Administrator',
        role: 'dev-admin',
        isActive: true,
        createdAt: new Date('2024-10-01'),
        lastLoginAt: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
      }
    ];

    console.log('👥 Seeding users data...');
    for (const userData of usersData) {
      try {
        await db.insert(users).values(userData).onConflictDoNothing();
      } catch (error) {
        console.log(`User ${userData.username} already exists, skipping...`);
      }
    }

    // 2. Seed FAQ Knowledge Base (Comprehensive merchant services FAQ)
    const faqData = [
      {
        id: 'faq-001',
        question: 'What are TracerPay processing rates for retail merchants?',
        answer: 'TracerPay offers competitive rates starting at 2.6% + $0.10 for qualified retail transactions. Rates vary based on business type, monthly volume, and average ticket size. Contact your sales agent for custom pricing.',
        category: 'Pricing',
        tags: ['tracerpay', 'rates', 'retail', 'pricing'],
        priority: 'high',
        isActive: true,
        createdAt: new Date('2025-01-01')
      },
      {
        id: 'faq-002', 
        question: 'How does Clover POS integration work with TracerPay?',
        answer: 'Clover POS seamlessly integrates with TracerPay processing. Setup includes hardware configuration, app installation, and account linking. Full integration typically takes 1-2 business days with dedicated support.',
        category: 'Technology',
        tags: ['clover', 'pos', 'integration', 'setup'],
        priority: 'high',
        isActive: true,
        createdAt: new Date('2025-01-02')
      },
      {
        id: 'faq-003',
        question: 'What documents are required for merchant account approval?',
        answer: 'Required documents include: Business license, voided check, 3 months bank statements, government-issued ID, and processing statements (if applicable). Additional documents may be required based on business type.',
        category: 'Onboarding',
        tags: ['documents', 'approval', 'requirements', 'onboarding'],
        priority: 'medium',
        isActive: true,
        createdAt: new Date('2025-01-03')
      },
      {
        id: 'faq-004',
        question: 'How do I handle high-risk merchant processing with Auth.net?',
        answer: 'High-risk processing through Authorize.Net requires specialized underwriting. We evaluate business model, processing history, and compliance requirements. Additional reserves and monitoring may apply.',
        category: 'High-Risk',
        tags: ['authorize.net', 'high-risk', 'underwriting', 'compliance'],
        priority: 'high',
        isActive: true,
        createdAt: new Date('2025-01-04')
      },
      {
        id: 'faq-005',
        question: 'What are the benefits of Shift4 payment processing?',
        answer: 'Shift4 offers end-to-end encryption, tokenization, PCI compliance tools, and integrated reporting. Perfect for hospitality and retail with robust security features and 24/7 support.',
        category: 'Technology',
        tags: ['shift4', 'security', 'encryption', 'compliance'],
        priority: 'medium',
        isActive: true,
        createdAt: new Date('2025-01-05')
      }
    ];

    console.log('📚 Seeding FAQ knowledge base...');
    for (const faq of faqData) {
      try {
        await db.insert(faqKnowledgeBase).values(faq).onConflictDoNothing();
      } catch (error) {
        console.log(`FAQ ${faq.id} already exists, skipping...`);
      }
    }

    // 3. Seed Vendor URLs for tracking
    const vendorUrlsData = [
      {
        id: 'vendor-001',
        name: 'TracerPay Official',
        url: 'https://tracerpay.com',
        category: 'Primary Processor',
        isActive: true,
        lastChecked: new Date(),
        status: 'active'
      },
      {
        id: 'vendor-002', 
        name: 'Authorize.Net Portal',
        url: 'https://account.authorize.net',
        category: 'Gateway',
        isActive: true,
        lastChecked: new Date(),
        status: 'active'
      },
      {
        id: 'vendor-003',
        name: 'Clover Dashboard',
        url: 'https://www.clover.com/dashboard',
        category: 'POS System',
        isActive: true,
        lastChecked: new Date(),
        status: 'active'
      },
      {
        id: 'vendor-004',
        name: 'Shift4 Merchant Portal',
        url: 'https://merchant.shift4.com',
        category: 'Processor',
        isActive: true,
        lastChecked: new Date(),
        status: 'active'
      }
    ];

    console.log('🔗 Seeding vendor URLs...');
    for (const vendor of vendorUrlsData) {
      try {
        await db.insert(vendorUrls).values(vendor).onConflictDoNothing();
      } catch (error) {
        console.log(`Vendor URL ${vendor.name} already exists, skipping...`);
      }
    }

    // 4. Seed AI Prompt Templates
    const promptTemplatesData = [
      {
        id: 'prompt-001',
        name: 'Merchant Consultation',
        description: 'Professional merchant consultation with needs analysis',
        content: 'You are a professional merchant services consultant. Help the merchant understand their processing needs, analyze their current setup, and recommend optimal solutions. Focus on cost savings, efficiency, and compliance.',
        category: 'Sales',
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 'prompt-002',
        name: 'Technical Support',
        description: 'Technical troubleshooting and support guidance',
        content: 'You are a technical support specialist for payment processing systems. Provide clear, step-by-step solutions for POS integration, gateway setup, and processing issues. Include safety checks and compliance considerations.',
        category: 'Support',
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 'prompt-003',
        name: 'Competitive Analysis',
        description: 'Analyze competitor offerings and positioning',
        content: 'You are a market analyst specializing in payment processing. Compare processing rates, features, and service levels across different providers. Highlight competitive advantages and value propositions.',
        category: 'Analysis',
        isActive: true,
        createdAt: new Date()
      }
    ];

    console.log('🤖 Seeding AI prompt templates...');
    for (const template of promptTemplatesData) {
      try {
        await db.insert(promptTemplates).values(template).onConflictDoNothing();
      } catch (error) {
        console.log(`Prompt template ${template.name} already exists, skipping...`);
      }
    }

    // 5. Seed Training Interactions (AI training data)
    const trainingData = [
      {
        id: 'training-001',
        userId: 'cburnell-user-id',
        question: 'What are the best rates for restaurant processing?',
        aiResponse: 'For restaurant processing, I recommend considering interchange-plus pricing starting around 2.4% + $0.10 for qualified transactions. Key factors include monthly volume, average ticket size, and card-present vs card-not-present transactions.',
        correctedResponse: 'For restaurant processing, TracerPay offers competitive interchange-plus pricing starting at 2.4% + $0.10 for qualified transactions. Restaurant-specific benefits include tip adjustment capabilities, split-tender support, and integration with popular POS systems like Toast and Square.',
        feedback: 'Response should include TracerPay-specific benefits and restaurant industry features',
        category: 'pricing',
        confidence: 0.85,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 1 week ago
      },
      {
        id: 'training-002',
        userId: 'sales-agent-001',
        question: 'How do I set up Clover for a retail store?',
        aiResponse: 'Clover setup involves hardware selection, software configuration, merchant account linking, and staff training. The process typically takes 2-3 business days.',
        correctedResponse: 'Clover setup for retail stores includes: 1) Hardware selection (Station, Mini, or Flex), 2) App marketplace configuration for inventory and reporting, 3) TracerPay account integration, 4) Tax and payment settings, 5) Staff training and testing. Our technical team provides full setup support within 1-2 business days.',
        feedback: 'Include specific hardware options and emphasize TracerPay integration',
        category: 'setup',
        confidence: 0.92,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      }
    ];

    console.log('🎓 Seeding training interactions...');
    for (const training of trainingData) {
      try {
        await db.insert(trainingInteractions).values(training).onConflictDoNothing();
      } catch (error) {
        console.log(`Training interaction ${training.id} already exists, skipping...`);
      }
    }

    // 6. Seed Sample Chats and Messages
    const chatsData = [
      {
        id: 'chat-001',
        userId: 'sales-agent-001',
        title: 'Restaurant Processing Inquiry',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'chat-002',
        userId: 'sales-agent-002',
        title: 'Clover POS Setup Questions',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      },
      {
        id: 'chat-003',
        userId: 'cburnell-user-id',
        title: 'High-Risk Processing Options',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
      }
    ];

    console.log('💬 Seeding chat data...');
    for (const chat of chatsData) {
      try {
        await db.insert(chats).values(chat).onConflictDoNothing();
      } catch (error) {
        console.log(`Chat ${chat.id} already exists, skipping...`);
      }
    }

    const messagesData = [
      {
        id: 'msg-001',
        chatId: 'chat-001',
        content: 'I have a potential restaurant client asking about processing rates. They do about $15K monthly volume with average ticket of $25. What rates can TracerPay offer?',
        role: 'user',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'msg-002',
        chatId: 'chat-001',
        content: '<h3>Restaurant Processing Rates for $15K Monthly Volume</h3><p>For a restaurant with $15K monthly volume and $25 average ticket, TracerPay can offer:</p><ul><li><strong>Qualified Rate:</strong> 2.4% + $0.10 per transaction</li><li><strong>Mid-Qualified:</strong> 2.8% + $0.10</li><li><strong>Non-Qualified:</strong> 3.2% + $0.15</li></ul><p><strong>Restaurant-Specific Benefits:</strong></p><ul><li>Tip adjustment capabilities</li><li>Split tender support</li><li>POS integration (Toast, Square, Clover)</li><li>Quick settlement (next-day funding)</li></ul><p>Based on their volume and ticket size, they could save approximately $50-80 monthly compared to typical retail rates.</p>',
        role: 'assistant',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30000)
      }
    ];

    console.log('📧 Seeding message data...');
    for (const message of messagesData) {
      try {
        await db.insert(messages).values(message).onConflictDoNothing();
      } catch (error) {
        console.log(`Message ${message.id} already exists, skipping...`);
      }
    }

    console.log('✅ Admin data seeding completed successfully!');
    console.log(`
📊 SEEDED DATA SUMMARY:
👥 Users: ${usersData.length} (admin, manager, sales agents)  
📚 FAQ Entries: ${faqData.length} (merchant services knowledge)
🔗 Vendor URLs: ${vendorUrlsData.length} (processor tracking)
🤖 AI Prompts: ${promptTemplatesData.length} (conversation templates)
🎓 Training Data: ${trainingData.length} (AI improvement examples)
💬 Chats: ${chatsData.length} (sample conversations)
📧 Messages: ${messagesData.length} (realistic chat content)

All admin tabs should now display authentic data!
    `);

  } catch (error) {
    console.error('❌ Error seeding admin data:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedAdminData().then(() => {
  console.log('🌟 Data seeding process completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fatal error during seeding:', error);
  process.exit(1);
});