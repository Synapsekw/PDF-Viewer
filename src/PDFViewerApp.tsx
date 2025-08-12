import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAnalytics } from './contexts/AnalyticsContext';
import { PdfProvider, usePdf } from './pdf/PdfContext';
import { PDFViewerWithFeatures } from './components/pdf/PDFViewerWithFeatures';
import { AIAssistant } from './components/ai';
import { ExportPanel } from './features/export/ExportPanel';
import { repositoryManager } from './lib/repositories/RepositoryManager';
import './index.css';

const PDFViewerAppContent: React.FC = () => {
  const [showExport, setShowExport] = useState(false);
  const [isAnalyticsEnabled, setIsAnalyticsEnabled] = useState(false);
  const [selectedAnalyticsType, setSelectedAnalyticsType] = useState<string>('none');
  const { document: pdfDocument, setFile, setDocumentMeta } = usePdf();
  const { recordInteraction } = useAnalytics();
  const [searchParams] = useSearchParams();
  
  // Debug logging
  useEffect(() => {
    console.log('PDFViewerAppContent mounted');
  }, []);
  
  // Load PDF from library if documentId or localId is provided
  useEffect(() => {
    const documentId = searchParams.get('documentId') || searchParams.get('localId');
    console.log('PDFViewerApp: Checking for documentId/localId parameter:', documentId);
    if (documentId) {
      console.log('PDFViewerApp: Found documentId, loading PDF from library:', documentId);
      loadPDFFromLibrary(documentId);
    } else {
      console.log('PDFViewerApp: No documentId parameter found');
    }
  }, [searchParams]);

  const loadPDFFromLibrary = async (documentId: string) => {
    console.log('PDFViewerApp: loadPDFFromLibrary called with documentId:', documentId);
    try {
      const libraryRepo = repositoryManager.getLibraryRepository();
      console.log('PDFViewerApp: Got library repository:', libraryRepo);
      
      // Get PDF directly from library
      const pdf = await libraryRepo.get(documentId);
      console.log('PDFViewerApp: Got PDF from library:', pdf);
      
      if (pdf && pdf.blob) {
        // Convert blob to Uint8Array for PDF.js
        const arrayBuffer = await pdf.blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        setFile(uint8Array);
        
        // Set document metadata
        setDocumentMeta({ name: pdf.name, id: pdf.id });
        
        console.log('PDFViewerApp: PDF loaded from library blob');
      } else {
        console.error('PDFViewerApp: PDF not found or no blob available');
      }
    } catch (error) {
      console.error('PDFViewerApp: Error loading PDF from library:', error);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (result instanceof ArrayBuffer) {
          const uint8Array = new Uint8Array(result);
          setFile(uint8Array);
          console.log('PDFViewerApp: File uploaded successfully');
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('PDFViewerApp: Error uploading file:', error);
    }
  };

  const handleAnalyticsToggle = () => {
    setIsAnalyticsEnabled(!isAnalyticsEnabled);
    console.log('PDFViewerApp: Analytics toggled:', !isAnalyticsEnabled);
  };

  const handleAnalyticsTypeChange = (type: string) => {
    setSelectedAnalyticsType(type);
    console.log('PDFViewerApp: Analytics type changed:', type);
  };

  const handleExportToggle = () => {
    setShowExport(!showExport);
    console.log('PDFViewerApp: Export panel toggled:', !showExport);
  };

  return (
    <div className="pdf-viewer-layout relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex-container flex flex-col lg:flex-row h-full">
        {/* Main PDF Viewer */}
        <div className="pdf-viewer-container flex-item relative">
          <PDFViewerWithFeatures
            onFileUpload={handleFileUpload}
            onToggleAnalytics={handleAnalyticsToggle}
            onAnalyticsTypeChange={handleAnalyticsTypeChange}
            onExportAnalytics={handleExportToggle}
            isAnalyticsEnabled={isAnalyticsEnabled}
            selectedAnalyticsType={selectedAnalyticsType}
          />
        </div>

        {/* AI Assistant Panel */}
        <div className="ai-assistant-container w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-700/50 bg-slate-800/50 backdrop-blur-sm h-96 lg:h-full flex-shrink-0">
          <AIAssistant />
        </div>

        {/* Export Panel Overlay */}
        {showExport && (
          <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm">
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
