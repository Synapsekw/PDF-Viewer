import React, { useRef, useState, useEffect } from 'react';
import { PdfProvider } from './pdf/PdfContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { PdfEngine } from './pdf/PdfEngine';
import { FileUpload, Navigation, ViewControls, SnippingControls, ExportControls } from './components/controls';
import { Modal } from './components/Modal';
import { FeatureRegistry } from './features/base/FeatureRegistry';
import { SnippingToolEnhanced } from './features/snipping/SnippingTool';
import { ExportPanel } from './features/export/ExportPanel';
import { SelectionRect } from './features/snipping/types';
import { getPlugins, PluginConfig } from './plugins';
import './App.css';

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
 * - Plugin System: Dynamically loads enabled features
 * - Clean Separation: Features never touch PDF engine directly
 * 
 * @component
 */
const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSnippingEnabled, setIsSnippingEnabled] = useState(false);
  const [currentSelection, setCurrentSelection] = useState<SelectionRect | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [loadedPlugins, setLoadedPlugins] = useState<PluginConfig[]>([]);

  // Load and register plugins on mount
  useEffect(() => {
    const enabledPlugins = getPlugins(undefined, true);
    
    // Register plugins with the FeatureRegistry
    enabledPlugins.forEach(plugin => {
      FeatureRegistry.register(plugin.component);
    });
    
    setLoadedPlugins(enabledPlugins);
    
    console.debug(`Loaded ${enabledPlugins.length} plugins:`, 
      enabledPlugins.map(p => p.name).join(', '));
  }, []);

  const handleSnippingToggle = (enabled: boolean) => {
    setIsSnippingEnabled(enabled);
    if (!enabled) {
      setCurrentSelection(null);
    }
  };

  const handleSelectionChange = (selection: SelectionRect | null) => {
    setCurrentSelection(selection);
  };

  const handleSnippingAction = (action: string, data?: any) => {
    console.log(`Snipping action: ${action}`, data);
    
    if (action === 'copy' && data?.success) {
      // Show success feedback
    } else if (action === 'download') {
      // Show download feedback
    }
  };

  const handleOpenExportPanel = () => {
    setIsExportModalOpen(true);
  };

  const handleCloseExportPanel = () => {
    setIsExportModalOpen(false);
  };

  return (
    <PdfProvider>
      <AnalyticsProvider>
        <div className="app">
          <div className="toolbar">
            <FileUpload />
            <Navigation />
            <ViewControls />
            <SnippingControls 
              onToggle={handleSnippingToggle}
              onSnippingAction={handleSnippingAction}
            />
            <ExportControls onOpenExportPanel={handleOpenExportPanel} />
          </div>
        <div className="viewer" ref={containerRef}>
          <PdfEngine canvasRef={canvasRef} />
          
          {/* Dynamically loaded feature plugins */}
          {loadedPlugins.map(plugin => {
            const { Component } = plugin.component;
            return (
              <Component
                key={plugin.id}
                canvasRef={canvasRef}
                containerRef={containerRef}
              />
            );
          })}
          
          {/* Enhanced Snipping Tool - only render when enabled */}
          <SnippingToolEnhanced
            canvasRef={canvasRef}
            containerRef={containerRef}
            isEnabled={isSnippingEnabled}
            onSelectionChange={handleSelectionChange}
            onSnippingAction={handleSnippingAction}
          />
        </div>

        {/* Export Modal */}
        <Modal isOpen={isExportModalOpen} onClose={handleCloseExportPanel}>
          <ExportPanel 
            onClose={handleCloseExportPanel}
            canvasRef={canvasRef}
          />
        </Modal>
      </div>
    </AnalyticsProvider>
  </PdfProvider>
  );
};

export default App;