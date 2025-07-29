import { db } from '../db';
import { auditLogs } from '@shared/schema';
import { z } from 'zod';
import { desc, and, gte, lte, eq } from 'drizzle-orm';

// Audit event types
export enum AuditEventType {
  // Authentication events
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  USER_REGISTRATION = 'USER_REGISTRATION',
  AUTH_ATTEMPT = 'AUTH_ATTEMPT',
  AUTH_SUCCESS = 'AUTH_SUCCESS',
  AUTH_FAILURE = 'AUTH_FAILURE',
  
  // Document events
  DOCUMENT_VIEW = 'DOCUMENT_VIEW',
  DOCUMENT_DOWNLOAD = 'DOCUMENT_DOWNLOAD',
  DOCUMENT_UPLOAD = 'DOCUMENT_UPLOAD',
  DOCUMENT_DELETE = 'DOCUMENT_DELETE',
  DOCUMENT_EDIT = 'DOCUMENT_EDIT',
  DOCUMENT_SEARCH = 'DOCUMENT_SEARCH',
  
  // Admin events
  ADMIN_SETTINGS_CHANGE = 'ADMIN_SETTINGS_CHANGE',
  USER_ROLE_CHANGE = 'USER_ROLE_CHANGE',
  API_KEY_ACCESS = 'API_KEY_ACCESS',
  DATABASE_EXPORT = 'DATABASE_EXPORT',
  SETTINGS_CHANGE = 'SETTINGS_CHANGE',
  DATA_ACCESS = 'DATA_ACCESS',
  
  // User Management events
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_ACTIVATED = 'USER_ACTIVATED',
  USER_DEACTIVATED = 'USER_DEACTIVATED',
  
  // AI events
  AI_QUERY = 'AI_QUERY',
  AI_TRAINING_CORRECTION = 'AI_TRAINING_CORRECTION',
  VECTOR_SEARCH = 'VECTOR_SEARCH',
  
  // Security events
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_INPUT_BLOCKED = 'INVALID_INPUT_BLOCKED',
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
  COMPLIANCE_REPORT = 'COMPLIANCE_REPORT',
  THREAT_DETECTED = 'THREAT_DETECTED',
  ANOMALY_DETECTED = 'ANOMALY_DETECTED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS'
}

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

export type AuditLog = z.infer<typeof auditLogSchema>;

class AuditLogger {
  async log(event: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
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
      
    } catch (error) {
      // Don't throw errors from audit logging to prevent disrupting main app flow
      console.error('Failed to write audit log:', error);
    }
  }
  
  private isCriticalEvent(eventType: AuditEventType): boolean {
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
  async logDocumentAccess(
    userId: string,
    userEmail: string,
    documentId: string,
    documentName: string,
    action: 'view' | 'download',
    ipAddress: string,
    userAgent?: string
  ): Promise<void> {
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
  private async triggerSecurityAlert(event: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
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
      
    } catch (error) {
      console.error('Failed to trigger security alert:', error);
    }
  }

  // Query methods for audit log analysis
  async getAuditLogs(options: {
    startDate?: Date;
    endDate?: Date;
    eventType?: AuditEventType;
    userId?: string;
    ipAddress?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<any[]> {
    try {
      const {
        startDate,
        endDate,
        eventType,
        userId,
        ipAddress,
        limit = 100,
        offset = 0
      } = options;

      let query = db.select().from(auditLogs);

      // Apply filters
      const conditions = [];
      if (startDate) conditions.push(gte(auditLogs.timestamp, startDate));
      if (endDate) conditions.push(lte(auditLogs.timestamp, endDate));
      if (eventType) conditions.push(eq(auditLogs.eventType, eventType));
      if (userId) conditions.push(eq(auditLogs.userId, userId));
      if (ipAddress) conditions.push(eq(auditLogs.ipAddress, ipAddress));

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const results = await query
        .orderBy(desc(auditLogs.timestamp))
        .limit(limit)
        .offset(offset);

      return results;
    } catch (error) {
      console.error('Failed to query audit logs:', error);
      return [];
    }
  }

  async getSecurityEvents(hours: number = 24): Promise<any[]> {
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.getAuditLogs({
      startDate,
      eventType: AuditEventType.SUSPICIOUS_ACTIVITY
    });
  }

  async getFailedLogins(hours: number = 24): Promise<any[]> {
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.getAuditLogs({
      startDate,
      eventType: AuditEventType.LOGIN_FAILED
    });
  }

  async getUserActivity(userId: string, hours: number = 24): Promise<any[]> {
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.getAuditLogs({
      startDate,
      userId
    });
  }

  async getAuditLogStats(): Promise<{
    totalEvents: number;
    securityEvents: number;
    failedLogins: number;
    uniqueUsers: number;
    uniqueIPs: number;
  }> {
    try {
      // In a real implementation, these would be optimized database queries
      const allLogs = await this.getAuditLogs({ limit: 10000 });
      
      const stats = {
        totalEvents: allLogs.length,
        securityEvents: allLogs.filter(log => this.isCriticalEvent(log.eventType as AuditEventType)).length,
        failedLogins: allLogs.filter(log => log.eventType === AuditEventType.LOGIN_FAILED).length,
        uniqueUsers: new Set(allLogs.map(log => log.userId).filter(Boolean)).size,
        uniqueIPs: new Set(allLogs.map(log => log.ipAddress)).size
      };

      return stats;
    } catch (error) {
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

  async logAuthEvent(
    eventType: AuditEventType.USER_LOGIN | AuditEventType.USER_LOGOUT | AuditEventType.LOGIN_FAILED,
    email: string | null,
    ipAddress: string,
    success: boolean,
    userAgent?: string,
    errorMessage?: string
  ): Promise<void> {
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
  
  async logAIQuery(
    userId: string,
    userEmail: string,
    query: string,
    responseTime: number,
    documentCount: number,
    ipAddress: string
  ): Promise<void> {
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