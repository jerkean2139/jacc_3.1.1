import { db } from '../db';
import { apiUsageLogs, monthlyUsageSummary, type InsertApiUsageLog, type InsertMonthlyUsageSummary } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';

// Current LLM pricing (updated as of January 2025)
export const LLM_PRICING = {
  // Anthropic Claude pricing per 1M tokens
  anthropic: {
    'claude-3.5-sonnet': {
      input: 3.00,   // $3.00 per 1M input tokens
      output: 15.00  // $15.00 per 1M output tokens
    },
    'claude-3-opus': {
      input: 15.00,
      output: 75.00
    },
    'claude-3-haiku': {
      input: 0.25,
      output: 1.25
    }
  },
  // OpenAI pricing per 1M tokens
  openai: {
    'gpt-4o': {
      input: 5.00,   // $5.00 per 1M input tokens
      output: 15.00  // $15.00 per 1M output tokens
    },
    'gpt-4-turbo': {
      input: 10.00,
      output: 30.00
    },
    'gpt-3.5-turbo': {
      input: 0.50,
      output: 1.50
    },
    'text-embedding-3-small': {
      input: 0.02,
      output: 0.02
    },
    'text-embedding-3-large': {
      input: 0.13,
      output: 0.13
    },
    'text-embedding-ada-002': {
      input: 0.10,
      output: 0.10
    }
  },
  // Pinecone pricing (estimated per 1K queries)
  pinecone: {
    'query': {
      input: 0.40,   // $0.40 per 1K queries
      output: 0.40
    },
    'upsert': {
      input: 0.40,
      output: 0.40
    }
  }
} as const;

export interface ApiUsageMetrics {
  provider: string;
  model: string;
  operation: string;
  inputTokens?: number;
  outputTokens?: number;
  requestCount?: number;
  responseTime?: number;
  success?: boolean;
  errorMessage?: string;
  requestData?: Record<string, any>;
}

export class ApiCostTracker {
  /**
   * Calculate estimated cost based on usage metrics
   */
  private calculateCost(metrics: ApiUsageMetrics): number {
    const { provider, model, inputTokens = 0, outputTokens = 0, requestCount = 1 } = metrics;
    
    let cost = 0;
    
    if (provider === 'anthropic' && LLM_PRICING.anthropic[model as keyof typeof LLM_PRICING.anthropic]) {
      const pricing = LLM_PRICING.anthropic[model as keyof typeof LLM_PRICING.anthropic];
      cost = (inputTokens * pricing.input / 1_000_000) + (outputTokens * pricing.output / 1_000_000);
    } else if (provider === 'openai' && LLM_PRICING.openai[model as keyof typeof LLM_PRICING.openai]) {
      const pricing = LLM_PRICING.openai[model as keyof typeof LLM_PRICING.openai];
      cost = (inputTokens * pricing.input / 1_000_000) + (outputTokens * pricing.output / 1_000_000);
    } else if (provider === 'pinecone' && LLM_PRICING.pinecone[model as keyof typeof LLM_PRICING.pinecone]) {
      const pricing = LLM_PRICING.pinecone[model as keyof typeof LLM_PRICING.pinecone];
      cost = requestCount * pricing.input / 1_000; // Per 1K queries
    }
    
    return Math.round(cost * 1_000_000) / 1_000_000; // Round to 6 decimal places
  }

  /**
   * Log API usage and calculate costs
   */
  async logUsage(userId: string | null, metrics: ApiUsageMetrics): Promise<void> {
    try {
      const startTime = Date.now();
      const estimatedCost = this.calculateCost(metrics);
      const totalTokens = (metrics.inputTokens || 0) + (metrics.outputTokens || 0);

      const usageLog: InsertApiUsageLog = {
        userId,
        provider: metrics.provider,
        model: metrics.model,
        operation: metrics.operation,
        inputTokens: metrics.inputTokens || null,
        outputTokens: metrics.outputTokens || null,
        totalTokens: totalTokens || null,
        requestCount: metrics.requestCount || 1,
        estimatedCost: estimatedCost.toString(),
        requestData: metrics.requestData || null,
        responseTime: metrics.responseTime || (Date.now() - startTime),
        success: metrics.success !== false,
        errorMessage: metrics.errorMessage || null,
      };

      await db.insert(apiUsageLogs).values(usageLog);

      // Update monthly summary
      if (userId) {
        await this.updateMonthlySummary(userId, metrics, estimatedCost, totalTokens);
      }
    } catch (error) {
      console.error('Failed to log API usage:', error);
      // Don't throw error to avoid breaking main functionality
    }
  }

  /**
   * Update monthly usage summary
   */
  private async updateMonthlySummary(
    userId: string, 
    metrics: ApiUsageMetrics, 
    cost: number,
    totalTokens: number
  ): Promise<void> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // JavaScript months are 0-indexed

    try {
      // Check if record exists
      const existing = await db
        .select()
        .from(monthlyUsageSummary)
        .where(
          and(
            eq(monthlyUsageSummary.userId, userId),
            eq(monthlyUsageSummary.year, year),
            eq(monthlyUsageSummary.month, month),
            eq(monthlyUsageSummary.provider, metrics.provider),
            eq(monthlyUsageSummary.model, metrics.model)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing record
        await db
          .update(monthlyUsageSummary)
          .set({
            totalRequests: sql`${monthlyUsageSummary.totalRequests} + ${metrics.requestCount || 1}`,
            totalInputTokens: sql`${monthlyUsageSummary.totalInputTokens} + ${metrics.inputTokens || 0}`,
            totalOutputTokens: sql`${monthlyUsageSummary.totalOutputTokens} + ${metrics.outputTokens || 0}`,
            totalTokens: sql`${monthlyUsageSummary.totalTokens} + ${totalTokens}`,
            totalCost: sql`${monthlyUsageSummary.totalCost} + ${cost}`,
            updatedAt: new Date(),
          })
          .where(eq(monthlyUsageSummary.id, existing[0].id));
      } else {
        // Create new record
        const newSummary: InsertMonthlyUsageSummary = {
          userId,
          year,
          month,
          provider: metrics.provider,
          model: metrics.model,
          totalRequests: metrics.requestCount || 1,
          totalInputTokens: metrics.inputTokens || 0,
          totalOutputTokens: metrics.outputTokens || 0,
          totalTokens,
          totalCost: cost.toString(),
        };

        await db.insert(monthlyUsageSummary).values(newSummary);
      }
    } catch (error) {
      console.error('Failed to update monthly summary:', error);
    }
  }

  /**
   * Get usage statistics for a user
   */
  async getUserUsageStats(userId: string, year?: number, month?: number): Promise<{
    totalCost: number;
    totalRequests: number;
    totalTokens: number;
    byProvider: Record<string, {
      cost: number;
      requests: number;
      tokens: number;
      models: Record<string, { cost: number; requests: number; tokens: number }>;
    }>;
  }> {
    try {
      let query = db
        .select()
        .from(monthlyUsageSummary)
        .where(eq(monthlyUsageSummary.userId, userId));

      if (year && month) {
        query = query.where(
          and(
            eq(monthlyUsageSummary.year, year),
            eq(monthlyUsageSummary.month, month)
          )
        );
      } else if (year) {
        query = query.where(eq(monthlyUsageSummary.year, year));
      }

      const results = await query;

      const stats = {
        totalCost: 0,
        totalRequests: 0,
        totalTokens: 0,
        byProvider: {} as Record<string, any>,
      };

      results.forEach((record) => {
        const cost = parseFloat(record.totalCost || '0');
        const requests = record.totalRequests || 0;
        const tokens = record.totalTokens || 0;

        stats.totalCost += cost;
        stats.totalRequests += requests;
        stats.totalTokens += tokens;

        if (!stats.byProvider[record.provider]) {
          stats.byProvider[record.provider] = {
            cost: 0,
            requests: 0,
            tokens: 0,
            models: {},
          };
        }

        const provider = stats.byProvider[record.provider];
        provider.cost += cost;
        provider.requests += requests;
        provider.tokens += tokens;

        if (!provider.models[record.model]) {
          provider.models[record.model] = { cost: 0, requests: 0, tokens: 0 };
        }

        provider.models[record.model].cost += cost;
        provider.models[record.model].requests += requests;
        provider.models[record.model].tokens += tokens;
      });

      return stats;
    } catch (error) {
      console.error('Failed to get user usage stats:', error);
      return {
        totalCost: 0,
        totalRequests: 0,
        totalTokens: 0,
        byProvider: {},
      };
    }
  }

  /**
   * Get current month usage for quick dashboard display
   */
  async getCurrentMonthUsage(userId: string): Promise<{
    totalCost: number;
    totalRequests: number;
    estimatedMonthlyCost: number;
  }> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    const stats = await this.getUserUsageStats(userId, year, month);
    
    // Estimate full month cost based on current usage
    const daysInMonth = new Date(year, month, 0).getDate();
    const currentDay = now.getDate();
    const estimatedMonthlyCost = (stats.totalCost / currentDay) * daysInMonth;
    
    return {
      totalCost: stats.totalCost,
      totalRequests: stats.totalRequests,
      estimatedMonthlyCost: Math.round(estimatedMonthlyCost * 100) / 100,
    };
  }

  /**
   * Get system-wide usage statistics (admin only)
   */
  async getSystemUsageStats(): Promise<{
    totalUsers: number;
    totalCost: number;
    totalRequests: number;
    byProvider: Record<string, number>;
    topUsers: Array<{ userId: string; cost: number; requests: number }>;
  }> {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const results = await db
        .select({
          userId: monthlyUsageSummary.userId,
          provider: monthlyUsageSummary.provider,
          totalCost: monthlyUsageSummary.totalCost,
          totalRequests: monthlyUsageSummary.totalRequests,
        })
        .from(monthlyUsageSummary)
        .where(
          and(
            eq(monthlyUsageSummary.year, year),
            eq(monthlyUsageSummary.month, month)
          )
        );

      const stats = {
        totalUsers: new Set(),
        totalCost: 0,
        totalRequests: 0,
        byProvider: {} as Record<string, number>,
        userStats: {} as Record<string, { cost: number; requests: number }>,
      };

      results.forEach((record) => {
        if (record.userId) {
          stats.totalUsers.add(record.userId);
          
          if (!stats.userStats[record.userId]) {
            stats.userStats[record.userId] = { cost: 0, requests: 0 };
          }
          
          const cost = parseFloat(record.totalCost || '0');
          const requests = record.totalRequests || 0;
          
          stats.totalCost += cost;
          stats.totalRequests += requests;
          stats.userStats[record.userId].cost += cost;
          stats.userStats[record.userId].requests += requests;
          
          if (!stats.byProvider[record.provider]) {
            stats.byProvider[record.provider] = 0;
          }
          stats.byProvider[record.provider] += cost;
        }
      });

      const topUsers = Object.entries(stats.userStats)
        .map(([userId, data]) => ({ userId, ...data }))
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 10);

      return {
        totalUsers: stats.totalUsers.size,
        totalCost: Math.round(stats.totalCost * 100) / 100,
        totalRequests: stats.totalRequests,
        byProvider: stats.byProvider,
        topUsers,
      };
    } catch (error) {
      console.error('Failed to get system usage stats:', error);
      return {
        totalUsers: 0,
        totalCost: 0,
        totalRequests: 0,
        byProvider: {},
        topUsers: [],
      };
    }
  }
}

export const apiCostTracker = new ApiCostTracker();