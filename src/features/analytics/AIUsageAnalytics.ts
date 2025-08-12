import { AIUsageEvent, AIUsageStats, AIUsageFilters, AIUsageReport } from './types';

// OpenAI pricing per 1K tokens (as of 2024)
const OPENAI_PRICING = {
  'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-4o': { input: 0.005, output: 0.015 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
};

export class AIUsageAnalytics {
  private storageKey = 'spectra-ai-usage';
  private sessionId: string;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('spectra-ai-session-id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('spectra-ai-session-id', sessionId);
    }
    return sessionId;
  }

  private calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    const pricing = OPENAI_PRICING[model as keyof typeof OPENAI_PRICING];
    if (!pricing) {
      console.warn(`Unknown model pricing for: ${model}`);
      return 0;
    }

    const inputCost = (promptTokens / 1000) * pricing.input;
    const outputCost = (completionTokens / 1000) * pricing.output;
    return inputCost + outputCost;
  }

  async trackUsage(event: Omit<AIUsageEvent, 'id' | 'timestamp' | 'sessionId'>): Promise<void> {
    const usageEvent: AIUsageEvent = {
      ...event,
      id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      cost: this.calculateCost(event.model, event.tokensUsed.prompt, event.tokensUsed.completion),
    };

    try {
      const existingData = await this.getStoredData();
      existingData.events.push(usageEvent);
      
      // Keep only last 1000 events to prevent storage bloat
      if (existingData.events.length > 1000) {
        existingData.events = existingData.events.slice(-1000);
      }

      await this.saveData(existingData);
      console.log('AI Usage Analytics: Event tracked', usageEvent);
    } catch (error) {
      console.error('AI Usage Analytics: Failed to track event', error);
    }
  }

  async getStats(filters?: AIUsageFilters): Promise<AIUsageStats> {
    const data = await this.getStoredData();
    let events = data.events;

    // Apply filters
    if (filters) {
      events = events.filter(event => {
        if (filters.startDate && event.timestamp < filters.startDate.getTime()) return false;
        if (filters.endDate && event.timestamp > filters.endDate.getTime()) return false;
        if (filters.model && event.model !== filters.model) return false;
        if (filters.documentId && event.documentId !== filters.documentId) return false;
        if (filters.userId && event.userId !== filters.userId) return false;
        if (filters.minTokens && event.tokensUsed.total < filters.minTokens) return false;
        if (filters.maxTokens && event.tokensUsed.total > filters.maxTokens) return false;
        return true;
      });
    }

    const totalRequests = events.length;
    const totalTokens = events.reduce((sum, event) => sum + event.tokensUsed.total, 0);
    const totalCost = events.reduce((sum, event) => sum + (event.cost || 0), 0);
    const averageResponseTime = totalRequests > 0 
      ? events.reduce((sum, event) => sum + event.responseTime, 0) / totalRequests 
      : 0;
    const successRate = totalRequests > 0 
      ? (events.filter(event => event.success).length / totalRequests) * 100 
      : 0;

    // Group by model
    const requestsByModel: Record<string, number> = {};
    events.forEach(event => {
      requestsByModel[event.model] = (requestsByModel[event.model] || 0) + 1;
    });

    // Group by document
    const requestsByDocument: Record<string, number> = {};
    events.forEach(event => {
      if (event.documentId) {
        requestsByDocument[event.documentId] = (requestsByDocument[event.documentId] || 0) + 1;
      }
    });

    // Group by hour
    const requestsByHour: Record<number, number> = {};
    events.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      requestsByHour[hour] = (requestsByHour[hour] || 0) + 1;
    });

    // Group by day
    const requestsByDay: Record<string, number> = {};
    events.forEach(event => {
      const day = new Date(event.timestamp).toISOString().split('T')[0];
      requestsByDay[day] = (requestsByDay[day] || 0) + 1;
    });

    return {
      totalRequests,
      totalTokens,
      totalCost,
      averageResponseTime,
      successRate,
      requestsByModel,
      requestsByDocument,
      requestsByHour,
      requestsByDay,
    };
  }

  async generateReport(filters?: AIUsageFilters): Promise<AIUsageReport> {
    const stats = await this.getStats(filters);
    const data = await this.getStoredData();
    let events = data.events;

    // Apply same filters as stats
    if (filters) {
      events = events.filter(event => {
        if (filters.startDate && event.timestamp < filters.startDate.getTime()) return false;
        if (filters.endDate && event.timestamp > filters.endDate.getTime()) return false;
        if (filters.model && event.model !== filters.model) return false;
        if (filters.documentId && event.documentId !== filters.documentId) return false;
        if (filters.userId && event.userId !== filters.userId) return false;
        if (filters.minTokens && event.tokensUsed.total < filters.minTokens) return false;
        if (filters.maxTokens && event.tokensUsed.total > filters.maxTokens) return false;
        return true;
      });
    }

    // Generate trends
    const requestsPerDay: Array<{ date: string; count: number }> = [];
    const tokensPerDay: Array<{ date: string; tokens: number }> = [];
    const costPerDay: Array<{ date: string; cost: number }> = [];

    const dayGroups: Record<string, { count: number; tokens: number; cost: number }> = {};
    
    events.forEach(event => {
      const day = new Date(event.timestamp).toISOString().split('T')[0];
      if (!dayGroups[day]) {
        dayGroups[day] = { count: 0, tokens: 0, cost: 0 };
      }
      dayGroups[day].count++;
      dayGroups[day].tokens += event.tokensUsed.total;
      dayGroups[day].cost += event.cost || 0;
    });

    Object.entries(dayGroups).forEach(([date, data]) => {
      requestsPerDay.push({ date, count: data.count });
      tokensPerDay.push({ date, tokens: data.tokens });
      costPerDay.push({ date, cost: data.cost });
    });

    // Sort by date
    requestsPerDay.sort((a, b) => a.date.localeCompare(b.date));
    tokensPerDay.sort((a, b) => a.date.localeCompare(b.date));
    costPerDay.sort((a, b) => a.date.localeCompare(b.date));

    return {
      period: {
        start: filters?.startDate || (events.length > 0 ? new Date(Math.min(...events.map(e => e.timestamp))) : new Date()),
        end: filters?.endDate || (events.length > 0 ? new Date(Math.max(...events.map(e => e.timestamp))) : new Date()),
      },
      summary: stats,
      events: events.slice(-100), // Last 100 events for detailed view
      trends: {
        requestsPerDay,
        tokensPerDay,
        costPerDay,
      },
    };
  }

  async clearData(): Promise<void> {
    try {
      localStorage.removeItem(this.storageKey);
      console.log('AI Usage Analytics: Data cleared');
    } catch (error) {
      console.error('AI Usage Analytics: Failed to clear data', error);
    }
  }

  async exportData(): Promise<string> {
    const data = await this.getStoredData();
    return JSON.stringify(data, null, 2);
  }

  private async getStoredData(): Promise<{ events: AIUsageEvent[] }> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : { events: [] };
    } catch (error) {
      console.error('AI Usage Analytics: Failed to get stored data', error);
      return { events: [] };
    }
  }

  private async saveData(data: { events: AIUsageEvent[] }): Promise<void> {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('AI Usage Analytics: Failed to save data', error);
    }
  }
}

// Export singleton instance
export const aiUsageAnalytics = new AIUsageAnalytics();
