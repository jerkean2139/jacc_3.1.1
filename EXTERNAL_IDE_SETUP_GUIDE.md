# External IDE Setup Guide for JACC Platform

## What the External IDE Needs to Do

### 1. Install dotenv Package
```bash
npm install dotenv
```

### 2. Add Environment Variable Loading to server/index.ts

**CRITICAL**: Add these lines at the **very top** of `server/index.ts` (before any other imports):

```javascript
import dotenv from 'dotenv';
dotenv.config();
```

The file should start like this:
```javascript
import dotenv from 'dotenv';
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { registerConsolidatedRoutes } from "./consolidated-routes";
// ... rest of imports
```

### 3. .env File Requirements

The `.env` file should be in the **root directory** (same level as package.json) and contain:

```env
# Database Configuration
DATABASE_URL=postgresql://[username]:[password]@[host]/[database]?sslmode=require

# AI Service Keys
ANTHROPIC_API_KEY=ant-api-xxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxx
PINECONE_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=merchant-docs-v2

# Session Security
SESSION_SECRET=your-secure-session-secret-here

# Google Services (Optional)
GOOGLE_CLIENT_ID=xxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxxxxxxxxxx
GOOGLE_SHEET_ID=1e_OX1HtrdQK2VSgLOjLpFYvMzrDSbONNLX6vhAHoMv8

# Email Service (Optional)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxx

# Application Configuration
NODE_ENV=development
PORT=5000
```

### 4. Why This Is Needed

- **Replit vs External IDE**: Replit automatically provides environment variables through their Secrets system
- **External IDEs**: Need explicit `.env` file loading using the `dotenv` package
- **Current Issue**: The application expects environment variables but external IDE doesn't know how to load them from `.env` file

### 5. Verification Steps

After making these changes, the external IDE should:

1. **Start the application**: `npm run dev`
2. **Check for success messages** in console:
   ```
   ✅ Pinecone vector service initialized successfully
   ✅ Database initialized
   ✅ Routes registered
   ✅ All required environment variables present
   ```
3. **Access the application** at `http://localhost:5000`
4. **Test authentication** with credentials: `cburnell/cburnell123`

### 6. Common Issues and Solutions

**Issue**: "Environment variable X is undefined"
**Solution**: Verify `.env` file exists in root directory and contains all required variables

**Issue**: "Cannot connect to database"
**Solution**: Check DATABASE_URL format and database accessibility

**Issue**: "dotenv is not defined"
**Solution**: Run `npm install dotenv` and restart the application

### 7. File Structure Expected

```
project-root/
├── .env                    ← Environment variables file
├── package.json
├── server/
│   ├── index.ts           ← Add dotenv.config() here
│   └── ...
└── client/
    └── ...
```

### 8. Security Note

- Add `.env` to `.gitignore` to prevent committing secrets
- Never share the `.env` file contents publicly
- Each developer should have their own `.env` file with their credentials

---

## Summary for External IDE Team

**What changed**: We moved from Replit's automatic environment variable system to standard `.env` file approach.

**What you need to do**:
1. Install `dotenv` package
2. Add `import dotenv from 'dotenv'; dotenv.config();` to the very top of `server/index.ts`
3. Create `.env` file in root with all environment variables
4. Run `npm run dev` to start the application

**Expected result**: Application should start successfully and show all initialization messages in console.