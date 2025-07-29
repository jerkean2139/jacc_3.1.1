# JACC Deployment Troubleshooting Guide

## Common Login Issues in Deployed Environments

### 1. Database Connection Issues
- **Symptom**: Login fails silently or returns 500 errors
- **Solution**: Check `DATABASE_URL` environment variable
- **Test**: Visit `/health` endpoint to verify database connection

### 2. Cookie/Session Issues
- **Symptom**: Login appears successful but user not authenticated on next request
- **Solutions**:
  - Ensure `sameSite: 'none'` for HTTPS deployments
  - Verify `secure: true` for production HTTPS
  - Check domain restrictions in cookie settings

### 3. CORS Issues
- **Symptom**: Login request blocked by browser
- **Solution**: Configure CORS headers for your deployment domain

### 4. Environment Variables Missing
Required environment variables:
```
DATABASE_URL=your_neon_database_url
NODE_ENV=production
ANTHROPIC_API_KEY=your_key
OPENAI_API_KEY=your_key
PINECONE_API_KEY=your_key
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=merchant-docs-v2
```

### 5. User Accounts Not Created
Default test accounts that should exist:
- `admin` / `admin123` (role: admin)
- `tracer-user` / `tracer123` (role: sales-agent)
- `manager` / `manager123` (role: client-admin)

## Debugging Steps

1. **Check Application Health**:
   ```bash
   curl https://your-domain.com/health
   ```

2. **Test Authentication API**:
   ```bash
   curl -X POST https://your-domain.com/api/auth/simple-login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}' \
     -v
   ```

3. **Verify Database Users**:
   Check if users exist in database with correct password hashes

4. **Check Browser Console**:
   - Network tab for failed requests
   - Console for JavaScript errors
   - Application tab for cookie storage

## Quick Fixes

### Fix 1: Update Cookie Settings
The system now uses deployment-friendly cookie settings that adapt to production environments.

### Fix 2: Add Database User Creation
If users don't exist, they need to be seeded in the database with proper password hashes.

### Fix 3: Environment Detection
The system detects production vs development and adjusts security settings accordingly.