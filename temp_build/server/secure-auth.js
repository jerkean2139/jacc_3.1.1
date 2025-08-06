import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { db } from './db';
import { users, securitySessions, loginAttempts, userSecuritySettings } from '@shared/schema';
import { eq, and, gt } from 'drizzle-orm';
import { verifyTOTPToken, auditLog } from './security-config';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes
const SESSION_DURATION = 4 * 60 * 60 * 1000; // 4 hours (bank standard)
const SESSION_IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes idle timeout
export class SecureAuthService {
    // Secure password hashing
    async hashPassword(password) {
        const saltRounds = 12; // Bank-level bcrypt rounds
        return bcrypt.hash(password, saltRounds);
    }
    // Validate password strength
    validatePasswordStrength(password) {
        const errors = [];
        if (password.length < 12)
            errors.push('Password must be at least 12 characters');
        if (!/[A-Z]/.test(password))
            errors.push('Password must contain uppercase letters');
        if (!/[a-z]/.test(password))
            errors.push('Password must contain lowercase letters');
        if (!/[0-9]/.test(password))
            errors.push('Password must contain numbers');
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
            errors.push('Password must contain special characters');
        if (/(.)\1{2,}/.test(password))
            errors.push('Password cannot contain repeated characters');
        // Check against common passwords
        const commonPasswords = ['password123', 'admin123', 'welcome123'];
        if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
            errors.push('Password is too common');
        }
        return { valid: errors.length === 0, errors };
    }
    // Authenticate user with comprehensive security checks
    async authenticateUser(username, password, ipAddress, userAgent, totpToken) {
        try {
            // Check for account lockout
            const lockoutStatus = await this.checkLockout(username, ipAddress);
            if (lockoutStatus.locked) {
                return { success: false, error: `Account locked. Try again in ${lockoutStatus.remainingMinutes} minutes` };
            }
            // Get user from database
            const [user] = await db
                .select()
                .from(users)
                .where(eq(users.username, username))
                .limit(1);
            console.log('User found:', user ? `${user.username} (isActive: ${user.isActive})` : 'null');
            if (!user) {
                await this.recordFailedAttempt(username, ipAddress, userAgent);
                return { success: false, error: 'Invalid credentials' };
            }
            // Verify password
            const validPassword = await bcrypt.compare(password, user.passwordHash);
            console.log('Password valid:', validPassword);
            if (!validPassword) {
                await this.recordFailedAttempt(username, ipAddress, userAgent);
                return { success: false, error: 'Invalid credentials' };
            }
            // Check if account is active
            console.log('User isActive value:', user.isActive, 'Type:', typeof user.isActive);
            if (!user.isActive) {
                return { success: false, error: 'Account is not active' };
            }
            // Get security settings
            const [securitySettings] = await db
                .select()
                .from(userSecuritySettings)
                .where(eq(userSecuritySettings.userId, user.id))
                .limit(1);
            // Check 2FA requirement
            if (securitySettings?.totpEnabled && !totpToken) {
                return { success: false, requiresTOTP: true };
            }
            if (securitySettings?.totpEnabled && totpToken) {
                const validTOTP = verifyTOTPToken(securitySettings.totpSecret, totpToken);
                if (!validTOTP) {
                    await this.recordFailedAttempt(username, ipAddress, userAgent);
                    return { success: false, error: 'Invalid 2FA code' };
                }
            }
            // Clear failed attempts
            await this.clearFailedAttempts(username, ipAddress);
            // Create secure session
            const sessionToken = await this.createSecureSession(user.id, ipAddress, userAgent);
            // Audit successful login
            await auditLog(user.id, 'login_success', 'auth', { username }, ipAddress, userAgent);
            // Return sanitized user data
            return {
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    firstName: user.firstName,
                    lastName: user.lastName
                },
                sessionToken
            };
        }
        catch (error) {
            console.error('Authentication error:', error);
            return { success: false, error: 'Authentication failed' };
        }
    }
    // Check account lockout status
    async checkLockout(username, ipAddress) {
        const recentAttempts = await db
            .select()
            .from(loginAttempts)
            .where(and(eq(loginAttempts.username, username), eq(loginAttempts.ipAddress, ipAddress), gt(loginAttempts.attemptTime, new Date(Date.now() - LOCKOUT_DURATION))));
        if (recentAttempts.length >= MAX_LOGIN_ATTEMPTS) {
            const oldestAttempt = recentAttempts[0].attemptTime;
            const lockoutEnd = new Date(oldestAttempt.getTime() + LOCKOUT_DURATION);
            const remainingMs = lockoutEnd.getTime() - Date.now();
            const remainingMinutes = Math.ceil(remainingMs / 60000);
            return { locked: true, remainingMinutes };
        }
        return { locked: false };
    }
    // Record failed login attempt
    async recordFailedAttempt(username, ipAddress, userAgent) {
        await db.insert(loginAttempts).values({
            username,
            ipAddress,
            userAgent,
            attemptTime: new Date(),
            success: false
        });
        await auditLog('', 'login_failed', 'auth', { username }, ipAddress, userAgent);
    }
    // Clear failed attempts after successful login
    async clearFailedAttempts(username, ipAddress) {
        await db
            .delete(loginAttempts)
            .where(and(eq(loginAttempts.username, username), eq(loginAttempts.ipAddress, ipAddress)));
    }
    // Create secure session with encryption
    async createSecureSession(userId, ipAddress, userAgent) {
        const sessionId = crypto.randomBytes(32).toString('hex');
        const hashedSessionId = crypto.createHash('sha256').update(sessionId).digest('hex');
        await db.insert(securitySessions).values({
            id: hashedSessionId,
            userId,
            ipAddress,
            userAgent,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + SESSION_DURATION),
            lastActivity: new Date(),
            isActive: true
        });
        return sessionId; // Return unhashed version for cookie
    }
    // Validate session with security checks
    async validateSession(sessionToken, ipAddress, userAgent) {
        const hashedSessionId = crypto.createHash('sha256').update(sessionToken).digest('hex');
        const [session] = await db
            .select()
            .from(securitySessions)
            .where(and(eq(securitySessions.id, hashedSessionId), eq(securitySessions.isActive, true)))
            .limit(1);
        if (!session) {
            return { valid: false, reason: 'Invalid session' };
        }
        // Check session expiry
        if (session.expiresAt < new Date()) {
            await this.invalidateSession(hashedSessionId);
            return { valid: false, reason: 'Session expired' };
        }
        // Check idle timeout
        const idleTime = Date.now() - session.lastActivity.getTime();
        if (idleTime > SESSION_IDLE_TIMEOUT) {
            await this.invalidateSession(hashedSessionId);
            return { valid: false, reason: 'Session idle timeout' };
        }
        // Verify IP and user agent for session fixation protection
        if (session.ipAddress !== ipAddress) {
            await auditLog(session.userId, 'session_ip_mismatch', 'auth', {
                originalIp: session.ipAddress,
                currentIp: ipAddress
            }, ipAddress, userAgent);
            await this.invalidateSession(hashedSessionId);
            return { valid: false, reason: 'Session security violation' };
        }
        // Update last activity
        await db
            .update(securitySessions)
            .set({ lastActivity: new Date() })
            .where(eq(securitySessions.id, hashedSessionId));
        // Get user data
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, session.userId))
            .limit(1);
        if (!user || !user.isActive) {
            await this.invalidateSession(hashedSessionId);
            return { valid: false, reason: 'User not active' };
        }
        return {
            valid: true,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName
            }
        };
    }
    // Invalidate session
    async invalidateSession(sessionId) {
        await db
            .update(securitySessions)
            .set({ isActive: false })
            .where(eq(securitySessions.id, sessionId));
    }
    // Logout with session cleanup
    async logout(sessionToken, ipAddress, userAgent) {
        const hashedSessionId = crypto.createHash('sha256').update(sessionToken).digest('hex');
        const [session] = await db
            .select()
            .from(securitySessions)
            .where(eq(securitySessions.id, hashedSessionId))
            .limit(1);
        if (session) {
            await this.invalidateSession(hashedSessionId);
            await auditLog(session.userId, 'logout', 'auth', {}, ipAddress, userAgent);
        }
    }
}
// Secure authentication middleware
export const secureAuth = new SecureAuthService();
export const requireSecureAuth = async (req, res, next) => {
    const sessionToken = req.cookies?.sessionId;
    if (!sessionToken) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    const ipAddress = req.ip || req.connection.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    const session = await secureAuth.validateSession(sessionToken, ipAddress, userAgent);
    if (!session.valid) {
        res.clearCookie('sessionId');
        return res.status(401).json({ error: session.reason || 'Authentication required' });
    }
    req.user = session.user;
    next();
};
// Role-based access control
export const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};
