import React, { useRef, useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { PdfEngine } from '../../pdf/PdfEngine';
import { usePdf } from '../../pdf/PdfContext';
import { IconButton, Card, Tooltip } from '../ui';
import { WelcomeMessage } from '../welcome';
import theme from '../../theme';
import { FiChevronLeft, FiChevronRight, FiList, FiMinus, FiPlus } from 'react-icons/fi';

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
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ onToggleOutline, canvasRef: externalCanvasRef, onFileUpload }) => {
  const internalCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = externalCanvasRef || internalCanvasRef;
  const { currentPage, totalPages, setCurrentPage, scale, setScale, document } = usePdf();
  const [pageInputValue, setPageInputValue] = useState<string>(currentPage.toString());
  
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

  return (
    <ViewerContainer>
      {/* Always render canvas for analytics features, but hide it when no document */}
      <div style={{ 
        display: document ? 'block' : 'none',
        width: '100%',
        height: '100%',
        overflow: 'hidden'
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
