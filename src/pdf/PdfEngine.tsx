import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { usePdf } from './PdfContext';

const { getDocument, GlobalWorkerOptions } = pdfjsLib;
type PDFDocumentProxy = pdfjsLib.PDFDocumentProxy;
type PDFPageProxy = pdfjsLib.PDFPageProxy;

// Configure PDF.js worker (using local copy)
// In Vite, we need to use the full path including the base URL
GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';
console.log('PdfEngine: Worker source set to:', GlobalWorkerOptions.workerSrc);

// Test worker availability (only in development)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
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
  const [isRendering, setIsRendering] = useState(false);
  const internalCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const isRenderingRef = useRef(false);
  const pendingRenderRef = useRef<{page: number, scale: number, rotation: number} | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const canvasRef = externalCanvasRef || internalCanvasRef;

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
          // Performance optimizations
          disableFontFace: true, // Disable font face loading for faster rendering
          disableRange: true, // Disable range requests for better performance with large files
          disableStream: true, // Disable streaming for consistent performance
          enableXfa: false, // Disable XFA forms support
          useSystemFonts: true, // Use system fonts when possible
          maxImageSize: 16777216, // 16MB limit for images
          isEvalSupported: false, // Disable eval for security and performance
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

  // Function to render a page (memoized for performance)
  const renderPage = useCallback(async (pageNum: number, pageScale: number, pageRotation: number) => {
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
      setIsRendering(true);

      // Load new page first, then cleanup (prevents flash)
      const newPage = await pdfDocument.getPage(pageNum);
      
      // Clean up previous page after new page is loaded
      if (currentPageObj && currentPageObj !== newPage) {
        currentPageObj.cleanup();
      }
      
      setCurrentPageObj(newPage);

      // Calculate viewport
      const viewport = newPage.getViewport({ scale: pageScale, rotation: pageRotation });

      // Set canvas dimensions
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d', {
        alpha: false, // Disable alpha channel for better performance
        willReadFrequently: false, // Optimize for write operations
        desynchronized: true, // Allow desynchronized rendering
      });
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
      const offscreenContext = offscreenCanvas.getContext('2d', {
        alpha: false, // Disable alpha channel for better performance
        willReadFrequently: false, // Optimize for write operations
        desynchronized: true, // Allow desynchronized rendering
      });
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
      
      // Seamless copy from offscreen to visible canvas
      // Use requestAnimationFrame for smooth visual updates
      requestAnimationFrame(() => {
        context.save();
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        
        // Clear and draw in one atomic operation
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(offscreenCanvas, 0, 0, canvas.width, canvas.height);
        
        context.restore();
        setIsRendering(false);
      });
      console.log('PdfEngine: Page rendered successfully');
      
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
      setIsRendering(false);
    }
  }, [pdfDocument, currentPageObj]);

  // Render page when page number, scale, or rotation changes
  useEffect(() => {
    if (!pdfDocument || !currentPage) return;
    
    // Immediate render for page changes, debounced for zoom/rotation
    const isPageChange = pendingRenderRef.current?.page !== currentPage;
    const delay = isPageChange ? 0 : 50; // Immediate for page changes, 50ms for zoom
    
    const timeoutId = setTimeout(() => {
      renderPage(currentPage, scale || 1, rotation || 0);
    }, delay);
    
    return () => clearTimeout(timeoutId);
  }, [pdfDocument, currentPage, scale, rotation, renderPage]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{
        display: 'block',
        transition: 'opacity 0.15s ease-out',
        willChange: 'transform',
        opacity: isRendering ? 0.9 : 1,
      }}
    />
  );
};

// Memoize the PdfEngine component for performance
export default memo(PdfEngine);