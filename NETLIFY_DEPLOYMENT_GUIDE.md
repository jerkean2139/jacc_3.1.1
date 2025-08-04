# JACC Netlify Deployment Guide

## Prerequisites

1. **GitHub Account** with your JACC project code
2. **Netlify Account** (free tier available)
3. **Environment Variables** from your current setup

## Step-by-Step Deployment

### 1. Prepare Your Repository

First, make sure your code is pushed to GitHub:

```bash
git add .
git commit -m "Prepare for Netlify deployment"
git push origin main
```

### 2. Netlify Setup

1. **Login to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Sign in with GitHub

2. **Create New Site**
   - Click "New site from Git"
   - Choose GitHub
   - Select your JACC repository

3. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist/public`
   - Node version: `18`

### 3. Environment Variables

In Netlify dashboard → Site settings → Environment variables, add these:

**Database Variables:**
```
DATABASE_URL=your_neon_database_url
PGHOST=your_neon_host
PGDATABASE=your_database_name
PGUSER=your_database_user
PGPASSWORD=your_database_password
PGPORT=5432
```

**AI Service Keys:**
```
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX_NAME=your_pinecone_index_name
```

**Security:**
```
SESSION_SECRET=a_very_long_random_string_min_32_chars
NODE_ENV=production
```

**Optional Services:**
```
SENDGRID_API_KEY=your_sendgrid_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 4. Deploy

1. Click "Deploy site"
2. Wait for build to complete (usually 5-10 minutes)
3. Your site will be available at `https://random-name.netlify.app`

### 5. Post-Deployment Setup

1. **Custom Domain** (Optional)
   - Go to Domain settings
   - Add your custom domain
   - Configure DNS

2. **Database Migration**
   - Run database migrations if needed:
   ```bash
   npm run db:push
   ```

3. **Test All Features**
   - Login functionality
   - Chat interface
   - Admin panel
   - Document upload
   - AI responses

## Important Notes

### **Limitations with Netlify**

Netlify has some limitations for full-stack apps like JACC:

1. **Serverless Functions Timeout**: 10 seconds for free tier, 26 seconds for Pro
2. **Database Connections**: Limited concurrent connections
3. **File Uploads**: May need external storage for large files
4. **WebSockets**: Not supported (affects real-time features)

### **Alternative Recommendation: Vercel or Railway**

For better full-stack support, consider:

- **Vercel**: Better Node.js support, longer function timeouts
- **Railway**: True server deployment, database included
- **Render**: Good balance of features and pricing

## Troubleshooting

### Build Errors
- Check build logs in Netlify dashboard
- Ensure all dependencies are in package.json
- Verify environment variables are set

### Runtime Errors
- Check function logs in Netlify dashboard
- Verify database connection string
- Test API endpoints individually

### Performance Issues
- Monitor function execution times
- Consider caching strategies
- Optimize database queries

## Migration from Replit

To get your current environment variables from Replit:

1. In Replit, go to Secrets tab
2. Copy all your environment variables
3. Add them to Netlify environment variables

## Domain Configuration

After deployment, update these settings:

1. **CORS Origins**: Update to include your Netlify domain
2. **Redirect URLs**: Update OAuth redirect URLs
3. **API Base URLs**: Update any hardcoded URLs in frontend

## Monitoring

Set up monitoring for:
- Function execution times
- Error rates
- Database connection health
- User authentication flows

---

Need help with deployment? Check the Netlify documentation or contact support.