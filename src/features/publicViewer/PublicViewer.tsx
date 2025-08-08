import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { viewerSource } from './viewerSource';
import { PdfProvider, usePdf } from '../../pdf/PdfContext';
import { PdfEngine } from '../../pdf/PdfEngine';

const PublicViewerContent: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setFile } = usePdf();

  useEffect(() => {
    const loadDocument = async () => {
      if (!token) {
        setError('Invalid share link');
        setIsLoading(false);
        return;
      }

      try {
        const url = await viewerSource.getBlobByToken(token);
        if (!url) {
          setError('Document not found');
          setIsLoading(false);
          return;
        }

        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        setFile(uint8Array);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load document');
        setIsLoading(false);
      }
    };

    loadDocument();
  }, [token, setFile]);

  if (isLoading) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading document...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h1 className="text-2xl mb-4">Document Not Available</h1>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-900">
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <h1 className="text-lg font-semibold text-white">Shared Document</h1>
      </div>
      <div className="h-full">
        <PdfEngine />
      </div>
    </div>
  );
};

const PublicViewer: React.FC = () => {
  return (
    <PdfProvider>
      <PublicViewerContent />
    </PdfProvider>
  );
};

export default PublicViewer;
