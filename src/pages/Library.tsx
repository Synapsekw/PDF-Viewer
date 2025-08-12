import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Trash2, Download, Copy, X, Share2, ExternalLink } from 'lucide-react';
import { LibraryPDFMetadata, LibraryFilters, ViewMode, LibraryState } from '../features/library/types';
import { filterAndSortPDFs, generateUniqueFileName } from '../features/library/utils';
import { LibraryControls } from '../features/library/components/LibraryControls';
import { PDFCard } from '../features/library/components/PDFCard';
import { DropZone } from '../features/library/components/DropZone';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/ui/Toast';
import { shareService } from '../features/share/shareService';
import { repositoryManager } from '../lib/repositories/RepositoryManager';
import { SupabaseClientManager } from '../lib/supabase/client';

const Library: React.FC = () => {
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  
  const [state, setState] = useState<LibraryState>({
    pdfs: [],
    viewMode: 'grid',
    filters: {
      search: '',
      sortBy: 'date',
      sortDirection: 'desc'
    },
    isLoading: true,
    selectedPdfs: []
  });
  
  const [showDropZone, setShowDropZone] = useState(false);
  const [shareModal, setShareModal] = useState<{ 
    isOpen: boolean; 
    pdfId: string; 
    shareUrl: string;
    expiryDays?: number;
  }>({
    isOpen: false,
    pdfId: '',
    shareUrl: '',
    expiryDays: undefined
  });
  
  const [uploadProgress, setUploadProgress] = useState<{
    isUploading: boolean;
    progress: number;
    fileName: string;
  }>({
    isUploading: false,
    progress: 0,
    fileName: ''
  });

  // Load PDFs on mount
  useEffect(() => {
    loadPDFs();
  }, []);

  const loadPDFs = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Configure repository manager to use Supabase if user is authenticated
      const supabase = SupabaseClientManager.getClient();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          repositoryManager.configure({ mode: 'supabase' });
        } else {
          repositoryManager.configure({ mode: 'local' });
        }
      } else {
        repositoryManager.configure({ mode: 'local' });
      }
      
      const libraryRepo = repositoryManager.getLibraryRepository();
      const pdfs = await libraryRepo.list();
      setState(prev => ({ ...prev, pdfs, isLoading: false }));
    } catch (error) {
      console.error('Failed to load PDFs:', error);
      showToast('Failed to load PDF library', 'error');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [showToast]);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    console.log('handleFilesSelected called with files:', files);
    
    try {
      const existingNames = state.pdfs.map(pdf => pdf.originalName);
      const libraryRepo = repositoryManager.getLibraryRepository();
      console.log('Library repository:', libraryRepo);
      
      for (const file of files) {
        console.log('Processing file:', file.name, 'Size:', file.size);
        
        // Generate unique filename if needed
        const uniqueName = generateUniqueFileName(file.name, existingNames);
        
        // Create a new file with the unique name if it was changed
        const fileToAdd = uniqueName !== file.name 
          ? new File([file], uniqueName, { type: file.type })
          : file;
        
        console.log('Adding file to library:', fileToAdd.name);
        
        // Set upload progress
        setUploadProgress({
          isUploading: true,
          progress: 0,
          fileName: fileToAdd.name
        });
        
        // Add with progress callback
        if ('add' in libraryRepo && typeof libraryRepo.add === 'function') {
          await libraryRepo.add(fileToAdd, (progress: any) => {
            if (progress && typeof progress.progress === 'number') {
              setUploadProgress({
                isUploading: true,
                progress: progress.progress,
                fileName: fileToAdd.name
              });
            }
          });
        } else {
          await libraryRepo.add(fileToAdd);
        }
        
        console.log('File added successfully:', fileToAdd.name);
        existingNames.push(uniqueName);
      }
      
      // Clear upload progress
      setUploadProgress({
        isUploading: false,
        progress: 0,
        fileName: ''
      });
      
      console.log('Reloading PDFs...');
      await loadPDFs();
      showToast(`Added ${files.length} PDF${files.length > 1 ? 's' : ''} to library`, 'success');
    } catch (error) {
      console.error('Failed to add PDFs:', error);
      showToast('Failed to add PDFs to library', 'error');
      setUploadProgress({
        isUploading: false,
        progress: 0,
        fileName: ''
      });
    }
  }, [state.pdfs, loadPDFs, showToast]);

  const handlePDFOpen = (id: string) => {
    console.log('Library: Opening PDF with ID:', id);
    console.log('Library: Navigating to:', `/viewer?localId=${id}`);
    navigate(`/viewer?localId=${id}`);
  };

  const handlePDFDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this PDF?')) {
      try {
        const libraryRepo = repositoryManager.getLibraryRepository();
        await libraryRepo.delete(id);
        await loadPDFs();
        showToast('PDF deleted successfully', 'success');
      } catch (error) {
        console.error('Failed to delete PDF:', error);
        showToast('Failed to delete PDF', 'error');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (state.selectedPdfs.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${state.selectedPdfs.length} PDF${state.selectedPdfs.length > 1 ? 's' : ''}?`)) {
      try {
        const libraryRepo = repositoryManager.getLibraryRepository();
        await Promise.all(state.selectedPdfs.map(id => libraryRepo.delete(id)));
        await loadPDFs();
        setState(prev => ({ ...prev, selectedPdfs: [] }));
        showToast('PDFs deleted successfully', 'success');
      } catch (error) {
        console.error('Failed to delete PDFs:', error);
        showToast('Failed to delete PDFs', 'error');
      }
    }
  };

  const handlePDFSelect = (id: string) => {
    setState(prev => ({
      ...prev,
      selectedPdfs: prev.selectedPdfs.includes(id)
        ? prev.selectedPdfs.filter(selectedId => selectedId !== id)
        : [...prev.selectedPdfs, id]
    }));
  };

  const handleFiltersChange = (filters: LibraryFilters) => {
    setState(prev => ({ ...prev, filters }));
  };

  const handleViewModeChange = (viewMode: ViewMode) => {
    setState(prev => ({ ...prev, viewMode }));
  };

  const handlePDFShare = async (id: string) => {
    setShareModal({
      isOpen: true,
      pdfId: id,
      shareUrl: '',
      expiryDays: undefined
    });
  };

  const handleCreateShare = async () => {
    try {
      const { token } = await shareService.createShare(shareModal.pdfId, shareModal.expiryDays);
      const shareUrl = shareService.generatePublicUrl(token);
      
      setShareModal(prev => ({
        ...prev,
        shareUrl
      }));
      
      showToast('Share link generated successfully', 'success');
    } catch (error) {
      console.error('Failed to create share link:', error);
      showToast('Failed to create share link', 'error');
    }
  };

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareModal.shareUrl);
      showToast('Share link copied to clipboard', 'success');
    } catch (error) {
      console.error('Failed to copy link:', error);
      showToast('Failed to copy link', 'error');
    }
  };

  const closeShareModal = () => {
    setShareModal({ isOpen: false, pdfId: '', shareUrl: '', expiryDays: undefined });
  };



  // Global drag and drop
  useEffect(() => {
    const handleGlobalDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleGlobalDrop = (e: DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer?.files || []).filter(file => 
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      );
      
      if (files.length > 0) {
        handleFilesSelected(files);
      }
    };

    document.addEventListener('dragover', handleGlobalDragOver);
    document.addEventListener('drop', handleGlobalDrop);

    return () => {
      document.removeEventListener('dragover', handleGlobalDragOver);
      document.removeEventListener('drop', handleGlobalDrop);
    };
  }, [handleFilesSelected]);

  const filteredPDFs = filterAndSortPDFs(state.pdfs, state.filters);

  if (state.isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400">Loading your PDF library...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6 px-4 lg:px-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">PDF Library</h1>
            <p className="text-slate-400">
              {state.pdfs.length} PDF{state.pdfs.length !== 1 ? 's' : ''} in your library
            </p>
          </div>
          
          {state.selectedPdfs.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">
                {state.selectedPdfs.length} selected
              </span>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          )}
        </div>

        {/* Controls */}
        <LibraryControls
          filters={state.filters}
          viewMode={state.viewMode}
          onFiltersChange={handleFiltersChange}
          onViewModeChange={handleViewModeChange}
          onUpload={() => setShowDropZone(true)}
        />

        {/* Content */}
        {filteredPDFs.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">
              {state.pdfs.length === 0 ? 'No PDFs in your library' : 'No PDFs match your search'}
            </h3>
            <p className="text-slate-500 mb-6">
              {state.pdfs.length === 0 
                ? 'Get started by adding your first PDF file'
                : 'Try adjusting your search or filters'
              }
            </p>
            {state.pdfs.length === 0 && (
              <button
                onClick={() => setShowDropZone(true)}
                className="px-6 py-3 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded-lg transition-colors"
              >
                Add Your First PDF
              </button>
            )}
          </div>
        ) : (
          <div className={
            state.viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6'
              : 'space-y-3'
          }>
            {filteredPDFs.map(pdf => (
              <PDFCard
                key={pdf.id}
                pdf={pdf}
                viewMode={state.viewMode}
                isSelected={state.selectedPdfs.includes(pdf.id)}
                onSelect={handlePDFSelect}
                onOpen={handlePDFOpen}
                onDelete={handlePDFDelete}
                onShare={handlePDFShare}
              />
            ))}
          </div>
        )}
      </div>

      {/* Drop Zone Modal */}
      <DropZone
        isVisible={showDropZone}
        onClose={() => setShowDropZone(false)}
        onFilesSelected={handleFilesSelected}
      />

      {/* Share Modal */}
      {shareModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800/90 backdrop-blur-md rounded-xl border border-slate-700/50 p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Share PDF
              </h3>
              <button
                onClick={closeShareModal}
                className="p-1 text-slate-400 hover:text-slate-200 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {!shareModal.shareUrl ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Link Expiry (Optional)
                    </label>
                    <select
                      value={shareModal.expiryDays || ''}
                      onChange={(e) => setShareModal(prev => ({ 
                        ...prev, 
                        expiryDays: e.target.value ? parseInt(e.target.value) : undefined 
                      }))}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 text-sm"
                    >
                      <option value="">No expiry</option>
                      <option value="1">1 day</option>
                      <option value="7">7 days</option>
                      <option value="30">30 days</option>
                      <option value="90">90 days</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={handleCreateShare}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    Generate Share Link
                  </button>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Public Share Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareModal.shareUrl}
                      readOnly
                      className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 text-sm font-mono"
                    />
                    <button
                      onClick={handleCopyShareLink}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-300 mb-2">What happens when you share:</h4>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Recipients can view the PDF without an account</li>
                  <li>• Analytics are automatically tracked</li>
                  <li>• AI assistant is available for questions</li>
                  <li>• Link can be revoked at any time</li>
                </ul>
              </div>
              
              {shareModal.shareUrl && (
                <div className="flex gap-3">
                  <button
                    onClick={() => window.open(shareModal.shareUrl, '_blank')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Test Link
                  </button>
                  <button
                    onClick={closeShareModal}
                    className="px-4 py-2 text-slate-400 hover:text-slate-200"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploadProgress.isUploading && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 bg-slate-800/90 backdrop-blur-md rounded-lg border border-slate-700/50 p-4 min-w-[300px]">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <div className="flex-1">
              <p className="text-sm text-slate-200 mb-2">Uploading {uploadProgress.fileName}...</p>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress.progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">{Math.round(uploadProgress.progress)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </>
  );
};

export default Library;
