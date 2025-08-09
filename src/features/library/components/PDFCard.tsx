import React from 'react';
import { FileText, Calendar, HardDrive, FileImage, Trash2, Share2 } from 'lucide-react';
import { LibraryPDFMetadata } from '../types';
import { formatFileSize, formatDate } from '../utils';

interface PDFCardProps {
  pdf: LibraryPDFMetadata;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onShare: (id: string) => void;
}

export const PDFCard: React.FC<PDFCardProps> = ({
  pdf,
  viewMode,
  isSelected,
  onSelect,
  onOpen,
  onDelete,
  onShare
}) => {
  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      onSelect(pdf.id);
    } else {
      onOpen(pdf.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(pdf.id);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare(pdf.id);
  };

  if (viewMode === 'grid') {
    return (
      <div
        className={`
          group relative bg-slate-800/50 backdrop-blur-md rounded-lg border border-slate-700/50
          hover:bg-slate-700/50 hover:border-slate-600/50 transition-all cursor-pointer
          ${isSelected ? 'ring-2 ring-slate-400 bg-slate-700/50' : ''}
        `}
        onClick={handleClick}
      >
        {/* Thumbnail */}
        <div className="aspect-[3/4] rounded-t-lg bg-slate-700/50 flex items-center justify-center overflow-hidden">
          {pdf.thumbnail ? (
            <img 
              src={pdf.thumbnail} 
              alt={pdf.name}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              style={{ 
                imageRendering: 'auto'
              }}
              loading="lazy"
            />
          ) : (
            <FileText className="w-12 h-12 text-slate-400" />
          )}
        </div>
        
        {/* Content */}
        <div className="p-4">
          <h3 className="font-medium text-slate-200 truncate mb-2" title={pdf.name}>
            {pdf.name}
          </h3>
          
          <div className="space-y-1 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <HardDrive className="w-3 h-3" />
              <span>{formatFileSize(pdf.size)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(pdf.addedDate)}</span>
            </div>
            
            {pdf.pageCount && (
              <div className="flex items-center gap-2">
                <FileImage className="w-3 h-3" />
                <span>{pdf.pageCount} pages</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleShare}
            className="p-1 bg-blue-600/80 hover:bg-blue-600 rounded"
            title="Share PDF"
          >
            <Share2 className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 bg-red-600/80 hover:bg-red-600 rounded"
            title="Delete PDF"
          >
            <Trash2 className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div
      className={`
        group flex items-center gap-4 p-4 bg-slate-800/50 backdrop-blur-md rounded-lg border border-slate-700/50
        hover:bg-slate-700/50 hover:border-slate-600/50 transition-all cursor-pointer
        ${isSelected ? 'ring-2 ring-slate-400 bg-slate-700/50' : ''}
      `}
      onClick={handleClick}
    >
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-12 h-16 bg-slate-700/50 rounded flex items-center justify-center overflow-hidden">
        {pdf.thumbnail ? (
          <img 
            src={pdf.thumbnail} 
            alt={pdf.name}
            className="w-full h-full object-cover"
            style={{ 
              imageRendering: 'auto'
            }}
            loading="lazy"
          />
        ) : (
          <FileText className="w-6 h-6 text-slate-400" />
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-slate-200 truncate mb-1" title={pdf.name}>
          {pdf.name}
        </h3>
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <span>{formatFileSize(pdf.size)}</span>
          <span>{formatDate(pdf.addedDate)}</span>
          {pdf.pageCount && <span>{pdf.pageCount} pages</span>}
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleShare}
          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-600/20 rounded transition-colors"
          title="Share PDF"
        >
          <Share2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleDelete}
          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-600/20 rounded transition-colors"
          title="Delete PDF"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
