import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAnalytics } from './contexts/AnalyticsContext';
import { PdfProvider, usePdf } from './pdf/PdfContext';
import { localLibraryRepo } from './features/library/localRepo';
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
  const [isAnalyticsEnabled, setIsAnalyticsEnabled] = useState(false);
  const [selectedAnalyticsType, setSelectedAnalyticsType] = useState<string>('none');
  const { document: pdfDocument, setFile } = usePdf();
  const { recordInteraction } = useAnalytics();
  const [searchParams] = useSearchParams();
  
  // Load PDF from library if localId is provided
  useEffect(() => {
    const localId = searchParams.get('localId');
    if (localId) {
      loadPDFFromLibrary(localId);
    }
  }, [searchParams]);

  const loadPDFFromLibrary = async (localId: string) => {
    try {
      const pdf = await localLibraryRepo.get(localId);
      if (pdf) {
        // Convert blob to Uint8Array
        const arrayBuffer = await pdf.blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        setFile(uint8Array);
      } else {
        console.error('PDF not found in library:', localId);
      }
    } catch (error) {
      console.error('Failed to load PDF from library:', error);
    }
  };


  const handleAnalyticsButtonClick = () => {
    // Don't toggle the dropdown off here - let the PDFViewer handle dropdown state
    setShowAnalyticsDropdown(!showAnalyticsDropdown);
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

  const handleExportAnalytics = () => {
    console.log('PDFViewerAppContent: Export analytics button clicked');
    setShowExport(true);
  };

  return (
    <div className="transition-[margin] duration-200 ease-out min-w-0">
      <div className="app-container min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <GlassViewLayout
        onFileUpload={handleFileUpload}
        onOpenSettings={() => setShowSettings(true)}
        onExportAnalytics={handleExportAnalytics}
        onToggleAnalytics={handleAnalyticsButtonClick}
        isAnalyticsEnabled={isAnalyticsEnabled}
      >
        <PDFViewerWithFeatures 
          onFileUpload={handleFileUpload}
          onDownload={() => console.log('Download PDF')}
          onExportAnalytics={handleExportAnalytics}
          isAnalyticsEnabled={isAnalyticsEnabled}
          onToggleAnalytics={handleAnalyticsButtonClick}
          onAnalyticsTypeChange={(type) => {
            console.log('🔥 PDFViewerApp: Analytics type changing from', selectedAnalyticsType, 'to', type);
            
            // Update state based on type
            const newIsEnabled = type !== 'none';
            
            // Only update state if values actually changed
            if (newIsEnabled !== isAnalyticsEnabled || type !== selectedAnalyticsType) {
              setIsAnalyticsEnabled(newIsEnabled);
              setSelectedAnalyticsType(type);
              
              // Update global element immediately with new values
              let analyticsElement = window.document.getElementById('analytics-live-view-element');
              if (!analyticsElement) {
                analyticsElement = window.document.createElement('div');
                analyticsElement.id = 'analytics-live-view-element';
                analyticsElement.style.display = 'none';
                window.document.body.appendChild(analyticsElement);
                console.log('PDFViewerApp: Created analytics element');
              }
              
              analyticsElement.setAttribute('data-analytics-live-view', newIsEnabled ? 'true' : 'false');
              analyticsElement.setAttribute('data-analytics-type', type);
              
              console.log('🚀 PDFViewerApp: Analytics state updated:', { 
                isEnabled: newIsEnabled, 
                type: type,
                element: analyticsElement
              });
            }
          }}
          selectedAnalyticsType={selectedAnalyticsType}
        />
      </GlassViewLayout>

      {showSettings && (
        <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      )}

      {showExport && (
        <div className="modal-overlay">
          <ExportPanel onClose={() => setShowExport(false)} />
        </div>
      )}
      </div>
    </div>
  );
};

const PDFViewerApp: React.FC = () => {
  return (
    <PdfProvider>
      <PDFViewerAppContent />
    </PdfProvider>
  );
};

export default PDFViewerApp;
