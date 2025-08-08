import React, { useRef, useEffect } from 'react';
import { PDFViewer } from './PDFViewer';
import { FeatureRegistry } from '../../features/base/FeatureRegistry';
import { getPlugins } from '../../plugins';
import { PdfFeatureProps } from '../../pdf/types';

interface PDFViewerWithFeaturesProps {
  onToggleOutline?: () => void;
  onFileUpload?: (file: File) => void;
  onDownload?: () => void;
  onExportAnalytics?: () => void;
  isAnalyticsEnabled?: boolean;
  onToggleAnalytics?: () => void;
  onAnalyticsTypeChange?: (type: string) => void;
  selectedAnalyticsType?: string;
}

export const PDFViewerWithFeatures: React.FC<PDFViewerWithFeaturesProps> = ({ 
  onToggleOutline, 
  onFileUpload,
  onDownload,
  onExportAnalytics,
  isAnalyticsEnabled,
  onToggleAnalytics,
  onAnalyticsTypeChange,
  selectedAnalyticsType
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Register plugins when component mounts
  useEffect(() => {
    const enabledPlugins = getPlugins();
    
    // Register all enabled plugins
    enabledPlugins.forEach(plugin => {
      console.log(`Registering plugin: ${plugin.name}`);
      FeatureRegistry.register(plugin.component);
    });

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up feature registry');
      FeatureRegistry.clear();
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Debug element to check if PDFViewerWithFeatures is rendering */}
      <div style={{
        position: 'absolute',
        top: '0px',
        left: '0px',
        padding: '5px',
        backgroundColor: 'cyan',
        color: 'black',
        zIndex: 1001,
        fontSize: '12px',
      }}>
        PDFViewerWithFeatures Debug
      </div>
      
      <PDFViewer 
        onToggleOutline={onToggleOutline} 
        canvasRef={canvasRef} 
        onFileUpload={onFileUpload}
        onDownload={onDownload}
        onExportAnalytics={onExportAnalytics}
        isAnalyticsEnabled={isAnalyticsEnabled}
        onToggleAnalytics={onToggleAnalytics}
        onAnalyticsTypeChange={onAnalyticsTypeChange}
        selectedAnalyticsType={selectedAnalyticsType}
      />
      
      {/* Render all registered features */}
      {FeatureRegistry.getAllFeatures().map((feature) => {
        const FeatureComponent = feature.Component;
        const featureProps: PdfFeatureProps = {
          canvasRef,
          containerRef,
        };
        
        // Add analytics props for analytics components
        const enhancedProps = {
          ...featureProps,
          isAnalyticsEnabled,
          selectedAnalyticsType,
        };
        
        console.log('PDFViewerWithFeatures: Passing props to', feature.displayName, {
          isAnalyticsEnabled,
          selectedAnalyticsType
        });
        
        return (
          <FeatureComponent
            key={feature.displayName}
            {...enhancedProps}
          />
        );
      })}
    </div>
  );
};

export default PDFViewerWithFeatures;
