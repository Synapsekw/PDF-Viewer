import React, { useState, useCallback, useRef } from 'react';
import { PdfFeatureComponent, PdfFeatureProps } from '../base/types';
import { FeatureOverlay } from '../base/FeatureOverlay';
import { SelectionRect, SnippingState, SnippingToolConfig, SnippingActions } from './types';

const DEFAULT_CONFIG: SnippingToolConfig = {
  selectionBorderColor: '#2196F3',
  selectionBorderWidth: 2,
  selectionFillColor: '#2196F3',
  selectionFillOpacity: 0.1,
  minSelectionSize: 10,
};

interface SnippingToolComponentProps extends PdfFeatureProps {
  isEnabled?: boolean;
  onSelectionChange?: (selection: SelectionRect | null) => void;
  onSnippingAction?: (action: string, data?: any) => void;
}

const SnippingToolComponent: React.FC<SnippingToolComponentProps> = ({ 
  canvasRef, 
  containerRef, 
  isEnabled = false,
  onSelectionChange,
  onSnippingAction
}) => {
  const [state, setState] = useState<SnippingState>({
    isEnabled,
    isSelecting: false,
    startPoint: null,
    currentSelection: null,
    completedSelection: null,
  });

  const overlayRef = useRef<HTMLDivElement>(null);

  // Get canvas coordinates from mouse event
  const getCanvasCoordinates = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - canvasRect.left;
    const y = e.clientY - canvasRect.top;
    
    // Clamp coordinates to canvas bounds
    return {
      x: Math.max(0, Math.min(x, canvasRect.width)),
      y: Math.max(0, Math.min(y, canvasRect.height))
    };
  }, [canvasRef]);

  // Calculate selection rectangle from start and current points
  const calculateSelection = useCallback((start: { x: number; y: number }, current: { x: number; y: number }): SelectionRect => {
    return {
      x: Math.min(start.x, current.x),
      y: Math.min(start.y, current.y),
      width: Math.abs(current.x - start.x),
      height: Math.abs(current.y - start.y),
    };
  }, []);

  // Handle mouse down - start selection
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!state.isEnabled) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const coords = getCanvasCoordinates(e);
    setState(prev => ({
      ...prev,
      isSelecting: true,
      startPoint: coords,
      currentSelection: null,
      completedSelection: null,
    }));
  }, [state.isEnabled, getCanvasCoordinates]);

  // Handle mouse move - update selection
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!state.isSelecting || !state.startPoint) return;
    
    const coords = getCanvasCoordinates(e);
    const selection = calculateSelection(state.startPoint, coords);
    
    setState(prev => ({
      ...prev,
      currentSelection: selection,
    }));
  }, [state.isSelecting, state.startPoint, getCanvasCoordinates, calculateSelection]);

  // Handle mouse up - complete selection
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!state.isSelecting || !state.startPoint) return;
    
    const coords = getCanvasCoordinates(e);
    const selection = calculateSelection(state.startPoint, coords);
    
    // Only complete selection if it meets minimum size requirements
    if (selection.width >= DEFAULT_CONFIG.minSelectionSize && 
        selection.height >= DEFAULT_CONFIG.minSelectionSize) {
      setState(prev => ({
        ...prev,
        isSelecting: false,
        currentSelection: null,
        completedSelection: selection,
      }));
      
      onSelectionChange?.(selection);
    } else {
      // Clear selection if too small
      setState(prev => ({
        ...prev,
        isSelecting: false,
        currentSelection: null,
        completedSelection: null,
      }));
      
      onSelectionChange?.(null);
    }
  }, [state.isSelecting, state.startPoint, getCanvasCoordinates, calculateSelection, onSelectionChange]);

  // Capture selected area as image data
  const captureSelection = useCallback((selection: SelectionRect): string | null => {
    if (!canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return null;
    
    // Create a new canvas for the selected area
    const snippetCanvas = document.createElement('canvas');
    const snippetContext = snippetCanvas.getContext('2d');
    if (!snippetContext) return null;
    
    // Set dimensions for the snippet
    snippetCanvas.width = selection.width;
    snippetCanvas.height = selection.height;
    
    // Copy the selected area from the main canvas
    snippetContext.drawImage(
      canvas,
      selection.x, selection.y, selection.width, selection.height,
      0, 0, selection.width, selection.height
    );
    
    return snippetCanvas.toDataURL('image/png');
  }, [canvasRef]);

  // Copy selection to clipboard
  const copySelection = useCallback(async () => {
    if (!state.completedSelection) return;
    
    try {
      const dataUrl = captureSelection(state.completedSelection);
      if (!dataUrl) return;
      
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      // Copy to clipboard using the modern Clipboard API
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob
          })
        ]);
        
        onSnippingAction?.('copy', { success: true });
      } else {
        // Fallback: create a temporary link for download
        downloadSelection();
      }
    } catch (error) {
      console.error('Failed to copy selection:', error);
      onSnippingAction?.('copy', { success: false, error });
    }
  }, [state.completedSelection, captureSelection, onSnippingAction]);

  // Download selection as image file
  const downloadSelection = useCallback((filename?: string) => {
    if (!state.completedSelection) return;
    
    const dataUrl = captureSelection(state.completedSelection);
    if (!dataUrl) return;
    
    const link = document.createElement('a');
    link.download = filename || `pdf-snippet-${Date.now()}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    onSnippingAction?.('download', { filename: link.download });
  }, [state.completedSelection, captureSelection, onSnippingAction]);

  // Clear current selection
  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      completedSelection: null,
      currentSelection: null,
    }));
    
    onSelectionChange?.(null);
  }, [onSelectionChange]);

  // Get current selection for rendering
  const currentSelection = state.currentSelection || state.completedSelection;

  if (!state.isEnabled) return null;

  return (
    <FeatureOverlay 
      canvasRef={canvasRef}
      containerRef={containerRef} 
      className="snipping-tool" 
      zIndex={3}
    >
      <div
        ref={overlayRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          cursor: state.isSelecting ? 'crosshair' : 'crosshair',
          pointerEvents: 'all',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Selection rectangle */}
        {currentSelection && (
          <div
            style={{
              position: 'absolute',
              left: currentSelection.x,
              top: currentSelection.y,
              width: currentSelection.width,
              height: currentSelection.height,
              border: `${DEFAULT_CONFIG.selectionBorderWidth}px dashed ${DEFAULT_CONFIG.selectionBorderColor}`,
              backgroundColor: DEFAULT_CONFIG.selectionFillColor,
              opacity: DEFAULT_CONFIG.selectionFillOpacity,
              pointerEvents: 'none',
            }}
          />
        )}
        
        {/* Selection info tooltip */}
        {currentSelection && (
          <div
            style={{
              position: 'absolute',
              left: currentSelection.x,
              top: Math.max(0, currentSelection.y - 30),
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              padding: '4px 8px',
              fontSize: '12px',
              borderRadius: '4px',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {Math.round(currentSelection.width)} × {Math.round(currentSelection.height)}
          </div>
        )}
        
        {/* Action buttons for completed selection */}
        {state.completedSelection && (
          <div
            style={{
              position: 'absolute',
              left: state.completedSelection.x + state.completedSelection.width + 10,
              top: state.completedSelection.y,
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
            }}
          >
            <button
              onClick={copySelection}
              style={{
                padding: '5px 10px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
              title="Copy to clipboard"
            >
              Copy
            </button>
            <button
              onClick={() => downloadSelection()}
              style={{
                padding: '5px 10px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
              title="Download as PNG"
            >
              Download
            </button>
            <button
              onClick={clearSelection}
              style={{
                padding: '5px 10px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
              title="Clear selection"
            >
              Clear
            </button>
          </div>
        )}
      </div>
    </FeatureOverlay>
  );
};

// Export the enhanced component with additional props
export const SnippingToolEnhanced = SnippingToolComponent;

export const SnippingTool: PdfFeatureComponent = {
  metadata: {
    id: 'snipping-tool',
    name: 'Snipping Tool',
    description: 'Allows selecting and capturing parts of PDF pages',
    version: '2.0.0',
  },
  Component: SnippingToolComponent,
};

export default SnippingTool;