import React, { useRef, useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { PdfEngine } from '../../pdf/PdfEngine';
import { usePdf } from '../../pdf/PdfContext';
import { IconButton, Card, Tooltip } from '../ui';
import { WelcomeMessage } from '../welcome';
import theme from '../../theme';
import { 
  FiChevronLeft, 
  FiChevronRight, 
  FiList, 
  FiMinus, 
  FiPlus,
  FiUpload,
  FiDownload,
  FiBarChart2,
  FiFileText
} from 'react-icons/fi';

const ViewerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  position: relative;
  padding: 0;
  overflow: hidden;
`;

const CanvasWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: transparent;
  border-radius: ${theme.borderRadius.md};
  box-shadow: ${theme.shadows.lg};
  
  canvas {
    max-width: none;
    max-height: none;
    object-fit: contain;
    display: block;
    transition: width 0.3s ease-out, height 0.3s ease-out;
    margin: auto;
    /* Background matches the landing page exactly */
    background: linear-gradient(135deg, #0f172a 0%, #334155 50%, #0f172a 100%);
    z-index: 1;
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
`;

const ControlsBar = styled(Card)`
  position: absolute;
  bottom: ${theme.spacing[6]};
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  border-radius: ${theme.borderRadius.full};
  padding: ${theme.spacing[1]};
  background: ${theme.colors.glass.background};
  backdrop-filter: blur(${theme.colors.glass.blur});
  -webkit-backdrop-filter: blur(${theme.colors.glass.blur});
  border: 1px solid ${theme.colors.glass.border};
  box-shadow: ${theme.shadows.lg};
  z-index: 1000;
`;

const TopControlsBar = styled(Card)`
  position: absolute;
  top: ${theme.spacing[4]};
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  border-radius: ${theme.borderRadius.full};
  padding: ${theme.spacing[1]};
  background: ${theme.colors.glass.background};
  backdrop-filter: blur(${theme.colors.glass.blur});
  -webkit-backdrop-filter: blur(${theme.colors.glass.blur});
  border: 1px solid ${theme.colors.glass.border};
  box-shadow: ${theme.shadows.lg};
`;

const PageDisplay = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing[1]} ${theme.spacing[3]};
  color: ${theme.colors.text.primary};
  font-size: ${theme.typography.fontSize.sm};
  margin: 0 ${theme.spacing[2]};
`;

const ZoomDisplay = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing[1]} ${theme.spacing[3]};
  color: ${theme.colors.text.primary};
  font-size: ${theme.typography.fontSize.sm};
  margin: 0 ${theme.spacing[2]};
  border-left: 1px solid ${theme.colors.glass.border};
  border-right: 1px solid ${theme.colors.glass.border};
`;

const Divider = styled.div`
  width: 1px;
  height: 24px;
  background-color: ${theme.colors.glass.border};
  margin: 0 ${theme.spacing[2]};
`;

const PageInput = styled.input`
  width: 40px;
  background-color: transparent;
  border: none;
  color: ${theme.colors.text.primary};
  font-size: ${theme.typography.fontSize.md};
  text-align: center;
  padding: 0;
  margin: 0;
  
  &:focus {
    outline: none;
  }
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 16px;
  
  svg {
    width: 16px;
    height: 16px;
    stroke-width: 2;
  }
`;

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
  const { currentPage, totalPages, setCurrentPage, scale, setScale, document } = usePdf();
  const [pageInputValue, setPageInputValue] = useState<string>(currentPage.toString());
  const [showAnalyticsDropdown, setShowAnalyticsDropdown] = useState(false);
  
  // Local state for analytics for immediate UI feedback
  const [localIsAnalyticsEnabled, setLocalIsAnalyticsEnabled] = useState<boolean>(isAnalyticsEnabled);
  const [localSelectedAnalyticsType, setLocalSelectedAnalyticsType] = useState<string>(selectedAnalyticsType);

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
    <ViewerContainer>
      {/* Hidden file input for upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      {/* Debug element to check if PDFViewer is rendering */}
      <div style={{
        position: 'absolute',
        top: '0px',
        right: '0px',
        padding: '10px',
        backgroundColor: 'purple',
        color: 'white',
        zIndex: 1000,
        fontSize: '14px',
      }}>
        PDFViewer Debug - Doc: {document ? 'YES' : 'NO'}
      </div>

      {/* Always render canvas for analytics features, but hide it when no document */}
      <div style={{ 
        display: document ? 'block' : 'none',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 0, 0.1)', // Yellow background for debugging
        border: '2px solid orange', // Orange border for debugging
      }}>
        <CanvasWrapper>
          <PdfEngine canvasRef={canvasRef} />
        </CanvasWrapper>
      </div>
      
      {/* Show welcome message if no document is loaded */}
      {!document && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10
        }}>
          <WelcomeMessage onFileUpload={onFileUpload} />
        </div>
      )}
      
      <TopControlsBar variant="glass">
        <Tooltip content="Previous Page">
          <IconButton 
            variant="transparent"
            onClick={goToPreviousPage} 
            disabled={currentPage <= 1}
          >
            <IconWrapper>
              <FiChevronLeft />
            </IconWrapper>
          </IconButton>
        </Tooltip>
        
        <PageInput 
          value={pageInputValue}
          onChange={handlePageInputChange}
          onBlur={handlePageInputBlur}
          onKeyDown={handlePageInputKeyDown}
          aria-label="Current page"
        />
        
        <PageDisplay>
          / {totalPages || 1}
        </PageDisplay>
        
        <Tooltip content="Next Page">
          <IconButton 
            variant="transparent"
            onClick={goToNextPage} 
            disabled={currentPage >= totalPages}
          >
            <IconWrapper>
              <FiChevronRight />
            </IconWrapper>
          </IconButton>
        </Tooltip>
      </TopControlsBar>
      
      <ControlsBar variant="glass">
        {/* File Controls */}
        <Tooltip content="Upload PDF">
          <IconButton 
            variant="transparent"
            onClick={() => fileInputRef.current?.click()}
          >
            <IconWrapper>
              <FiUpload />
            </IconWrapper>
          </IconButton>
        </Tooltip>
        
        <Tooltip content="Download PDF">
          <IconButton 
            variant="transparent"
            onClick={onDownload}
          >
            <IconWrapper>
              <FiDownload />
            </IconWrapper>
          </IconButton>
        </Tooltip>
        
        <Divider />
        
        {/* Zoom Controls */}
        <Tooltip content="Zoom Out">
          <IconButton 
            variant="transparent"
            onClick={zoomOut}
            disabled={scale <= 1.0}
          >
            <IconWrapper>
              <FiMinus />
            </IconWrapper>
          </IconButton>
        </Tooltip>
        
        <ZoomDisplay>
          {Math.round(scale * 100)}%
        </ZoomDisplay>
        
        <Tooltip content="Zoom In">
          <IconButton 
            variant="transparent"
            onClick={zoomIn}
            disabled={scale >= 2.49}
          >
            <IconWrapper>
              <FiPlus />
            </IconWrapper>
          </IconButton>
        </Tooltip>
        
        <Divider />
        
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
              <IconWrapper>
                <FiBarChart2 />
              </IconWrapper>
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
            <IconWrapper>
              <FiFileText />
            </IconWrapper>
          </IconButton>
        </Tooltip>
        
        <Divider />
        
        {/* Document Controls */}
        <Tooltip content="Toggle Document Outline">
          <IconButton 
            variant="transparent"
            onClick={onToggleOutline}
          >
            <IconWrapper>
              <FiList />
            </IconWrapper>
          </IconButton>
        </Tooltip>
      </ControlsBar>
    </ViewerContainer>
  );
};

export default PDFViewer;
