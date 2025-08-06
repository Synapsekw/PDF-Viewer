import React, { useEffect, useState } from 'react';
import { usePdf } from '../../pdf/PdfContext';
import { PdfFeatureComponent, PdfFeatureProps } from '../base/types';
import { FeatureOverlay } from '../base/FeatureOverlay';

const AnalyticsOverlayComponent: React.FC<PdfFeatureProps> = ({ canvasRef, containerRef }) => {
  const { currentPage, totalPages } = usePdf();
  const [viewTime, setViewTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setViewTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <FeatureOverlay 
      canvasRef={canvasRef}
      containerRef={containerRef} 
      className="analytics-overlay" 
      zIndex={2}
    >
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          pointerEvents: 'none',
        }}
      >
        <div>Page: {currentPage}/{totalPages}</div>
        <div>View Time: {viewTime}s</div>
        <div>Dummy Heat Map Active</div>
      </div>
    </FeatureOverlay>
  );
};

export const AnalyticsOverlay: PdfFeatureComponent = {
  metadata: {
    id: 'analytics-overlay',
    name: 'Analytics Overlay',
    description: 'Displays viewing analytics and heatmap',
    version: '1.0.0',
  },
  Component: AnalyticsOverlayComponent,
};

export default AnalyticsOverlay;