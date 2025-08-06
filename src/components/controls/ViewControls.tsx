import React from 'react';
import { usePdf } from '../../pdf/PdfContext';
import { useAnalytics } from '../../contexts/AnalyticsContext';

export const ViewControls: React.FC = () => {
  const { scale, rotation, setScale, setRotation } = usePdf();
  const { recordInteraction } = useAnalytics();

  const zoomIn = () => {
    const newScale = scale * 1.2;
    setScale(newScale);
    recordInteraction({ 
      type: 'zoom', 
      details: { action: 'zoom_in', from: scale, to: newScale } 
    });
  };

  const zoomOut = () => {
    const newScale = scale / 1.2;
    setScale(newScale);
    recordInteraction({ 
      type: 'zoom', 
      details: { action: 'zoom_out', from: scale, to: newScale } 
    });
  };

  const resetZoom = () => {
    setScale(1.0);
    recordInteraction({ 
      type: 'zoom', 
      details: { action: 'reset', from: scale, to: 1.0 } 
    });
  };

  const rotate = () => {
    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);
    recordInteraction({ 
      type: 'rotate', 
      details: { from: rotation, to: newRotation } 
    });
  };

  const resetRotation = () => {
    setRotation(0);
    recordInteraction({ 
      type: 'rotate', 
      details: { action: 'reset', from: rotation, to: 0 } 
    });
  };

  const resetView = () => {
    resetZoom();
    resetRotation();
    recordInteraction({ 
      type: 'zoom', 
      details: { action: 'reset_all' } 
    });
  };

  return (
    <div className="view-controls">
      <div className="zoom-controls">
        <button onClick={zoomOut}>-</button>
        <button onClick={resetZoom}>{Math.round(scale * 100)}%</button>
        <button onClick={zoomIn}>+</button>
      </div>
      <div className="rotation-controls">
        <button onClick={rotate}>Rotate</button>
        <button onClick={resetView}>Reset View</button>
      </div>
    </div>
  );
};

export default ViewControls;