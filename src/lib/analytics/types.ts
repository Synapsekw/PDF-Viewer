export type KpiDelta = {
  value: number;
  direction: 'up' | 'down' | 'neutral';
};

export type Kpis = {
  totalViews: number;
  uniqueViewers: number;
  avgTimeSec: number;
  totalDownloads: number;
  deltas: {
    totalViews: KpiDelta;
    uniqueViewers: KpiDelta;
    avgTimeSec: KpiDelta;
    totalDownloads: KpiDelta;
  };
};

export type TimeSeriesDataPoint = {
  date: string;
  views: number;
};

export type TopPdfData = {
  id: string;
  title: string;
  views: number;
};

export type KeywordData = {
  word: string;
  weight: number;
  source: 'pdf' | 'chat' | 'clicks';
};

export type QuestionData = {
  id: string;
  question: string;
  count: number;
  lastAsked: string;
};

export type HeatmapPoint = {
  x: number; // percentage of page width
  y: number; // percentage of page height
  intensity: number; // 0-1 scale
  type: 'click' | 'hover' | 'scroll';
};

export type HeatmapData = {
  pdfId: string;
  pageNumber: number;
  points: HeatmapPoint[];
};

export type DropoffData = {
  pdfId: string;
  pages: Array<{
    pageNumber: number;
    percentage: number; // % of sessions reaching this page
  }>;
};

export type AnalyticsData = {
  kpis: Kpis;
  viewsTimeSeries: TimeSeriesDataPoint[];
  topPdfs: TopPdfData[];
  keywords: KeywordData[];
  questions: QuestionData[];
  heatmapData: HeatmapData;
  dropoffData: DropoffData;
};

export type AnalyticsConfig = {
  useMockData: boolean;
};
