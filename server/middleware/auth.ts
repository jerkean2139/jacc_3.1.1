import bcrypt from 'bcrypt';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import type { Express } from 'express';
import { storage } from '../storage';
import { sessions } from '../consolidated-routes';
import { auditLogger, AuditEventType } from '../utils/audit-logger';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  return bcrypt.compare(supplied, stored);
}

export function setupAuth(app: Express) {
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: 7 * 24 * 60 * 60 * 1000, // 1 week
    tableName: "sessions",
  });

  // Require SESSION_SECRET - security critical
  if (!process.env.SESSION_SECRET) {
    console.error('🚨 SECURITY ERROR: SESSION_SECRET environment variable is required');
    console.error('Please set a strong SESSION_SECRET (32+ characters) in your environment');
    process.exit(1);
  }

  if (process.env.SESSION_SECRET.length < 32) {
    console.error('🚨 SECURITY WARNING: SESSION_SECRET should be at least 32 characters long');
  }

  app.use(session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      sameSite: 'strict', // Enhanced security
    },
  }));
}

// Performance cache for authenticated sessions
const sessionCache = new Map<string, { user: any, timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Session rotation tracking
const sessionRotationTracker = new Map<string, { 
  sessionId: string; 
  userId: string; 
  createdAt: number; 
  rotationCount: number; 
  lastActivity: number;
}>();

// Session rotation interval (15 minutes for security)
const SESSION_ROTATION_INTERVAL = 15 * 60 * 1000; 
const MAX_SESSION_AGE = 4 * 60 * 60 * 1000; // 4 hours max session age

// Failed login tracking for account lockout
const failedLoginAttempts = new Map<string, { 
  count: number; 
  firstAttempt: number; 
  lockoutUntil?: number;
}>();

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes lockout

export const isAuthenticated = async (req: any, res: any, next: any) => {
  try {
    // PRIORITY 1: Check express session first (database-backed, persistent)
    if (req.session?.user) {
      req.user = req.session.user;
      await updateSessionActivity(req);
      return next();
    }
    
    // PRIORITY 2: Check sessionId cookie and restore to express session if valid
    const sessionId = req.cookies?.sessionToken || req.cookies?.sessionId;
    if (sessionId) {
      // Check cache first for performance
      const cached = sessionCache.get(sessionId);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        req.user = cached.user;
        // Restore to express session for persistence
        req.session.user = cached.user;
        await updateSessionActivity(req);
        return next();
      }
      
      // Check sessions Map and restore to express session
      let user = null;
      if (sessions.has(sessionId)) {
        const sessionData = sessions.get(sessionId);
        if (sessionData && sessionData.userId && sessionData.role) {
          // Check session expiry
          const tracker = sessionRotationTracker.get(sessionId);
          if (tracker && Date.now() - tracker.createdAt > MAX_SESSION_AGE) {
            // Session expired, clean up
            sessions.delete(sessionId);
            sessionCache.delete(sessionId);
            sessionRotationTracker.delete(sessionId);
            
            await auditLogger.log({
              eventType: AuditEventType.SESSION_EXPIRED,
              userId: sessionData.userId,
              userEmail: sessionData.email || null,
              ipAddress: req.ip || 'unknown',
              userAgent: req.get('User-Agent'),
              resourceId: sessionId,
              resourceType: 'session',
              action: 'session_expiry',
              details: { reason: 'max_age_exceeded' },
              success: true,
              errorMessage: null
            });
            
            return res.status(401).json({ error: 'Session expired' });
          }
          
          // Validate session has required fields and hasn't expired
          user = {
            id: sessionData.userId,
            username: sessionData.username,
            role: sessionData.role,
            email: sessionData.email
          };
          
          // CRITICAL: Restore to express session for deployment persistence
          req.session.user = user;
        }
      }
    
      if (user) {
        // Cache the validated user for performance
        sessionCache.set(sessionId, { user, timestamp: Date.now() });
        req.user = user;
        await updateSessionActivity(req);
        return next();
      }
    }
    
    // Log unauthorized access attempt
    await auditLogger.log({
      eventType: AuditEventType.UNAUTHORIZED_ACCESS,
      userId: null,
      userEmail: null,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      resourceId: req.path,
      resourceType: 'endpoint',
      action: 'unauthorized_access',
      details: { path: req.path, method: req.method },
      success: false,
      errorMessage: 'Authentication required'
    });
    
    // Fast-path 401 response for unauthenticated users
    res.status(401).json({ error: 'Not authenticated' });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication service error' });
  }
};

// Session rotation and security functions
async function checkSessionRotation(req: any, res: any): Promise<boolean> {
  const sessionId = req.cookies?.sessionToken || req.cookies?.sessionId || req.session?.id;
  if (!sessionId) return false;
  
  const tracker = sessionRotationTracker.get(sessionId);
  if (!tracker) {
    // Initialize tracking for new session
    sessionRotationTracker.set(sessionId, {
      sessionId,
      userId: req.user?.id || req.session?.user?.id,
      createdAt: Date.now(),
      rotationCount: 0,
      lastActivity: Date.now()
    });
    return false;
  }
  
  // Check if rotation is needed
  const timeSinceLastRotation = Date.now() - tracker.lastActivity;
  return timeSinceLastRotation > SESSION_ROTATION_INTERVAL;
}

async function rotateSession(req: any, res: any): Promise<void> {
  try {
    const oldSessionId = req.cookies?.sessionToken || req.cookies?.sessionId || req.session?.id;
    const newSessionId = 'rotated-' + crypto.randomUUID();
    
    if (oldSessionId && sessions.has(oldSessionId)) {
      const sessionData = sessions.get(oldSessionId);
      if (sessionData) {
        // Create new session with same data
        sessions.set(newSessionId, sessionData);
        
        // Update rotation tracker
        const tracker = sessionRotationTracker.get(oldSessionId);
        if (tracker) {
          sessionRotationTracker.set(newSessionId, {
            ...tracker,
            sessionId: newSessionId,
            rotationCount: tracker.rotationCount + 1,
            lastActivity: Date.now()
          });
          sessionRotationTracker.delete(oldSessionId);
        }
        
        // Clean up old session
        sessions.delete(oldSessionId);
        sessionCache.delete(oldSessionId);
        
        // Set new session cookie
        res.cookie('sessionId', newSessionId, { 
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 4 * 60 * 60 * 1000 // 4 hours
        });
        
        // Log session rotation
        await auditLogger.log({
          eventType: AuditEventType.AUTH_SUCCESS,
          userId: sessionData.userId,
          userEmail: sessionData.email || null,
          ipAddress: req.ip || 'unknown',
          userAgent: req.get('User-Agent'),
          resourceId: newSessionId,
          resourceType: 'session',
          action: 'session_rotation',
          details: { 
            oldSessionId: oldSessionId.substring(0, 8) + '...',
            rotationCount: (tracker?.rotationCount || 0) + 1
          },
          success: true,
          errorMessage: null
        });
      }
    }
  } catch (error) {
    console.error('Session rotation error:', error);
  }
}

async function updateSessionActivity(req: any): Promise<void> {
  const sessionId = req.cookies?.sessionToken || req.cookies?.sessionId || req.session?.id;
  if (!sessionId) return;
  
  const tracker = sessionRotationTracker.get(sessionId);
  if (tracker) {
    tracker.lastActivity = Date.now();
  }
}

// Account lockout functions
export async function checkAccountLockout(identifier: string): Promise<{ 
  isLocked: boolean; 
  remainingTime?: number; 
  attemptsRemaining?: number; 
}> {
  const attempts = failedLoginAttempts.get(identifier);
  if (!attempts) {
    return { isLocked: false, attemptsRemaining: MAX_FAILED_ATTEMPTS };
  }
  
  // Check if lockout period has expired
  if (attempts.lockoutUntil && Date.now() > attempts.lockoutUntil) {
    failedLoginAttempts.delete(identifier);
    return { isLocked: false, attemptsRemaining: MAX_FAILED_ATTEMPTS };
  }
  
  // Check if account is currently locked
  if (attempts.lockoutUntil && Date.now() < attempts.lockoutUntil) {
    const remainingTime = attempts.lockoutUntil - Date.now();
    return { isLocked: true, remainingTime };
  }
  
  // Account not locked but has failed attempts
  return { 
    isLocked: false, 
    attemptsRemaining: Math.max(0, MAX_FAILED_ATTEMPTS - attempts.count)
  };
}

export async function recordFailedLogin(identifier: string, req: any): Promise<void> {
  const now = Date.now();
  const attempts = failedLoginAttempts.get(identifier) || { 
    count: 0, 
    firstAttempt: now 
  };
  
  attempts.count++;
  
  // Reset counter if first attempt was more than 1 hour ago
  if (now - attempts.firstAttempt > 60 * 60 * 1000) {
    attempts.count = 1;
    attempts.firstAttempt = now;
    delete attempts.lockoutUntil;
  }
  
  // Lock account if max attempts reached
  if (attempts.count >= MAX_FAILED_ATTEMPTS) {
    attempts.lockoutUntil = now + LOCKOUT_DURATION;
    
    // Log security event
    await auditLogger.log({
      eventType: AuditEventType.SUSPICIOUS_ACTIVITY,
      userId: null,
      userEmail: identifier,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      resourceId: identifier,
      resourceType: 'account',
      action: 'account_lockout',
      details: { 
        failedAttempts: attempts.count,
        lockoutDuration: LOCKOUT_DURATION / 1000 / 60 + ' minutes'
      },
      success: true,
      errorMessage: null
    });
  }
  
  failedLoginAttempts.set(identifier, attempts);
}

export async function clearFailedLoginAttempts(identifier: string): Promise<void> {
  failedLoginAttempts.delete(identifier);
}

// Enhanced login function with lockout protection
export async function authenticateUser(
  username: string, 
  password: string, 
  req: any
): Promise<{ 
  success: boolean; 
  user?: any; 
  error?: string; 
  lockoutInfo?: any; 
}> {
  try {
    // Check account lockout
    const lockoutStatus = await checkAccountLockout(username);
    if (lockoutStatus.isLocked) {
      await auditLogger.log({
        eventType: AuditEventType.AUTH_FAILURE,
        userId: null,
        userEmail: username,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent'),
        resourceId: username,
        resourceType: 'account',
        action: 'login_attempt_while_locked',
        details: { remainingTime: lockoutStatus.remainingTime },
        success: false,
        errorMessage: 'Account locked'
      });
      
      return { 
        success: false, 
        error: 'Account temporarily locked due to multiple failed attempts',
        lockoutInfo: lockoutStatus
      };
    }
    
    // Attempt authentication
    const user = await storage.getUserByUsername(username);
    if (!user || !await comparePasswords(password, user.passwordHash)) {
      await recordFailedLogin(username, req);
      
      await auditLogger.log({
        eventType: AuditEventType.AUTH_FAILURE,
        userId: null,
        userEmail: username,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent'),
        resourceId: username,
        resourceType: 'account',
        action: 'invalid_credentials',
        details: { attemptsRemaining: (lockoutStatus.attemptsRemaining || 1) - 1 },
        success: false,
        errorMessage: 'Invalid credentials'
      });
      
      return { 
        success: false, 
        error: 'Invalid credentials',
        lockoutInfo: { attemptsRemaining: (lockoutStatus.attemptsRemaining || 1) - 1 }
      };
    }
    
    // Successful authentication
    await clearFailedLoginAttempts(username);
    
    await auditLogger.log({
      eventType: AuditEventType.AUTH_SUCCESS,
      userId: user.id,
      userEmail: user.email,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      resourceId: user.id,
      resourceType: 'account',
      action: 'successful_login',
      details: { username: user.username, role: user.role },
      success: true,
      errorMessage: null
    });
    
    return { success: true, user };
    
  } catch (error) {
    console.error('Authentication error:', error);
      return { success: false, error: 'Authentication service error' };
  }
}

export const requireRole = (roles: string[]) => {
  return async (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (!roles.includes(req.user.role)) {
      // Log unauthorized role access attempt
      await auditLogger.log({
        eventType: AuditEventType.UNAUTHORIZED_ACCESS,
        userId: req.user.id,
        userEmail: req.user.email,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent'),
        resourceId: req.path,
        resourceType: 'endpoint',
        action: 'insufficient_permissions',
        details: { 
          requiredRoles: roles, 
          userRole: req.user.role,
          path: req.path 
        },
        success: false,
        errorMessage: 'Insufficient permissions'
      });
      
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    
    return next();
  };
};

// Original requireRole function kept for compatibility