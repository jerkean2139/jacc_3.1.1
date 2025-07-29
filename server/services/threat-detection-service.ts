import { auditLogger, AuditEventType } from '../utils/audit-logger';
import { db } from '../db';
import { auditLogs, users } from '../../shared/schema';
import { sql, desc, and, gte, eq, count } from 'drizzle-orm';

export interface ThreatAlert {
  id: string;
  type: 'BRUTE_FORCE' | 'SUSPICIOUS_ACTIVITY' | 'ANOMALOUS_BEHAVIOR' | 'RATE_LIMIT_EXCEEDED' | 'UNUSUAL_ACCESS_PATTERN';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  userId?: string;
  ipAddress: string;
  timestamp: Date;
  details: any;
  status: 'ACTIVE' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';
}

export interface UserBehaviorProfile {
  userId: string;
  avgSessionDuration: number;
  commonAccessHours: number[];
  commonIpAddresses: string[];
  typicalUserAgent: string;
  avgActionsPerSession: number;
  lastUpdated: Date;
}

class ThreatDetectionService {
  private threatAlerts: Map<string, ThreatAlert> = new Map();
  private userProfiles: Map<string, UserBehaviorProfile> = new Map();
  private suspiciousIps: Set<string> = new Set();
  private rateLimitTracking: Map<string, { count: number; firstRequest: number }> = new Map();

  // Brute force detection
  async detectBruteForce(ipAddress: string, userId?: string): Promise<ThreatAlert | null> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      // Check failed login attempts from this IP in the last hour
      const [failedAttempts] = await db
        .select({ count: count() })
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.eventType, AuditEventType.AUTH_FAILURE),
            eq(auditLogs.ipAddress, ipAddress),
            gte(auditLogs.timestamp, oneHourAgo)
          )
        );

      if (failedAttempts.count >= 10) {
        const alert: ThreatAlert = {
          id: `brute-force-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'BRUTE_FORCE',
          severity: failedAttempts.count >= 20 ? 'CRITICAL' : 'HIGH',
          description: `${failedAttempts.count} failed login attempts detected from IP ${ipAddress} in the last hour`,
          userId,
          ipAddress,
          timestamp: new Date(),
          details: { failedAttempts: failedAttempts.count, timeWindow: '1 hour' },
          status: 'ACTIVE'
        };

        this.threatAlerts.set(alert.id, alert);
        this.suspiciousIps.add(ipAddress);

        // Log the threat detection
        await auditLogger.log({
          eventType: AuditEventType.SECURITY_VIOLATION,
          userId: userId || null,
          userEmail: null,
          ipAddress,
          userAgent: null,
          resourceId: 'threat-detection',
          resourceType: 'security',
          action: 'brute_force_detected',
          details: alert.details,
          success: true,
          errorMessage: null
        });

        return alert;
      }

      return null;
    } catch (error) {
      console.error('Error in brute force detection:', error);
      return null;
    }
  }

  // Rate limiting detection
  async detectRateLimitViolation(ipAddress: string, endpoint: string): Promise<ThreatAlert | null> {
    const key = `${ipAddress}:${endpoint}`;
    const now = Date.now();
    const windowMs = 5 * 60 * 1000; // 5 minutes
    const maxRequests = 100;

    const existing = this.rateLimitTracking.get(key);
    
    if (!existing) {
      this.rateLimitTracking.set(key, { count: 1, firstRequest: now });
      return null;
    }

    if (now - existing.firstRequest > windowMs) {
      // Reset window
      this.rateLimitTracking.set(key, { count: 1, firstRequest: now });
      return null;
    }

    existing.count++;

    if (existing.count > maxRequests) {
      const alert: ThreatAlert = {
        id: `rate-limit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'RATE_LIMIT_EXCEEDED',
        severity: existing.count > maxRequests * 2 ? 'HIGH' : 'MEDIUM',
        description: `Rate limit exceeded: ${existing.count} requests from ${ipAddress} to ${endpoint} in 5 minutes`,
        ipAddress,
        timestamp: new Date(),
        details: { requestCount: existing.count, endpoint, timeWindow: '5 minutes' },
        status: 'ACTIVE'
      };

      this.threatAlerts.set(alert.id, alert);

      await auditLogger.log({
        eventType: AuditEventType.SECURITY_VIOLATION,
        userId: null,
        userEmail: null,
        ipAddress,
        userAgent: null,
        resourceId: endpoint,
        resourceType: 'endpoint',
        action: 'rate_limit_exceeded',
        details: alert.details,
        success: true,
        errorMessage: null
      });

      return alert;
    }

    return null;
  }

  // Anomalous behavior detection
  async detectAnomalousBehavior(userId: string, currentActivity: any): Promise<ThreatAlert | null> {
    try {
      const profile = await this.getUserBehaviorProfile(userId);
      if (!profile) return null;

      const anomalies: string[] = [];

      // Check for unusual access hours
      const currentHour = new Date().getHours();
      if (!profile.commonAccessHours.includes(currentHour)) {
        anomalies.push(`Access at unusual hour: ${currentHour}`);
      }

      // Check for new IP address
      if (!profile.commonIpAddresses.includes(currentActivity.ipAddress)) {
        anomalies.push(`Access from new IP address: ${currentActivity.ipAddress}`);
      }

      // Check for different user agent
      if (profile.typicalUserAgent && currentActivity.userAgent !== profile.typicalUserAgent) {
        anomalies.push('Different user agent detected');
      }

      if (anomalies.length >= 2) {
        const alert: ThreatAlert = {
          id: `anomaly-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'ANOMALOUS_BEHAVIOR',
          severity: anomalies.length >= 3 ? 'HIGH' : 'MEDIUM',
          description: `Anomalous behavior detected for user ${userId}`,
          userId,
          ipAddress: currentActivity.ipAddress,
          timestamp: new Date(),
          details: { anomalies, userProfile: profile },
          status: 'ACTIVE'
        };

        this.threatAlerts.set(alert.id, alert);

        await auditLogger.log({
          eventType: AuditEventType.SECURITY_VIOLATION,
          userId,
          userEmail: null,
          ipAddress: currentActivity.ipAddress,
          userAgent: currentActivity.userAgent,
          resourceId: 'behavior-analysis',
          resourceType: 'security',
          action: 'anomalous_behavior_detected',
          details: alert.details,
          success: true,
          errorMessage: null
        });

        return alert;
      }

      return null;
    } catch (error) {
      console.error('Error in anomalous behavior detection:', error);
      return null;
    }
  }

  // Build user behavior profiles
  async getUserBehaviorProfile(userId: string): Promise<UserBehaviorProfile | null> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Get user activity from audit logs
      const activities = await db
        .select()
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.userId, userId),
            gte(auditLogs.timestamp, thirtyDaysAgo)
          )
        )
        .orderBy(desc(auditLogs.timestamp));

      if (activities.length === 0) return null;

      // Analyze patterns
      const accessHours = new Map<number, number>();
      const ipAddresses = new Map<string, number>();
      let userAgent = '';
      let totalActions = activities.length;

      activities.forEach(activity => {
        const hour = new Date(activity.timestamp).getHours();
        accessHours.set(hour, (accessHours.get(hour) || 0) + 1);
        
        if (activity.ipAddress) {
          ipAddresses.set(activity.ipAddress, (ipAddresses.get(activity.ipAddress) || 0) + 1);
        }
        
        if (activity.userAgent && !userAgent) {
          userAgent = activity.userAgent;
        }
      });

      // Get most common hours (top 8 hours with activity)
      const commonHours = Array.from(accessHours.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([hour]) => hour);

      // Get most common IPs (top 3)
      const commonIps = Array.from(ipAddresses.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([ip]) => ip);

      const profile: UserBehaviorProfile = {
        userId,
        avgSessionDuration: 30, // Placeholder - would need session tracking
        commonAccessHours: commonHours,
        commonIpAddresses: commonIps,
        typicalUserAgent: userAgent,
        avgActionsPerSession: Math.round(totalActions / Math.max(1, activities.length / 10)),
        lastUpdated: new Date()
      };

      this.userProfiles.set(userId, profile);
      return profile;
    } catch (error) {
      console.error('Error building user behavior profile:', error);
      return null;
    }
  }

  // Get all active threats
  getActiveThreats(): ThreatAlert[] {
    return Array.from(this.threatAlerts.values())
      .filter(alert => alert.status === 'ACTIVE')
      .sort((a, b) => {
        const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
  }

  // Update threat status
  async updateThreatStatus(threatId: string, status: ThreatAlert['status'], notes?: string): Promise<boolean> {
    const threat = this.threatAlerts.get(threatId);
    if (!threat) return false;

    threat.status = status;

    await auditLogger.log({
      eventType: AuditEventType.SECURITY_VIOLATION,
      userId: threat.userId || null,
      userEmail: null,
      ipAddress: threat.ipAddress,
      userAgent: null,
      resourceId: threatId,
      resourceType: 'threat',
      action: 'threat_status_updated',
      details: { oldStatus: threat.status, newStatus: status, notes },
      success: true,
      errorMessage: null
    });

    return true;
  }

  // Check if IP is suspicious
  isSuspiciousIp(ipAddress: string): boolean {
    return this.suspiciousIps.has(ipAddress);
  }

  // Get threat statistics
  getThreatStatistics(): any {
    const threats = Array.from(this.threatAlerts.values());
    const last24Hours = threats.filter(t => 
      Date.now() - t.timestamp.getTime() < 24 * 60 * 60 * 1000
    );

    return {
      totalThreats: threats.length,
      activeThreats: threats.filter(t => t.status === 'ACTIVE').length,
      last24Hours: last24Hours.length,
      criticalThreats: threats.filter(t => t.severity === 'CRITICAL').length,
      byType: {
        bruteForce: threats.filter(t => t.type === 'BRUTE_FORCE').length,
        rateLimitExceeded: threats.filter(t => t.type === 'RATE_LIMIT_EXCEEDED').length,
        anomalousBehavior: threats.filter(t => t.type === 'ANOMALOUS_BEHAVIOR').length,
        suspiciousActivity: threats.filter(t => t.type === 'SUSPICIOUS_ACTIVITY').length
      }
    };
  }

  // Cleanup old rate limit tracking
  cleanupRateLimitTracking(): void {
    const now = Date.now();
    const windowMs = 5 * 60 * 1000;

    for (const [key, data] of Array.from(this.rateLimitTracking.entries())) {
      if (now - data.firstRequest > windowMs) {
        this.rateLimitTracking.delete(key);
      }
    }
  }
}

export const threatDetectionService = new ThreatDetectionService();

// Cleanup interval for rate limiting
setInterval(() => {
  threatDetectionService.cleanupRateLimitTracking();
}, 5 * 60 * 1000); // Every 5 minutes