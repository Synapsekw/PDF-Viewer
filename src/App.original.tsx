import React, { useRef, useState } from 'react';
import { PdfProvider } from './pdf/PdfContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { ThemeProvider } from './theme/ThemeProvider';

import { GlassViewLayout } from './components/layout';
import { PDFViewer } from './components/pdf';
import { AIAssistant } from './components/ai';
import { SettingsModal } from './components/settings';
import { FeatureRegistry } from './features/base/FeatureRegistry';
import { getPlugins } from './plugins';


/**
 * Main PDF Viewer Application Component.
 * 
 * This component orchestrates the entire PDF viewing experience by:
 * - Managing PDF context and analytics providers
 * - Loading and rendering enabled plugins
 * - Providing core UI controls (upload, navigation, zoom, etc.)
 * - Handling feature integrations (snipping, export, etc.)
 * 
 * Architecture:
 * - PdfProvider: Manages PDF state and rendering
 * - AnalyticsProvider: Tracks user interactions and data
 * - ThemeProvider: Manages UI theme and background settings
 * - Plugin System: Dynamically loads enabled features
 * - Clean Separation: Features never touch PDF engine directly
 * 
 * @component
 */
const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isAnalyticsEnabled, setIsAnalyticsEnabled] = useState(false);

  const handleToggleOutline = () => {
    setShowSidebar(prev => !prev);
  };

  const handleOpenSettings = () => {
    setIsSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
  };

  const handleToggleAnalytics = () => {
    setIsAnalyticsEnabled(prev => !prev);
  };

  const handleExportAnalytics = () => {
    // In a real app, this would export analytics data
    console.log('Exporting analytics data...');
    alert('Analytics data exported!');
  };

  return (
    <ThemeProvider>
      <PdfProvider>
        <AnalyticsProvider>
          <Layout 
            sidebarContent={<AIAssistant />}
            showSidebar={showSidebar}
            onOpenSettings={handleOpenSettings}
            onToggleAnalytics={handleToggleAnalytics}
            isAnalyticsEnabled={isAnalyticsEnabled}
            onExportAnalytics={handleExportAnalytics}
          >
            <PDFViewer onToggleOutline={handleToggleOutline} />
            
            {/* Settings Modal */}
            <SettingsModal 
              isOpen={isSettingsOpen} 
              onClose={handleCloseSettings} 
            />
          </Layout>
        </AnalyticsProvider>
      </PdfProvider>
    </ThemeProvider>
  );
};

export default App;