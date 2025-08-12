import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { PDFDocumentProxy } from 'pdfjs-dist';
import { PdfContextType } from './types';

const PdfContext = createContext<PdfContextType | null>(null);

interface PdfProviderProps {
  children: ReactNode;
}

export const PdfProvider: React.FC<PdfProviderProps> = ({ children }) => {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0); // 100% starting zoom
  const [rotation, setRotation] = useState(0);
  const [file, setFile] = useState<string | Uint8Array | null>(null);
  const [documentMeta, setDocumentMeta] = useState<{ name: string; id?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [isRendering, setIsRendering] = useState(false);
  
  // Debug logging for file changes
  useEffect(() => {
    console.log('PdfContext: File state changed:', file ? `Uint8Array(${file instanceof Uint8Array ? file.length : 'string'})` : 'null');
  }, [file]);

  // Memoize callbacks for performance
  const handleSetDocument = useCallback((doc: PDFDocumentProxy) => {
    console.log('PdfContext: Setting document with', doc.numPages, 'pages');
    setDocument(doc);
    setTotalPages(doc.numPages);
    setCurrentPage(1);
    setIsLoading(false);
    setLoadingProgress(100);
  }, []);

  const handleSetCurrentPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const handleSetScale = useCallback((newScale: number) => {
    if (newScale > 0) {
      setScale(newScale);
    }
  }, []);

  const handleSetRotation = useCallback((newRotation: number) => {
    // Normalize rotation to 0, 90, 180, or 270 degrees
    const normalized = ((newRotation % 360) + 360) % 360;
    setRotation(normalized);
  }, []);

  const handleSetFile = useCallback((newFile: string | Uint8Array) => {
    console.log('PdfContext: setFile called with:', typeof newFile, newFile instanceof Uint8Array ? `Uint8Array(${newFile.length})` : newFile);
    setFile(newFile);
    setIsLoading(true);
    setLoadingProgress(0);
  }, []);

  const handleSetDocumentMeta = useCallback((meta: { name: string; id?: string } | null) => {
    console.log('PdfContext: setDocumentMeta called with:', meta);
    setDocumentMeta(meta);
  }, []);

  const handleSetLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
    if (!loading) {
      setLoadingProgress(100);
    }
  }, []);

  const handleSetLoadingProgress = useCallback((progress: number) => {
    setLoadingProgress(progress);
  }, []);

  const handleSetRendering = useCallback((rendering: boolean) => {
    setIsRendering(rendering);
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value: PdfContextType = useMemo(() => ({
    document,
    currentPage,
    totalPages,
    scale,
    rotation,
    file,
    documentMeta,
    isLoading,
    loadingProgress,
    isRendering,
    setDocument: handleSetDocument,
    setCurrentPage: handleSetCurrentPage,
    setScale: handleSetScale,
    setRotation: handleSetRotation,
    setFile: handleSetFile,
    setDocumentMeta: handleSetDocumentMeta,
    setLoading: handleSetLoading,
    setLoadingProgress: handleSetLoadingProgress,
    setRendering: handleSetRendering
  }), [
    document,
    currentPage,
    totalPages,
    scale,
    rotation,
    file,
    documentMeta,
    isLoading,
    loadingProgress,
    isRendering,
    handleSetDocument,
    handleSetCurrentPage,
    handleSetScale,
    handleSetRotation,
    handleSetFile,
    handleSetDocumentMeta,
    handleSetLoading,
    handleSetLoadingProgress,
    handleSetRendering
  ]);

  return (
    <PdfContext.Provider value={value}>
      {children}
    </PdfContext.Provider>
  );
};

export const usePdf = (): PdfContextType => {
  const context = useContext(PdfContext);
  if (!context) {
    throw new Error('usePdf must be used within a PdfProvider');
  }
  return context;
};

export default PdfContext;