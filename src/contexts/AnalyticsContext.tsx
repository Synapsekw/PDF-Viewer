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
        startTime: prev.startTime || Date.now(), // Ensure start time is set
      }));
      
      console.debug('📊 Analytics auto-started - PDF loaded with', totalPages, 'pages');
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

  // Auto-start analytics tracking when document loads
  useEffect(() => {
    if (totalPages > 0) {
      recordInteraction({
        type: 'click',
        details: { 
          action: 'pdf_loaded', 
          totalPages,
          documentInfo: {
            fileName: 'uploaded_pdf.pdf',
            loadTime: Date.now(),
          }
        },
      });
    }
  }, [totalPages]); // Removed recordInteraction from deps to prevent infinite loop

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

    // Generate analytics visualization for each page
    const generatePageAnalytics = (pageNumber: number) => {
      const pageView = report.pageViews.find(pv => pv.pageNumber === pageNumber);
      const pageInteractions = report.interactions.filter(i => i.pageNumber === pageNumber);
      const pageHeatmapData = report.heatmapData && report.heatmapData[pageNumber];
      
      const clicks = pageInteractions.filter(i => i.type === 'click');
      const scrolls = pageInteractions.filter(i => i.type === 'scroll');
      const zooms = pageInteractions.filter(i => i.type === 'zoom');
      
      const interactionDots = pageInteractions
        .filter(interaction => interaction.details && 
               typeof interaction.details.x === 'number' && 
               typeof interaction.details.y === 'number')
        .map(interaction => {
          let color = '#4ecdc4';
          let size = 8;
          
          switch (interaction.type) {
            case 'click': color = '#4ecdc4'; size = 8; break;
            case 'scroll': color = '#96ceb4'; size = 6; break;
            case 'zoom': color = '#feca57'; size = 10; break;
            case 'rotate': color = '#ff6b6b'; size = 12; break;
          }
          
                      return `
            <div class="interaction-dot" 
                 style="position: absolute; 
                        left: ${interaction.details?.x || 0}px; 
                        top: ${interaction.details?.y || 0}px; 
                        width: ${size}px; 
                        height: ${size}px; 
                        background: ${color}; 
                        border-radius: 50%; 
                        border: 2px solid white; 
                        box-shadow: 0 0 4px rgba(0,0,0,0.3);
                        z-index: 10;"
                 title="${interaction.type} at ${formatTime(interaction.timestamp)}">
            </div>`;
        }).join('');

      const heatmapVisualization = pageHeatmapData ? `
        <div class="heatmap-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.6; z-index: 5;">
          ${pageHeatmapData.positions ? pageHeatmapData.positions.map((pos: any) => `
            <div style="position: absolute; 
                        left: ${pos.x - 15}px; 
                        top: ${pos.y - 15}px; 
                        width: 30px; 
                        height: 30px; 
                        background: radial-gradient(circle, rgba(255,107,107,0.6) 0%, rgba(255,107,107,0.1) 100%); 
                        border-radius: 50%; 
                        pointer-events: none;">
            </div>
          `).join('') : ''}
        </div>
      ` : '';

      return `
        <div class="page-analytics" style="page-break-before: always; margin-bottom: 40px;">
          <h3>Page ${pageNumber} Analytics</h3>
          
          <div class="page-stats" style="margin-bottom: 20px;">
            <div class="page-metric">
              <span class="label">Time Spent:</span>
              <span class="value">${pageView ? formatDuration(pageView.totalTime) : '0s'}</span>
            </div>
            <div class="page-metric">
              <span class="label">Interactions:</span>
              <span class="value">${pageInteractions.length}</span>
            </div>
            <div class="page-metric">
              <span class="label">Clicks:</span>
              <span class="value">${clicks.length}</span>
            </div>
            <div class="page-metric">
              <span class="label">Scrolls:</span>
              <span class="value">${scrolls.length}</span>
            </div>
            <div class="page-metric">
              <span class="label">Zooms:</span>
              <span class="value">${zooms.length}</span>
            </div>
          </div>

          <div class="page-visualization" style="position: relative; width: 100%; min-height: 600px; border: 1px solid #ddd; border-radius: 5px; background: #f9f9f9; overflow: hidden;">
            <div class="page-placeholder" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: #666;">
              <h4>PDF Page ${pageNumber}</h4>
              <p>Analytics Overlay Visualization</p>
            </div>
            
            ${heatmapVisualization}
            ${interactionDots}
            
            <div class="analytics-legend" style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.8); color: white; padding: 8px; border-radius: 4px; font-size: 11px;">
              <div style="margin-bottom: 4px; font-weight: bold;">Interaction Types:</div>
              <div style="display: flex; align-items: center; margin-bottom: 2px;">
                <div style="width: 8px; height: 8px; border-radius: 50%; background: #4ecdc4; margin-right: 6px;"></div>
                <span>Clicks</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 2px;">
                <div style="width: 6px; height: 6px; border-radius: 50%; background: #96ceb4; margin-right: 6px;"></div>
                <span>Scrolls</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 2px;">
                <div style="width: 10px; height: 10px; border-radius: 50%; background: #feca57; margin-right: 6px;"></div>
                <span>Zooms</span>
              </div>
              ${pageHeatmapData ? '<div style="margin-top: 4px; color: #ff6b6b;">🔥 Mouse Heatmap</div>' : ''}
            </div>
          </div>
        </div>
      `;
    };

    // Generate analytics for all pages that were viewed
    const viewedPages = [...new Set(report.pageViews.map(pv => pv.pageNumber))].sort((a, b) => a - b);
    const pageAnalytics = viewedPages.map(generatePageAnalytics).join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDF Analytics Report - All Pages</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .section { margin-bottom: 30px; }
        .metric { display: inline-block; margin: 10px; padding: 15px; background: #e9f5ff; border-radius: 5px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #0066cc; }
        .metric-label { font-size: 14px; color: #666; }
        .page-metric { display: inline-block; margin: 5px 10px; padding: 8px 12px; background: #f0f8ff; border-radius: 3px; font-size: 12px; }
        .page-metric .label { color: #666; margin-right: 5px; }
        .page-metric .value { font-weight: bold; color: #0066cc; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .chart-placeholder { background: #f9f9f9; padding: 20px; text-align: center; border-radius: 5px; margin: 10px 0; }
        .page-analytics { margin-bottom: 40px; }
        .interaction-dot { transition: all 0.3s ease; }
        .interaction-dot:hover { transform: scale(1.5); }
        @media print { .page-analytics { page-break-inside: avoid; } }
        .toc { background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .toc ul { list-style: none; padding-left: 0; }
        .toc li { margin: 5px 0; }
        .toc a { text-decoration: none; color: #0066cc; }
        .toc a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 PDF Analytics Report - All Pages</h1>
        <p><strong>Session ID:</strong> ${report.sessionId}</p>
        <p><strong>Generated:</strong> ${formatTime(Date.now())}</p>
        <p><strong>Session Duration:</strong> ${formatDuration(report.totalDuration)}</p>
        <p><strong>PDF File:</strong> ${report.pdfFileName || 'Unknown'}</p>
    </div>

    <div class="toc">
        <h3>📑 Table of Contents</h3>
        <ul>
            <li><a href="#overview">📈 Overview</a></li>
            <li><a href="#summary">📋 Page Summary</a></li>
            <li><a href="#timeline">⏰ Interaction Timeline</a></li>
            <li><a href="#pages">📄 Page-by-Page Analytics</a></li>
            <li><a href="#session">🎯 Session Summary</a></li>
        </ul>
    </div>

    <div class="section" id="overview">
        <h2>📈 Overview</h2>
        <div class="metric">
            <div class="metric-value">${report.totalPages}</div>
            <div class="metric-label">Total Pages</div>
        </div>
        <div class="metric">
            <div class="metric-value">${viewedPages.length}</div>
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

    <div class="section" id="summary">
        <h2>📋 Page Summary</h2>
        <table>
            <thead>
                <tr>
                    <th>Page</th>
                    <th>Time Spent</th>
                    <th>Total Interactions</th>
                    <th>Clicks</th>
                    <th>Scrolls</th>
                    <th>Zooms</th>
                    <th>Mouse Activity</th>
                </tr>
            </thead>
            <tbody>
                ${viewedPages.map(pageNum => {
                  const pv = report.pageViews.find(p => p.pageNumber === pageNum);
                  const interactions = report.interactions.filter(i => i.pageNumber === pageNum);
                  const clicks = interactions.filter(i => i.type === 'click').length;
                  const scrolls = interactions.filter(i => i.type === 'scroll').length;
                  const zooms = interactions.filter(i => i.type === 'zoom').length;
                  const heatmapData = report.heatmapData && report.heatmapData[pageNum];
                  const mouseActivity = heatmapData && heatmapData.positions ? heatmapData.positions.length : 0;
                  
                  return `
                    <tr>
                        <td><a href="#page-${pageNum}">Page ${pageNum}</a></td>
                        <td>${pv ? formatDuration(pv.totalTime) : '0s'}</td>
                        <td>${interactions.length}</td>
                        <td>${clicks}</td>
                        <td>${scrolls}</td>
                        <td>${zooms}</td>
                        <td>${mouseActivity} positions</td>
                    </tr>
                  `;
                }).join('')}
            </tbody>
        </table>
    </div>

    <div class="section" id="timeline">
        <h2>⏰ Interaction Timeline (Last 50)</h2>
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
                ${report.interactions.slice(-50).map(interaction => `
                    <tr>
                        <td>${formatTime(interaction.timestamp)}</td>
                        <td>Page ${interaction.pageNumber}</td>
                        <td>${interaction.type}</td>
                        <td>${interaction.details ? JSON.stringify(interaction.details).slice(0, 100) : '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section" id="pages">
        <h2>📄 Page-by-Page Analytics with Visualizations</h2>
        <p style="color: #666; margin-bottom: 30px;">
            Each page shows interaction points overlaid where you clicked, scrolled, and zoomed. 
            Heatmap areas show where your mouse spent the most time.
        </p>
        ${pageAnalytics}
    </div>

    <div class="section" id="session">
        <h2>🎯 Session Summary</h2>
        <div style="background: #f0f8ff; padding: 20px; border-radius: 5px; border-left: 4px solid #0066cc;">
            <p><strong>📈 Most Viewed Page:</strong> ${report.pageViews.length > 0 ? 'Page ' + report.pageViews.reduce((max, pv) => pv.totalTime > max.totalTime ? pv : max).pageNumber : 'N/A'}</p>
            <p><strong>⏱️ Average Time per Page:</strong> ${report.pageViews.length > 0 ? formatDuration(report.pageViews.reduce((sum, pv) => sum + pv.totalTime, 0) / report.pageViews.length) : 'N/A'}</p>
            <p><strong>🖱️ Total Interactions:</strong> ${report.interactions.length}</p>
            <p><strong>📊 Pages with Analytics Data:</strong> ${viewedPages.length} of ${report.totalPages}</p>
            <p><strong>🔥 Heatmap Data:</strong> ${report.heatmapData ? Object.keys(report.heatmapData).length + ' pages tracked' : 'No heatmap data'}</p>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #fff9e6; border-radius: 5px; border: 1px solid #ffd700;">
            <h4>💡 Reading Insights</h4>
            <ul>
                ${report.pageViews.length > 0 ? `<li>You spent the most time on Page ${report.pageViews.reduce((max, pv) => pv.totalTime > max.totalTime ? pv : max).pageNumber}</li>` : ''}
                ${report.interactions.filter(i => i.type === 'zoom').length > 0 ? `<li>You zoomed in/out ${report.interactions.filter(i => i.type === 'zoom').length} times across all pages</li>` : ''}
                ${report.interactions.filter(i => i.type === 'click').length > 0 ? `<li>You clicked ${report.interactions.filter(i => i.type === 'click').length} times throughout the session</li>` : ''}
                <li>Your session lasted ${formatDuration(report.totalDuration)} across ${viewedPages.length} pages</li>
            </ul>
        </div>
    </div>

    <footer style="margin-top: 50px; padding: 20px; text-align: center; background: #f4f4f4; border-radius: 5px; color: #666;">
        <p>Generated by PDF Viewer Analytics • ${formatTime(Date.now())}</p>
        <p>This report shows all your interactions with the PDF document, including mouse movements, clicks, scrolls, and time spent on each page.</p>
    </footer>
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