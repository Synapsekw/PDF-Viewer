/**
 * Interaction points visualizer - shows click, scroll, and zoom events as colored dots
 */

import React, { useEffect, useRef, useState } from 'react';
import { usePdf } from '../../pdf/PdfContext';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import { PdfFeatureComponent, PdfFeatureProps } from '../../pdf/types';
import { FeatureOverlay } from '../base/FeatureOverlay';

interface InteractionPoint {
  x: number;
  y: number;
  type: 'click' | 'scroll' | 'zoom' | 'rotate';
  timestamp: number;
  details?: any;
}

const InteractionVisualizerComponent: React.FC<PdfFeatureProps> = ({ canvasRef, containerRef }) => {
  const { currentPage } = usePdf();
  const { getAnalyticsReport } = useAnalytics();
  const [isLiveViewEnabled, setIsLiveViewEnabled] = useState(false);
  const [selectedAnalyticsType, setSelectedAnalyticsType] = useState<string>('none');
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Monitor live view settings
  useEffect(() => {
    const checkLiveViewSettings = () => {
      const liveViewElement = document.getElementById('analytics-live-view-element');
      const isEnabled = liveViewElement?.getAttribute('data-analytics-live-view') === 'true';
      const analyticsType = liveViewElement?.getAttribute('data-analytics-type') || 'none';
      
      // Only update state if values have actually changed
      setIsLiveViewEnabled(prev => prev !== isEnabled ? isEnabled : prev);
      setSelectedAnalyticsType(prev => prev !== analyticsType ? analyticsType : prev);
    };

    checkLiveViewSettings();
    const interval = setInterval(checkLiveViewSettings, 100);
    return () => clearInterval(interval);
  }, []);

  // Render interaction points
  useEffect(() => {
    if (!isLiveViewEnabled || selectedAnalyticsType !== 'interactions') {
      return;
    }

    const canvas = overlayCanvasRef.current;
    const pdfCanvas = canvasRef.current;
    
    if (!canvas || !pdfCanvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // Match PDF canvas dimensions
      canvas.width = pdfCanvas.width;
      canvas.height = pdfCanvas.height;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Get current page interactions
      const analyticsData = getAnalyticsReport();
      const pageInteractions = analyticsData.interactions.filter(i => i.pageNumber === currentPage);

      // Convert interactions to points
      const interactionPoints: InteractionPoint[] = pageInteractions
        .filter(interaction => {
          // Only show interactions with position data
          return interaction.details && 
                 typeof interaction.details.x === 'number' && 
                 typeof interaction.details.y === 'number';
        })
        .map(interaction => ({
          x: interaction.details!.x,
          y: interaction.details!.y,
          type: interaction.type as any,
          timestamp: interaction.timestamp,
          details: interaction.details!,
        }));

      // Render interaction points
      interactionPoints.forEach((point, index) => {
        const age = Date.now() - point.timestamp;
        const maxAge = 30000; // 30 seconds
        
        if (age > maxAge) return; // Skip old interactions

        // Calculate opacity based on age
        const opacity = Math.max(0.2, 1 - (age / maxAge));

        // Set color based on interaction type
        let color = '#fff';
        let size = 6;
        
        switch (point.type) {
          case 'click':
            color = '#4ecdc4';
            size = 8;
            break;
          case 'scroll':
            color = '#96ceb4';
            size = 6;
            break;
          case 'zoom':
            color = '#feca57';
            size = 10;
            break;
          case 'rotate':
            color = '#ff6b6b';
            size = 12;
            break;
        }

        // Draw the interaction point
        ctx.save();
        ctx.globalAlpha = opacity;
        
        // Draw outer ring
        ctx.beginPath();
        ctx.arc(point.x, point.y, size + 2, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();
        
        // Draw inner circle
        ctx.beginPath();
        ctx.arc(point.x, point.y, size, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        
        // Add stroke
        ctx.beginPath();
        ctx.arc(point.x, point.y, size, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Add animation for recent interactions (< 2 seconds)
        if (age < 2000) {
          const animationProgress = age / 2000;
          const pulseSize = size + (10 * (1 - animationProgress));
          
          ctx.beginPath();
          ctx.arc(point.x, point.y, pulseSize, 0, 2 * Math.PI);
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.globalAlpha = opacity * (1 - animationProgress);
          ctx.stroke();
        }

        ctx.restore();
      });

      // Continue animation
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isLiveViewEnabled, selectedAnalyticsType, currentPage, canvasRef]);

  // Only render if live view is enabled and interactions type is selected
  if (!isLiveViewEnabled || selectedAnalyticsType !== 'interactions') {
    return null;
  }

  return (
    <FeatureOverlay 
      canvasRef={canvasRef}
      containerRef={containerRef} 
      className="interaction-visualizer" 
      zIndex={2}
    >
      <canvas
        ref={overlayCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          opacity: 0.9,
          transition: 'opacity 0.3s ease',
        }}
      />
      
      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          right: 10,
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '8px',
          borderRadius: '4px',
          fontSize: '11px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>Interactions</div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
          <div style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            background: '#4ecdc4',
            marginRight: '6px'
          }} />
          <span>Clicks</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
          <div style={{ 
            width: '6px', 
            height: '6px', 
            borderRadius: '50%', 
            background: '#96ceb4',
            marginRight: '6px'
          }} />
          <span>Scrolls</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
          <div style={{ 
            width: '10px', 
            height: '10px', 
            borderRadius: '50%', 
            background: '#feca57',
            marginRight: '6px'
          }} />
          <span>Zooms</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ 
            width: '12px', 
            height: '12px', 
            borderRadius: '50%', 
            background: '#ff6b6b',
            marginRight: '6px'
          }} />
          <span>Rotations</span>
        </div>
      </div>
    </FeatureOverlay>
  );
};

export const InteractionVisualizer: PdfFeatureComponent = {
  displayName: 'InteractionVisualizer',
  Component: InteractionVisualizerComponent,
  config: {
    maxAge: 30000,
    animationDuration: 2000,
    showLegend: true,
  },
};

export default InteractionVisualizer;