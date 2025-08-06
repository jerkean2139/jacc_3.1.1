import { db } from '../db';
import { auditLogs } from '@shared/schema';
import { z } from 'zod';
import { desc, and, gte, lte, eq } from 'drizzle-orm';
// Audit event types
export var AuditEventType;
(function (AuditEventType) {
    // Authentication events
    AuditEventType["USER_LOGIN"] = "USER_LOGIN";
    AuditEventType["USER_LOGOUT"] = "USER_LOGOUT";
    AuditEventType["LOGIN_FAILED"] = "LOGIN_FAILED";
    AuditEventType["SESSION_EXPIRED"] = "SESSION_EXPIRED";
    AuditEventType["USER_REGISTRATION"] = "USER_REGISTRATION";
    AuditEventType["AUTH_ATTEMPT"] = "AUTH_ATTEMPT";
    AuditEventType["AUTH_SUCCESS"] = "AUTH_SUCCESS";
    AuditEventType["AUTH_FAILURE"] = "AUTH_FAILURE";
    // Document events
    AuditEventType["DOCUMENT_VIEW"] = "DOCUMENT_VIEW";
    AuditEventType["DOCUMENT_DOWNLOAD"] = "DOCUMENT_DOWNLOAD";
    AuditEventType["DOCUMENT_UPLOAD"] = "DOCUMENT_UPLOAD";
    AuditEventType["DOCUMENT_DELETE"] = "DOCUMENT_DELETE";
    AuditEventType["DOCUMENT_EDIT"] = "DOCUMENT_EDIT";
    AuditEventType["DOCUMENT_SEARCH"] = "DOCUMENT_SEARCH";
    // Admin events
    AuditEventType["ADMIN_SETTINGS_CHANGE"] = "ADMIN_SETTINGS_CHANGE";
    AuditEventType["USER_ROLE_CHANGE"] = "USER_ROLE_CHANGE";
    AuditEventType["API_KEY_ACCESS"] = "API_KEY_ACCESS";
    AuditEventType["DATABASE_EXPORT"] = "DATABASE_EXPORT";
    AuditEventType["SETTINGS_CHANGE"] = "SETTINGS_CHANGE";
    AuditEventType["DATA_ACCESS"] = "DATA_ACCESS";
    // User Management events
    AuditEventType["USER_CREATED"] = "USER_CREATED";
    AuditEventType["USER_UPDATED"] = "USER_UPDATED";
    AuditEventType["USER_DELETED"] = "USER_DELETED";
    AuditEventType["USER_ACTIVATED"] = "USER_ACTIVATED";
    AuditEventType["USER_DEACTIVATED"] = "USER_DEACTIVATED";
    // AI events
    AuditEventType["AI_QUERY"] = "AI_QUERY";
    AuditEventType["AI_TRAINING_CORRECTION"] = "AI_TRAINING_CORRECTION";
    AuditEventType["VECTOR_SEARCH"] = "VECTOR_SEARCH";
    // Security events
    AuditEventType["SUSPICIOUS_ACTIVITY"] = "SUSPICIOUS_ACTIVITY";
    AuditEventType["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    AuditEventType["INVALID_INPUT_BLOCKED"] = "INVALID_INPUT_BLOCKED";
    AuditEventType["SECURITY_VIOLATION"] = "SECURITY_VIOLATION";
    AuditEventType["COMPLIANCE_REPORT"] = "COMPLIANCE_REPORT";
    AuditEventType["THREAT_DETECTED"] = "THREAT_DETECTED";
    AuditEventType["ANOMALY_DETECTED"] = "ANOMALY_DETECTED";
    AuditEventType["UNAUTHORIZED_ACCESS"] = "UNAUTHORIZED_ACCESS";
})(AuditEventType || (AuditEventType = {}));
// Audit log schema
const auditLogSchema = z.object({
    id: z.string().uuid().optional(),
    eventType: z.nativeEnum(AuditEventType),
    userId: z.string().nullable(),
    userEmail: z.string().nullable(),
    ipAddress: z.string(),
    userAgent: z.string().optional(),
    resourceId: z.string().nullable(),
    resourceType: z.string().nullable(),
    action: z.string(),
    details: z.record(z.any()).optional(),
    success: z.boolean(),
    errorMessage: z.string().nullable(),
    status: z.string().optional(),
    timestamp: z.date().optional()
});
class AuditLogger {
    async log(event) {
        try {
            // Save to database for persistent storage
            await db.insert(auditLogs).values({
                eventType: event.eventType,
                userId: event.userId,
                userEmail: event.userEmail,
                ipAddress: event.ipAddress,
                userAgent: event.userAgent,
                resourceId: event.resourceId,
                resourceType: event.resourceType,
                action: event.action,
                details: event.details,
                success: event.success,
                errorMessage: event.errorMessage,
                status: event.status
            });
            const auditEntry = {
                ...event,
                id: crypto.randomUUID(),
                timestamp: new Date(),
                details: event.details || {}
            };
            // Also log to console for immediate visibility
            console.log(`🔒 AUDIT LOG: ${event.eventType}`, {
                userId: event.userId,
                userEmail: event.userEmail,
                ipAddress: event.ipAddress,
                action: event.action,
                success: event.success,
                timestamp: auditEntry.timestamp.toISOString()
            });
            // Log critical security events to console as well
            if (this.isCriticalEvent(event.eventType)) {
                console.warn(`🚨 SECURITY AUDIT: ${event.eventType}`, {
                    userId: event.userId,
                    ipAddress: event.ipAddress,
                    action: event.action,
                    success: event.success
                });
                // Trigger real-time alert for critical events
                await this.triggerSecurityAlert(event);
            }
        }
        catch (error) {
            // Don't throw errors from audit logging to prevent disrupting main app flow
            console.error('Failed to write audit log:', error);
        }
    }
    isCriticalEvent(eventType) {
        return [
            AuditEventType.LOGIN_FAILED,
            AuditEventType.SUSPICIOUS_ACTIVITY,
            AuditEventType.RATE_LIMIT_EXCEEDED,
            AuditEventType.API_KEY_ACCESS,
            AuditEventType.DATABASE_EXPORT,
            AuditEventType.USER_ROLE_CHANGE
        ].includes(eventType);
    }
    // Helper methods for common audit scenarios
    async logDocumentAccess(userId, userEmail, documentId, documentName, action, ipAddress, userAgent) {
        await this.log({
            eventType: action === 'view' ? AuditEventType.DOCUMENT_VIEW : AuditEventType.DOCUMENT_DOWNLOAD,
            userId,
            userEmail,
            ipAddress,
            userAgent,
            resourceId: documentId,
            resourceType: 'document',
            action: `${action}_document`,
            details: { documentName },
            success: true,
            errorMessage: null
        });
    }
    // Real-time security alert system
    async triggerSecurityAlert(event) {
        try {
            // Log to a special security events table or external monitoring service
            console.error(`🚨 SECURITY ALERT: ${event.eventType}`, {
                timestamp: new Date().toISOString(),
                userId: event.userId,
                ipAddress: event.ipAddress,
                details: event.details
            });
            // In production, this would integrate with:
            // - PagerDuty or similar alerting service
            // - Security information and event management (SIEM) systems
            // - Slack/Teams notifications for security team
        }
        catch (error) {
            console.error('Failed to trigger security alert:', error);
        }
    }
    // Query methods for audit log analysis
    async getAuditLogs(options = {}) {
        try {
            const { startDate, endDate, eventType, userId, ipAddress, limit = 100, offset = 0 } = options;
            let query = db.select().from(auditLogs);
            // Apply filters
            const conditions = [];
            if (startDate)
                conditions.push(gte(auditLogs.timestamp, startDate));
            if (endDate)
                conditions.push(lte(auditLogs.timestamp, endDate));
            if (eventType)
                conditions.push(eq(auditLogs.eventType, eventType));
            if (userId)
                conditions.push(eq(auditLogs.userId, userId));
            if (ipAddress)
                conditions.push(eq(auditLogs.ipAddress, ipAddress));
            if (conditions.length > 0) {
                query = query.where(and(...conditions));
            }
            const results = await query
                .orderBy(desc(auditLogs.timestamp))
                .limit(limit)
                .offset(offset);
            return results;
        }
        catch (error) {
            console.error('Failed to query audit logs:', error);
            return [];
        }
    }
    async getSecurityEvents(hours = 24) {
        const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
        return this.getAuditLogs({
            startDate,
            eventType: AuditEventType.SUSPICIOUS_ACTIVITY
        });
    }
    async getFailedLogins(hours = 24) {
        const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
        return this.getAuditLogs({
            startDate,
            eventType: AuditEventType.LOGIN_FAILED
        });
    }
    async getUserActivity(userId, hours = 24) {
        const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
        return this.getAuditLogs({
            startDate,
            userId
        });
    }
    async getAuditLogStats() {
        try {
            // In a real implementation, these would be optimized database queries
            const allLogs = await this.getAuditLogs({ limit: 10000 });
            const stats = {
                totalEvents: allLogs.length,
                securityEvents: allLogs.filter(log => this.isCriticalEvent(log.eventType)).length,
                failedLogins: allLogs.filter(log => log.eventType === AuditEventType.LOGIN_FAILED).length,
                uniqueUsers: new Set(allLogs.map(log => log.userId).filter(Boolean)).size,
                uniqueIPs: new Set(allLogs.map(log => log.ipAddress)).size
            };
            return stats;
        }
        catch (error) {
            console.error('Failed to get audit log stats:', error);
            return {
                totalEvents: 0,
                securityEvents: 0,
                failedLogins: 0,
                uniqueUsers: 0,
                uniqueIPs: 0
            };
        }
    }
    async logAuthEvent(eventType, email, ipAddress, success, userAgent, errorMessage) {
        await this.log({
            eventType,
            userId: null,
            userEmail: email,
            ipAddress,
            userAgent,
            resourceId: null,
            resourceType: null,
            action: eventType.toLowerCase(),
            details: { timestamp: new Date().toISOString() },
            success,
            errorMessage: errorMessage || null
        });
    }
    async logAIQuery(userId, userEmail, query, responseTime, documentCount, ipAddress) {
        await this.log({
            eventType: AuditEventType.AI_QUERY,
            userId,
            userEmail,
            ipAddress,
            resourceId: null,
            resourceType: 'ai_query',
            action: 'ai_query',
            details: {
                queryLength: query.length,
                responseTime,
                documentCount,
                timestamp: new Date().toISOString()
            },
            success: true,
            errorMessage: null
        });
    }
}
export const auditLogger = new AuditLogger();
