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
  const { currentPage, scale, rotation } = usePdf();
  const { updateHeatmapData, recordInteraction } = useAnalytics();
  const [heatmapData, setHeatmapData] = useState<Map<number, PageHeatmapData>>(new Map());
  const [config] = useState<HeatmapConfig>(DEFAULT_CONFIG);
  const [isLiveViewEnabled, setIsLiveViewEnabled] = useState(false);
  const [selectedAnalyticsType, setSelectedAnalyticsType] = useState<string>('none');
  const heatmapCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastInteractionTime = useRef<number>(0);

  // Monitor live view settings from analytics controls
  useEffect(() => {
    const checkLiveViewSettings = () => {
      const liveViewElement = document.getElementById('analytics-live-view-element');
      const isEnabled = liveViewElement?.getAttribute('data-analytics-live-view') === 'true';
      const analyticsType = liveViewElement?.getAttribute('data-analytics-type') || 'none';
      

      
      // Only update state if values have actually changed
      setIsLiveViewEnabled(prev => prev !== isEnabled ? isEnabled : prev);
      setSelectedAnalyticsType(prev => prev !== analyticsType ? analyticsType : prev);
    };

    // Check immediately and set up polling
    checkLiveViewSettings();
    const interval = setInterval(checkLiveViewSettings, 100);

    return () => clearInterval(interval);
  }, []);

  // Initialize heatmap data for current page
  const initializePageData = useCallback((pageNumber: number): PageHeatmapData => {
    // Get actual PDF canvas dimensions
    const canvas = canvasRef.current;
    const canvasWidth = canvas?.width || 595;
    const canvasHeight = canvas?.height || 841;
    
    // Convert to PDF dimensions (zoom-independent)
    const pdfWidth = canvasWidth / scale;
    const pdfHeight = canvasHeight / scale;
    
    // Use grid size in PDF coordinates
    const gridSize = config.gridSize;
    
    // Calculate how many grid cells we need based on the PDF dimensions
    const gridCellsX = Math.ceil(pdfWidth / gridSize);
    const gridCellsY = Math.ceil(pdfHeight / gridSize);
    
    return {
      pageNumber,
      positions: [],
      grid: Array(gridCellsY).fill(null).map((_, y) =>
        Array(gridCellsX).fill(null).map((_, x) => ({
          x: x * gridSize,
          y: y * gridSize,
          count: 0,
          intensity: 0,
        }))
      ),
      lastUpdate: Date.now(),
    };
  }, [config.gridSize, canvasRef, scale]);

  // Optimized mouse movement handler with performance monitoring
  const optimizedMouseMove = useCallback(
    throttleAndSample((event: MouseEvent) => {
      const endTiming = performanceMonitor.startTiming('heatmap_mouse_move');
      
      try {
        if (!canvasRef.current || !containerRef.current) return;

        const canvasRect = canvasRef.current.getBoundingClientRect();
        const canvas = canvasRef.current;
        
        // Calculate relative position within the canvas
        const rawX = event.clientX - canvasRect.left;
        const rawY = event.clientY - canvasRect.top;
        
        // SIMPLIFIED APPROACH: Use the canvas coordinate system directly
        // Convert mouse position to canvas coordinates using the canvas's own coordinate mapping
        
        // Get canvas dimensions
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const displayWidth = canvasRect.width;
        const displayHeight = canvasRect.height;
        
        // Convert to canvas coordinates first
        const canvasX = (rawX / displayWidth) * canvasWidth;
        const canvasY = (rawY / displayHeight) * canvasHeight;
        
        // Then convert canvas coordinates to PDF coordinates (zoom-independent)
        // PDF coordinates = canvas coordinates / scale
        const x = canvasX / scale;
        const y = canvasY / scale;
        
        console.log('MouseHeatmap PDF coordinate debug:', {
          mouse: { clientX: event.clientX, clientY: event.clientY },
          canvasRect: { left: canvasRect.left, top: canvasRect.top, width: displayWidth, height: displayHeight },
          canvas: { width: canvasWidth, height: canvasHeight, x: canvasX, y: canvasY },
          pdfCoords: { x, y },
          pdfScale: scale
        });

        // Check bounds in PDF coordinates
        const pdfWidth = canvasWidth / scale;
        const pdfHeight = canvasHeight / scale;
        const margin = 5 / scale; // Scale margin to PDF coordinates
        
        if (x >= margin && y >= margin && x <= pdfWidth - margin && y <= pdfHeight - margin) {
          console.log('Mouse over canvas:', { x, y, pdfDimensions: { width: pdfWidth, height: pdfHeight } });
          const now = Date.now();
          const position: MousePosition = {
            x, // PDF coordinates
            y, // PDF coordinates
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

            console.log('Updated heatmap data:', {
              page: currentPage,
              positions: pageData.positions.length,
              gridCells: pageData.grid.length * (pageData.grid[0]?.length || 0),
              cellsWithIntensity: pageData.grid.reduce((sum, row) => 
                sum + row.filter(cell => cell.intensity > 0).length, 0
              )
            });

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

  // Update grid with new mouse position (in PDF coordinates)
  const updateGrid = (pageData: PageHeatmapData, position: MousePosition, config: HeatmapConfig) => {
    // Grid size in PDF coordinates
    const gridSize = config.gridSize;
    const gridX = Math.floor(position.x / gridSize);
    const gridY = Math.floor(position.y / gridSize);

    console.log('Updating grid:', {
      pdfPosition: { x: position.x, y: position.y },
      gridCoords: { x: gridX, y: gridY },
      gridSize: config.gridSize,
      gridBounds: { rows: pageData.grid.length, cols: pageData.grid[0]?.length || 0 }
    });

    // Update cells within radius
    const radiusInGrid = Math.ceil(config.radius / gridSize);
    
    for (let dy = -radiusInGrid; dy <= radiusInGrid; dy++) {
      for (let dx = -radiusInGrid; dx <= radiusInGrid; dx++) {
        const cellX = gridX + dx;
        const cellY = gridY + dy;
        
        if (cellY >= 0 && cellY < pageData.grid.length && 
            cellX >= 0 && cellX < pageData.grid[cellY].length) {
          
          const distance = Math.sqrt(dx * dx + dy * dy) * gridSize;
          if (distance <= config.radius) {
            const influence = 1 - (distance / config.radius);
            const oldIntensity = pageData.grid[cellY][cellX].intensity;
            pageData.grid[cellY][cellX].count += influence;
            pageData.grid[cellY][cellX].intensity = Math.min(
              config.maxIntensity,
              pageData.grid[cellY][cellX].count
            );
            
            if (pageData.grid[cellY][cellX].intensity > oldIntensity) {
              console.log('Updated cell:', {
                cellX, cellY,
                oldIntensity,
                newIntensity: pageData.grid[cellY][cellX].intensity,
                count: pageData.grid[cellY][cellX].count
              });
            }
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

    // Match canvas size to source canvas exactly
    canvas.width = sourceCanvas.width;
    canvas.height = sourceCanvas.height;
    // Don't set style width/height - let the transform handle scaling

                                // Clear canvas
              ctx.clearRect(0, 0, canvas.width, canvas.height);

      const pageData = heatmapData.get(currentPage);
      if (!pageData) {
        console.log('No page data for current page:', currentPage);
        return;
      }
      
      // Don't add background - let the heatmap cells show naturally
    
                  console.log('Rendering heatmap for page:', currentPage, 'with data:', {
                positions: pageData.positions.length,
                gridSize: pageData.grid.length,
                hasIntensity: pageData.grid.some(row => row.some(cell => cell.intensity > 0)),
                totalCells: pageData.grid.length * (pageData.grid[0]?.length || 0),
                cellsWithIntensity: pageData.grid.reduce((sum, row) => 
                  sum + row.filter(cell => cell.intensity > 0).length, 0
                )
              });

                  // Create color scale with more vibrant colors
              const colorScale = scaleLinear<string>()
                .domain([0, config.maxIntensity])
                .range(['rgba(255, 255, 255, 0)', 'rgba(255, 0, 0, 1.0)']); // Full opacity red
      
    console.log('Canvas dimensions:', {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      sourceWidth: sourceCanvas.width,
      sourceHeight: sourceCanvas.height,
      styleWidth: sourceCanvas.style.width,
      styleHeight: sourceCanvas.style.height,
      sourceCanvasRect: sourceCanvas.getBoundingClientRect(),
      canvasRect: canvas.getBoundingClientRect(),
      sourceComputedStyle: {
        position: getComputedStyle(sourceCanvas).position,
        top: getComputedStyle(sourceCanvas).top,
        left: getComputedStyle(sourceCanvas).left,
        transform: getComputedStyle(sourceCanvas).transform,
        margin: getComputedStyle(sourceCanvas).margin,
        padding: getComputedStyle(sourceCanvas).padding
      }
    });

    // Convert PDF coordinates to canvas coordinates for rendering
    // Canvas coordinates = PDF coordinates * scale
    const gridSize = config.gridSize;
    const scaleX = scale; // Scale from PDF to canvas
    const scaleY = scale; // Scale from PDF to canvas

        pageData.grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell.intensity > 0) {
          // Calculate alpha with a minimum threshold to ensure visibility
          const normalizedIntensity = cell.intensity / config.maxIntensity;
          const alpha = Math.max(0.3, normalizedIntensity * 0.8); // Minimum 30% opacity, scale up to 80%
          
          // Use direct color calculation instead of d3 scale to avoid alpha conflicts
          ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
          ctx.globalAlpha = 1; // Reset global alpha since we're using rgba
      
          const rectX = x * gridSize * scaleX;
          const rectY = y * gridSize * scaleY;
          const rectWidth = gridSize * scaleX;
          const rectHeight = gridSize * scaleY;
          
          // Only render if the cell is within the canvas bounds with a small margin
          const margin = 2;
          if (rectX >= margin && rectY >= margin && 
              rectX + rectWidth <= canvas.width - margin && 
              rectY + rectHeight <= canvas.height - margin) {
            ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
            
                          console.log('Drawing heatmap cell:', {
                gridPos: { x, y },
                intensity: cell.intensity,
                alpha,
                pdfRect: { x: cell.x, y: cell.y },
                canvasRect: { x: rectX, y: rectY, width: rectWidth, height: rectHeight },
                scale: scale
              });
          }
        }
      });
    });

    ctx.globalAlpha = 1;
  }, [heatmapData, currentPage, config, canvasRef, scale]);

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

  // Calculate the position of the PDF canvas relative to the container
  const [canvasPosition, setCanvasPosition] = useState({ top: 0, left: 0 });

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

  // Calculate canvas position
  useEffect(() => {
    if (canvasRef.current && containerRef.current) {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      
      const canvasRect = canvas.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      // Calculate position accounting for scale and rotation
      const top = canvasRect.top - containerRect.top;
      const left = canvasRect.left - containerRect.left;
      
      setCanvasPosition({ top, left });
      
      console.log('Canvas positioning:', {
        canvasRect: { top: canvasRect.top, left: canvasRect.left, width: canvasRect.width, height: canvasRect.height },
        containerRect: { top: containerRect.top, left: containerRect.left },
        calculated: { top, left },
        scale,
        rotation
      });
    }
  }, [canvasRef, containerRef, currentPage, scale, rotation]);

  // Update position when PDF canvas size changes (for zoom/rotation)
  useEffect(() => {
    const updatePosition = () => {
      if (canvasRef.current && containerRef.current) {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        
        const canvasRect = canvas.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        const top = canvasRect.top - containerRect.top;
        const left = canvasRect.left - containerRect.left;
        
        setCanvasPosition({ top, left });
      }
    };

    // Update position immediately and set up a small delay to catch any size changes
    updatePosition();
    const timeoutId = setTimeout(updatePosition, 100);
    
    return () => clearTimeout(timeoutId);
  }, [scale, rotation]);

  // Only render heatmap if live view is enabled and heatmap type is selected
  if (!isLiveViewEnabled || selectedAnalyticsType !== 'heatmap') {
    return null;
  }

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
                      top: canvasPosition.top,
                      left: canvasPosition.left,
                      pointerEvents: 'none',
                      opacity: isLiveViewEnabled ? 0.8 : 0,
                      transition: 'opacity 0.3s ease',
                      // No transform needed since we're working in actual canvas coordinates
                      // The overlay canvas will match the PDF canvas dimensions exactly
                      width: canvasRef.current?.width || 595,
                      height: canvasRef.current?.height || 841,
                    }}
                  />
    </FeatureOverlay>
  );
};

export const MouseHeatmap: PdfFeatureComponent = {
  displayName: 'MouseHeatmap',
  Component: MouseHeatmapComponent,
  config: {
    gridSize: 60, // Even larger grid cells for better visibility
    maxIntensity: 100,
    fadeTime: 30000,
    opacity: 1.0, // Maximum opacity for better visibility
    radius: 30,
  },
};

export default MouseHeatmap;