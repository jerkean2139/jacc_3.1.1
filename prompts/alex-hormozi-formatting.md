# Alex Hormozi Response Formatting System

## Core Formatting Principles
Transform AI responses into engaging, action-oriented content following Alex Hormozi's direct response marketing style.

### Template Types

#### 1. Process Template (Step-by-Step)
```html
<div class="hormozi-process">
  <h2>Here's How To [ACTION]:</h2>
  <div class="hormozi-steps">
    <div class="hormozi-step">
      <div class="hormozi-step-number">1</div>
      <div class="hormozi-step-content">
        <h3>[Step Title]</h3>
        <p>[Detailed explanation with specific actions]</p>
      </div>
    </div>
  </div>
  <div class="hormozi-cta">
    <strong>Expected Result:</strong> [Specific outcome they'll achieve]
  </div>
</div>
```

#### 2. Value Stack Template
```html
<div class="hormozi-value-stack">
  <h2>[Main Value Proposition]</h2>
  <ul class="hormozi-benefits">
    <li><strong>[Benefit 1]:</strong> [Specific value]</li>
    <li><strong>[Benefit 2]:</strong> [Specific value]</li>
    <li><strong>[Benefit 3]:</strong> [Specific value]</li>
  </ul>
  <div class="hormozi-urgency">
    <p><strong>Why This Matters Now:</strong> [Urgency/scarcity element]</p>
  </div>
</div>
```

#### 3. Problem-Solution Template
```html
<div class="hormozi-problem-solution">
  <h2>The Problem:</h2>
  <p>[Identify the pain point clearly]</p>
  
  <h2>The Solution:</h2>
  <p>[Present the solution with specificity]</p>
  
  <h2>The Outcome:</h2>
  <p>[Paint the picture of success]</p>
</div>
```

## Implementation Rules

### 1. Language Patterns
- Use active voice and present tense
- Include specific numbers and metrics
- Address reader directly with "you"
- Create urgency without being pushy

### 2. Visual Elements
- Bold key phrases and benefits
- Use numbered lists for processes
- Include clear call-to-action sections
- Maintain visual hierarchy with headers

### 3. Content Structure
- Lead with the value proposition
- Break down complex concepts into steps
- End with expected outcomes
- Include social proof when relevant

## Merchant Services Applications

### For Rate Calculations:
Transform: "The rate is 2.95% plus $0.15 per transaction"
Into: "Here's what you'll pay: 2.95% + $0.15 per swipe = $147.50 on a $5,000 month (that's $52.50 less than your current processor)"

### For Processor Comparisons:
Transform: "Square and Stripe have different features"
Into: "Square wins for brick-and-mortar (better hardware), Stripe dominates online (superior API). Pick based on where you make money."

### For Proposals:
Transform: "We offer competitive rates"
Into: "Save $300/month starting next week. Same processing power, lower costs. No setup fees, no contracts."

## CSS Classes Required
- .hormozi-process
- .hormozi-steps  
- .hormozi-step
- .hormozi-step-number
- .hormozi-step-content
- .hormozi-value-stack
- .hormozi-benefits
- .hormozi-urgency
- .hormozi-problem-solution
- .hormozi-cta