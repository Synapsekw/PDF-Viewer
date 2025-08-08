import React, { useEffect, useState, useRef, useMemo } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { usePdf } from './PdfContext';



const { getDocument, GlobalWorkerOptions } = pdfjsLib;
type PDFDocumentProxy = pdfjsLib.PDFDocumentProxy;
type PDFPageProxy = pdfjsLib.PDFPageProxy;

// Configure PDF.js worker
GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';

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
    if (!currentPageObj) return null;
    const effectiveScale = scale || 1;
    const effectiveRotation = rotation || 0;
    try {
      return currentPageObj.getViewport({ scale: effectiveScale, rotation: effectiveRotation });
    } catch {
      return null;
    }
  }, [currentPageObj, scale, rotation]);

  // Load PDF document
  useEffect(() => {
    if (!file) return;

    const loadDocument = async () => {
      try {
        const pdfData = file instanceof Uint8Array ? new Uint8Array(file) : file;
        const document = await getDocument({
          data: pdfData,
          cMapUrl: '/pdfjs/cmaps/',
          cMapPacked: true,
          disableFontFace: false,
          disableRange: false,
          disableStream: false,
        }).promise;
        
        setPdfDocument(document);
        setDocument(document);
      } catch (error) {
        console.error('Failed to load PDF:', error);
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
    console.log('[PdfEngine] renderPage called with:', { pageNum, pageScale, pageRotation });
    console.log('[PdfEngine] renderPage - this is the debug version');
    
    if (!pdfDocument || !canvasRef.current) {
      console.log('[PdfEngine] renderPage early return - no pdfDocument or canvasRef');
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
      console.log('[PdfEngine] Setting currentPageObj:', !!newPage, 'pageNum:', pageNum);
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

        isRenderingRef.current = false;
        return;
      }

      // Set canvas dimensions to match viewport

      
      // Check for browser canvas size limits (most browsers limit to ~16,777,216 pixels)
      const maxCanvasSize = 16384; // Conservative limit
      let renderScale = 1.0;
      
      if (viewport.width > maxCanvasSize || viewport.height > maxCanvasSize) {

        // Calculate scale factor to fit within limits
        renderScale = Math.min(maxCanvasSize / viewport.width, maxCanvasSize / viewport.height);
        const finalWidth = Math.floor(viewport.width * renderScale);
        const finalHeight = Math.floor(viewport.height * renderScale);
        
        // Set both canvases to the same dimensions
        canvas.width = finalWidth;
        canvas.height = finalHeight;
        offscreenCanvas.width = finalWidth;
        offscreenCanvas.height = finalHeight;
        

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

    </div>
  );
};

export default PdfEngine;