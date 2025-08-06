# API Pricing Model Summary (August 2025)

## Updated Pricing Structure

### Anthropic Claude Models (per 1M tokens)

| Model | Model ID | Input Price | Output Price | Notes |
|-------|----------|-------------|--------------|-------|
| Claude Opus 4.1 | `claude-opus-4-1-20250805` | $15.00 | $75.00 | 🆕 **Latest Release** (Aug 5, 2025) |
| Claude 4 Opus | `claude-4-opus` | $15.00 | $75.00 | High-performance model |
| Claude 4.0 Sonnet | `claude-sonnet-4-20250514` | $3.00 | $15.00 | **Default** model |
| Claude 3.7 Sonnet | `claude-3.7` | $3.00 | $15.00 | Fallback model |
| Claude 3.5 Sonnet | `claude-3.5-sonnet` | $3.00 | $15.00 | Legacy model |
| Claude 3 Opus | `claude-3-opus` | $15.00 | $75.00 | Legacy high-end model |
| Claude 3 Haiku | `claude-3-haiku` | $0.25 | $1.25 | Fast/budget model |

### OpenAI GPT Models (per 1M tokens)

| Model | Model ID | Input Price | Output Price | Notes |
|-------|----------|-------------|--------------|-------|
| GPT-4o Sonnet | `gpt-4o-sonnet` | $5.00 | $20.00 | Latest Sonnet variant |
| GPT-4o | `gpt-4o` | $5.00 | $20.00 | Standard GPT-4o |
| GPT-4o Mini | `gpt-4o-mini` | $0.15 | $0.60 | Budget option |
| GPT-4.1 Mini | `gpt-4.1-mini` | $0.15 | $0.60 | Latest mini variant |
| GPT-4 Turbo | `gpt-4-turbo` | $10.00 | $30.00 | Legacy turbo model |
| GPT-3.5 Turbo | `gpt-3.5-turbo` | $0.50 | $1.50 | Legacy budget model |

### OpenAI Embedding Models (per 1M tokens)

| Model | Model ID | Input Price | Output Price |
|-------|----------|-------------|--------------|
| Text Embedding 3 Small | `text-embedding-3-small` | $0.02 | $0.02 |
| Text Embedding 3 Large | `text-embedding-3-large` | $0.13 | $0.13 |
| Text Embedding Ada 002 | `text-embedding-ada-002` | $0.10 | $0.10 |

### Pinecone Vector Database (per 1K queries)

| Operation | Price |
|-----------|-------|
| Query | $0.40 per 1K queries |
| Upsert | $0.40 per 1K queries |

## Admin Interface Model Selection

All admin interfaces now include the complete model list matching the pricing structure:

### Available Options:
1. **🆕 Claude Opus 4.1 (Latest)** - Released today (Aug 5, 2025)
2. **Claude 4 Opus** - High-performance model
3. **Claude 4.0 Sonnet (Default)** - Balanced performance
4. **GPT-4o Sonnet** - Latest OpenAI Sonnet
5. **GPT-4o** - Standard OpenAI flagship
6. **GPT-4o Mini** - Budget OpenAI option
7. **GPT-4.1-mini** - Latest mini variant
8. **Claude 3.7 Sonnet** - Fallback model

## Cost Tracking Features

✅ **Real-time token consumption tracking** with 6-decimal precision
✅ **Monthly usage summaries** by user, provider, and model
✅ **Database storage** for historical analysis
✅ **Admin dashboard integration** for cost monitoring
✅ **Multi-provider support** (Anthropic, OpenAI, Pinecone)

## Recent Updates (August 5, 2025)

- ✅ Added Claude Opus 4.1 (released today)
- ✅ Updated GPT-4o pricing to current rates ($20 output tokens)
- ✅ Added GPT-4o Sonnet and GPT-4o Mini options
- ✅ Fixed database query issues in cost tracking
- ✅ Updated admin interface dropdowns
- ✅ Synchronized pricing models with tracking system