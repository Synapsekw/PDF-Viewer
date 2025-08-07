import React, { useState } from 'react';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import { usePdf } from '../../pdf/PdfContext';

interface ExportPanelProps {
  onClose: () => void;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ onClose }) => {
  const { getAnalyticsReport, exportAsJSON, exportAsHTML } = useAnalytics();
  const { currentPage } = usePdf();
  const [exportFormat, setExportFormat] = useState<'json' | 'html'>('json');
  const [includeScreenshot, setIncludeScreenshot] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Debug: Log when component mounts
  React.useEffect(() => {
    console.log('ExportPanel: Component mounted');
    const report = getAnalyticsReport();
    console.log('ExportPanel: Analytics data available:', {
      pageViews: report.pageViews.length,
      interactions: report.interactions.length,
      totalDuration: report.totalDuration,
      currentPage
    });
  }, [getAnalyticsReport, currentPage]);

  const captureCanvasScreenshot = (): string | null => {
    // Try to find the PDF canvas in the DOM
    const canvas = document.querySelector('canvas');
    if (!canvas) return null;
    
    try {
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Failed to capture canvas screenshot:', error);
      return null;
    }
  };

  const downloadFile = (content: string, filename: string, contentType: string) => {
    console.log('ExportPanel: Downloading file:', filename, 'size:', content.length, 'type:', contentType);
    
    try {
      const blob = new Blob([content], { type: contentType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('ExportPanel: File download initiated successfully');
    } catch (error) {
      console.error('ExportPanel: File download failed:', error);
      throw error;
    }
  };

  const handleExport = async () => {
    console.log('ExportPanel: Export button clicked');
    setIsExporting(true);
    
    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      console.log('ExportPanel: Starting export with format:', exportFormat);
      
      if (exportFormat === 'json') {
        let exportData = getAnalyticsReport();
        console.log('ExportPanel: Got analytics report:', exportData);
        
        // Add screenshot if requested
        if (includeScreenshot) {
          const screenshot = captureCanvasScreenshot();
          if (screenshot) {
            console.log('ExportPanel: Screenshot captured, size:', screenshot.length);
            const exportDataWithScreenshot = {
              ...exportData,
              currentPageScreenshot: {
                pageNumber: currentPage,
                dataUrl: screenshot,
                timestamp: Date.now(),
              }
            };
            const jsonContent = JSON.stringify(exportDataWithScreenshot, null, 2);
            downloadFile(jsonContent, `pdf-analytics-${timestamp}.json`, 'application/json');
          } else {
            console.log('ExportPanel: No screenshot available');
            const jsonContent = JSON.stringify(exportData, null, 2);
            downloadFile(jsonContent, `pdf-analytics-${timestamp}.json`, 'application/json');
          }
        } else {
          const jsonContent = JSON.stringify(exportData, null, 2);
          downloadFile(jsonContent, `pdf-analytics-${timestamp}.json`, 'application/json');
        }
      } else if (exportFormat === 'html') {
        console.log('ExportPanel: Generating HTML report');
        let htmlContent = exportAsHTML();
        
        // Add screenshot to HTML if requested
        if (includeScreenshot) {
          const screenshot = captureCanvasScreenshot();
          if (screenshot) {
            console.log('ExportPanel: Adding screenshot to HTML report');
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
      
      console.log('ExportPanel: Export completed successfully');
      onClose();
    } catch (error) {
      console.error('ExportPanel: Export failed:', error);
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
      
      <style>{`
        .export-panel {
          padding: 24px;
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 600px;
        }
        
        .export-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .export-header h2 {
          font-size: 24px;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          color: #666;
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: all 0.2s;
        }
        
        .close-button:hover {
          background: #f0f0f0;
          color: #333;
        }
        
        .export-preview {
          background: #f7f9fc;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 24px;
        }
        
        .export-preview h3 {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin: 0 0 16px 0;
        }
        
        .preview-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        
        .stat-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .stat-label {
          color: #666;
          font-size: 14px;
        }
        
        .stat-value {
          color: #333;
          font-weight: 600;
          font-size: 14px;
        }
        
        .export-options h3 {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin: 0 0 16px 0;
        }
        
        .option-group {
          margin-bottom: 20px;
        }
        
        .option-group > label {
          display: block;
          font-weight: 500;
          color: #333;
          margin-bottom: 8px;
        }
        
        .radio-group {
          display: flex;
          gap: 24px;
        }
        
        .radio-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          color: #666;
        }
        
        .radio-group input[type="radio"] {
          cursor: pointer;
        }
        
        .option-group input[type="checkbox"] {
          margin-right: 8px;
          cursor: pointer;
        }
        
        .format-description {
          background: #f0f4f8;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 24px;
        }
        
        .format-description p {
          margin: 0;
          font-size: 14px;
          color: #666;
          line-height: 1.5;
        }
        
        .export-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }
        
        .export-button {
          padding: 10px 24px;
          border-radius: 8px;
          border: none;
          font-weight: 500;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .export-button.primary {
          background: #2563eb;
          color: white;
        }
        
        .export-button.primary:hover:not(:disabled) {
          background: #1d4ed8;
        }
        
        .export-button.primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .export-button.secondary {
          background: #e5e7eb;
          color: #374151;
        }
        
        .export-button.secondary:hover {
          background: #d1d5db;
        }
      `}</style>
    </div>
  );
};

export default ExportPanel;