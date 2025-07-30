# Simple Instructions for External IDE Team

## The Problem
Your IDE can't find the environment variables that were stored in Replit's Secrets system.

## The Solution (3 Steps)

### Step 1: The dotenv package is already installed ✅
We just added it to your dependencies.

### Step 2: The code changes are already made ✅  
We added the environment loading to your `server/index.ts` file.

### Step 3: You need to create a `.env` file
Create a file called `.env` in your project root (same folder as package.json) with this content:

```env
# Copy your actual values from Replit Secrets here
DATABASE_URL=your_actual_database_url_here
ANTHROPIC_API_KEY=your_actual_anthropic_key_here  
OPENAI_API_KEY=your_actual_openai_key_here
PINECONE_API_KEY=your_actual_pinecone_key_here
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=merchant-docs-v2
SESSION_SECRET=your_session_secret_here
NODE_ENV=development
PORT=5000
```

## That's It!
After creating the `.env` file with your actual credentials, run:
```bash
npm run dev
```

The application should start successfully and show:
```
✅ Pinecone vector service initialized successfully
✅ Database initialized  
✅ Routes registered
```

## Why This Works
- **Replit**: Automatically provides environment variables
- **Your IDE**: Needs the `.env` file to load them manually
- **dotenv package**: Reads the `.env` file and makes variables available to your app

---
**Bottom Line**: Create the `.env` file with your credentials, and everything will work exactly like it does in Replit.