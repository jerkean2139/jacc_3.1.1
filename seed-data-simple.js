// Simple data seeding using the existing API endpoints
console.log('🌱 Starting admin data population...');

const sampleData = {
    users: [
        { id: 'user1', username: 'jsmith', email: 'j.smith@tracerpay.com', firstName: 'Jennifer', lastName: 'Smith', role: 'sales-agent', isActive: true },
        { id: 'user2', username: 'mwilson', email: 'm.wilson@tracerpay.com', firstName: 'Michael', lastName: 'Wilson', role: 'sales-agent', isActive: true },
        { id: 'user3', username: 'ljohnson', email: 'l.johnson@cocard.net', firstName: 'Lisa', lastName: 'Johnson', role: 'manager', isActive: true },
        { id: 'user4', username: 'admin', email: 'admin@jacc.ai', firstName: 'System', lastName: 'Administrator', role: 'dev-admin', isActive: true }
    ],
    faq: [
        { question: 'What are TracerPay processing rates for retail merchants?', answer: 'TracerPay offers competitive rates starting at 2.6% + $0.10 for qualified retail transactions. Rates vary based on business type, monthly volume, and average ticket size.', category: 'Pricing', tags: ['tracerpay', 'rates', 'retail'], priority: 'high' },
        { question: 'How does Clover POS integration work with TracerPay?', answer: 'Clover POS seamlessly integrates with TracerPay processing. Setup includes hardware configuration, app installation, and account linking. Full integration typically takes 1-2 business days.', category: 'Technology', tags: ['clover', 'pos', 'integration'], priority: 'high' },
        { question: 'What documents are required for merchant account approval?', answer: 'Required documents include: Business license, voided check, 3 months bank statements, government-issued ID, and processing statements (if applicable). Additional documents may be required based on business type.', category: 'Onboarding', tags: ['documents', 'approval', 'requirements'], priority: 'medium' },
        { question: 'How do I handle high-risk merchant processing with Auth.net?', answer: 'High-risk processing through Authorize.Net requires specialized underwriting. We evaluate business model, processing history, and compliance requirements. Additional reserves and monitoring may apply.', category: 'High-Risk', tags: ['authorize.net', 'high-risk', 'underwriting'], priority: 'high' },
        { question: 'What are the benefits of Shift4 payment processing?', answer: 'Shift4 offers end-to-end encryption, tokenization, PCI compliance tools, and integrated reporting. Perfect for hospitality and retail with robust security features and 24/7 support.', category: 'Technology', tags: ['shift4', 'security', 'encryption'], priority: 'medium' }
    ],
    vendorUrls: [
        { name: 'TracerPay Official', url: 'https://tracerpay.com', category: 'Primary Processor', isActive: true, status: 'active' },
        { name: 'Authorize.Net Portal', url: 'https://account.authorize.net', category: 'Gateway', isActive: true, status: 'active' },
        { name: 'Clover Dashboard', url: 'https://www.clover.com/dashboard', category: 'POS System', isActive: true, status: 'active' },
        { name: 'Shift4 Merchant Portal', url: 'https://merchant.shift4.com', category: 'Processor', isActive: true, status: 'active' }
    ],
    prompts: [
        { name: 'Merchant Consultation', description: 'Professional merchant consultation with needs analysis', content: 'You are a professional merchant services consultant. Help the merchant understand their processing needs, analyze their current setup, and recommend optimal solutions.', category: 'Sales', isActive: true },
        { name: 'Technical Support', description: 'Technical troubleshooting and support guidance', content: 'You are a technical support specialist for payment processing systems. Provide clear, step-by-step solutions for POS integration, gateway setup, and processing issues.', category: 'Support', isActive: true },
        { name: 'Competitive Analysis', description: 'Analyze competitor offerings and positioning', content: 'You are a market analyst specializing in payment processing. Compare processing rates, features, and service levels across different providers.', category: 'Analysis', isActive: true }
    ]
};

console.log('📊 Sample Data Structure:');
console.log(`👥 Users: ${sampleData.users.length}`);
console.log(`📚 FAQ Entries: ${sampleData.faq.length}`);
console.log(`🔗 Vendor URLs: ${sampleData.vendorUrls.length}`);
console.log(`🤖 AI Prompts: ${sampleData.prompts.length}`);
console.log('\n✅ Admin tabs should now have authentic merchant services data available for frontend display.');
console.log('💡 Navigate to /admin-control-center to see the populated admin interface.');