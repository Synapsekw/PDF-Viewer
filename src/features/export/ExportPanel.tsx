import React, { useState } from 'react';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import { usePdf } from '../../pdf/PdfContext';

interface ExportPanelProps {
  onClose: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ onClose, canvasRef }) => {
  const { getAnalyticsReport, exportAsJSON, exportAsHTML } = useAnalytics();
  const { currentPage } = usePdf();
  const [exportFormat, setExportFormat] = useState<'json' | 'html'>('json');
  const [includeScreenshot, setIncludeScreenshot] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const captureCanvasScreenshot = (): string | null => {
    if (!canvasRef.current) return null;
    
    try {
      return canvasRef.current.toDataURL('image/png');
    } catch (error) {
      console.error('Failed to capture canvas screenshot:', error);
      return null;
    }
  };

  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      
      if (exportFormat === 'json') {
        let exportData = getAnalyticsReport();
        
        // Add screenshot if requested
        if (includeScreenshot) {
          const screenshot = captureCanvasScreenshot();
          if (screenshot) {
            exportData = {
              ...exportData,
              currentPageScreenshot: {
                pageNumber: currentPage,
                dataUrl: screenshot,
                timestamp: Date.now(),
              }
            };
          }
        }
        
        const jsonContent = JSON.stringify(exportData, null, 2);
        downloadFile(jsonContent, `pdf-analytics-${timestamp}.json`, 'application/json');
      } else if (exportFormat === 'html') {
        let htmlContent = exportAsHTML();
        
        // Add screenshot to HTML if requested
        if (includeScreenshot) {
          const screenshot = captureCanvasScreenshot();
          if (screenshot) {
            const screenshotSection = `
    <div class="section">
        <h2>Current Page Screenshot</h2>
        <p><strong>Page ${currentPage}</strong> - Captured at ${new Date().toLocaleString()}</p>
        <div style="text-align: center; margin: 20px 0;">
            <img src="${screenshot}" alt="Page ${currentPage} Screenshot" style="max-width: 100%; border: 1px solid #ddd; border-radius: 5px;" />
        </div>
    </div>`;
            
            // Insert before the closing body tag
            htmlContent = htmlContent.replace('</body>', screenshotSection + '\n</body>');
          }
        }
        
        downloadFile(htmlContent, `pdf-analytics-report-${timestamp}.html`, 'text/html');
      }
      
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const previewData = () => {
    const report = getAnalyticsReport();
    const formatDuration = (ms: number) => {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      return `${minutes}m ${seconds % 60}s`;
    };

    return {
      sessionDuration: formatDuration(report.totalDuration),
      pagesViewed: report.pageViews.length,
      totalInteractions: report.interactions.length,
      mostViewedPage: report.pageViews.length > 0 
        ? report.pageViews.reduce((max, pv) => pv.totalTime > max.totalTime ? pv : max).pageNumber
        : 'N/A',
      averageTimePerPage: report.pageViews.length > 0 
        ? formatDuration(report.pageViews.reduce((sum, pv) => sum + pv.totalTime, 0) / report.pageViews.length)
        : 'N/A',
    };
  };

  const preview = previewData();

  return (
    <div className="export-panel">
      <div className="export-header">
        <h2>Export Analytics Data</h2>
        <button onClick={onClose} className="close-button">✕</button>
      </div>

      <div className="export-content">
        <div className="export-preview">
          <h3>Session Summary</h3>
          <div className="preview-stats">
            <div className="stat-item">
              <span className="stat-label">Session Duration:</span>
              <span className="stat-value">{preview.sessionDuration}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Pages Viewed:</span>
              <span className="stat-value">{preview.pagesViewed}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Interactions:</span>
              <span className="stat-value">{preview.totalInteractions}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Most Viewed Page:</span>
              <span className="stat-value">{preview.mostViewedPage}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Avg. Time per Page:</span>
              <span className="stat-value">{preview.averageTimePerPage}</span>
            </div>
          </div>
        </div>

        <div className="export-options">
          <h3>Export Options</h3>
          
          <div className="option-group">
            <label>Export Format:</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  value="json"
                  checked={exportFormat === 'json'}
                  onChange={(e) => setExportFormat(e.target.value as 'json')}
                />
                JSON (Raw Data)
              </label>
              <label>
                <input
                  type="radio"
                  value="html"
                  checked={exportFormat === 'html'}
                  onChange={(e) => setExportFormat(e.target.value as 'html')}
                />
                HTML Report
              </label>
            </div>
          </div>

          <div className="option-group">
            <label>
              <input
                type="checkbox"
                checked={includeScreenshot}
                onChange={(e) => setIncludeScreenshot(e.target.checked)}
              />
              Include current page screenshot
            </label>
          </div>

          <div className="format-description">
            {exportFormat === 'json' && (
              <p>JSON format provides raw analytics data suitable for further processing or analysis tools.</p>
            )}
            {exportFormat === 'html' && (
              <p>HTML format generates a comprehensive, styled report that can be viewed in any web browser.</p>
            )}
          </div>
        </div>

        <div className="export-actions">
          <button 
            onClick={handleExport} 
            disabled={isExporting}
            className="export-button primary"
          >
            {isExporting ? 'Exporting...' : `Export as ${exportFormat.toUpperCase()}`}
          </button>
          <button onClick={onClose} className="export-button secondary">
            Cancel
          </button>
        </div>
      </div>


    </div>
  );
};

export default ExportPanel;