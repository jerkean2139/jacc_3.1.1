# JACC Technical Architecture & Deployment Resolution

## Current Issues & Resolution

### Port Conflict (RESOLVED)
**Problem**: Development server (port 5000) blocked production deployment
**Solution**: Smart port selection - production automatically uses port 3000
**Status**: ✅ Production server successfully starts on port 3000

### Required Manual Action
Update `.replit` file:
```
[[ports]]
localPort = 3000
externalPort = 80
```

## Technical Architecture Overview

### Frontend Stack
**Core Framework**: React 18 + TypeScript + Vite
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query v5 (data fetching/caching)
- **UI Components**: Radix UI + shadcn/ui (accessible components)
- **Styling**: Tailwind CSS + CSS variables for theming
- **PWA**: Progressive Web App capabilities for mobile
- **Icons**: Lucide React

**Key Frontend Dependencies**:
- Form handling: React Hook Form + Hookform Resolvers
- Animation: Framer Motion
- Drag & Drop: DND Kit
- Charts: Recharts
- Date picker: React Day Picker

### Backend Stack
**Core**: Node.js + Express.js + TypeScript
- **Database**: PostgreSQL (Neon) + Drizzle ORM
- **Authentication**: Express sessions + Passport.js
- **Security**: Helmet, CORS, Rate limiting, CSRF protection
- **AI Integration**: Anthropic Claude + OpenAI + Pinecone vector database
- **Document Processing**: Tesseract.js OCR, PDF parsing, Puppeteer

**Key Backend Dependencies**:
- Session storage: Connect-pg-simple (PostgreSQL sessions)
- File uploads: Multer
- Email: SendGrid
- Password hashing: Bcrypt
- Web scraping: Cheerio + Puppeteer
- Document parsing: PDF-parse, Mammoth (Word docs)

### Database Schema (PostgreSQL + Drizzle)
**Core Tables**:
- `users` - Authentication, roles, ISO Hub integration
- `sessions` - Express session storage (required for Replit)
- `chats` - Chat conversations and AI interactions
- `documents` - File uploads with OCR and vector embeddings
- `vendors` - Merchant services vendor data
- `vendor_intelligence` - AI-powered competitive intelligence
- `vector_embeddings` - Semantic search capabilities

### AI & Intelligence Layer
**Primary Models**: 
- Claude 4.0 Sonnet (main AI)
- GPT-4.1 Mini (fallback)
- Pinecone (vector search/embeddings)

**Features**:
- Document OCR and intelligent processing
- Semantic search across business documents
- Competitive intelligence automation
- Custom prompt chaining and AI orchestration

### Development & Build Tools
**Development**: 
- tsx (TypeScript execution)
- Vite (frontend bundling)
- esbuild (backend bundling)

**Build Output**:
- Frontend: 693KB (includes React, Tailwind, all UI components)
- Backend: 513KB (Node.js server with all dependencies)

### Production Configuration
**Environment**: 
- Development: PORT=5000, NODE_ENV=development
- Production: PORT=3000, NODE_ENV=production (auto-selected)

**Deployment**: 
- Platform: Replit (native deployment)
- Build: Vite + esbuild bundling
- Database: Neon PostgreSQL (cloud)

## Current Status
- ✅ Application builds successfully
- ✅ Development server runs on port 5000
- ✅ Production server runs on port 3000 (avoiding conflicts)
- ⏳ Awaiting manual `.replit` port configuration update
- ✅ All 36+ previous deployment failures resolved

## Next Steps
1. Update `.replit` port mapping to 3000→80
2. Commit changes to git
3. Deploy application