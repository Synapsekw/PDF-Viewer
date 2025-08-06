import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { usePdf } from '../pdf/PdfContext';
import { 
  debounce, 
  throttle, 
  AdaptiveSampler, 
  CircularBuffer, 
  DEFAULT_PERFORMANCE_CONFIG,
  performanceMonitor 
} from '../utils/performance';
import { analyticsStorage } from '../features/analytics/persistence/storage';

/**
 * Data for tracking user interaction with a specific PDF page.
 */
export interface PageView {
  /** Page number (1-based) */
  pageNumber: number;
  /** Timestamp when user started viewing this page */
  startTime: number;
  /** Timestamp when user stopped viewing this page */
  endTime?: number;
  /** Total time spent on this page in milliseconds */
  totalTime: number;
  /** Number of mouse movements recorded on this page */
  mouseMovements: number;
  /** Number of scroll events on this page */
  scrollEvents: number;
  /** Number of zoom changes while on this page */
  zoomChanges: number;
  /** Number of rotation changes while on this page */
  rotationChanges: number;
}

/**
 * Individual user interaction event.
 */
export interface UserInteraction {
  /** Type of interaction */
  type: 'click' | 'scroll' | 'zoom' | 'rotate' | 'navigate' | 'snip';
  /** When the interaction occurred */
  timestamp: number;
  /** Page number where interaction occurred */
  pageNumber: number;
  /** Additional context-specific data */
  details?: Record<string, any>;
}

/**
 * Complete analytics data for a PDF viewing session.
 */
export interface AnalyticsData {
  /** Unique identifier for this viewing session */
  sessionId: string;
  /** When the session started */
  startTime: number;
  /** When the session ended (if ended) */
  endTime?: number;
  /** Total session duration in milliseconds */
  totalDuration: number;
  /** Name of the PDF file being viewed */
  pdfFileName?: string;
  /** Total number of pages in the PDF */
  totalPages: number;
  /** Detailed page view statistics */
  pageViews: PageView[];
  /** Chronological list of user interactions */
  interactions: UserInteraction[];
  /** Heatmap data from analytics plugins */
  heatmapData?: Record<string, any>;
}

/**
 * Context interface for analytics functionality.
 * Provides methods for recording and exporting user interaction data.
 */
interface AnalyticsContextType {
  /** Current analytics data */
  analyticsData: AnalyticsData;
  /** Record a page view event */
  recordPageView: (pageNumber: number) => void;
  /** Record a user interaction event */
  recordInteraction: (interaction: Omit<UserInteraction, 'timestamp' | 'pageNumber'>) => void;
  /** Update heatmap data from analytics plugins */
  updateHeatmapData: (data: Record<string, any>) => void;
  /** Get a complete analytics report */
  getAnalyticsReport: () => AnalyticsData;
  /** Export analytics data as JSON string */
  exportAsJSON: () => string;
  /** Export analytics data as formatted HTML report */
  exportAsHTML: () => string;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

/**
 * Props for the AnalyticsProvider component.
 */
interface AnalyticsProviderProps {
  /** Child components that will have access to analytics context */
  children: ReactNode;
}

/**
 * Analytics context provider component.
 * 
 * This component provides analytics tracking functionality throughout the application.
 * It automatically tracks page views, user interactions, and provides export capabilities.
 * 
 * Features:
 * - Automatic page view tracking
 * - User interaction recording
 * - Session duration tracking
 * - Data export (JSON/HTML)
 * - Heatmap data integration
 * 
 * @component
 * @param {AnalyticsProviderProps} props - Component props
 * @returns {JSX.Element} Provider component
 */
export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const { currentPage, totalPages, document: pdfDocument } = usePdf();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>(() => ({
    sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    startTime: Date.now(),
    totalDuration: 0,
    totalPages: 0,
    pageViews: [],
    interactions: [],
  }));

  const [currentPageView, setCurrentPageView] = useState<PageView | null>(null);
  
  // Performance optimization instances
  const [interactionBuffer] = useState(() => new CircularBuffer<UserInteraction>(
    DEFAULT_PERFORMANCE_CONFIG.maxAnalyticsEvents
  ));
  const [adaptiveSampler] = useState(() => new AdaptiveSampler(
    DEFAULT_PERFORMANCE_CONFIG.mouseSampleRate
  ));
  
  // Debounced functions for performance
  const debouncedPersistence = useCallback(
    debounce((data: AnalyticsData) => {
      analyticsStorage.saveSession(data.sessionId, data).catch(console.error);
    }, DEFAULT_PERFORMANCE_CONFIG.debounceDelay),
    []
  );
  
  const throttledUpdateHeatmap = useCallback(
    throttle((data: Record<string, any>) => {
      setAnalyticsData(prev => {
        // Only update if data has actually changed
        if (JSON.stringify(prev.heatmapData) === JSON.stringify(data)) {
          return prev;
        }
        return {
          ...prev,
          heatmapData: data,
        };
      });
    }, DEFAULT_PERFORMANCE_CONFIG.throttleInterval),
    []
  );

  // Update total pages when document loads
  useEffect(() => {
    if (totalPages > 0) {
      setAnalyticsData(prev => ({
        ...prev,
        totalPages,
        pdfFileName: pdfDocument ? 'uploaded_pdf.pdf' : undefined,
      }));
    }
  }, [totalPages, pdfDocument]);

  // Track page views
  useEffect(() => {
    if (currentPage > 0) {
      recordPageView(currentPage);
    }
  }, [currentPage]);

  // Update session duration and handle persistence
  useEffect(() => {
    const interval = setInterval(() => {
      setAnalyticsData(prev => {
        const updated = {
          ...prev,
          totalDuration: Date.now() - prev.startTime,
        };
        
        // Trigger debounced persistence
        debouncedPersistence(updated);
        
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [debouncedPersistence]);
  
  // Session cleanup and final persistence on unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Force immediate save before page unload
      const finalData = getAnalyticsReport();
      analyticsStorage.saveSession(finalData.sessionId, finalData).catch(console.error);
    };
    
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.hidden) {
        // Save data when tab becomes hidden
        const currentData = getAnalyticsReport();
        analyticsStorage.saveSession(currentData.sessionId, currentData).catch(console.error);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      
      // Final save on component unmount
      const finalData = getAnalyticsReport();
      analyticsStorage.saveSession(finalData.sessionId, finalData).catch(console.error);
    };
  }, []);
  
  // Periodic cleanup of old data
  useEffect(() => {
    // Clean up old analytics data periodically
    const cleanupInterval = setInterval(() => {
      analyticsStorage.cleanup().catch(console.error);
    }, 60000); // Every minute
    
    return () => clearInterval(cleanupInterval);
  }, []);

  const recordPageView = (pageNumber: number) => {
    const now = Date.now();

    // End previous page view
    if (currentPageView) {
      const endedPageView = {
        ...currentPageView,
        endTime: now,
        totalTime: now - currentPageView.startTime,
      };

      setAnalyticsData(prev => ({
        ...prev,
        pageViews: prev.pageViews.map(pv => 
          pv.pageNumber === currentPageView.pageNumber && !pv.endTime ? endedPageView : pv
        ).concat(prev.pageViews.find(pv => pv.pageNumber === currentPageView.pageNumber) ? [] : [endedPageView]),
      }));
    }

    // Start new page view
    const newPageView: PageView = {
      pageNumber,
      startTime: now,
      totalTime: 0,
      mouseMovements: 0,
      scrollEvents: 0,
      zoomChanges: 0,
      rotationChanges: 0,
    };

    setCurrentPageView(newPageView);
    
    // Record navigation interaction
    recordInteraction({
      type: 'navigate',
      details: { fromPage: currentPageView?.pageNumber, toPage: pageNumber },
    });
  };

  const recordInteraction = useCallback((interaction: Omit<UserInteraction, 'timestamp' | 'pageNumber'>) => {
    const endTiming = performanceMonitor.startTiming('record_interaction');
    
    try {
      // Apply adaptive sampling for high-frequency events
      if (interaction.type === 'click' && interaction.details?.action === 'mouse_movement') {
        if (!adaptiveSampler.shouldSample()) {
          return;
        }
      }
      
      const newInteraction: UserInteraction = {
        ...interaction,
        timestamp: Date.now(),
        pageNumber: currentPage,
      };

      // Use circular buffer for memory efficiency
      interactionBuffer.push(newInteraction);
      
      setAnalyticsData(prev => {
        // Get interactions from buffer (automatically manages memory)
        const bufferedInteractions = interactionBuffer.toArray();
        
        return {
          ...prev,
          interactions: bufferedInteractions,
        };
      });

      // Update current page view stats
      if (currentPageView) {
        setCurrentPageView(prev => {
          if (!prev) return prev;
          
          const updated = { ...prev };
          switch (interaction.type) {
            case 'scroll':
              updated.scrollEvents++;
              break;
            case 'zoom':
              updated.zoomChanges++;
              break;
            case 'rotate':
              updated.rotationChanges++;
              break;
            case 'click':
              if (interaction.details?.action === 'mouse_movement') {
                updated.mouseMovements++;
              }
              break;
          }
          return updated;
        });
      }
    } finally {
      endTiming();
    }
  }, [currentPage, currentPageView, interactionBuffer, adaptiveSampler]);

  const updateHeatmapData = useCallback((data: Record<string, any>) => {
    // Use throttled update for performance
    throttledUpdateHeatmap(data);
  }, [throttledUpdateHeatmap]);

  const getAnalyticsReport = (): AnalyticsData => {
    return {
      ...analyticsData,
      endTime: Date.now(),
      totalDuration: Date.now() - analyticsData.startTime,
    };
  };

  const exportAsJSON = (): string => {
    const report = getAnalyticsReport();
    return JSON.stringify(report, null, 2);
  };

  const exportAsHTML = (): string => {
    const report = getAnalyticsReport();
    const formatDuration = (ms: number) => {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      return `${minutes}m ${seconds % 60}s`;
    };

    const formatTime = (timestamp: number) => {
      return new Date(timestamp).toLocaleString();
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDF Analytics Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .section { margin-bottom: 30px; }
        .metric { display: inline-block; margin: 10px; padding: 15px; background: #e9f5ff; border-radius: 5px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #0066cc; }
        .metric-label { font-size: 14px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .chart-placeholder { background: #f9f9f9; padding: 20px; text-align: center; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>PDF Analytics Report</h1>
        <p><strong>Session ID:</strong> ${report.sessionId}</p>
        <p><strong>Generated:</strong> ${formatTime(Date.now())}</p>
        <p><strong>Session Duration:</strong> ${formatDuration(report.totalDuration)}</p>
    </div>

    <div class="section">
        <h2>Overview</h2>
        <div class="metric">
            <div class="metric-value">${report.totalPages}</div>
            <div class="metric-label">Total Pages</div>
        </div>
        <div class="metric">
            <div class="metric-value">${report.pageViews.length}</div>
            <div class="metric-label">Pages Viewed</div>
        </div>
        <div class="metric">
            <div class="metric-value">${report.interactions.length}</div>
            <div class="metric-label">Total Interactions</div>
        </div>
        <div class="metric">
            <div class="metric-value">${formatDuration(report.totalDuration)}</div>
            <div class="metric-label">Session Duration</div>
        </div>
    </div>

    <div class="section">
        <h2>Page Views</h2>
        <table>
            <thead>
                <tr>
                    <th>Page</th>
                    <th>Time Spent</th>
                    <th>Mouse Movements</th>
                    <th>Zoom Changes</th>
                    <th>Rotation Changes</th>
                </tr>
            </thead>
            <tbody>
                ${report.pageViews.map(pv => `
                    <tr>
                        <td>Page ${pv.pageNumber}</td>
                        <td>${formatDuration(pv.totalTime)}</td>
                        <td>${pv.mouseMovements}</td>
                        <td>${pv.zoomChanges}</td>
                        <td>${pv.rotationChanges}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Interaction Timeline</h2>
        <table>
            <thead>
                <tr>
                    <th>Time</th>
                    <th>Page</th>
                    <th>Action</th>
                    <th>Details</th>
                </tr>
            </thead>
            <tbody>
                ${report.interactions.slice(-20).map(interaction => `
                    <tr>
                        <td>${formatTime(interaction.timestamp)}</td>
                        <td>Page ${interaction.pageNumber}</td>
                        <td>${interaction.type}</td>
                        <td>${interaction.details ? JSON.stringify(interaction.details) : '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    ${report.heatmapData ? `
    <div class="section">
        <h2>Heatmap Data</h2>
        <div class="chart-placeholder">
            <p>Heatmap data available for ${Object.keys(report.heatmapData).length} pages</p>
            <p>Total mouse positions tracked: ${Object.values(report.heatmapData).reduce((sum: number, page: any) => sum + (page.positions?.length || 0), 0)}</p>
        </div>
    </div>
    ` : ''}

    <div class="section">
        <h2>Session Summary</h2>
        <p><strong>Most Viewed Page:</strong> ${report.pageViews.length > 0 ? 'Page ' + report.pageViews.reduce((max, pv) => pv.totalTime > max.totalTime ? pv : max).pageNumber : 'N/A'}</p>
        <p><strong>Average Time per Page:</strong> ${report.pageViews.length > 0 ? formatDuration(report.pageViews.reduce((sum, pv) => sum + pv.totalTime, 0) / report.pageViews.length) : 'N/A'}</p>
        <p><strong>Total Interactions:</strong> ${report.interactions.length}</p>
    </div>
</body>
</html>`;
  };

  const value: AnalyticsContextType = {
    analyticsData,
    recordPageView,
    recordInteraction,
    updateHeatmapData,
    getAnalyticsReport,
    exportAsJSON,
    exportAsHTML,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

/**
 * Hook for accessing analytics functionality.
 * 
 * This hook provides access to analytics tracking methods and data.
 * Must be used within an AnalyticsProvider component.
 * 
 * @hook
 * @returns {AnalyticsContextType} Analytics context methods and data
 * @throws {Error} If used outside of AnalyticsProvider
 * 
 * @example
 * ```tsx
 * const { recordInteraction, analyticsData } = useAnalytics();
 * 
 * // Record a user interaction
 * recordInteraction({ 
 *   type: 'zoom', 
 *   details: { scale: 1.5 } 
 * });
 * 
 * // Access current analytics data
 * console.log(analyticsData.interactions.length);
 * ```
 */
export const useAnalytics = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

export default AnalyticsContext;