import React, { useRef, useState, useEffect } from 'react';
import { PdfEngine } from '../../pdf/PdfEngine';
import { usePdf } from '../../pdf/PdfContext';
import { IconButton, Tooltip } from '../ui';
import { WelcomeMessage } from '../welcome';
import { PDFLoadingOverlay } from './PDFLoadingOverlay';
import { 
  FiChevronLeft, 
  FiChevronRight, 
  FiList, 
  FiMinus, 
  FiPlus,
  FiUpload,
  FiDownload,
  FiBarChart2,
  FiFileText,
  FiCloud
} from 'react-icons/fi';
import { cloudUploadService } from '../../services/CloudUploadService';
import { AuthModal } from '../auth';
import { CloudUploadProgress } from '../upload';
import { UploadProgress } from '../../lib/repositories/supabase/LibraryRepository';
import { useToast } from '../../hooks/useToast';

// Component interfaces and types remain the same

interface PDFViewerProps {
  onToggleOutline?: () => void;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  onFileUpload?: (file: File) => void;
  onDownload?: () => void;
  onExportAnalytics?: () => void;
  isAnalyticsEnabled?: boolean;
  onToggleAnalytics?: () => void;
  onAnalyticsTypeChange?: (type: string) => void;
  selectedAnalyticsType?: string;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ 
  onToggleOutline, 
  canvasRef: externalCanvasRef, 
  onFileUpload,
  onDownload,
  onExportAnalytics,
  isAnalyticsEnabled = false,
  onToggleAnalytics,
  onAnalyticsTypeChange,
  selectedAnalyticsType = 'none'
}) => {
  const internalCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = externalCanvasRef || internalCanvasRef;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { currentPage, totalPages, setCurrentPage, scale, setScale, document, file, isLoading, loadingProgress, isRendering } = usePdf();
  const [pageInputValue, setPageInputValue] = useState<string>(currentPage.toString());
  const [showAnalyticsDropdown, setShowAnalyticsDropdown] = useState(false);
  
  // Local state for analytics for immediate UI feedback
  const [localIsAnalyticsEnabled, setLocalIsAnalyticsEnabled] = useState<boolean>(isAnalyticsEnabled);
  const [localSelectedAnalyticsType, setLocalSelectedAnalyticsType] = useState<string>(selectedAnalyticsType);
  
  // Cloud upload state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [uploadState, setUploadState] = useState<{
    isUploading: boolean;
    progress: UploadProgress | null;
    status: 'idle' | 'uploading' | 'success' | 'error';
    error?: string;
  }>({
    isUploading: false,
    progress: null,
    status: 'idle'
  });
  
  const { showToast } = useToast();

  // Keep local analytics state in sync with parent when it changes
  useEffect(() => {
    setLocalIsAnalyticsEnabled(isAnalyticsEnabled);
  }, [isAnalyticsEnabled]);

  useEffect(() => {
    setLocalSelectedAnalyticsType(selectedAnalyticsType);
  }, [selectedAnalyticsType]);

  // Effective values prefer local state for snappy UI, while parent remains source of truth
  const effectiveIsAnalyticsEnabled = localIsAnalyticsEnabled;
  const effectiveSelectedAnalyticsType = localSelectedAnalyticsType;
  
  // Keep page input value in sync with current page
  useEffect(() => {
    setPageInputValue(currentPage.toString());
  }, [currentPage]);
  
  const goToPreviousPage = () => {
    setCurrentPage(Math.max(1, currentPage - 1));
  };

  const goToNextPage = () => {
    setCurrentPage(Math.min(totalPages, currentPage + 1));
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInputValue(e.target.value);
  };

  const handlePageInputBlur = () => {
    const pageNumber = parseInt(pageInputValue, 10);
    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    } else {
      setPageInputValue(currentPage.toString());
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handlePageInputBlur();
    }
  };

  const zoomIn = () => {
    const newScale = Math.min(scale * 1.2, 2.49); // Cap at 249%
    console.log('Zoom in:', { currentScale: scale, newScale, capped: newScale === 2.49 });
    setScale(newScale);
  };

  const zoomOut = () => {
    const newScale = Math.max(scale / 1.2, 1.0); // Minimum 100%
    console.log('Zoom out:', { currentScale: scale, newScale, capped: newScale === 1.0 });
    setScale(newScale);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
  };

  const handleCloudUpload = async () => {
    // Check if document is loaded
    if (!document) {
      showToast('No PDF loaded to upload', 'error');
      return;
    }

    // Check authentication
    const isAuthenticated = await cloudUploadService.isAuthenticated();
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    // Check if file data is available
    if (!file) {
      showToast('Unable to access PDF data', 'error');
      return;
    }

    // Start upload
    setUploadState({
      isUploading: true,
      progress: null,
      status: 'uploading'
    });

    try {
      const fileName = `${document.fingerprints?.[0] || 'document'}.pdf`;
      
      const result = await cloudUploadService.uploadPDFToCloud(
        file as Uint8Array,
        fileName,
        {
          onProgress: (progress) => {
            setUploadState(prev => ({
              ...prev,
              progress
            }));
          },
          onSuccess: (documentId) => {
            setUploadState({
              isUploading: false,
              progress: null,
              status: 'success'
            });
            showToast('PDF successfully uploaded to cloud!', 'success');
            
            // Auto-dismiss after 3 seconds
            setTimeout(() => {
              setUploadState({
                isUploading: false,
                progress: null,
                status: 'idle'
              });
            }, 3000);
          },
          onError: (error) => {
            setUploadState({
              isUploading: false,
              progress: null,
              status: 'error',
              error: error.message
            });
            showToast(`Upload failed: ${error.message}`, 'error');
          }
        }
      );
    } catch (error) {
      setUploadState({
        isUploading: false,
        progress: null,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      showToast('Failed to upload PDF', 'error');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      // Ignore clicks inside the injected dropdown element rendered to body
      const injectedDropdown = window.document.getElementById('analytics-dropdown');
      if (injectedDropdown && injectedDropdown.contains(targetNode)) {
        return;
      }
      // Close if click is outside the trigger/button container
      if (dropdownRef.current && !dropdownRef.current.contains(targetNode)) {
        setShowAnalyticsDropdown(false);
      }
    };

    if (showAnalyticsDropdown) {
      window.document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      window.document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAnalyticsDropdown]);

  // Render analytics dropdown to document body
  // Depend ONLY on open/close state to avoid tearing down/rebuilding on selection → prevents flicker
  useEffect(() => {
    if (showAnalyticsDropdown && typeof window !== 'undefined') {
      const dropdownElement = window.document.createElement('div');
      dropdownElement.id = 'analytics-dropdown';
      
      // Get button position for proper positioning
      const buttonElement = dropdownRef.current;
      if (buttonElement) {
        const rect = buttonElement.getBoundingClientRect();
        const dropdownHTML = `
          <div style="
            position: fixed;
            bottom: ${window.innerHeight - rect.top + 8}px;
            left: ${rect.left}px;
            width: 280px;
            background: rgba(35, 47, 61, 0.6);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: white;
            overflow: hidden;
          ">
            <!-- Options -->
            <div style="padding: 8px;">
              ${[
                { value: 'heatmap', label: 'Mouse Heatmap', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6"/><path d="M1 12h6m6 0h6"/></svg>', description: 'Track mouse movements' },
                { value: 'interactions', label: 'Interaction Points', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3l8-8"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>', description: 'Show clicks and actions' },
                { value: 'page_time', label: 'Time Spent', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>', description: 'View time analytics' },
                { value: 'scroll_patterns', label: 'Scroll Patterns', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 13l3 3l3-3"/><path d="M7 6l3 3l3-3"/></svg>', description: 'Reading flow analysis' },
                { value: 'click_density', label: 'Click Density', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>', description: 'Highlight active areas' },
                { value: 'none', label: 'Hide All', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>', description: 'Disable analytics' }
              ].map(option => `
                <button 
                  onclick="window.selectAnalyticsOption('${option.value}')"
                  style="
                    width: 100%;
                    padding: 12px 16px;
                    text-align: left;
                    background: transparent;
                    border: 1px solid transparent;
                    border-radius: 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    transition: all 0.2s ease;
                    margin: 1px 0;
                    opacity: 0.7;
                  "
                  onmouseover="this.style.background='rgba(255, 255, 255, 0.08)'; this.style.opacity='1'"
                  onmouseout="this.style.background='transparent'; this.style.opacity='0.7'"
                >
                  <span style="
                    flex-shrink: 0; 
                    color: rgba(255, 255, 255, 0.8);
                    opacity: 0.5;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  ">${option.icon}</span>
                  <div style="flex: 1; min-width: 0;">
                    <div style="
                      font-weight: 500; 
                      color: rgba(255, 255, 255, 0.9); 
                      font-size: 12px; 
                      margin-bottom: 1px;
                    ">
                      ${option.label}
                    </div>
                    <div style="
                      color: rgba(255, 255, 255, 0.5); 
                      font-size: 10px; 
                      line-height: 1.2;
                      font-weight: 400;
                    ">
                      ${option.description}
                    </div>
                  </div>
                  <!-- No checkmark since we can't dynamically update it -->
                </button>
              `).join('')}
            </div>

            <!-- Footer -->
            <div style="
              padding: 12px 16px; 
              border-top: 1px solid rgba(255, 255, 255, 0.1); 
              background: rgba(0, 0, 0, 0.1);
            ">
              <div style="
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                font-size: 10px; 
                color: rgba(255, 255, 255, 0.5);
                font-weight: 400;
              ">
                <span id="analytics-status" style="display: flex; align-items: center; gap: 6px;">
                  <span id="analytics-status-dot" style="
                    width: 4px; 
                    height: 4px; 
                    border-radius: 50%; 
                    background: rgba(255, 255, 255, 0.3);
                  "></span>
                  <span id="analytics-status-text">Disabled</span>
                </span>
                <button 
                  onclick="window.closeAnalyticsDropdown()"
                  style="
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: rgba(255, 255, 255, 0.7);
                    cursor: pointer;
                    font-size: 10px;
                    padding: 4px 8px;
                    border-radius: 6px;
                    transition: all 0.2s ease;
                    font-weight: 400;
                  "
                  onmouseover="this.style.background='rgba(255, 255, 255, 0.15)'; this.style.color='rgba(255, 255, 255, 0.9)';"
                  onmouseout="this.style.background='rgba(255, 255, 255, 0.1)'; this.style.color='rgba(255, 255, 255, 0.7)';"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        `;
        
        dropdownElement.innerHTML = dropdownHTML;
        
        // Initialize dropdown with current selection
        setTimeout(() => {
          const currentButton = dropdownElement.querySelector(`button[onclick*=\"'${effectiveSelectedAnalyticsType}'\"]`) as HTMLElement;
          if (currentButton) {
            currentButton.style.background = 'rgba(255, 255, 255, 0.15)';
            currentButton.style.border = '1px solid rgba(255, 255, 255, 0.3)';
            currentButton.style.opacity = '1';
            currentButton.style.transform = 'scale(1.01)';
            
            // Add checkmark
            const checkmark = window.document.createElement('span');
            checkmark.className = 'checkmark';
            checkmark.style.cssText = 'color: rgba(255, 255, 255, 0.8); font-size: 12px;';
            checkmark.textContent = '✓';
            currentButton.appendChild(checkmark);
          }

          // Initialize status indicator from current global state
          const statusDot = dropdownElement.querySelector('#analytics-status-dot') as HTMLElement | null;
          const statusText = dropdownElement.querySelector('#analytics-status-text') as HTMLElement | null;
          const liveViewElement = window.document.getElementById('analytics-live-view-element');
          const isEnabled = liveViewElement?.getAttribute('data-analytics-live-view') === 'true';
          if (statusDot && statusText) {
            statusDot.style.background = isEnabled ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.3)';
            statusText.textContent = isEnabled ? 'Enabled' : 'Disabled';
          }
        }, 10);
        
        // Add global functions for dropdown interaction
        (window as any).selectAnalyticsOption = (value: string) => {
          console.log('🚨 Analytics option selected:', value);
          
          // Update visual selection in dropdown before closing
          const dropdownButtons = dropdownElement.querySelectorAll('button[onclick*="selectAnalyticsOption"]');
          dropdownButtons.forEach((button: any) => {
            const buttonValue = button.onclick.toString().match(/'([^']+)'/)?.[1];
            if (buttonValue === value) {
              // Highlight selected option
              button.style.background = 'rgba(255, 255, 255, 0.15)';
              button.style.border = '1px solid rgba(255, 255, 255, 0.3)';
              button.style.opacity = '1';
              button.style.transform = 'scale(1.01)';
              // Add checkmark
              const checkmark = button.querySelector('.checkmark') || window.document.createElement('span');
              checkmark.className = 'checkmark';
              checkmark.style.cssText = 'color: rgba(255, 255, 255, 0.8); font-size: 12px;';
              checkmark.textContent = '✓';
              if (!button.contains(checkmark)) {
                button.appendChild(checkmark);
              }
            } else {
              // Reset other options
              button.style.background = 'transparent';
              button.style.border = '1px solid transparent';
              button.style.opacity = '0.7';
              button.style.transform = 'scale(1)';
              // Remove checkmark
              const checkmark = button.querySelector('.checkmark');
              if (checkmark) {
                checkmark.remove();
              }
            }
          });
          
          // Update local state immediately for UI responsiveness
          setLocalSelectedAnalyticsType(value);
          setLocalIsAnalyticsEnabled(value !== 'none');

          // Notify parent to update global state
          onAnalyticsTypeChange?.(value);
          
          // Update global analytics state for other components
          const analyticsElement = window.document.getElementById('analytics-live-view-element') || window.document.createElement('div');
          analyticsElement.id = 'analytics-live-view-element';
          analyticsElement.setAttribute('data-analytics-live-view', value !== 'none' ? 'true' : 'false');
          analyticsElement.setAttribute('data-analytics-type', value);
          if (!window.document.body.contains(analyticsElement)) {
            window.document.body.appendChild(analyticsElement);
          }
          
          // Update status indicator without rebuilding dropdown
          const statusDot = dropdownElement.querySelector('#analytics-status-dot') as HTMLElement | null;
          const statusText = dropdownElement.querySelector('#analytics-status-text') as HTMLElement | null;
          if (statusDot && statusText) {
            const enabled = value !== 'none';
            statusDot.style.background = enabled ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.3)';
            statusText.textContent = enabled ? 'Enabled' : 'Disabled';
          }

          console.log('🎯 SET GLOBAL ANALYTICS STATE:', {
            element: analyticsElement,
            isEnabled: analyticsElement.getAttribute('data-analytics-live-view'),
            type: analyticsElement.getAttribute('data-analytics-type'),
            bodyContains: window.document.body.contains(analyticsElement)
          });
          
          // Close dropdown after a short delay to show the selection
          setTimeout(() => {
            setShowAnalyticsDropdown(false);
          }, 200);
        };
        
        (window as any).closeAnalyticsDropdown = () => {
          setShowAnalyticsDropdown(false);
        };
        
        window.document.body.appendChild(dropdownElement);
        
        return () => {
          const existingDropdown = window.document.getElementById('analytics-dropdown');
          if (existingDropdown) {
            existingDropdown.remove();
          }
          delete (window as any).selectAnalyticsOption;
          delete (window as any).closeAnalyticsDropdown;
        };
      }
    }
  }, [showAnalyticsDropdown]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full relative p-0 overflow-hidden">
      {/* Hidden file input for upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      {/* Always render canvas for analytics features, but hide it when no document */}
      <div className={`${document ? 'block' : 'hidden'} w-full h-full overflow-hidden`}>
        <div className="relative flex items-center justify-center w-full h-full overflow-auto bg-transparent rounded-lg min-h-0">
          <PdfEngine canvasRef={canvasRef} />
          <PDFLoadingOverlay 
            isLoading={isLoading} 
            loadingProgress={loadingProgress} 
            isRendering={isRendering} 
          />
        </div>
      </div>
      
      {/* Show welcome message if no document is loaded */}
      {!document && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <WelcomeMessage onFileUpload={onFileUpload} />
        </div>
      )}
      
      {/* Top Controls Bar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-full p-1 shadow-lg">
        <Tooltip content="Previous Page">
          <IconButton 
            variant="transparent"
            onClick={goToPreviousPage} 
            disabled={currentPage <= 1}
          >
            <div className="flex items-center justify-center w-4 h-4">
              <FiChevronLeft className="w-4 h-4" />
            </div>
          </IconButton>
        </Tooltip>
        
        <input 
          value={pageInputValue}
          onChange={handlePageInputChange}
          onBlur={handlePageInputBlur}
          onKeyDown={handlePageInputKeyDown}
          aria-label="Current page"
          className="w-10 bg-transparent border-none text-white text-base text-center p-0 m-0 focus:outline-none"
        />
        
        <div className="flex items-center justify-center px-3 py-1 text-white text-sm mx-2">
          / {totalPages || 1}
        </div>
        
        <Tooltip content="Next Page">
          <IconButton 
            variant="transparent"
            onClick={goToNextPage} 
            disabled={currentPage >= totalPages}
          >
            <div className="flex items-center justify-center w-4 h-4">
              <FiChevronRight className="w-4 h-4" />
            </div>
          </IconButton>
        </Tooltip>
      </div>
      
      {/* Bottom Controls Bar */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-full p-1 shadow-lg z-10">
        {/* File Controls */}
        <Tooltip content="Upload PDF">
          <IconButton 
            variant="transparent"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex items-center justify-center w-4 h-4">
              <FiUpload className="w-4 h-4" />
            </div>
          </IconButton>
        </Tooltip>
        
        <Tooltip content="Download PDF">
          <IconButton 
            variant="transparent"
            onClick={onDownload}
          >
            <div className="flex items-center justify-center w-4 h-4">
              <FiDownload className="w-4 h-4" />
            </div>
          </IconButton>
        </Tooltip>
        
        <Tooltip content="Push to Cloud">
          <IconButton 
            variant="transparent"
            onClick={handleCloudUpload}
            disabled={!document || uploadState.isUploading}
            className={uploadState.status === 'success' ? 'text-green-400' : ''}
          >
            <div className="flex items-center justify-center w-4 h-4">
              <FiCloud className="w-4 h-4" />
            </div>
          </IconButton>
        </Tooltip>
        
        <div className="w-px h-6 bg-slate-600 mx-2"></div>
        
        {/* Zoom Controls */}
        <Tooltip content="Zoom Out">
          <IconButton 
            variant="transparent"
            onClick={zoomOut}
            disabled={scale <= 1.0}
          >
            <div className="flex items-center justify-center w-4 h-4">
              <FiMinus className="w-4 h-4" />
            </div>
          </IconButton>
        </Tooltip>
        
        <div className="flex items-center justify-center px-3 py-1 text-white text-sm mx-2 border-l border-r border-slate-600">
          {Math.round(scale * 100)}%
        </div>
        
        <Tooltip content="Zoom In">
          <IconButton 
            variant="transparent"
            onClick={zoomIn}
            disabled={scale >= 2.49}
          >
            <div className="flex items-center justify-center w-4 h-4">
              <FiPlus className="w-4 h-4" />
            </div>
          </IconButton>
        </Tooltip>
        
        <div className="w-px h-6 bg-slate-600 mx-2"></div>
        
        {/* Analytics Controls */}
        <div className="relative" ref={dropdownRef}>
          <Tooltip content="Select Analytics Type">
            <IconButton 
              variant="transparent"
              onClick={() => {
                const newState = !showAnalyticsDropdown;
                console.log('🚨 ANALYTICS BUTTON CLICKED! 🚨', { currentState: showAnalyticsDropdown, newState });
                setShowAnalyticsDropdown(newState);
              }}
              className={`${effectiveIsAnalyticsEnabled ? 'text-blue-400' : ''} ${showAnalyticsDropdown ? 'bg-white/20' : ''} hover:bg-white/10 flex items-center gap-1`}

            >
              <div className="flex items-center justify-center w-4 h-4">
                <FiBarChart2 className="w-4 h-4" />
              </div>
              {effectiveIsAnalyticsEnabled && effectiveSelectedAnalyticsType && effectiveSelectedAnalyticsType !== 'none' && (
                <span className="text-xs opacity-75 ml-1">
                  {effectiveSelectedAnalyticsType === 'heatmap' && '🔥'}
                  {effectiveSelectedAnalyticsType === 'interactions' && '📍'}
                  {effectiveSelectedAnalyticsType === 'page_time' && '⏱️'}
                  {effectiveSelectedAnalyticsType === 'scroll_patterns' && '📜'}
                  {effectiveSelectedAnalyticsType === 'click_density' && '🎯'}
                </span>
              )}
              <svg 
                className={`w-3 h-3 transition-transform duration-200 ${showAnalyticsDropdown ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </IconButton>
          </Tooltip>

        </div>
        
        <Tooltip content="Export Analytics">
          <IconButton 
            variant="transparent"
            onClick={onExportAnalytics}
          >
            <div className="flex items-center justify-center w-4 h-4">
              <FiFileText className="w-4 h-4" />
            </div>
          </IconButton>
        </Tooltip>
        
        <div className="w-px h-6 bg-slate-600 mx-2"></div>
        
        {/* Document Controls */}
        <Tooltip content="Toggle Document Outline">
          <IconButton 
            variant="transparent"
            onClick={onToggleOutline}
          >
            <div className="flex items-center justify-center w-4 h-4">
              <FiList className="w-4 h-4" />
            </div>
          </IconButton>
        </Tooltip>
      </div>
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={() => {
          setShowAuthModal(false);
          handleCloudUpload();
        }}
        title="Sign in to Upload"
        message="Sign in to save your PDFs to the cloud and access them from any device."
      />
      
      {/* Upload Progress */}
      <CloudUploadProgress
        isVisible={uploadState.status !== 'idle'}
        progress={uploadState.progress}
        fileName={document?.fingerprints?.[0] || 'document.pdf'}
        status={uploadState.status}
        error={uploadState.error}
        onClose={() => setUploadState(prev => ({ ...prev, status: 'idle' }))}
      />
    </div>
  );
};

export default PDFViewer;
