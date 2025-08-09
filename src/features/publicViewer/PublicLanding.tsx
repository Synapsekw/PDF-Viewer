import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Download, Eye, Clock, AlertCircle } from 'lucide-react';
import { viewerSource } from './viewerSource';
import { formatFileSize } from '../library/utils';

const PublicLanding: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [documentMeta, setDocumentMeta] = useState<{ title: string; size: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDocumentMeta = async () => {
      if (!token) {
        setError('Invalid share link');
        setIsLoading(false);
        return;
      }

      try {
        const meta = await viewerSource.getDocumentMeta(token);
        if (meta) {
          setDocumentMeta(meta);
        } else {
          setError('Document not found or share link has expired');
        }
      } catch (err) {
        console.error('Failed to load document meta:', err);
        setError('Failed to load document information');
      } finally {
        setIsLoading(false);
      }
    };

    loadDocumentMeta();
  }, [token]);

  const handleViewDocument = () => {
    navigate(`/v/${token}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !documentMeta) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Document Not Found</h1>
          <p className="text-slate-400 mb-6">
            {error || 'The shared document could not be found. The link may have expired or been revoked.'}
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
          >
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-700/50 rounded-full mb-6">
              <FileText className="w-10 h-10 text-slate-300" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Shared Document</h1>
            <p className="text-slate-400">You've been invited to view this document</p>
          </div>

          {/* Document Card */}
          <div className="bg-slate-800/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-8 mb-8">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-16 h-20 bg-slate-700/50 rounded-lg flex items-center justify-center">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-white mb-3 break-words">
                  {documentMeta.title}
                </h2>
                
                <div className="flex flex-wrap gap-4 text-sm text-slate-400 mb-6">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    <span>{formatFileSize(documentMeta.size)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>PDF Document</span>
                  </div>
                </div>

                <button
                  onClick={handleViewDocument}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-slate-600 hover:bg-slate-500 text-white font-medium rounded-lg transition-colors"
                >
                  <Eye className="w-5 h-5" />
                  View Document
                </button>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
            <div className="bg-slate-800/30 rounded-lg p-4">
              <Eye className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-300 font-medium mb-1">Interactive Viewer</p>
              <p className="text-xs text-slate-500">Navigate, zoom, and search the document</p>
            </div>
            <div className="bg-slate-800/30 rounded-lg p-4">
              <FileText className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-300 font-medium mb-1">AI Assistant</p>
              <p className="text-xs text-slate-500">Ask questions about the document content</p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-12">
            <p className="text-xs text-slate-500">
              This document was shared securely via PDF Viewer
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicLanding;