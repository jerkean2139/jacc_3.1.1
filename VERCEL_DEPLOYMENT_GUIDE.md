# JACC Vercel Deployment Guide

## Why Vercel is Better for JACC

Vercel offers significant advantages over Netlify for full-stack AI applications:
- **60-second function timeouts** (vs 10s on Netlify free tier)
- **Better Node.js support** with native TypeScript
- **Edge runtime options** for faster responses
- **Automatic API route handling**
- **Superior full-stack integration**

## Prerequisites

1. **GitHub Repository** with your JACC code
2. **Vercel Account** (free tier available)
3. **Environment Variables** from your Replit setup

## Step-by-Step Deployment

### 1. Push to GitHub
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Vercel Setup
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "New Project" 
3. Import your JACC repository
4. Vercel will auto-detect the framework settings

### 3. Build Configuration
Vercel should auto-configure, but verify these settings:
- **Framework**: Other
- **Build Command**: `npm run build`
- **Output Directory**: `dist/public`
- **Install Command**: `npm install`

### 4. Environment Variables
Add these in Vercel dashboard → Settings → Environment Variables:

**Database (Required):**
```
DATABASE_URL=your_neon_database_connection_string
PGHOST=your_neon_host
PGDATABASE=your_database_name
PGUSER=your_database_user
PGPASSWORD=your_database_password
PGPORT=5432
```

**AI Services (Required):**
```
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX_NAME=your_pinecone_index_name
```

**Security (Required):**
```
SESSION_SECRET=your_very_long_random_session_secret_min_32_chars
NODE_ENV=production
```

**Optional Services:**
```
SENDGRID_API_KEY=your_sendgrid_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
```

### 5. Deploy
1. Click "Deploy"
2. Wait for build to complete (usually 3-5 minutes)
3. Your app will be live at `https://your-project-name.vercel.app`

## Post-Deployment Checklist

### Test Core Functionality:
- [ ] Login/Authentication works
- [ ] Chat interface loads properly
- [ ] AI responses generate (test with simple query)
- [ ] Admin panel accessible
- [ ] Document upload works
- [ ] Database operations function

### Performance Monitoring:
- [ ] Check function execution times in Vercel dashboard
- [ ] Monitor error rates
- [ ] Test response times for AI queries

## Configuration Files Created:

1. **`vercel.json`** - Main Vercel configuration
2. **`api/index.ts`** - Serverless function entry point
3. **Build settings** - Optimized for full-stack deployment

## Advantages Over Netlify:

✅ **60-second function timeouts** (enough for most AI processing)
✅ **Better database connection handling**
✅ **Native TypeScript support**
✅ **Automatic API route detection**
✅ **Superior error handling and logging**
✅ **Edge runtime options for global performance**

## Troubleshooting:

### Build Errors:
- Check build logs in Vercel dashboard
- Ensure all dependencies are in package.json
- Verify TypeScript compilation

### Runtime Errors:
- Check function logs in Vercel dashboard
- Verify environment variables are set correctly
- Test database connection string

### Timeout Issues:
- Most AI queries should complete within 60 seconds
- For longer operations, consider implementing background processing

## Migration from Replit:

1. Export all environment variables from Replit Secrets
2. Add them to Vercel environment variables
3. Update any hardcoded URLs to use Vercel domain
4. Test all functionality thoroughly

## Custom Domain Setup:

1. Go to Vercel dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS settings as instructed
4. SSL certificate will be automatically provisioned

## Monitoring and Analytics:

Vercel provides built-in monitoring:
- Function execution metrics
- Error tracking
- Performance insights
- Real-time logs

---

Vercel is the recommended deployment platform for JACC due to its superior full-stack capabilities and better support for AI workloads.