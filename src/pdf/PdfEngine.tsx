import React, { useEffect, useState } from 'react';
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

  // Render page when page number, scale, or rotation changes
  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDocument || !canvasRef.current || !currentPage) {
        return;
      }

      try {
        // Clean up previous page
        currentPageObj?.cleanup();

        // Load new page
        const newPage = await pdfDocument.getPage(currentPage);
        setCurrentPageObj(newPage);

        // Calculate viewport
        const viewport = newPage.getViewport({ scale: scale || 1, rotation: rotation || 0 });

        // Set canvas dimensions
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) {
          console.error('Failed to get canvas context');
          return;
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Render PDF page
        await newPage.render({
          canvasContext: context,
          viewport,
          canvas,
        }).promise;
      } catch (error) {
        console.error('Failed to render page:', error);
      }
    };

    renderPage();
  }, [pdfDocument, currentPage, scale, rotation]);

  return <canvas ref={canvasRef} />;
};

export default PdfEngine;