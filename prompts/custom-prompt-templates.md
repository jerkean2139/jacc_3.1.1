# Custom Prompt Templates System

## Core Template Categories

### 1. Pricing Analysis Templates

#### Basic Rate Calculation
```
ROLE: Payment Processing Cost Analyst
CONTEXT: Analyzing processing costs for {business_type}

TASK: Calculate exact processing costs with the following data:
- Monthly Volume: {monthly_volume}
- Average Ticket: {average_ticket}
- Transaction Count: {transaction_count}
- Current Rate: {current_rate}
- Current Monthly Fee: {monthly_fee}

RESPONSE FORMAT:
1. Current Cost Breakdown (itemized)
2. Recommended Alternative (with specific rates)
3. Monthly Savings Calculation
4. Annual Savings Projection
5. Break-even Analysis

Include specific processor recommendations from our partner network: Alliant, Merchant Lynx, Clearent, MiCamp, Authorize.Net, Shift4.

Use Alex Hormozi formatting with clear value propositions and action steps.
```

#### Competitive Analysis
```
ROLE: Payment Processing Consultant
CONTEXT: Comparing processors for {business_type}

ANALYZE: Compare the following processors based on:
- Processing Rates and Fees
- Hardware/POS Integration
- Customer Support Quality
- Contract Terms
- Setup Requirements

PROCESSORS TO COMPARE: {processor_list}

RESPONSE STRUCTURE:
1. Quick Winner (best overall choice)
2. Cost Leader (lowest processing costs)
3. Feature Leader (best functionality)
4. Detailed Comparison Table
5. Specific Recommendation with reasoning

Focus on practical business impact, not just features.
```

### 2. Objection Handling Templates

#### Price Objection
```
SCENARIO: Prospect says "Your rates are higher than my current processor"

RESPONSE FRAMEWORK:
1. ACKNOWLEDGE: "I understand cost is important..."
2. CLARIFY: "Help me understand your current situation..."
3. EDUCATE: "Here's what most merchants don't realize..."
4. VALUE STACK: "Beyond the rate, you're getting..."
5. CLOSE: "Would you like to see the total cost comparison?"

TALKING POINTS:
- Total cost of ownership vs. headline rate
- Hidden fees in current processing
- Value of superior customer service
- Business growth impact
- Risk mitigation benefits

Use specific examples and dollar amounts when possible.
```

#### Timing Objection
```
SCENARIO: Prospect says "Now isn't a good time" or "We're not ready to switch"

RESPONSE FRAMEWORK:
1. EMPATHIZE: "I completely understand..."
2. CURIOSITY: "What would need to change for timing to be right?"
3. FUTURE PACE: "When you are ready to look at this..."
4. VALUE BRIDGE: "In the meantime, would it be helpful to..."
5. COMMITMENT: "Can we schedule a time when..."

GOAL: Keep the conversation alive and add value even if timing isn't right.
```

### 3. Industry-Specific Templates

#### Restaurant Template
```
ROLE: Restaurant Payment Processing Specialist
CONTEXT: Analyzing payment processing for restaurant/food service

FOCUS AREAS:
- High-volume transaction handling
- Tip processing and payroll integration
- POS system compatibility (Toast, Square, Clover)
- Quick service vs. full service considerations
- Delivery/online ordering integration

RESPONSE ELEMENTS:
1. Industry-specific rate benchmarks
2. POS integration recommendations
3. Tip processing best practices
4. Volume-based savings opportunities
5. Restaurant-specific pain points addressed

Reference successful restaurant implementations from our case studies.
```

#### E-commerce Template
```
ROLE: E-commerce Payment Processing Expert
CONTEXT: Online business payment processing optimization

FOCUS AREAS:
- Online payment security (PCI compliance)
- Shopping cart integration
- International processing capabilities
- Chargeback protection
- Mobile payment optimization

RESPONSE STRUCTURE:
1. Current online processing analysis
2. Security and compliance requirements
3. Integration complexity assessment
4. Customer experience optimization
5. Growth scalability planning

Emphasize seamless customer experience and security.
```

### 4. Sales Process Templates

#### Discovery Questions
```
ROLE: Consultative Sales Professional
CONTEXT: Initial discovery conversation with merchant

QUESTION FRAMEWORK:
CURRENT STATE:
- "Tell me about your current processing setup..."
- "What's working well with your current processor?"
- "What challenges are you experiencing?"

BUSINESS IMPACT:
- "How do processing issues affect your business?"
- "What would solving this problem mean for you?"
- "How much time do you spend dealing with processing problems?"

DECISION PROCESS:
- "Who else is involved in this decision?"
- "What's your timeline for making a change?"
- "What would need to happen for you to move forward?"

Use consultative approach, not interrogation. Build rapport first.
```

#### Closing Templates
```
ROLE: Payment Processing Consultant
CONTEXT: Moving prospect toward decision

CLOSING TECHNIQUES:

ASSUMPTION CLOSE:
"Based on our conversation, it sounds like [solution] is the right fit. When would you like to start the transition?"

ALTERNATIVE CLOSE:
"Would you prefer to start with the basic package or the full solution we discussed?"

URGENCY CLOSE:
"We have a special onboarding window this month. Would you like to secure that rate?"

OBJECTION HANDLING:
Address each concern specifically before attempting to close.
```

## Template Customization

### Variable Placeholders
- {business_type} - Restaurant, Retail, E-commerce, etc.
- {merchant_name} - Client/prospect name
- {monthly_volume} - Processing volume
- {current_processor} - Existing processor
- {main_pain_point} - Primary concern identified
- {processor_list} - Processors to compare
- {timeline} - Implementation timeline

### Response Modifiers
- **Formal** - Professional, corporate language
- **Casual** - Conversational, friendly tone
- **Technical** - Detailed, specification-focused
- **Benefits-Focused** - ROI and outcome emphasis

### Integration Hooks
- Document references: [doc:rate-sheet-2024]
- Calculator links: [calc:processing-cost]
- Proposal generation: [action:create-proposal]
- Follow-up scheduling: [action:schedule-followup]

## Usage Guidelines

### When to Use Templates
- Consistent messaging required
- Complex explanations needed
- Industry-specific knowledge
- Objection handling situations
- Sales process standardization

### Customization Best Practices
- Adapt language to prospect's style
- Include specific business details
- Reference previous conversation points
- Add relevant case studies/examples
- Maintain conversational flow

### Performance Tracking
- Template usage frequency
- Response quality ratings
- Conversion rates by template
- User feedback and improvements
- A/B test variations