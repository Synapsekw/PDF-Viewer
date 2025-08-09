/**
 * Upload Progress Component - Shows progress for PDF uploads
 */

import React from 'react';
import { UploadProgress as UploadProgressType } from '../../lib/repositories/supabase/LibraryRepository';

interface UploadProgressProps {
  progress: UploadProgressType;
  fileName: string;
  onCancel?: () => void;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  progress,
  fileName,
  onCancel
}) => {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getProgressColor = (): string => {
    if (progress.error) return 'bg-red-500';
    if (progress.isComplete) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getStatusText = (): string => {
    if (progress.error) return 'Upload failed';
    if (progress.isComplete) return 'Upload complete';
    return `Uploading... ${formatBytes(progress.bytesUploaded)} / ${formatBytes(progress.totalBytes)}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            {progress.isComplete ? (
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : progress.error ? (
              <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
              </svg>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">
              {fileName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {getStatusText()}
            </p>
          </div>
        </div>
        
        {onCancel && !progress.isComplete && !progress.error && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Cancel upload"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${progress.progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>{progress.progress}%</span>
          <span>{formatBytes(progress.totalBytes)}</span>
        </div>
      </div>

      {/* Error Message */}
      {progress.error && (
        <div className="mt-2 text-sm text-red-600 dark:text-red-400">
          {progress.error}
        </div>
      )}
    </div>
  );
};

interface MultiUploadProgressProps {
  uploads: Array<{
    id: string;
    fileName: string;
    progress: UploadProgressType;
  }>;
  onCancelUpload?: (id: string) => void;
  className?: string;
}

export const MultiUploadProgress: React.FC<MultiUploadProgressProps> = ({
  uploads,
  onCancelUpload,
  className = ""
}) => {
  if (uploads.length === 0) return null;

  const activeUploads = uploads.filter(upload => !upload.progress.isComplete && !upload.progress.error);
  const completedUploads = uploads.filter(upload => upload.progress.isComplete);
  const failedUploads = uploads.filter(upload => upload.progress.error);

  const overallProgress = uploads.length > 0 
    ? uploads.reduce((sum, upload) => sum + upload.progress.progress, 0) / uploads.length
    : 0;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Overall Progress */}
      {uploads.length > 1 && (
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Overall Progress
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {completedUploads.length + failedUploads.length} / {uploads.length} complete
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="h-2 bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Individual Upload Progress */}
      {uploads.map((upload) => (
        <UploadProgress
          key={upload.id}
          progress={upload.progress}
          fileName={upload.fileName}
          onCancel={onCancelUpload ? () => onCancelUpload(upload.id) : undefined}
        />
      ))}

      {/* Summary */}
      {uploads.length > 1 && (completedUploads.length > 0 || failedUploads.length > 0) && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center space-x-4">
          {completedUploads.length > 0 && (
            <span className="text-green-600 dark:text-green-400">
              ✓ {completedUploads.length} completed
            </span>
          )}
          {failedUploads.length > 0 && (
            <span className="text-red-600 dark:text-red-400">
              ✗ {failedUploads.length} failed
            </span>
          )}
          {activeUploads.length > 0 && (
            <span>
              ⟳ {activeUploads.length} uploading
            </span>
          )}
        </div>
      )}
    </div>
  );
};
