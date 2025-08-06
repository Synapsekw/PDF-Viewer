import { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { RefObject } from 'react';

/**
 * Props for the core PDF rendering engine component.
 * This interface defines the minimal set of properties required for PDF rendering.
 * 
 * @interface PdfEngineProps
 */
export interface PdfEngineProps {
  /** PDF file as a path string or binary data array */
  file: string | Uint8Array;
  /** Current page number (1-based indexing) */
  page: number;
  /** Zoom scale factor (1.0 = 100%, 2.0 = 200%, etc.) */
  scale: number;
  /** Page rotation in degrees. Must be one of: 0, 90, 180, 270 */
  rotation: number;
  /** Callback fired when PDF document is successfully loaded */
  onLoad?: (doc: PDFDocumentProxy) => void;
  /** Callback fired when a page is successfully rendered */
  onRender?: (page: PDFPageProxy) => void;
  /** Callback fired when an error occurs during loading or rendering */
  onError?: (error: Error) => void;
}

/**
 * Context type for sharing PDF state across the application.
 * This context provides read-only access to PDF state and controlled setters.
 * Features and plugins should use this context instead of directly accessing the PDF engine.
 * 
 * @interface PdfContextType
 */
export interface PdfContextType {
  /** The loaded PDF document proxy from PDF.js */
  document: PDFDocumentProxy | null;
  /** Current page number (1-based) */
  currentPage: number;
  /** Total number of pages in the document */
  totalPages: number;
  /** Current zoom scale factor */
  scale: number;
  /** Current rotation in degrees */
  rotation: number;
  /** The original file data */
  file: string | Uint8Array | null;
  /** Set the PDF document (internal use only) */
  setDocument: (doc: PDFDocumentProxy) => void;
  /** Navigate to a specific page */
  setCurrentPage: (page: number) => void;
  /** Set the zoom scale */
  setScale: (scale: number) => void;
  /** Set the rotation angle */
  setRotation: (rotation: number) => void;
  /** Set the PDF file data (internal use only) */
  setFile: (file: string | Uint8Array) => void;
}

/**
 * Props passed to PDF feature plugins and overlays.
 * This interface provides the minimal set of refs needed for features to interact with the PDF canvas.
 * 
 * @interface PdfFeatureProps
 */
export interface PdfFeatureProps {
  /** Reference to the PDF canvas element for reading pixel data or positioning overlays */
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** Reference to the container element for calculating relative positions */
  containerRef: RefObject<HTMLDivElement | null>;
}

/**
 * Base interface for PDF feature components.
 * All feature plugins should implement this interface.
 * 
 * @interface PdfFeatureComponent
 */
export interface PdfFeatureComponent {
  /** Display name for the feature */
  displayName: string;
  /** React component that renders the feature */
  Component: React.FC<PdfFeatureProps>;
  /** Optional feature configuration */
  config?: Record<string, any>;
}