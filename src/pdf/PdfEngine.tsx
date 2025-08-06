import React, { useEffect, useState, useRef } from 'react';
import { getDocument, GlobalWorkerOptions, PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { usePdf } from './PdfContext';

// Configure PDF.js worker (using local copy)
GlobalWorkerOptions.workerSrc = `/pdfjs/pdf.worker.min.js`;

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
  
  const canvasRef = externalCanvasRef || internalCanvasRef;

  // Load PDF document
  useEffect(() => {
    if (!file) return;

    const loadDocument = async () => {
      try {
        // Ensure we have a fresh copy of the data for PDF.js
        let pdfData;
        if (file instanceof Uint8Array) {
          // Create a new Uint8Array from the existing one to avoid transfer issues
          pdfData = new Uint8Array(file);
        } else {
          pdfData = file;
        }
        
        const document = await getDocument({
          data: pdfData,
          cMapUrl: '/pdfjs/cmaps/',
          cMapPacked: true,
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
      setCurrentPageObj(newPage);

      // Calculate viewport
      const viewport = newPage.getViewport({ scale: pageScale, rotation: pageRotation });

      // Set canvas dimensions
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) {
        console.error('Failed to get canvas context');
        isRenderingRef.current = false;
        return;
      }

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Render PDF page
      await newPage.render({
        canvasContext: context,
        viewport,
      }).promise;

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
    
    renderPage(currentPage, scale || 1, rotation || 0);
  }, [pdfDocument, currentPage, scale, rotation]);

  return <canvas ref={canvasRef} />;
};

export default PdfEngine;