/**
 * Time-based visualizer - shows areas where user spent more time with colored overlays
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { scaleLinear } from 'd3-scale';
import { interpolateBlues } from 'd3-scale-chromatic';
import { usePdf } from '../../pdf/PdfContext';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import { PdfFeatureComponent, PdfFeatureProps } from '../../pdf/types';
import { FeatureOverlay } from '../base/FeatureOverlay';
import { throttleAndSample, performanceMonitor } from '../../utils/performance';

interface TimeRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  timeSpent: number;
  lastUpdate: number;
}

const TimeVisualizerComponent: React.FC<PdfFeatureProps> = ({ canvasRef, containerRef }) => {
  const { currentPage, scale, rotation } = usePdf();
  const { getAnalyticsReport, recordInteraction } = useAnalytics();
  const [isLiveViewEnabled, setIsLiveViewEnabled] = useState(false);
  const [selectedAnalyticsType, setSelectedAnalyticsType] = useState<string>('none');
  const [timeRegions, setTimeRegions] = useState<Map<string, TimeRegion>>(new Map());
  const [canvasPosition, setCanvasPosition] = useState({ top: 0, left: 0 });
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const lastMousePosition = useRef<{ x: number; y: number } | null>(null);
  const regionSize = 20; // Size of each time tracking region (matching MouseHeatmap's gridSize)
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

  // Optimized mouse movement handler with performance monitoring (matching MouseHeatmap)
  const optimizedMouseMove = useCallback(
    throttleAndSample((event: MouseEvent) => {
      const endTiming = performanceMonitor.startTiming('time_visualizer_mouse_move');
      
      try {
        if (!canvasRef.current || !containerRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const canvas = canvasRef.current;
        
        // Calculate relative position within the canvas
        const rawX = event.clientX - rect.left;
        const rawY = event.clientY - rect.top;
        
        // SIMPLIFIED APPROACH: Use the canvas coordinate system directly
        // Convert mouse position to canvas coordinates using the canvas's own coordinate mapping
        
        // Get canvas dimensions
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const displayWidth = rect.width;
        const displayHeight = rect.height;
        
        // Use the exact same method that canvas uses for coordinate mapping
        // This accounts for the canvas's internal scaling automatically
        const x = (rawX / displayWidth) * canvasWidth;
        const y = (rawY / displayHeight) * canvasHeight;
        
        console.log('TimeVisualizer simplified coordinate debug:', {
          mouse: { clientX: event.clientX, clientY: event.clientY },
          canvasRect: { left: rect.left, top: rect.top, width: displayWidth, height: displayHeight },
          canvas: { width: canvasWidth, height: canvasHeight },
          raw: { x: rawX, y: rawY },
          ratio: { x: rawX / displayWidth, y: rawY / displayHeight },
          final: { x, y },
          pdfScale: scale
        });

        // Only track if mouse is over the canvas and within actual canvas bounds
        const margin = 5;
        if (x >= margin && y >= margin && x <= canvasWidth - margin && y <= canvasHeight - margin) {
          lastMousePosition.current = { x, y };
        }
      } finally {
        endTiming();
      }
    }, 50, 0.2), // Same throttling as MouseHeatmap: 50ms intervals, sample 20% of events
    [canvasRef, containerRef, scale]
  );

  // Track mouse position for time visualization
  useEffect(() => {
    if (!isLiveViewEnabled || selectedAnalyticsType !== 'page_time') {
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mousemove', optimizedMouseMove);
    return () => {
      container.removeEventListener('mousemove', optimizedMouseMove);
    };
  }, [isLiveViewEnabled, selectedAnalyticsType, optimizedMouseMove, containerRef]);

  // Update time regions based on mouse position
  useEffect(() => {
    if (!isLiveViewEnabled || selectedAnalyticsType !== 'page_time') {
      return;
    }

    const updateTimeRegions = () => {
      if (!lastMousePosition.current) return;

      const { x, y } = lastMousePosition.current;
      
      // Calculate region key based on mouse position using PDF coordinates
      // For accurate tracking at any zoom level, we need to use the actual PDF coordinates
      // This matches the approach used in MouseHeatmap
      
      // Get the actual canvas dimensions
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // Calculate region coordinates as a proportion of canvas size
      // This ensures regions scale with zoom level like MouseHeatmap does
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      
      // Calculate grid coordinates based on canvas dimensions (like MouseHeatmap)
      const gridCellsX = Math.ceil(canvasWidth / regionSize);
      const gridCellsY = Math.ceil(canvasHeight / regionSize);
      
      // Find which grid cell the mouse is in
      const gridX = Math.floor((x / canvasWidth) * gridCellsX);
      const gridY = Math.floor((y / canvasHeight) * gridCellsY);
      
      // Calculate the actual region boundaries (like MouseHeatmap grid cells)
      const regionX = gridX * (canvasWidth / gridCellsX);
      const regionY = gridY * (canvasHeight / gridCellsY);
      const regionKey = `${currentPage}-${gridX}-${gridY}`;
      
      console.log('TimeVisualizer region calculation:', {
        mouse: { x, y },
        canvas: { width: canvasWidth, height: canvasHeight },
        grid: { cellsX: gridCellsX, cellsY: gridCellsY },
        gridPos: { x: gridX, y: gridY },
        regionBounds: { x: regionX, y: regionY },
        regionSize: { width: canvasWidth / gridCellsX, height: canvasHeight / gridCellsY },
        pdfScale: scale
      });
      
      // Record this interaction in analytics
      recordInteraction({ 
        type: 'click', // Using 'click' type as 'hover' is not in the allowed types
        details: { action: 'time_spent', x, y, regionX, regionY } 
      });

      // Update surrounding regions with decreasing intensity
      // This creates a more natural heatmap effect similar to MouseHeatmap
      const updateRadius = 1; // How many surrounding cells to update
      const now = Date.now();
      
      setTimeRegions(prev => {
        const newRegions = new Map(prev);
        
        // Calculate actual region dimensions for this canvas size
        const regionWidth = canvasWidth / gridCellsX;
        const regionHeight = canvasHeight / gridCellsY;
        
        // Update cells within radius
        for (let dy = -updateRadius; dy <= updateRadius; dy++) {
          for (let dx = -updateRadius; dx <= updateRadius; dx++) {
            const currentGridX = gridX + dx;
            const currentGridY = gridY + dy;
            
            // Check bounds
            if (currentGridX < 0 || currentGridY < 0 || currentGridX >= gridCellsX || currentGridY >= gridCellsY) {
              continue;
            }
            
            const currentRegionX = currentGridX * regionWidth;
            const currentRegionY = currentGridY * regionHeight;
            const currentRegionKey = `${currentPage}-${currentGridX}-${currentGridY}`;
            
            // Calculate distance factor (0-1) - closer cells get more time
            const distance = Math.sqrt(dx * dx + dy * dy);
            const factor = Math.max(0, 1 - (distance / (updateRadius + 1)));
            
            // Only update if factor is significant
            if (factor > 0.1) {
              const timeToAdd = Math.round(100 * factor); // Base 100ms * distance factor
              
              const existingRegion = newRegions.get(currentRegionKey);
              if (existingRegion) {
                // Update existing region
                existingRegion.timeSpent += timeToAdd;
                existingRegion.lastUpdate = now;
              } else {
                // Create new region with actual canvas-relative dimensions
                newRegions.set(currentRegionKey, {
                  x: currentRegionX,
                  y: currentRegionY,
                  width: regionWidth,
                  height: regionHeight,
                  timeSpent: timeToAdd,
                  lastUpdate: now,
                });
              }
            }
          }
        }
        
        return newRegions;
      });
    };

    const interval = setInterval(updateTimeRegions, 200); // Reduce frequency to match performance
    return () => clearInterval(interval);
  }, [isLiveViewEnabled, selectedAnalyticsType, currentPage, regionSize, canvasRef, scale, recordInteraction]);

  // Render time visualization using animation frame (matching MouseHeatmap approach)
  const renderTimeVisualization = useCallback(() => {
    if (!isLiveViewEnabled || selectedAnalyticsType !== 'page_time') {
      return;
    }

    const canvas = overlayCanvasRef.current;
    const pdfCanvas = canvasRef.current;
    
    if (!canvas || !pdfCanvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match PDF canvas dimensions
    canvas.width = pdfCanvas.width;
    canvas.height = pdfCanvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get regions for current page
    const currentPageRegions = Array.from(timeRegions.entries())
      .filter(([key]) => key.startsWith(`${currentPage}-`))
      .map(([, region]) => region);

    if (currentPageRegions.length === 0) return;

    // Find max time spent for scaling
    const maxTime = Math.max(...currentPageRegions.map(r => r.timeSpent));
    
    // Since we're now using actual canvas coordinates for tracking,
    // the regions are already in the correct coordinate system
    // No additional scaling needed for rendering
    const scaleFactorX = 1;
    const scaleFactorY = 1;
    
    console.log('Time Visualizer Rendering:', {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      pdfCanvasWidth: pdfCanvas.width,
      pdfCanvasHeight: pdfCanvas.height,
      scaleFactorX,
      scaleFactorY,
      scale,
      regionsCount: currentPageRegions.length
    });

    // Render time regions
    currentPageRegions.forEach(region => {
      const age = Date.now() - region.lastUpdate;
      const maxAge = 5000; // 5 seconds
      
      if (age > maxAge) return; // Don't show old regions

      const opacity = Math.max(0.3, 1 - (age / maxAge));
      const normalizedIntensity = region.timeSpent / maxTime;
      
      ctx.save();
      ctx.globalAlpha = opacity;
      
      // Scale region coordinates to match canvas dimensions
      const scaledX = region.x * scaleFactorX;
      const scaledY = region.y * scaleFactorY;
      const scaledWidth = region.width * scaleFactorX;
      const scaledHeight = region.height * scaleFactorY;
      
      // Check if region is within canvas bounds with a small margin
      const margin = 2;
      if (scaledX >= margin && scaledY >= margin && 
          scaledX + scaledWidth <= canvas.width - margin && 
          scaledY + scaledHeight <= canvas.height - margin) {
        
        // Use consistent color calculation like MouseHeatmap
        const alpha = Math.max(0.3, normalizedIntensity * 0.8);
        ctx.fillStyle = `rgba(0, 100, 255, ${alpha})`; // Blue color for time visualization
        ctx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight);
        
        // Add border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);
      
        // Add time text for high-value regions
        if (region.timeSpent > maxTime * 0.7) { // Only show text for regions with 70%+ of max time
          const timeSeconds = (region.timeSpent / 1000).toFixed(1);
          ctx.fillStyle = 'white';
          ctx.font = '8px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText(
            `${timeSeconds}s`,
            scaledX + scaledWidth / 2,
            scaledY + scaledHeight / 2 + 2
          );
        }
        
        console.log('Rendering time region:', {
          original: { x: region.x, y: region.y, width: region.width, height: region.height },
          scaled: { x: scaledX, y: scaledY, width: scaledWidth, height: scaledHeight },
          timeSpent: region.timeSpent
        });
      }
      
      ctx.restore();
    });
  }, [isLiveViewEnabled, selectedAnalyticsType, currentPage, timeRegions, canvasRef, scale]);

  // Set up animation frame rendering like MouseHeatmap
  useEffect(() => {
    if (!isLiveViewEnabled || selectedAnalyticsType !== 'page_time') {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
      return;
    }

    const animate = () => {
      renderTimeVisualization();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };
  }, [renderTimeVisualization]);

  // Calculate canvas position
  useEffect(() => {
    if (canvasRef.current && containerRef.current) {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      
      const canvasRect = canvas.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      const top = canvasRect.top - containerRect.top;
      const left = canvasRect.left - containerRect.left;
      
      setCanvasPosition({ top, left });
    }
  }, [canvasRef, containerRef, currentPage, scale, rotation]);

  // Clean up old regions periodically
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now();
      const maxAge = 30000; // 30 seconds
      
      setTimeRegions(prev => {
        const newRegions = new Map();
        
        for (const [key, region] of prev.entries()) {
          if (now - region.lastUpdate < maxAge) {
            newRegions.set(key, region);
          }
        }
        
        return newRegions;
      });
    };

    const interval = setInterval(cleanup, 5000);
    return () => clearInterval(interval);
  }, []);

  // Only render if live view is enabled and page_time type is selected
  if (!isLiveViewEnabled || selectedAnalyticsType !== 'page_time') {
    return null;
  }

  return (
    <FeatureOverlay 
      canvasRef={canvasRef}
      containerRef={containerRef} 
      className="time-visualizer" 
      zIndex={2}
    >
      <canvas
        ref={overlayCanvasRef}
        style={{
          position: 'absolute',
          top: canvasPosition.top,
          left: canvasPosition.left,
          pointerEvents: 'none',
          opacity: isLiveViewEnabled && selectedAnalyticsType === 'page_time' ? 0.8 : 0,
          transition: 'opacity 0.3s ease',
          // No transform needed since we're working in actual canvas coordinates
          // The overlay canvas will match the PDF canvas dimensions exactly
          // Let CSS handle the display dimensions to match PDF canvas exactly
          width: canvasRef.current?.getBoundingClientRect().width || 595,
          height: canvasRef.current?.getBoundingClientRect().height || 841,
        }}
      />
      
      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '8px',
          borderRadius: '4px',
          fontSize: '11px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>Time Spent</div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
          <div style={{ 
            width: '12px', 
            height: '8px', 
            background: 'linear-gradient(to right, transparent, #0066cc)',
            marginRight: '6px',
            border: '1px solid #333'
          }} />
          <span>More time</span>
        </div>
        <div style={{ fontSize: '10px', color: '#ccc', marginTop: '4px' }}>
          Shows areas where you spend more time viewing
        </div>
      </div>
    </FeatureOverlay>
  );
};

export const TimeVisualizer: PdfFeatureComponent = {
  displayName: 'TimeVisualizer',
  Component: TimeVisualizerComponent,
  config: {
    regionSize: 20, // Smaller regions for better precision (matching MouseHeatmap)
    updateInterval: 100,
    maxAge: 30000,
  },
};

export default TimeVisualizer;