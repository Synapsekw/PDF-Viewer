export interface MousePosition {
  x: number;
  y: number;
  timestamp: number;
}

export interface HeatmapDataPoint {
  x: number;
  y: number;
  intensity: number;
}

export interface HeatmapGridCell {
  x: number;
  y: number;
  count: number;
  intensity: number;
}

export interface HeatmapConfig {
  gridSize: number;
  maxIntensity: number;
  fadeTime: number; // Time in ms after which data points start to fade
  opacity: number;
  radius: number; // Influence radius of each mouse position
}

export interface PageHeatmapData {
  pageNumber: number;
  positions: MousePosition[];
  grid: HeatmapGridCell[][];
  lastUpdate: number;
}

// AI Usage Analytics Types
export interface AIUsageEvent {
  id: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
  documentId?: string;
  documentTitle?: string;
  userMessage: string;
  aiResponse: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  model: string;
  responseTime: number; // in milliseconds
  success: boolean;
  error?: string;
  cost?: number; // estimated cost in USD
}

export interface AIUsageStats {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  averageResponseTime: number;
  successRate: number;
  requestsByModel: Record<string, number>;
  requestsByDocument: Record<string, number>;
  requestsByHour: Record<number, number>;
  requestsByDay: Record<string, number>;
}

export interface AIUsageFilters {
  startDate?: Date;
  endDate?: Date;
  model?: string;
  documentId?: string;
  userId?: string;
  minTokens?: number;
  maxTokens?: number;
}

export interface AIUsageReport {
  period: {
    start: Date;
    end: Date;
  };
  summary: AIUsageStats;
  events: AIUsageEvent[];
  trends: {
    requestsPerDay: Array<{ date: string; count: number }>;
    tokensPerDay: Array<{ date: string; tokens: number }>;
    costPerDay: Array<{ date: string; cost: number }>;
  };
}