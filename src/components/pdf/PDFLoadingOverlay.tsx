import React from 'react';
import { FileText, Loader2 } from 'lucide-react';

interface PDFLoadingOverlayProps {
  isLoading: boolean;
  loadingProgress: number;
  isRendering: boolean;
}

export const PDFLoadingOverlay: React.FC<PDFLoadingOverlayProps> = ({
  isLoading,
  loadingProgress,
  isRendering
}) => {
  if (!isLoading && !isRendering) {
    return null;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center z-20 bg-slate-900/80 backdrop-blur-sm">
      <div className="text-center space-y-4">
        {/* Loading Icon */}
        <div className="relative">
          <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
          )}
        </div>
        
        {/* Loading Text */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">
            {isLoading ? 'Loading PDF...' : 'Rendering page...'}
          </h3>
          <p className="text-slate-400 text-sm">
            {isLoading ? 'Please wait while we prepare your document' : 'Optimizing display quality'}
          </p>
        </div>
        
        {/* Progress Bar */}
        {isLoading && (
          <div className="w-64 mx-auto">
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <p className="text-slate-400 text-sm mt-2">
              {loadingProgress}% complete
            </p>
          </div>
        )}
        
        {/* Rendering Indicator */}
        {isRendering && !isLoading && (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        )}
      </div>
    </div>
  );
};
