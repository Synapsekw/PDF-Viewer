import React, { useEffect, useState, useRef, useMemo } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { usePdf } from './PdfContext';
import { TextLayer } from '@/features/selection/TextLayer';

const { getDocument, GlobalWorkerOptions } = pdfjsLib;
type PDFDocumentProxy = pdfjsLib.PDFDocumentProxy;
type PDFPageProxy = pdfjsLib.PDFPageProxy;

// Configure PDF.js worker (using local copy)
// In Vite, we need to use the full path including the base URL
GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';
console.log('PdfEngine: Worker source set to:', GlobalWorkerOptions.workerSrc);

// Test worker availability
if (typeof window !== 'undefined') {
  fetch('/pdfjs/pdf.worker.min.js')
    .then(response => {
      console.log('PdfEngine: Worker file accessible:', response.ok);
    })
    .catch(error => {
      console.error('PdfEngine: Worker file not accessible:', error);
    });
}

/**
 * Props for the PdfEngine component.
 * The engine only accepts a canvas ref - all other configuration comes from PdfContext.
 */
interface PdfEngineProps {
  /** Reference to the canvas element where the PDF will be rendered */
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
}

/**
 * Core PDF rendering engine component.
 * 
 * This component is responsible for:
 * - Loading PDF documents using PDF.js
 * - Rendering pages to a canvas element
 * - Handling zoom, rotation, and page navigation
 * 
 * IMPORTANT: This component should NEVER be modified by features or plugins.
 * All interaction should happen through the PdfContext.
 * 
 * @component
 * @param {PdfEngineProps} props - Component props
 * @returns {JSX.Element} Canvas element for PDF rendering
 */
export const PdfEngine: React.FC<PdfEngineProps> = ({
  canvasRef: externalCanvasRef,
}) => {
  const { file, currentPage, scale, rotation, setDocument } = usePdf();
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [currentPageObj, setCurrentPageObj] = useState<PDFPageProxy | null>(null);
  const internalCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const isRenderingRef = useRef(false);
  const pendingRenderRef = useRef<{page: number, scale: number, rotation: number} | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const canvasRef = externalCanvasRef || internalCanvasRef;
  
  // Computed viewport for current page to size the wrapper
  const currentViewport = useMemo(() => {
    if (!currentPageObj) {
      console.log('[PdfEngine] currentViewport: no currentPageObj');
      return null;
    }
    const effectiveScale = scale || 1;
    const effectiveRotation = rotation || 0;
    try {
      const viewport = currentPageObj.getViewport({ scale: effectiveScale, rotation: effectiveRotation });
      console.log('[PdfEngine] currentViewport calculated:', {
        width: viewport.width,
        height: viewport.height,
        scale: effectiveScale,
        rotation: effectiveRotation
      });
      return viewport;
    } catch (error) {
      console.error('[PdfEngine] currentViewport error:', error);
      return null;
    }
  }, [currentPageObj, scale, rotation]);

  // Load PDF document
  useEffect(() => {
    console.log('PdfEngine: File changed, file type:', typeof file, 'file instanceof Uint8Array:', file instanceof Uint8Array);
    if (!file) {
      console.log('PdfEngine: No file provided, returning');
      return;
    }

    const loadDocument = async () => {
      try {
        console.log('PdfEngine: Starting to load PDF document...');
        
        // Ensure we have a fresh copy of the data for PDF.js
        let pdfData;
        if (file instanceof Uint8Array) {
          console.log('PdfEngine: File is Uint8Array, length:', file.length);
          // Create a new Uint8Array from the existing one to avoid transfer issues
          pdfData = new Uint8Array(file);
          console.log('PdfEngine: Created new Uint8Array, length:', pdfData.length);
        } else {
          console.log('PdfEngine: File is not Uint8Array, using as-is');
          pdfData = file;
        }
        
        console.log('PdfEngine: About to call getDocument with data length:', pdfData.length);
        const document = await getDocument({
          data: pdfData,
          cMapUrl: '/pdfjs/cmaps/',
          cMapPacked: true,
          disableFontFace: false,
          disableRange: false,
          disableStream: false,
        }).promise;
        
        console.log('PdfEngine: PDF document loaded successfully, pages:', document.numPages);
        setPdfDocument(document);
        setDocument(document);
      } catch (error) {
        console.error('PdfEngine: Failed to load PDF:', error);
        if (error instanceof Error) {
          console.error('PdfEngine: Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        }
      }
    };

    loadDocument();

    return () => {
      if (pdfDocument) {
        pdfDocument.destroy();
      }
      if (currentPageObj) {
        currentPageObj.cleanup();
      }
    };
  }, [file]);

  // Function to render a page
  const renderPage = async (pageNum: number, pageScale: number, pageRotation: number) => {
    if (!pdfDocument || !canvasRef.current) {
      return;
    }

    // If already rendering, store these parameters for later
    if (isRenderingRef.current) {
      pendingRenderRef.current = {
        page: pageNum,
        scale: pageScale,
        rotation: pageRotation
      };
      return;
    }

    try {
      isRenderingRef.current = true;

      // Clean up previous page
      if (currentPageObj) {
        currentPageObj.cleanup();
        setCurrentPageObj(null);
      }

      // Load new page
      const newPage = await pdfDocument.getPage(pageNum);
      console.log('[PdfEngine] Setting currentPageObj:', !!newPage);
      setCurrentPageObj(newPage);

      // Calculate viewport
      const viewport = newPage.getViewport({ scale: pageScale, rotation: pageRotation });
      console.log('[PdfEngine] Calculated viewport:', {
        width: viewport.width,
        height: viewport.height,
        scale: pageScale,
        rotation: pageRotation
      });

      // Set canvas dimensions
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) {
        console.error('PdfEngine: Failed to get canvas context');
        isRenderingRef.current = false;
        return;
      }

      // Create off-screen canvas for double-buffering to prevent white flash
      if (!offscreenCanvasRef.current) {
        offscreenCanvasRef.current = document.createElement('canvas');
      }
      const offscreenCanvas = offscreenCanvasRef.current;
      const offscreenContext = offscreenCanvas.getContext('2d');
      if (!offscreenContext) {
        console.error('PdfEngine: Failed to get offscreen canvas context');
        isRenderingRef.current = false;
        return;
      }

      // Set canvas dimensions to match viewport
      console.log('PdfEngine: Setting canvas dimensions:', viewport.width, 'x', viewport.height, 'scale:', pageScale);
      
      // Check for browser canvas size limits (most browsers limit to ~16,777,216 pixels)
      const maxCanvasSize = 16384; // Conservative limit
      let renderScale = 1.0;
      
      if (viewport.width > maxCanvasSize || viewport.height > maxCanvasSize) {
        console.warn('PdfEngine: Canvas size exceeds browser limits:', viewport.width, 'x', viewport.height);
        // Calculate scale factor to fit within limits
        renderScale = Math.min(maxCanvasSize / viewport.width, maxCanvasSize / viewport.height);
        const finalWidth = Math.floor(viewport.width * renderScale);
        const finalHeight = Math.floor(viewport.height * renderScale);
        
        // Set both canvases to the same dimensions
        canvas.width = finalWidth;
        canvas.height = finalHeight;
        offscreenCanvas.width = finalWidth;
        offscreenCanvas.height = finalHeight;
        
        console.log('PdfEngine: Using render scale:', renderScale, 'canvas size:', finalWidth, 'x', finalHeight);
      } else {
        const finalWidth = viewport.width;
        const finalHeight = viewport.height;
        
        // Set both canvases to the same dimensions
        canvas.width = finalWidth;
        canvas.height = finalHeight;
        offscreenCanvas.width = finalWidth;
        offscreenCanvas.height = finalHeight;
      }
      
      // Set CSS to make canvas responsive and centered
      // Use the actual viewport dimensions for CSS to ensure proper scaling
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      canvas.style.maxWidth = 'none'; // Remove max width constraint
      canvas.style.maxHeight = 'none'; // Remove max height constraint
      canvas.style.objectFit = 'contain';
      canvas.style.display = 'block';
      
      // Render to offscreen canvas first to prevent white flash
      offscreenContext.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
      
      // Create a gradient background that matches the glassmorphic effect
      // The background is a semi-transparent white (bg-white/10) over a dark gradient
      const gradient = offscreenContext.createLinearGradient(0, 0, offscreenCanvas.width, offscreenCanvas.height);
      gradient.addColorStop(0, 'rgba(15, 23, 42, 0.95)'); // slate-900 with opacity
      gradient.addColorStop(0.5, 'rgba(30, 41, 59, 0.95)'); // slate-800 with opacity  
      gradient.addColorStop(1, 'rgba(15, 23, 42, 0.95)'); // slate-900 with opacity
      
      offscreenContext.fillStyle = gradient;
      offscreenContext.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
      
      // Add a subtle semi-transparent white overlay to match bg-white/10
      offscreenContext.fillStyle = 'rgba(255, 255, 255, 0.1)';
      offscreenContext.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

      // Render PDF page to offscreen canvas
      console.log('PdfEngine: About to render page to offscreen canvas with render scale:', renderScale);
      
      // Create a scaled viewport if needed
      const renderViewport = renderScale !== 1.0 
        ? newPage.getViewport({ scale: pageScale * renderScale, rotation: pageRotation })
        : viewport;
      
      await newPage.render({
        canvasContext: offscreenContext,
        viewport: renderViewport,
        canvas: offscreenCanvas,
      }).promise;
      
      // Now copy the rendered content to the visible canvas
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(offscreenCanvas, 0, 0);
      console.log('PdfEngine: Page rendered successfully');
      console.log('[PdfEngine] After render - currentPageObj:', !!currentPageObj, 'currentViewport:', !!currentViewport);
      
      // Debug: Check if canvas has content
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const hasContent = imageData.data.some(pixel => pixel !== 0);
      console.log('PdfEngine: Canvas has content:', hasContent, 'canvas dimensions:', canvas.width, 'x', canvas.height);

      isRenderingRef.current = false;

      // Check if there's a pending render request
      if (pendingRenderRef.current) {
        const { page, scale, rotation } = pendingRenderRef.current;
        pendingRenderRef.current = null;
        
        // Only trigger a new render if the parameters have changed
        if (page !== pageNum || scale !== pageScale || rotation !== pageRotation) {
          renderPage(page, scale, rotation);
        }
      }
    } catch (error) {
      console.error('Failed to render page:', error);
      isRenderingRef.current = false;
    }
  };

  // Render page when page number, scale, or rotation changes
  useEffect(() => {
    if (!pdfDocument || !currentPage) return;
    
    // Add debouncing to prevent rapid re-renders during zoom
    const timeoutId = setTimeout(() => {
      renderPage(currentPage, scale || 1, rotation || 0);
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [pdfDocument, currentPage, scale, rotation]);

  // Debug logging for TextLayer rendering - use useEffect to track state changes
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[PdfEngine] State changed:', {
      currentPageObj: !!currentPageObj,
      currentViewport: !!currentViewport,
      currentPage,
      scale,
      rotation
    })

    const shouldRenderTextLayer = currentPageObj && currentViewport
    if (!shouldRenderTextLayer) {
      // eslint-disable-next-line no-console
      console.log('[PdfEngine] TextLayer not rendered because:', {
        currentPageObj: !!currentPageObj,
        currentViewport: !!currentViewport,
        currentPage,
        scale,
        rotation
      })
    } else {
      // eslint-disable-next-line no-console
      console.log('[PdfEngine] TextLayer should be rendered')
    }
  }, [currentPageObj, currentViewport, currentPage, scale, rotation])

  const shouldRenderTextLayer = currentPageObj && currentViewport

  return (
    <div
      style={{
        position: 'relative',
        width: currentViewport ? currentViewport.width : undefined,
        height: currentViewport ? currentViewport.height : undefined,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}
      />
      {shouldRenderTextLayer && (
        <TextLayer
          page={currentPageObj}
          pageIndex={(currentPage || 1) - 1}
          transform={{ scale: scale || 1, rotation: rotation || 0 }}
        />
      )}
    </div>
  );
};

export default PdfEngine;