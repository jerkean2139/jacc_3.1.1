import { Request, Response } from 'express';

interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  timestamp: number;
  endpoint: string;
  method: string;
}

class PerformanceService {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 1000; // Keep last 1000 requests

  // Middleware to track performance
  trackPerformance() {
    return (req: Request, res: Response, next: any) => {
      const startTime = process.hrtime.bigint();
      
      res.on('finish', () => {
        const endTime = process.hrtime.bigint();
        const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        
        const metric: PerformanceMetrics = {
          responseTime,
          memoryUsage: process.memoryUsage(),
          timestamp: Date.now(),
          endpoint: req.path,
          method: req.method
        };

        this.addMetric(metric);
      });

      next();
    };
  }

  private addMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getAverageResponseTime(minutes: number = 5): number {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);
    
    if (recentMetrics.length === 0) return 0;
    
    const total = recentMetrics.reduce((sum, metric) => sum + metric.responseTime, 0);
    return Math.round(total / recentMetrics.length);
  }

  getSlowEndpoints(threshold: number = 1000): Array<{endpoint: string, avgTime: number, count: number}> {
    const endpointStats = new Map<string, {total: number, count: number}>();
    
    this.metrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      const existing = endpointStats.get(key) || {total: 0, count: 0};
      endpointStats.set(key, {
        total: existing.total + metric.responseTime,
        count: existing.count + 1
      });
    });

    return Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        avgTime: Math.round(stats.total / stats.count),
        count: stats.count
      }))
      .filter(stat => stat.avgTime > threshold)
      .sort((a, b) => b.avgTime - a.avgTime);
  }

  getCurrentMemoryUsage(): {
    used: number;
    free: number;
    percentage: number;
  } {
    const usage = process.memoryUsage();
    const totalHeap = usage.heapTotal;
    const usedHeap = usage.heapUsed;
    const freeHeap = totalHeap - usedHeap;
    
    return {
      used: Math.round(usedHeap / 1024 / 1024), // MB
      free: Math.round(freeHeap / 1024 / 1024), // MB
      percentage: Math.round((usedHeap / totalHeap) * 100)
    };
  }

  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    avgResponseTime: number;
    memoryUsage: number;
    slowEndpoints: number;
  } {
    const avgResponse = this.getAverageResponseTime();
    const memory = this.getCurrentMemoryUsage();
    const slowEndpoints = this.getSlowEndpoints(500).length;

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (avgResponse > 2000 || memory.percentage > 85 || slowEndpoints > 5) {
      status = 'critical';
    } else if (avgResponse > 1000 || memory.percentage > 70 || slowEndpoints > 2) {
      status = 'warning';
    }

    return {
      status,
      avgResponseTime: avgResponse,
      memoryUsage: memory.percentage,
      slowEndpoints
    };
  }

  // Cache for frequently accessed data
  private cache = new Map<string, {data: any, expiry: number}>();
  
  setCache(key: string, data: any, ttlMinutes: number = 5): void {
    const expiry = Date.now() + (ttlMinutes * 60 * 1000);
    this.cache.set(key, {data, expiry});
  }

  getCache(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  clearExpiredCache(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    for (const [key, item] of entries) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

export const performanceService = new PerformanceService();