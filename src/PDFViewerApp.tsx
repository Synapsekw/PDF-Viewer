import React, { useState } from 'react';
import { AnalyticsProvider, useAnalytics } from './contexts/AnalyticsContext';
import { PdfProvider, usePdf } from './pdf/PdfContext';
import { ThemeProvider } from './theme/ThemeProvider';
import { GlassViewLayout } from './components/layout';
import { PDFViewerWithFeatures } from './components/pdf/PDFViewerWithFeatures';
import { SettingsModal } from './components/settings';
import { ExportPanel } from './features/export/ExportPanel';
import './index.css';

// AI Assistant Logic
interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

const PDFViewerAppContent: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showAnalyticsDropdown, setShowAnalyticsDropdown] = useState(false);
  const [selectedAnalyticsType, setSelectedAnalyticsType] = useState<string>('mouse-heatmap');
  const { document: pdfDocument, setFile } = usePdf();
  const { recordInteraction } = useAnalytics();

  const handleToggleAnalytics = (analyticsType: string) => {
    setSelectedAnalyticsType(analyticsType);
    setShowAnalyticsDropdown(false);
    
    // Update the analytics-live-view-element with the selected type
    const analyticsElement = document.getElementById('analytics-live-view-element');
    if (analyticsElement) {
      analyticsElement.setAttribute('data-analytics-type', analyticsType);
      analyticsElement.setAttribute('data-analytics-enabled', 'true');
      console.log('Analytics dropdown: Updated analytics element with type:', analyticsType);
    }
    
    recordInteraction({
      type: 'click',
      details: { action: 'toggle_analytics', analyticsType }
    });
  };

  const handleAnalyticsButtonClick = () => {
    if (showAnalyticsDropdown) {
      setShowAnalyticsDropdown(false);
      // Disable analytics
      const analyticsElement = document.getElementById('analytics-live-view-element');
      if (analyticsElement) {
        analyticsElement.setAttribute('data-analytics-enabled', 'false');
      }
    } else {
      setShowAnalyticsDropdown(true);
    }
  };

  const handleFileUpload = (file: File) => {
    console.log('PDFViewerAppContent: File upload triggered:', file.name, file.size);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (result instanceof ArrayBuffer) {
        const uint8Array = new Uint8Array(result);
        console.log('PDFViewerAppContent: Converting file to Uint8Array:', uint8Array.length, 'bytes');
        setFile(uint8Array);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="app-container">
      <GlassViewLayout
        onFileUpload={handleFileUpload}
        onOpenSettings={() => setShowSettings(true)}
        onExportAnalytics={() => setShowExport(true)}
        onToggleAnalytics={handleAnalyticsButtonClick}
        isAnalyticsEnabled={showAnalyticsDropdown}
      >
        <PDFViewerWithFeatures />
      </GlassViewLayout>

      {showSettings && (
        <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      )}

      {showExport && (
        <ExportPanel onClose={() => setShowExport(false)} />
      )}
    </div>
  );
};

const PDFViewerApp: React.FC = () => {
  console.log('PDFViewerApp component rendering - FULL VERSION');
  
  return (
    <ThemeProvider>
      <AnalyticsProvider>
        <PdfProvider>
          <PDFViewerAppContent />
        </PdfProvider>
      </AnalyticsProvider>
    </ThemeProvider>
  );
};

export default PDFViewerApp;
