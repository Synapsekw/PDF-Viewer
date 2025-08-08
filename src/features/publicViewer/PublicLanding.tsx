import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Download, Eye, AlertCircle } from 'lucide-react';
import { viewerSource } from './viewerSource';
import { formatFileSize } from '../library/utils';

const PublicLanding: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [documentMeta, setDocumentMeta] = useState<{ title: string; size: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      viewerSource.getDocumentMeta(token).then(meta => {
        setDocumentMeta(meta);
        setIsLoading(false);
      });
    }
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading document...</div>
      </div>
    );
  }

  if (!documentMeta) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h1 className="text-2xl mb-4">Document Not Found</h1>
          <p className="text-slate-400">The shared document could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-2xl mx-auto text-center py-16">
        <FileText className="w-20 h-20 text-slate-400 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-white mb-4">Shared Document</h1>
        <h2 className="text-xl text-slate-300 mb-4">{documentMeta.title}</h2>
        <p className="text-slate-400 mb-8">Size: {formatFileSize(documentMeta.size)}</p>
        <button
          onClick={() => navigate(`/v/${token}`)}
          className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
        >
          <Eye className="w-5 h-5" />
          View Document
        </button>
      </div>
    </div>
  );
};

export default PublicLanding;
