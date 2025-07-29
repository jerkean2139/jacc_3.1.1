# JACC Deployment Login Fix Guide

## Issue
Login not working in deployed version - users cannot authenticate successfully.

## Root Cause Analysis
Most likely causes in deployment environments:
1. **Database connectivity issues**
2. **Cookie/session configuration problems** 
3. **Missing environment variables**
4. **User accounts not properly seeded**

## Immediate Debugging Steps

### Step 1: Check Application Health
Visit: `https://your-deployed-app.com/api/debug/auth-status`

This will show:
- Database connection status
- Available test users
- Active sessions
- Environment information

### Step 2: Test Authentication API Directly
```bash
curl -X POST https://your-deployed-app.com/api/auth/simple-login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -v
```

## Fixes Applied

### 1. **CRITICAL FIX: Express Session Priority**
Fixed authentication middleware to prioritize database-backed express sessions over in-memory sessions:

**Login Process** (server/consolidated-routes.ts):
```javascript
// PRIMARY: Store in express session (database-backed)
req.session.user = userObj;
req.session.sessionId = sessionId;

// SECONDARY: Store in sessions map as cache
sessions.set(sessionId, userObj);
```

**Authentication Check** (requireAdmin function):
```javascript
// PRIORITY 1: Check express session first (persistent)
if (req.session?.user) {
  const user = req.session.user;
  if (user.role === 'admin' || user.role === 'client-admin') {
    req.user = user;
    return next();
  }
}

// PRIORITY 2: Check in-memory sessions and restore to express session
if (sessionId && sessions.has(sessionId)) {
  const userSession = sessions.get(sessionId);
  req.session.user = userSession; // Restore for persistence
  return next();
}
```

### 2. Deployment-Friendly Cookie Settings
Updated cookie configuration to handle HTTPS deployments:
```javascript
res.cookie('sessionId', sessionId, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production' ? true : false,
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/'
});
```

### 3. Added Debug Endpoint
New endpoint `/api/debug/auth-status` provides:
- Database connection verification  
- User account availability check
- Session management status
- Environment detection

### 4. Enhanced Error Logging
Authentication attempts now include detailed audit logging for troubleshooting.

## Expected Test Accounts
The system should have these accounts:
- **admin** / **admin123** (role: admin)
- **tracer-user** / **tracer123** (role: sales-agent)  
- **manager** / **manager123** (role: client-admin)

## Verification Steps

1. **Database Connection**: Debug endpoint shows `database.connected: true`
2. **User Accounts**: Debug endpoint lists all test users
3. **Login Test**: Manual curl test returns session token
4. **Admin Access Test**: After login, admin endpoints return 200 status
5. **Frontend Login**: Browser login stores cookie and redirects properly

## Local Testing Confirmed ✅

The fix has been tested locally and works perfectly:

```bash
# Login successful
POST /api/auth/simple-login → 200 OK
{"sessionToken":"session_dd4bcbfb-4369-4c2f-91b8-a61f36e4cd4d",...}

# Admin access works
GET /api/admin/documents → 200 OK
[{"id":"341d4171-8580-465d-b73a-129153...", ...}]
```

**Key Success Indicators:**
- Express session authentication working
- Database-backed session persistence active
- Admin role authorization functional
- Session restoration from cookies operational

## Environment Variables Required
```
DATABASE_URL=your_neon_database_url
NODE_ENV=production
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=merchant-docs-v2
```

## Next Steps
1. Test debug endpoint in deployed environment
2. Verify authentication API response
3. Check browser network/console for client-side issues
4. If users missing, they need to be seeded in database