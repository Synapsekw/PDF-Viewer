import React, { useCallback, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { isValidPDF } from '../utils';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  isVisible: boolean;
  onClose: () => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFilesSelected, isVisible, onClose }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(isValidPDF);
    if (files.length > 0) {
      onFilesSelected(files);
      onClose();
    }
  }, [onFilesSelected, onClose]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const validFiles = Array.from(files).filter(isValidPDF);
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
        onClose();
      }
    }
  }, [onFilesSelected, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800/90 backdrop-blur-md rounded-xl border border-slate-700/50 p-8 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-200">Add PDFs to Library</h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragOver 
              ? 'border-slate-400 bg-slate-700/50' 
              : 'border-slate-600 hover:border-slate-500'
            }
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-300 mb-2">
            Drag and drop PDF files here
          </p>
          <p className="text-slate-500 text-sm mb-4">
            or
          </p>
          
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded-lg cursor-pointer transition-colors">
            <FileText className="w-4 h-4" />
            Choose Files
            <input
              type="file"
              accept=".pdf,application/pdf"
              multiple
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
          
          <p className="text-xs text-slate-500 mt-4">
            Only PDF files are supported
          </p>
        </div>
      </div>
    </div>
  );
};
