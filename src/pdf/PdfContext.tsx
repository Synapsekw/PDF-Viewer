import React, { createContext, useContext, useState, ReactNode } from 'react';
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
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [file, setFile] = useState<string | Uint8Array | null>(null);

  const handleSetDocument = (doc: PDFDocumentProxy) => {
    setDocument(doc);
    setTotalPages(doc.numPages);
    setCurrentPage(1);
  };

  const value: PdfContextType = {
    document,
    currentPage,
    totalPages,
    scale,
    rotation,
    file,
    setDocument: handleSetDocument,
    setCurrentPage: (page: number) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
    },
    setScale: (newScale: number) => {
      if (newScale > 0) {
        setScale(newScale);
      }
    },
    setRotation: (newRotation: number) => {
      // Normalize rotation to 0, 90, 180, or 270 degrees
      const normalized = ((newRotation % 360) + 360) % 360;
      setRotation(normalized);
    },
    setFile: (newFile: string | Uint8Array) => {
      setFile(newFile);
    }
  };

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