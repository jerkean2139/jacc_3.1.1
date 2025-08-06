# JACC - AI-Powered Merchant Services Platform

## Overview
JACC is an advanced AI-powered assistant platform for independent sales agents in the merchant services industry. It provides intelligent document processing, business intelligence, and ISO hub integration through an adaptive AI ecosystem. The platform aims to streamline merchant analysis and competitive intelligence workflows by combining modern web technologies with enterprise-grade AI services. The business vision is to empower sales agents with cutting-edge tools to enhance efficiency and competitiveness in the merchant services market.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (August 2025)

### Memory Optimization & Performance Enhancement (Aug 6, 2025)
- **CRITICAL**: Implemented aggressive memory optimization to resolve 97% memory usage issues
- Reduced memory thresholds: Warning at 70%, Critical at 85% (down from 85%/95%)
- Target memory limit: 200MB (down from 400MB) with 180MB proactive cleanup trigger
- Enhanced garbage collection: Multiple GC cycles + every 60 seconds + on-demand cleanup
- Request payload limits: Reduced from 10MB to 2MB to conserve memory
- Faster monitoring cycles: Every 15 seconds (down from 30 seconds)
- Added Node.js runtime flags: --max-old-space-size=200 --optimize-for-size --expose-gc
- Aggressive require cache clearing for non-essential modules

### API Pricing Model & Cost Tracking Updates (Aug 6, 2025)
- **NEW**: Added Claude Opus 4.1 model (released Aug 5, 2025) - latest AI model with enhanced coding capabilities
- Updated OpenAI GPT-4o pricing to current market rates ($20 per 1M output tokens)
- Added GPT-4o Sonnet, GPT-4o Mini, and GPT-4.1 Mini models to pricing structure
- Fixed database query issues in ApiCostTracker service for monthly usage summaries
- Updated admin interface dropdowns to include all latest AI models
- Synchronized API cost tracking with actual model usage for accurate billing
- Enhanced pricing structure covers all models: Anthropic Claude (4.1 Opus to 3 Haiku) and OpenAI GPT (4o variants to 3.5 Turbo)

### AI Training & Chat Review System Complete (Aug 5, 2025)
- Successfully implemented comprehensive AI learning system with 4-step correction process
- Fixed React infinite re-render warnings by removing function dependencies from useEffect hooks
- Added missing `/api/user` endpoint resolving frontend authentication issues
- Enhanced admin chat messages endpoint with proper authentication and fallback logic
- Chat loading functionality now works flawlessly with View buttons and message display
- AI training corrections stored in multiple database tables for comprehensive learning
- Knowledge base integration ensures corrected responses are immediately available
- Training interactions tracked for machine learning and analytics

### Chat Review & Training Features (PRESERVED - WORKING FLAWLESSLY)
- View button functionality: ✓ Working perfectly
- Chat message loading: ✓ Loading conversations properly
- Edit response interface: ✓ Rich text editor with save functionality
- AI training pipeline: ✓ 4-step learning process implemented
- Database storage: ✓ Multiple tables for comprehensive tracking
- Knowledge base updates: ✓ Immediate integration of corrections
- Admin authentication: ✓ Secure access with proper role checking

### Current Development Status
- Core platform: Stable and error-free
- Authentication: Working (user: cburnell, role: client-admin)
- Chat Review System: **COMPLETE AND PRESERVED**
- AI Training Pipeline: **FULLY FUNCTIONAL**
- API endpoints: All functional with proper error handling
- Database: Connected and responsive
- OCR System: **DEPRECATED** - Modern LLMs have built-in document analysis capabilities
- Next phase: Leverage LLM native document processing instead of complex OCR pipeline

## System Architecture
JACC is built as a Progressive Web App (PWA) combining a React 18 (with TypeScript) frontend, a Node.js (with Express.js and TypeScript) backend, and a PostgreSQL database.

### Frontend
- **Frameworks**: React 18, TypeScript, Vite, Wouter (routing), TanStack Query (state management).
- **Styling**: Tailwind CSS with shadcn/ui and Radix UI for accessible components.
- **Features**: PWA capabilities for mobile use.

### Backend
- **Core**: Node.js with Express.js, TypeScript.
- **Authentication**: Session-based with PostgreSQL session store, multi-factor authentication, role-based access control (sales-agent, client-admin, dev-admin), ISO Hub SSO integration.
- **API**: RESTful, modular service architecture for AI, search, and document processing.

### Database
- **Type**: PostgreSQL (Neon).
- **ORM**: Drizzle ORM.
- **Schema**: Supports users, chats, documents, vendors, monitoring, and vector embeddings.

### Key Components
- **AI Integration**: Primary language models are Claude 4.0 Sonnet and OpenAI GPT-4.1 Mini. Fallback models are OpenAI GPT-4.1 Mini and Claude 3.7 Sonnet. Utilizes Pinecone for vector search, custom prompt chaining, and AI orchestration.
- **Document Processing**: Simplified approach leveraging native LLM document analysis capabilities for PDF, CSV, text, and image files. Modern AI models provide superior document understanding without complex OCR pipelines. Documents are encrypted at rest with AES-256-GCM.
- **ISO Hub Integration**: SSO authentication, token-based authentication, CORS configuration, and iframe embedding support with PostMessage communication for seamless integration with external merchant services platforms.
- **Performance Optimization**: Includes in-memory vector caching (LRU eviction), query optimization (expansion, intent detection, domain-specific terms, rewriting), search result reranking (multi-signal scoring), and configurable batch processing with job queue management and error handling.
- **Security**: Production-ready security implementation with mandatory SESSION_SECRET validation, proper API key authentication, restrictive CSP headers (no unsafe-eval), environment-specific CORS policies, generic error handling in production, comprehensive audit logging, role-based access control, session security (7-day timeout, SameSite strict), multi-tier rate limiting, CSRF protection, and account lockout mechanisms. All critical security vulnerabilities from audit have been resolved.

### UI/UX Decisions
- Professional and clean design with cockpit-style interface for admin panels.
- Consistent color schemes, particularly using gradients and color-coded status indicators (green/yellow/red).
- Emphasis on clear visual hierarchy, accessible components, and responsive design for mobile.
- AI responses are formatted with HTML for improved readability, using structured layouts inspired by direct response marketing.

### System Design Choices
- **Scalability**: Designed with auto-scaling policies and performance monitoring for production.
- **Modularity**: Services are decoupled for easier maintenance and development.
- **Data Flow**: Defined flows for user authentication, chat processing (query to AI response), and document processing (upload to vector storage).
- **Deployment**: Production-ready for Vercel deployment with 60-second function timeouts, native TypeScript support, and comprehensive serverless configuration. Netlify configuration also available but not recommended due to timeout limitations for AI processing.

## External Dependencies
- **AI Services**: Anthropic Claude API, OpenAI API, Pinecone (vector database).
- **Cloud Services**: Neon PostgreSQL (cloud database hosting), Google Drive API (optional document synchronization), Google Service Account (for Drive integration).
- **ISO Integrations**: ISO Hub Server, ISO AMP API (for merchant processing analysis tools).