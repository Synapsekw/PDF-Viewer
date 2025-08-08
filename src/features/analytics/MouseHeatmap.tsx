import React, { useEffect, useRef, useState, useCallback } from 'react';
import { scaleLinear } from 'd3-scale';
import { interpolateYlOrRd, interpolateReds, interpolateOranges } from 'd3-scale-chromatic';
import { usePdf } from '../../pdf/PdfContext';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import { PdfFeatureComponent, PdfFeatureProps } from '../../pdf/types';
import { FeatureOverlay } from '../base/FeatureOverlay';
import { MousePosition, HeatmapConfig, PageHeatmapData, HeatmapGridCell } from './types';
import { throttleAndSample, performanceMonitor } from '../../utils/performance';

// Dynamic configuration based on zoom level
const getDynamicConfig = (scale: number): HeatmapConfig => {
  // Base grid size that scales with zoom level
  // At 100% zoom, use 12px grid cells
  // At 200% zoom, use 8px grid cells for more precision
  const baseGridSize = Math.max(6, Math.min(20, 12 / Math.sqrt(scale)));
  
  // Radius should also scale with zoom for consistent visual effect
  const baseRadius = Math.max(20, Math.min(60, 40 / Math.sqrt(scale)));
  
  return {
    gridSize: baseGridSize,
    maxIntensity: 100,
    fadeTime: 30000, // 30 seconds
    opacity: 0.7,
    radius: baseRadius,
  };
};

const MouseHeatmapComponent: React.FC<PdfFeatureProps> = ({ canvasRef, containerRef, isAnalyticsEnabled, selectedAnalyticsType }) => {
  const { currentPage, scale, rotation, document: pdfDocument } = usePdf();
  const { updateHeatmapData, recordInteraction } = useAnalytics();
  const [heatmapData, setHeatmapData] = useState<Map<number, PageHeatmapData>>(new Map());
  const [config, setConfig] = useState<HeatmapConfig>(getDynamicConfig(scale));
  const [isLiveViewEnabled, setIsLiveViewEnabled] = useState(false);
  const [localSelectedAnalyticsType, setLocalSelectedAnalyticsType] = useState<string>('none');
  const heatmapCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastInteractionTime = useRef<number>(0);
  const canvasBoundsRef = useRef<{ width: number; height: number; left: number; top: number }>({ width: 0, height: 0, left: 0, top: 0 });
  const [debugMode, setDebugMode] = useState(false);

  // Update config when scale changes
  useEffect(() => {
    setConfig(getDynamicConfig(scale));
  }, [scale]);

  // Monitor live view settings from analytics controls
  useEffect(() => {
    const checkLiveViewSettings = () => {
      // Use props as primary source, fall back to global DOM element
      let isEnabled = isAnalyticsEnabled || false;
      let analyticsType = selectedAnalyticsType || 'none';
      
      // Fall back to global DOM element if props are not available
      if (isAnalyticsEnabled === undefined || selectedAnalyticsType === undefined) {
        const liveViewElement = window.document.getElementById('analytics-live-view-element');
        isEnabled = liveViewElement?.getAttribute('data-analytics-live-view') === 'true';
        analyticsType = liveViewElement?.getAttribute('data-analytics-type') || 'none';
      }
      
      console.log('MouseHeatmap: Checking settings:', { 
        isEnabled, 
        analyticsType, 
        propsEnabled: isAnalyticsEnabled, 
        propsType: selectedAnalyticsType 
      });
      
      // Only update state if values have actually changed
      setIsLiveViewEnabled(prev => prev !== isEnabled ? isEnabled : prev);
      setLocalSelectedAnalyticsType(prev => prev !== analyticsType ? analyticsType : prev);
    };

    // Check immediately and set up polling
    checkLiveViewSettings();
    const interval = setInterval(checkLiveViewSettings, 100);

    return () => clearInterval(interval);
  }, [isAnalyticsEnabled, selectedAnalyticsType]);

  // Update canvas bounds when scale or rotation changes
  useEffect(() => {
    const updateCanvasBounds = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        canvasBoundsRef.current = {
          width: rect.width,
          height: rect.height,
          left: rect.left,
          top: rect.top
        };
        console.log('MouseHeatmap: Updated canvas bounds:', canvasBoundsRef.current);
      }
    };

    // Update bounds immediately and on resize
    updateCanvasBounds();
    window.addEventListener('resize', updateCanvasBounds);
    
    // Also update when scale/rotation changes
    const timeoutId = setTimeout(updateCanvasBounds, 100);
    
    return () => {
      window.removeEventListener('resize', updateCanvasBounds);
      clearTimeout(timeoutId);
    };
  }, [canvasRef, scale, rotation]);

  // Initialize heatmap data for current page with dynamic grid
  const initializePageData = useCallback((pageNumber: number): PageHeatmapData => {
    // Get actual PDF canvas dimensions
    const canvas = canvasRef.current;
    const canvasWidth = canvas?.width || 595;
    const canvasHeight = canvas?.height || 841;
    
    // Convert to PDF dimensions (zoom-independent)
    const pdfWidth = canvasWidth / scale;
    const pdfHeight = canvasHeight / scale;
    
    // Use dynamic grid size based on current scale
    const gridSize = config.gridSize;
    
    // Calculate how many grid cells we need based on the PDF dimensions
    const gridCellsX = Math.ceil(pdfWidth / gridSize);
    const gridCellsY = Math.ceil(pdfHeight / gridSize);
    
    console.log('MouseHeatmap: Initializing page data with dynamic config:', {
      pageNumber,
      pdfDimensions: { width: pdfWidth, height: pdfHeight },
      gridSize,
      gridCells: { x: gridCellsX, y: gridCellsY },
      scale
    });
    
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

  // Improved coordinate conversion with precise bounds checking
  const convertMouseToPdfCoords = useCallback((event: MouseEvent): { x: number; y: number } | null => {
    if (!canvasRef.current) return null;

    const canvas = canvasRef.current;
    const bounds = canvasBoundsRef.current;
    
    // Get the actual canvas rect at the moment of the event
    const canvasRect = canvas.getBoundingClientRect();
    
    // Calculate relative position within the canvas
    const rawX = event.clientX - canvasRect.left;
    const rawY = event.clientY - canvasRect.top;
    
    // Check if mouse is within canvas bounds
    if (rawX < 0 || rawY < 0 || rawX > canvasRect.width || rawY > canvasRect.height) {
      return null;
    }
    
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
    
    // Check bounds in PDF coordinates
    const pdfWidth = canvasWidth / scale;
    const pdfHeight = canvasHeight / scale;
    const margin = 5 / scale; // Scale margin to PDF coordinates
    
    if (x >= margin && y >= margin && x <= pdfWidth - margin && y <= pdfHeight - margin) {
      console.log('MouseHeatmap: Precise coordinate conversion:', {
        mouse: { clientX: event.clientX, clientY: event.clientY },
        canvasRect: { left: canvasRect.left, top: canvasRect.top, width: displayWidth, height: displayHeight },
        rawCoords: { x: rawX, y: rawY },
        canvasCoords: { x: canvasX, y: canvasY },
        pdfCoords: { x, y },
        pdfDimensions: { width: pdfWidth, height: pdfHeight },
        scale
      });
      return { x, y };
    }
    
    return null;
  }, [canvasRef, scale]);

  // Enhanced color palette with time-based progression
  const getHeatmapColor = (intensity: number, maxIntensity: number, timestamp: number) => {
    const normalizedIntensity = intensity / maxIntensity;
    const now = Date.now();
    const age = now - timestamp; // Age in milliseconds
    const maxAge = config.fadeTime; // 30 seconds
    
    // Calculate time factor (0 = recent, 1 = old)
    const timeFactor = Math.min(1, age / maxAge);
    
    // Create a beautiful gradient from hot red (recent) to cool blue (old)
    if (normalizedIntensity < 0.3) {
      // Low intensity: Cool blues that fade to lighter blues
      const alpha = Math.max(0.1, normalizedIntensity * 0.4);
      const blueIntensity = Math.max(100, 255 - timeFactor * 100);
      return `rgba(100, 150, ${blueIntensity}, ${alpha})`;
    } else if (normalizedIntensity < 0.6) {
      // Medium intensity: Warm oranges that fade to cool blues
      const alpha = Math.max(0.2, normalizedIntensity * 0.6);
      if (timeFactor < 0.5) {
        // Recent: Orange to yellow
        const orangeIntensity = 255 - timeFactor * 100;
        const yellowIntensity = 150 + timeFactor * 100;
        return `rgba(${orangeIntensity}, ${yellowIntensity}, 50, ${alpha})`;
      } else {
        // Older: Yellow to blue
        const yellowIntensity = 255 - (timeFactor - 0.5) * 200;
        const blueIntensity = 100 + (timeFactor - 0.5) * 155;
        return `rgba(${yellowIntensity}, ${yellowIntensity}, ${blueIntensity}, ${alpha})`;
      }
    } else {
      // High intensity: Hot reds that fade to cool blues
      const alpha = Math.max(0.3, normalizedIntensity * 0.8);
      if (timeFactor < 0.3) {
        // Very recent: Hot red
        const redIntensity = 255;
        const greenIntensity = 80 + timeFactor * 70;
        return `rgba(${redIntensity}, ${greenIntensity}, 80, ${alpha})`;
      } else if (timeFactor < 0.6) {
        // Recent: Red to orange
        const redIntensity = 255 - (timeFactor - 0.3) * 100;
        const orangeIntensity = 150 + (timeFactor - 0.3) * 100;
        return `rgba(${redIntensity}, ${orangeIntensity}, 50, ${alpha})`;
      } else {
        // Older: Orange to blue
        const orangeIntensity = 255 - (timeFactor - 0.6) * 200;
        const blueIntensity = 100 + (timeFactor - 0.6) * 155;
        return `rgba(${orangeIntensity}, ${orangeIntensity}, ${blueIntensity}, ${alpha})`;
      }
    }
  };

  // Get intensity level for legend
  const getIntensityLevel = (intensity: number, maxIntensity: number) => {
    const normalizedIntensity = intensity / maxIntensity;
    if (normalizedIntensity > 0.7) return 'high';
    if (normalizedIntensity > 0.3) return 'medium';
    return 'low';
  };

  // Heat map legend component with dynamic stats
  const HeatmapLegend = () => {
    if (!isLiveViewEnabled || localSelectedAnalyticsType !== 'heatmap') return null;

    // Calculate current heat map stats
    const pageData = heatmapData.get(currentPage);
    const totalCells = pageData?.grid.reduce((sum, row) => 
      sum + row.filter(cell => cell.intensity > 0).length, 0) || 0;
    const maxIntensity = pageData?.grid.reduce((max, row) => 
      Math.max(max, ...row.map(cell => cell.intensity)), 0) || 0;

    return (
      <div className="heatmap-legend" style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        zIndex: 10,
        pointerEvents: 'auto',
        minWidth: '180px'
      }}>
        <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '11px' }}>
          Mouse Heatmap
        </div>
        <div style={{ marginBottom: '6px', fontSize: '9px', opacity: 0.8 }}>
          {totalCells} active areas • {Math.round(scale * 100)}% zoom
        </div>
        <div style={{ marginBottom: '6px', fontSize: '9px', opacity: 0.6 }}>
          Grid: {config.gridSize.toFixed(1)}px • Radius: {config.radius.toFixed(1)}px
        </div>
        <div className="heatmap-legend-item">
          <div className="heatmap-legend-color heatmap-intensity-high"></div>
          <span style={{ fontSize: '10px' }}>Recent Activity (Red)</span>
        </div>
        <div className="heatmap-legend-item">
          <div className="heatmap-legend-color heatmap-intensity-medium"></div>
          <span style={{ fontSize: '10px' }}>Medium Activity (Orange)</span>
        </div>
        <div className="heatmap-legend-item">
          <div className="heatmap-legend-color heatmap-intensity-low"></div>
          <span style={{ fontSize: '10px' }}>Old Activity (Blue)</span>
        </div>
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          <button
            onClick={() => setDebugMode(!debugMode)}
            style={{
              background: debugMode ? 'rgba(255, 100, 100, 0.3)' : 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '9px',
              color: 'white',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            {debugMode ? '🔴 Debug Mode ON' : '⚪ Debug Mode OFF'}
          </button>
        </div>
      </div>
    );
  };

  // Render heatmap with improved visual design and time-based colors
  const renderHeatmap = useCallback(() => {
    if (!heatmapCanvasRef.current || !canvasRef.current) return;

    const canvas = heatmapCanvasRef.current;
    const sourceCanvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas size to source canvas exactly
    canvas.width = sourceCanvas.width;
    canvas.height = sourceCanvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pageData = heatmapData.get(currentPage);
    if (!pageData) {
      console.log('No page data for current page:', currentPage);
      return;
    }
    
    console.log('Rendering heatmap for page:', currentPage, 'with data:', {
      positions: pageData.positions.length,
      gridSize: pageData.grid.length,
      hasIntensity: pageData.grid.some(row => row.some(cell => cell.intensity > 0)),
      totalCells: pageData.grid.length * (pageData.grid[0]?.length || 0),
      cellsWithIntensity: pageData.grid.reduce((sum, row) => 
        sum + row.filter(cell => cell.intensity > 0).length, 0
      ),
      config: { gridSize: config.gridSize, radius: config.radius, scale }
    });

    console.log('Canvas dimensions:', {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      sourceWidth: sourceCanvas.width,
      sourceHeight: sourceCanvas.height,
      sourceCanvasRect: sourceCanvas.getBoundingClientRect(),
      canvasRect: canvas.getBoundingClientRect(),
    });

    // Convert PDF coordinates to canvas coordinates for rendering
    const gridSize = config.gridSize;
    const scaleX = scale;
    const scaleY = scale;

    // Enable anti-aliasing for smoother rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Create gradient for each cell for smoother appearance
    pageData.grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell.intensity > 0) {
          const rectX = x * gridSize * scaleX;
          const rectY = y * gridSize * scaleY;
          const rectWidth = gridSize * scaleX;
          const rectHeight = gridSize * scaleY;
          
          // Only render if the cell is within the canvas bounds with a small margin
          const margin = 2;
          if (rectX >= margin && rectY >= margin && 
              rectX + rectWidth <= canvas.width - margin && 
              rectY + rectHeight <= canvas.height - margin) {
            
            // Create radial gradient for each cell for smoother appearance
            const centerX = rectX + rectWidth / 2;
            const centerY = rectY + rectHeight / 2;
            const radius = Math.min(rectWidth, rectHeight) / 2;
            
            const gradient = ctx.createRadialGradient(
              centerX, centerY, 0,
              centerX, centerY, radius
            );
            
            // Use time-based color progression
            const color = getHeatmapColor(cell.intensity, config.maxIntensity, pageData.lastUpdate);
            const baseColor = color.replace(/[\d.]+\)$/, '0.8)'); // Full opacity for center
            const edgeColor = color.replace(/[\d.]+\)$/, '0.1)'); // Low opacity for edges
            
            gradient.addColorStop(0, baseColor);
            gradient.addColorStop(0.7, color);
            gradient.addColorStop(1, edgeColor);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
            
            console.log('Drawing heatmap cell:', {
              gridPos: { x, y },
              intensity: cell.intensity,
              color,
              pdfRect: { x: cell.x, y: cell.y },
              canvasRect: { x: rectX, y: rectY, width: rectWidth, height: rectHeight },
              scale: scale,
              timestamp: pageData.lastUpdate
            });
          }
        }
      });
    });

    // Add a subtle glow effect for high-intensity areas
    ctx.globalCompositeOperation = 'screen';
    pageData.grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell.intensity > config.maxIntensity * 0.7) {
          const rectX = x * gridSize * scaleX;
          const rectY = y * gridSize * scaleY;
          const rectWidth = gridSize * scaleX;
          const rectHeight = gridSize * scaleY;
          
          const margin = 2;
          if (rectX >= margin && rectY >= margin && 
              rectX + rectWidth <= canvas.width - margin && 
              rectY + rectHeight <= canvas.height - margin) {
            
            // Add glow effect with time-based color
            const glowGradient = ctx.createRadialGradient(
              rectX + rectWidth / 2, rectY + rectHeight / 2, 0,
              rectX + rectWidth / 2, rectY + rectHeight / 2, rectWidth
            );
            
            const normalizedIntensity = cell.intensity / config.maxIntensity;
            const glowAlpha = normalizedIntensity * 0.3;
            
            // Use time-based glow color
            const glowColor = getHeatmapColor(cell.intensity, config.maxIntensity, pageData.lastUpdate);
            const glowRgba = glowColor.replace(/[\d.]+\)$/, `${glowAlpha})`);
            
            glowGradient.addColorStop(0, glowRgba);
            glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = glowGradient;
            ctx.fillRect(rectX - rectWidth/2, rectY - rectHeight/2, rectWidth * 2, rectHeight * 2);
          }
        }
      });
    });
    
    ctx.globalCompositeOperation = 'source-over';

    // Add subtle animation for high-intensity cells
    const time = Date.now() * 0.001; // Time in seconds
    pageData.grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell.intensity > config.maxIntensity * 0.8) {
          const rectX = x * gridSize * scaleX;
          const rectY = y * gridSize * scaleY;
          const rectWidth = gridSize * scaleX;
          const rectHeight = gridSize * scaleY;
          
          const margin = 2;
          if (rectX >= margin && rectY >= margin && 
              rectX + rectWidth <= canvas.width - margin && 
              rectY + rectHeight <= canvas.height - margin) {
            
            // Add pulsing animation effect with time-based color
            const pulse = Math.sin(time * 3 + x + y) * 0.1 + 0.9;
            const animatedGradient = ctx.createRadialGradient(
              rectX + rectWidth / 2, rectY + rectHeight / 2, 0,
              rectX + rectWidth / 2, rectY + rectHeight / 2, rectWidth * pulse
            );
            
            const normalizedIntensity = cell.intensity / config.maxIntensity;
            const animatedAlpha = normalizedIntensity * 0.2 * pulse;
            
            // Use time-based animation color
            const animColor = getHeatmapColor(cell.intensity, config.maxIntensity, pageData.lastUpdate);
            const animRgba = animColor.replace(/[\d.]+\)$/, `${animatedAlpha})`);
            
            animatedGradient.addColorStop(0, animRgba);
            animatedGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.globalCompositeOperation = 'overlay';
            ctx.fillStyle = animatedGradient;
            ctx.fillRect(rectX - rectWidth/2, rectY - rectHeight/2, rectWidth * 2, rectHeight * 2);
          }
        }
      });
    });
    
    ctx.globalCompositeOperation = 'source-over';
  }, [heatmapData, currentPage, config, canvasRef, scale]);

  // Optimized mouse movement handler with improved tracking
  const optimizedMouseMove = useCallback(
    throttleAndSample((event: MouseEvent) => {
      const endTiming = performanceMonitor.startTiming('heatmap_mouse_move');
      
      try {
        const pdfCoords = convertMouseToPdfCoords(event);
        if (!pdfCoords) return;

        console.log('MouseHeatmap PDF coordinate debug:', {
          mouse: { clientX: event.clientX, clientY: event.clientY },
          canvasBounds: canvasBoundsRef.current,
          pdfCoords,
          pdfScale: scale,
          gridSize: config.gridSize
        });

        const now = Date.now();
        const position: MousePosition = {
          x: pdfCoords.x,
          y: pdfCoords.y,
          timestamp: now,
        };

        // Record mouse movement interaction (will be sampled by analytics context)
        recordInteraction({ 
          type: 'click', 
          details: { action: 'mouse_movement', x: pdfCoords.x, y: pdfCoords.y } 
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
            ),
            config: { gridSize: config.gridSize, radius: config.radius }
          });

          // Clean old positions (older than fadeTime)
          const cutoffTime = Date.now() - config.fadeTime;
          pageData.positions = pageData.positions.filter(pos => pos.timestamp > cutoffTime);

          newData.set(currentPage, pageData);
          return newData;
        });
      } finally {
        endTiming();
      }
    }, 50, 0.2), // Throttle to 50ms intervals, sample 20% of events
    [convertMouseToPdfCoords, currentPage, initializePageData, config, recordInteraction]
  );

  // Track mouse movements
  const handleMouseMove = useCallback((event: MouseEvent) => {
    optimizedMouseMove(event);
  }, [optimizedMouseMove]);

  // Debug cursor indicator component
  const DebugCursor = () => {
    if (!debugMode || !isLiveViewEnabled) return null;

    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

    useEffect(() => {
      const handleMouseMove = (event: MouseEvent) => {
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const rect = canvas.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          setCursorPos({ x, y });
        }
      };

      document.addEventListener('mousemove', handleMouseMove);
      return () => document.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
      <div
        style={{
          position: 'absolute',
          left: cursorPos.x - 5,
          top: cursorPos.y - 5,
          width: 10,
          height: 10,
          backgroundColor: 'red',
          borderRadius: '50%',
          border: '2px solid white',
          pointerEvents: 'none',
          zIndex: 1000,
        }}
      />
    );
  };

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
          
          // Fade grid intensities more gradually
          pageData.grid.forEach(row => {
            row.forEach(cell => {
              cell.intensity *= 0.98; // Slower fade for better persistence
              if (cell.intensity < 0.05) {
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

  // Real-time canvas position calculation
  const getCanvasPosition = useCallback(() => {
    if (canvasRef.current && containerRef.current) {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      
      const canvasRect = canvas.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      // Calculate position accounting for scale and rotation
      const top = canvasRect.top - containerRect.top;
      const left = canvasRect.left - containerRect.left;
      
      return { top, left };
    }
    return { top: 0, left: 0 };
  }, [canvasRef, containerRef]);

  // Update position when PDF canvas size changes (for zoom/rotation)
  useEffect(() => {
    const updatePosition = () => {
      const newPosition = getCanvasPosition();
      setCanvasPosition(newPosition);
      
      console.log('Canvas positioning:', {
        position: newPosition,
        scale,
        rotation
      });
    };

    // Update position immediately and set up a small delay to catch any size changes
    updatePosition();
    const timeoutId = setTimeout(updatePosition, 100);
    
    return () => clearTimeout(timeoutId);
  }, [getCanvasPosition, scale, rotation]);

  // Only render heatmap if live view is enabled and heatmap type is selected
  console.log('MouseHeatmap render check:', { 
    isLiveViewEnabled, 
    localSelectedAnalyticsType, 
    hasPdfDocument: !!pdfDocument,
    hasCanvasRef: !!canvasRef.current,
    hasContainerRef: !!containerRef.current,
    containerRefElement: containerRef.current
  });
  if (!isLiveViewEnabled || localSelectedAnalyticsType !== 'heatmap') {
    console.log('MouseHeatmap: Not rendering due to conditions not met');
    return null;
  }
  
  console.log('MouseHeatmap: Rendering component', {
    canvasWidth: canvasRef.current?.width,
    canvasHeight: canvasRef.current?.height,
    containerElement: containerRef.current
  });

  // Don't render if no document is loaded
  if (!pdfDocument) {
    return null;
  }

  // Get real-time canvas position
  const currentCanvasPosition = getCanvasPosition();

  return (
    <FeatureOverlay 
      canvasRef={canvasRef}
      containerRef={containerRef} 
      className="mouse-heatmap heatmap-optimized" 
      zIndex={1}
    >
      <canvas
        ref={heatmapCanvasRef}
        className="heatmap-glass"
        style={{
          position: 'absolute',
          top: currentCanvasPosition.top,
          left: currentCanvasPosition.left,
          pointerEvents: 'none',
          opacity: isLiveViewEnabled ? 0.85 : 0,
          transition: 'opacity 0.3s ease',
          // No transform needed since we're working in actual canvas coordinates
          // The overlay canvas will match the PDF canvas dimensions exactly
          width: canvasRef.current?.width || 595,
          height: canvasRef.current?.height || 841,
        }}
      />
      <HeatmapLegend />
      <DebugCursor />
    </FeatureOverlay>
  );
};

export const MouseHeatmap: PdfFeatureComponent = {
  displayName: 'MouseHeatmap',
  Component: MouseHeatmapComponent,
  config: {
    gridSize: 12, // Base grid size that will be dynamically adjusted
    maxIntensity: 100,
    fadeTime: 30000,
    opacity: 0.85, // Better opacity for visibility
    radius: 40, // Base radius that will be dynamically adjusted
  },
};

export default MouseHeatmap;