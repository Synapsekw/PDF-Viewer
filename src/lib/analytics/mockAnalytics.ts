import { Kpis, TimeSeriesDataPoint, TopPdfData, KeywordData, QuestionData, HeatmapData, DropoffData } from './types';

// ===== MOCK_DATA_START (Analytics) =====

const mockKpis: Kpis = {
  totalViews: 1247,
  uniqueViewers: 342,
  avgTimeSec: 187,
  totalDownloads: 89,
  deltas: {
    totalViews: { value: 12.5, direction: 'up' },
    uniqueViewers: { value: 8.2, direction: 'up' },
    avgTimeSec: { value: 3.1, direction: 'down' },
    totalDownloads: { value: 15.7, direction: 'up' },
  },
};

const mockViewsTimeSeries: TimeSeriesDataPoint[] = [
  { date: '01 Dec', views: 45 },
  { date: '02 Dec', views: 52 },
  { date: '03 Dec', views: 38 },
  { date: '04 Dec', views: 67 },
  { date: '05 Dec', views: 73 },
  { date: '06 Dec', views: 89 },
  { date: '07 Dec', views: 94 },
  { date: '08 Dec', views: 76 },
  { date: '09 Dec', views: 82 },
  { date: '10 Dec', views: 91 },
  { date: '11 Dec', views: 103 },
  { date: '12 Dec', views: 87 },
  { date: '13 Dec', views: 95 },
  { date: '14 Dec', views: 112 },
  { date: '15 Dec', views: 108 },
  { date: '16 Dec', views: 125 },
  { date: '17 Dec', views: 134 },
  { date: '18 Dec', views: 142 },
  { date: '19 Dec', views: 156 },
  { date: '20 Dec', views: 148 },
  { date: '21 Dec', views: 167 },
  { date: '22 Dec', views: 178 },
  { date: '23 Dec', views: 189 },
  { date: '24 Dec', views: 203 },
  { date: '25 Dec', views: 198 },
  { date: '26 Dec', views: 215 },
  { date: '27 Dec', views: 234 },
  { date: '28 Dec', views: 247 },
  { date: '29 Dec', views: 256 },
  { date: '30 Dec', views: 268 },
];

const mockTopPdfs: TopPdfData[] = [
  { id: 'pdf-001', title: 'Q4 Financial Report 2024', views: 342 },
  { id: 'pdf-002', title: 'Product Launch Strategy', views: 287 },
  { id: 'pdf-003', title: 'Annual Performance Review', views: 234 },
  { id: 'pdf-004', title: 'Technical Documentation v2.1', views: 198 },
  { id: 'pdf-005', title: 'Marketing Campaign Results', views: 156 },
];

// Debug: Log the mock data
console.log('mockTopPdfs:', mockTopPdfs);

const mockKeywords: KeywordData[] = [
  { word: 'Financial', weight: 95, source: 'pdf' },
  { word: 'Revenue', weight: 87, source: 'pdf' },
  { word: 'Growth', weight: 82, source: 'chat' },
  { word: 'Strategy', weight: 78, source: 'pdf' },
  { word: 'Performance', weight: 75, source: 'pdf' },
  { word: 'Analysis', weight: 72, source: 'chat' },
  { word: 'Market', weight: 68, source: 'pdf' },
  { word: 'Data', weight: 65, source: 'clicks' },
  { word: 'Report', weight: 62, source: 'pdf' },
  { word: 'Metrics', weight: 58, source: 'chat' },
  { word: 'Trends', weight: 55, source: 'pdf' },
  { word: 'Forecast', weight: 52, source: 'chat' },
  { word: 'Budget', weight: 48, source: 'pdf' },
  { word: 'ROI', weight: 45, source: 'clicks' },
  { word: 'Efficiency', weight: 42, source: 'chat' },
  { word: 'Optimization', weight: 38, source: 'pdf' },
  { word: 'Scaling', weight: 35, source: 'chat' },
  { word: 'Innovation', weight: 32, source: 'pdf' },
  { word: 'Technology', weight: 28, source: 'clicks' },
  { word: 'Process', weight: 25, source: 'chat' },
];

const mockQuestions: QuestionData[] = [
  { id: 'q-001', question: 'What are the key revenue drivers for Q4?', count: 45, lastAsked: '2024-12-30' },
  { id: 'q-002', question: 'How does our performance compare to competitors?', count: 38, lastAsked: '2024-12-29' },
  { id: 'q-003', question: 'What are the main growth opportunities?', count: 32, lastAsked: '2024-12-28' },
  { id: 'q-004', question: 'Can you analyze the budget allocation?', count: 28, lastAsked: '2024-12-27' },
  { id: 'q-005', question: 'What metrics should we focus on?', count: 25, lastAsked: '2024-12-26' },
  { id: 'q-006', question: 'How can we improve efficiency?', count: 22, lastAsked: '2024-12-25' },
  { id: 'q-007', question: 'What are the market trends?', count: 19, lastAsked: '2024-12-24' },
  { id: 'q-008', question: 'Can you explain the ROI calculation?', count: 16, lastAsked: '2024-12-23' },
  { id: 'q-009', question: 'What\'s the forecast for next quarter?', count: 14, lastAsked: '2024-12-22' },
  { id: 'q-010', question: 'How do we optimize our processes?', count: 12, lastAsked: '2024-12-21' },
];

// Mock PDF list for dropdown
const mockAllPdfs = [
  { id: 'pdf-001', title: 'Q4 Financial Report' },
  { id: 'pdf-002', title: 'Product Manual v2.1' },
  { id: 'pdf-003', title: 'User Research Findings' },
  { id: 'pdf-004', title: 'Technical Specifications' },
  { id: 'pdf-005', title: 'Marketing Strategy 2024' },
];

// Mock heatmap data with clustering
const generateHeatmapPoints = (pdfId: string): HeatmapData => {
  const points = [];
  
  // Generate clusters of activity
  const clusters = [
    { centerX: 0.3, centerY: 0.4, radius: 0.15, intensity: 0.9, type: 'click' as const },
    { centerX: 0.7, centerY: 0.6, radius: 0.12, intensity: 0.8, type: 'hover' as const },
    { centerX: 0.5, centerY: 0.2, radius: 0.1, intensity: 0.7, type: 'click' as const },
    { centerX: 0.2, centerY: 0.8, radius: 0.08, intensity: 0.6, type: 'scroll' as const },
    { centerX: 0.8, centerY: 0.3, radius: 0.06, intensity: 0.5, type: 'hover' as const },
  ];

  clusters.forEach(cluster => {
    const numPoints = Math.floor(Math.random() * 30) + 10; // 10-40 points per cluster
    for (let i = 0; i < numPoints; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * cluster.radius;
      const x = cluster.centerX + Math.cos(angle) * distance;
      const y = cluster.centerY + Math.sin(angle) * distance;
      
      // Ensure points stay within bounds
      const clampedX = Math.max(0.05, Math.min(0.95, x));
      const clampedY = Math.max(0.05, Math.min(0.95, y));
      
      points.push({
        x: clampedX,
        y: clampedY,
        intensity: cluster.intensity * (0.8 + Math.random() * 0.4), // Vary intensity
        type: cluster.type,
      });
    }
  });

  // Add some random scattered points
  for (let i = 0; i < 20; i++) {
    points.push({
      x: 0.05 + Math.random() * 0.9,
      y: 0.05 + Math.random() * 0.9,
      intensity: 0.3 + Math.random() * 0.4,
      type: ['click', 'hover', 'scroll'][Math.floor(Math.random() * 3)] as 'click' | 'hover' | 'scroll',
    });
  }

  return {
    pdfId,
    pageNumber: 1,
    points,
  };
};

// Mock dropoff data - realistic decay
const generateDropoffData = (pdfId: string): DropoffData => {
  const pages = [];
  let currentPercentage = 100;
  
  // Generate realistic page dropoff
  for (let pageNum = 1; pageNum <= 25; pageNum++) {
    if (pageNum === 1) {
      pages.push({ pageNumber: pageNum, percentage: 100 });
    } else {
      // Realistic decay: steeper at beginning, flatter towards end
      const decayRate = Math.max(0.02, 0.15 * Math.exp(-pageNum * 0.1));
      currentPercentage = Math.max(5, currentPercentage - (currentPercentage * decayRate));
      pages.push({ pageNumber: pageNum, percentage: Math.round(currentPercentage * 10) / 10 });
    }
  }
  
  return { pdfId, pages };
};

// ===== MOCK_DATA_END (Analytics) =====

export async function getKpis(): Promise<Kpis> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return mockKpis;
}

export async function getViewsTimeSeries({ days }: { days: number }): Promise<TimeSeriesDataPoint[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return mockViewsTimeSeries;
}

export async function getTopPdfsByViews({ limit }: { limit: number }): Promise<TopPdfData[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 250));
  
  const result = mockTopPdfs.slice(0, limit);
  console.log('getTopPdfsByViews - returning:', result);
  return result;
}

export async function getTopKeywords({ limit }: { limit: number }): Promise<KeywordData[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return mockKeywords.slice(0, limit);
}

export async function getTopQuestions({ limit }: { limit: number }): Promise<QuestionData[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 250));
  
  return mockQuestions.slice(0, limit);
}

export async function getAllPdfs(): Promise<Array<{ id: string; title: string }>> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return mockAllPdfs;
}

export async function getHeatmapPreview({ pdfId }: { pdfId: string }): Promise<HeatmapData> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return generateHeatmapPoints(pdfId);
}

export async function getPageDropoff({ pdfId }: { pdfId: string }): Promise<DropoffData> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 250));
  
  return generateDropoffData(pdfId);
}

export async function getAnalyticsData() {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 250));
  
  return {
    kpis: mockKpis,
    viewsTimeSeries: mockViewsTimeSeries,
    topPdfs: mockTopPdfs,
    keywords: mockKeywords,
    questions: mockQuestions,
    heatmapData: generateHeatmapPoints('pdf-001'),
    dropoffData: generateDropoffData('pdf-001'),
  };
}
