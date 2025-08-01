# JACC - AI-Powered Merchant Services Platform

## Overview
JACC is an advanced AI-powered assistant platform for independent sales agents in the merchant services industry. It provides intelligent document processing, business intelligence, and ISO hub integration through an adaptive AI ecosystem. The platform aims to streamline merchant analysis and competitive intelligence workflows by combining modern web technologies with enterprise-grade AI services. The business vision is to empower sales agents with cutting-edge tools to enhance efficiency and competitiveness in the merchant services market.

## User Preferences
Preferred communication style: Simple, everyday language.

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
- **Document Processing**: Advanced OCR pipeline (Tesseract.js) supporting PDF, CSV, text, and image files with batch processing, quality assessment, intelligent text chunking, metadata extraction, and vector embedding generation. Documents are encrypted at rest with AES-256-GCM.
- **ISO Hub Integration**: SSO authentication, token-based authentication, CORS configuration, and iframe embedding support with PostMessage communication for seamless integration with external merchant services platforms.
- **Performance Optimization**: Includes in-memory vector caching (LRU eviction), query optimization (expansion, intent detection, domain-specific terms, rewriting), search result reranking (multi-signal scoring), and configurable batch processing with job queue management and error handling.
- **Security**: Bank-level security implementation with AES-256-GCM document encryption, comprehensive audit logging, role-based access control, session security (4-hour timeout, IP binding), multi-tier rate limiting, CSRF protection, security headers, document watermarking readiness, and account lockout mechanisms.

### UI/UX Decisions
- Professional and clean design, often described as "F35 cockpit-style" for admin panels.
- Consistent color schemes, particularly using gradients and color-coded status indicators (green/yellow/red).
- Emphasis on clear visual hierarchy, accessible components, and responsive design for mobile.
- AI responses are formatted with HTML for improved readability, using structured layouts inspired by direct response marketing.

### System Design Choices
- **Scalability**: Designed with auto-scaling policies and performance monitoring for production.
- **Modularity**: Services are decoupled for easier maintenance and development.
- **Data Flow**: Defined flows for user authentication, chat processing (query to AI response), and document processing (upload to vector storage).
- **Deployment**: Primarily hosted on Replit, with considerations for external IDE compatibility via dotenv.

## External Dependencies
- **AI Services**: Anthropic Claude API, OpenAI API, Pinecone (vector database).
- **Cloud Services**: Neon PostgreSQL (cloud database hosting), Google Drive API (optional document synchronization), Google Service Account (for Drive integration).
- **ISO Integrations**: ISO Hub Server, ISO AMP API (for merchant processing analysis tools).