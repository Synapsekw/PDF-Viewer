import React, { useRef, useEffect } from 'react';
import { PDFViewer } from './PDFViewer';
import { FeatureRegistry } from '../../features/base/FeatureRegistry';
import { getPlugins } from '../../plugins';
import { PdfFeatureProps } from '../../pdf/types';

interface PDFViewerWithFeaturesProps {
  onToggleOutline?: () => void;
}

export const PDFViewerWithFeatures: React.FC<PDFViewerWithFeaturesProps> = ({ onToggleOutline }) => {
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
      <PDFViewer onToggleOutline={onToggleOutline} canvasRef={canvasRef} />
      
      {/* Render all registered features */}
      {FeatureRegistry.getAllFeatures().map((feature) => {
        const FeatureComponent = feature.Component;
        const featureProps: PdfFeatureProps = {
          canvasRef,
          containerRef,
        };
        
        return (
          <FeatureComponent
            key={feature.displayName}
            {...featureProps}
          />
        );
      })}
    </div>
  );
};

export default PDFViewerWithFeatures;
