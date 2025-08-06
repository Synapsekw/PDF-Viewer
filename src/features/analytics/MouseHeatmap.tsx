import React, { useEffect, useRef, useState, useCallback } from 'react';
import { scaleLinear } from 'd3-scale';
import { interpolateYlOrRd } from 'd3-scale-chromatic';
import { usePdf } from '../../pdf/PdfContext';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import { PdfFeatureComponent, PdfFeatureProps } from '../../pdf/types';
import { FeatureOverlay } from '../base/FeatureOverlay';
import { MousePosition, HeatmapConfig, PageHeatmapData, HeatmapGridCell } from './types';
import { throttleAndSample, performanceMonitor } from '../../utils/performance';

const DEFAULT_CONFIG: HeatmapConfig = {
  gridSize: 20,
  maxIntensity: 100,
  fadeTime: 30000, // 30 seconds
  opacity: 0.6,
  radius: 30,
};

const MouseHeatmapComponent: React.FC<PdfFeatureProps> = ({ canvasRef, containerRef }) => {
  const { currentPage } = usePdf();
  const { updateHeatmapData, recordInteraction } = useAnalytics();
  const [heatmapData, setHeatmapData] = useState<Map<number, PageHeatmapData>>(new Map());
  const [config] = useState<HeatmapConfig>(DEFAULT_CONFIG);
  const heatmapCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastInteractionTime = useRef<number>(0);

  // Initialize heatmap data for current page
  const initializePageData = useCallback((pageNumber: number): PageHeatmapData => {
    return {
      pageNumber,
      positions: [],
      grid: Array(Math.ceil(500 / config.gridSize)).fill(null).map((_, y) =>
        Array(Math.ceil(700 / config.gridSize)).fill(null).map((_, x) => ({
          x: x * config.gridSize,
          y: y * config.gridSize,
          count: 0,
          intensity: 0,
        }))
      ),
      lastUpdate: Date.now(),
    };
  }, [config.gridSize]);

  // Optimized mouse movement handler with performance monitoring
  const optimizedMouseMove = useCallback(
    throttleAndSample((event: MouseEvent) => {
      const endTiming = performanceMonitor.startTiming('heatmap_mouse_move');
      
      try {
        if (!canvasRef.current || !containerRef.current) return;

        const canvasRect = canvasRef.current.getBoundingClientRect();
        
        // Calculate relative position within the canvas
        const x = event.clientX - canvasRect.left;
        const y = event.clientY - canvasRect.top;

        // Only track if mouse is over the canvas
        if (x >= 0 && y >= 0 && x <= canvasRect.width && y <= canvasRect.height) {
          const now = Date.now();
          const position: MousePosition = {
            x,
            y,
            timestamp: now,
          };

          // Record mouse movement interaction (will be sampled by analytics context)
          recordInteraction({ 
            type: 'click', 
            details: { action: 'mouse_movement', x, y } 
          });

          setHeatmapData(prev => {
            const newData = new Map(prev);
            let pageData = newData.get(currentPage);
            
            if (!pageData) {
              pageData = initializePageData(currentPage);
            }

            // Add new position
            pageData.positions.push(position);
            pageData.lastUpdate = Date.now();

            // Update grid
            updateGrid(pageData, position, config);

            // Clean old positions (older than fadeTime)
            const cutoffTime = Date.now() - config.fadeTime;
            pageData.positions = pageData.positions.filter(pos => pos.timestamp > cutoffTime);

            newData.set(currentPage, pageData);
            return newData;
          });
        }
      } finally {
        endTiming();
      }
    }, 50, 0.2), // Throttle to 50ms intervals, sample 20% of events
    [canvasRef, containerRef, currentPage, initializePageData, config, recordInteraction]
  );

  // Track mouse movements
  const handleMouseMove = useCallback((event: MouseEvent) => {
    optimizedMouseMove(event);
  }, [optimizedMouseMove]);

  // Update analytics context when heatmap data changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateHeatmapData(Object.fromEntries(heatmapData));
    }, 100); // Debounce updates to avoid performance issues

    return () => clearTimeout(timeoutId);
  }, [heatmapData, updateHeatmapData]);

  // Update grid with new mouse position
  const updateGrid = (pageData: PageHeatmapData, position: MousePosition, config: HeatmapConfig) => {
    const gridX = Math.floor(position.x / config.gridSize);
    const gridY = Math.floor(position.y / config.gridSize);

    // Update cells within radius
    const radiusInGrid = Math.ceil(config.radius / config.gridSize);
    
    for (let dy = -radiusInGrid; dy <= radiusInGrid; dy++) {
      for (let dx = -radiusInGrid; dx <= radiusInGrid; dx++) {
        const cellX = gridX + dx;
        const cellY = gridY + dy;
        
        if (cellY >= 0 && cellY < pageData.grid.length && 
            cellX >= 0 && cellX < pageData.grid[cellY].length) {
          
          const distance = Math.sqrt(dx * dx + dy * dy) * config.gridSize;
          if (distance <= config.radius) {
            const influence = 1 - (distance / config.radius);
            pageData.grid[cellY][cellX].count += influence;
            pageData.grid[cellY][cellX].intensity = Math.min(
              config.maxIntensity,
              pageData.grid[cellY][cellX].count
            );
          }
        }
      }
    }
  };

  // Render heatmap
  const renderHeatmap = useCallback(() => {
    if (!heatmapCanvasRef.current || !canvasRef.current) return;

    const canvas = heatmapCanvasRef.current;
    const sourceCanvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas size to source canvas
    canvas.width = sourceCanvas.width;
    canvas.height = sourceCanvas.height;
    canvas.style.width = sourceCanvas.style.width;
    canvas.style.height = sourceCanvas.style.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pageData = heatmapData.get(currentPage);
    if (!pageData) return;

    // Create color scale
    const colorScale = scaleLinear<string>()
      .domain([0, config.maxIntensity])
      .range(['transparent', interpolateYlOrRd(1)]);

    // Render grid cells
    const scaleX = canvas.width / (pageData.grid[0]?.length * config.gridSize || 1);
    const scaleY = canvas.height / (pageData.grid.length * config.gridSize || 1);

    pageData.grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell.intensity > 0) {
          const alpha = (cell.intensity / config.maxIntensity) * config.opacity;
          ctx.fillStyle = colorScale(cell.intensity);
          ctx.globalAlpha = alpha;
          
          ctx.fillRect(
            x * config.gridSize * scaleX,
            y * config.gridSize * scaleY,
            config.gridSize * scaleX,
            config.gridSize * scaleY
          );
        }
      });
    });

    ctx.globalAlpha = 1;
  }, [heatmapData, currentPage, config, canvasRef]);

  // Set up mouse tracking
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mousemove', handleMouseMove);
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove, containerRef]);

  // Render heatmap when data changes
  useEffect(() => {
    const animate = () => {
      renderHeatmap();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [renderHeatmap]);

  // Clean up old data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setHeatmapData(prev => {
        const newData = new Map(prev);
        const now = Date.now();
        
        newData.forEach((pageData, pageNumber) => {
          // Clean old positions
          const cutoffTime = now - config.fadeTime;
          pageData.positions = pageData.positions.filter(pos => pos.timestamp > cutoffTime);
          
          // Fade grid intensities
          pageData.grid.forEach(row => {
            row.forEach(cell => {
              cell.intensity *= 0.95; // Gradual fade
              if (cell.intensity < 0.1) {
                cell.intensity = 0;
                cell.count = 0;
              }
            });
          });
        });
        
        return newData;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [config.fadeTime]);

  return (
    <FeatureOverlay 
      canvasRef={canvasRef}
      containerRef={containerRef} 
      className="mouse-heatmap" 
      zIndex={1}
    >
      <canvas
        ref={heatmapCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
        }}
      />
    </FeatureOverlay>
  );
};

export const MouseHeatmap: PdfFeatureComponent = {
  displayName: 'MouseHeatmap',
  Component: MouseHeatmapComponent,
  config: {
    gridSize: 20,
    maxIntensity: 100,
    fadeTime: 30000,
    opacity: 0.6,
    radius: 30,
  },
};

export default MouseHeatmap;