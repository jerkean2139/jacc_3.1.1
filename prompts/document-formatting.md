# Document Formatting and Integration System

## Document Link Formatting

### Professional Card Style
When referencing documents in AI responses, use this HTML structure:

```html
<div class="document-card">
  <div class="document-header">
    <h4 class="document-title">[Document Name]</h4>
    <span class="document-type">[PDF/DOC/XLS]</span>
  </div>
  <p class="document-preview">[Brief content preview or description]</p>
  <div class="document-actions">
    <a href="/api/documents/view/[document_id]" target="_blank" class="btn-view">
      📄 View Document
    </a>
    <a href="/api/documents/download/[document_id]" class="btn-download">
      ⬇️ Download
    </a>
  </div>
</div>
```

### Document Types and Icons
- **PDF**: 📄 (reports, guides, contracts)
- **Excel/CSV**: 📊 (rate sheets, calculators)
- **Word/Text**: 📝 (proposals, templates)
- **Image**: 🖼️ (diagrams, screenshots)
- **Presentation**: 📽️ (pitch decks, training)

## Content Integration Patterns

### 1. Rate Sheets and Pricing
```html
<div class="rate-sheet-reference">
  <h3>Current Rate Information:</h3>
  <div class="document-card">
    <div class="document-header">
      <h4>TracerPay Rate Sheet 2024</h4>
      <span class="document-type">PDF</span>
    </div>
    <p class="document-preview">Interchange rates: 2.65% + $0.15 | Qualified rates starting at 1.89%</p>
    <div class="document-actions">
      <a href="/api/documents/view/rate-sheet-2024" target="_blank" class="btn-view">
        📄 View Rates
      </a>
      <a href="/api/documents/download/rate-sheet-2024" class="btn-download">
        ⬇️ Download
      </a>
    </div>
  </div>
</div>
```

### 2. Processor Comparisons
```html
<div class="processor-comparison-docs">
  <h3>Processor Comparison Data:</h3>
  <div class="document-grid">
    <div class="document-card">
      <h4>Alliant Processing Guide</h4>
      <p>Complete feature set and pricing structure</p>
      <a href="/api/documents/view/alliant-guide" class="btn-view">📄 View</a>
    </div>
    <div class="document-card">  
      <h4>Merchant Lynx Overview</h4>
      <p>Service offerings and rate comparisons</p>
      <a href="/api/documents/view/merchant-lynx-overview" class="btn-view">📄 View</a>
    </div>
  </div>
</div>
```

### 3. Compliance and Contracts
```html
<div class="compliance-documents">
  <h3>Required Documentation:</h3>
  <ul class="document-list">
    <li>
      <div class="document-item">
        <span class="doc-icon">📄</span>
        <div class="doc-info">
          <strong>PCI Compliance Guide</strong>
          <p>Security requirements and implementation</p>
        </div>
        <a href="/api/documents/view/pci-compliance" class="btn-view">View</a>
      </div>
    </li>
  </ul>
</div>
```

## Search Result Integration

### Document Relevance Scoring
When AI searches return documents, format based on relevance:

#### High Relevance (90-100%)
```html
<div class="document-match high-relevance">
  <div class="relevance-indicator">
    <span class="relevance-score">96%</span>
    <span class="match-type">Exact Match</span>
  </div>
  [Standard document card format]
</div>
```

#### Medium Relevance (70-89%)
```html
<div class="document-match medium-relevance">
  <div class="relevance-indicator">
    <span class="relevance-score">78%</span>
    <span class="match-type">Related</span>
  </div>
  [Standard document card format]
</div>
```

#### Low Relevance (50-69%)
```html
<div class="document-match low-relevance">
  <div class="relevance-indicator">
    <span class="relevance-score">62%</span>
    <span class="match-type">Tangential</span>
  </div>
  [Standard document card format]
</div>
```

## Content Extraction Rules

### 1. Key Information Highlighting
Extract and highlight critical information:

```html
<div class="key-info-extract">
  <h4>Key Points from [Document Name]:</h4>
  <ul class="key-points">
    <li><strong>Processing Rate:</strong> 2.65% + $0.15 per transaction</li>
    <li><strong>Monthly Fee:</strong> $25 per month</li>
    <li><strong>Setup Cost:</strong> No setup fees</li>
    <li><strong>Contract Term:</strong> Month-to-month</li>
  </ul>
  <div class="source-link">
    <a href="/api/documents/view/[doc_id]">📄 View Full Document</a>
  </div>
</div>
```

### 2. Table Data Formatting
When documents contain tables, format for readability:

```html
<div class="table-extract">
  <h4>Rate Comparison (from [Document Name]):</h4>
  <table class="comparison-table">
    <thead>
      <tr>
        <th>Processor</th>
        <th>Rate</th>
        <th>Monthly Fee</th>
        <th>Notes</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Alliant</td>
        <td>2.65% + $0.15</td>
        <td>$25</td>
        <td>No contracts</td>
      </tr>
    </tbody>
  </table>
</div>
```

## Error Handling

### Document Not Found
```html
<div class="document-error">
  <p>⚠️ Referenced document "[Document Name]" is currently unavailable.</p>
  <p>Alternative resources:</p>
  <ul>
    <li><a href="/search?q=alternative+topic">Search related documents</a></li>
    <li><a href="/help">Contact support</a></li>
  </ul>
</div>
```

### Access Restricted
```html
<div class="document-restricted">
  <p>🔒 This document requires elevated permissions.</p>
  <p>Contact your administrator for access to "[Document Name]"</p>
</div>
```

## CSS Classes Required

### Document Cards
- `.document-card` - Main container
- `.document-header` - Title and type section  
- `.document-title` - Document name
- `.document-type` - File type indicator
- `.document-preview` - Content preview text
- `.document-actions` - Button container
- `.btn-view` - View button styling
- `.btn-download` - Download button styling

### Content Integration
- `.rate-sheet-reference` - Rate sheet containers
- `.processor-comparison-docs` - Comparison sections
- `.compliance-documents` - Compliance document lists
- `.document-grid` - Grid layout for multiple docs
- `.document-list` - List layout for documents
- `.document-item` - Individual list items

### Search Results
- `.document-match` - Search result container
- `.high-relevance` - High relevance styling
- `.medium-relevance` - Medium relevance styling
- `.low-relevance` - Low relevance styling
- `.relevance-indicator` - Relevance score display
- `.relevance-score` - Score number
- `.match-type` - Match type description

### Content Extraction
- `.key-info-extract` - Key information containers
- `.key-points` - Key points lists
- `.source-link` - Source document links
- `.table-extract` - Table extraction containers
- `.comparison-table` - Comparison table styling

### Error States
- `.document-error` - Error message containers
- `.document-restricted` - Restricted access messages