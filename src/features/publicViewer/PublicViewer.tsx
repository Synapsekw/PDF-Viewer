import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  AlertCircle, 
  MessageSquare, 
  X, 
  Send, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Minus, 
  FileText 
} from 'lucide-react';
import styled from '@emotion/styled';
import { viewerSource } from './viewerSource';
import { PdfProvider, usePdf } from '../../pdf/PdfContext';
import { PdfEngine } from '../../pdf/PdfEngine';
import { IconButton, Card, Tooltip } from '../../components/ui';
import theme from '../../theme';

// Styled Components (matching PDFViewer design)
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
  z-index: 1000;
`;

const TopControlsBar = styled(Card)`
  position: absolute;
  top: ${theme.spacing[4]};
  right: ${theme.spacing[4]};
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
`;

const PageInput = styled.input`
  background: transparent;
  border: none;
  color: ${theme.colors.text.primary};
  text-align: center;
  width: 3rem;
  font-size: ${theme.typography.fontSize.sm};
  margin: 0 ${theme.spacing[1]};
  
  &:focus {
    outline: none;
    background: ${theme.colors.glass.background};
    border-radius: ${theme.borderRadius.sm};
    padding: 2px 4px;
  }
`;

const IconWrapper = styled.div`
  width: 1rem;
  height: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const HeaderBar = styled.div`
  position: absolute;
  top: ${theme.spacing[4]};
  left: ${theme.spacing[4]};
  display: flex;
  align-items: center;
  gap: ${theme.spacing[4]};
  z-index: 1000;
`;

const DocumentTitle = styled(Card)`
  padding: ${theme.spacing[2]} ${theme.spacing[4]};
  background: ${theme.colors.glass.background};
  backdrop-filter: blur(${theme.colors.glass.blur});
  border: 1px solid ${theme.colors.glass.border};
  border-radius: ${theme.borderRadius.lg};
  
  h1 {
    color: ${theme.colors.text.primary};
    font-size: ${theme.typography.fontSize.lg};
    font-weight: ${theme.typography.fontWeight.semibold};
    margin: 0;
    max-width: 300px;
    truncate: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }
  
  p {
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.fontSize.sm};
    margin: 0;
    margin-top: ${theme.spacing[1]};
  }
`;

const PublicViewerContent: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [documentMeta, setDocumentMeta] = useState<{ title: string; size: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ text: string; isUser: boolean }>>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { 
    setFile, 
    currentPage, 
    totalPages, 
    setCurrentPage, 
    scale, 
    setScale 
  } = usePdf();
  
  const [pageInputValue, setPageInputValue] = useState<string>(currentPage.toString());

  // Sync page input with current page
  useEffect(() => {
    setPageInputValue(currentPage.toString());
  }, [currentPage]);

  useEffect(() => {
    const loadDocument = async () => {
      if (!token) {
        setError('Invalid share link');
        setIsLoading(false);
        return;
      }

      try {
        console.log('PublicViewer: Loading document for token:', token);
        
        const [meta, url] = await Promise.all([
          viewerSource.getDocumentMeta(token),
          viewerSource.getBlobByToken(token)
        ]);

        console.log('PublicViewer: Got meta and URL:', { meta, url });

        if (!meta || !url) {
          setError('Document not found or share link has expired');
          setIsLoading(false);
          return;
        }

        setDocumentMeta(meta);
        
        console.log('PublicViewer: Fetching PDF from URL:', url);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        console.log('PublicViewer: PDF loaded, size:', uint8Array.length, 'bytes');
        
        setFile(uint8Array);
        setIsLoading(false);

      } catch (err) {
        console.error('PublicViewer: Failed to load document:', err);
        setError(`Failed to load document: ${err.message}`);
        setIsLoading(false);
      }
    };

    loadDocument();

    return () => {
      if (token) {
        viewerSource.revokeObjectUrl(token);
      }
    };
  }, [token, setFile]);

  // Navigation functions
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

  const handlePageInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handlePageInputBlur();
    }
  };

  // Zoom functions
  const zoomIn = () => {
    const newScale = Math.min(scale * 1.2, 2.49);
    setScale(newScale);
  };

  const zoomOut = () => {
    const newScale = Math.max(scale / 1.2, 1.0);
    setScale(newScale);
  };

  // Chat functions
  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;

    const userMessage = chatMessage.trim();
    setChatMessage('');
    setChatHistory(prev => [...prev, { text: userMessage, isUser: true }]);

    setTimeout(() => {
      const responses = [
        "I can help you understand this document. What specific section would you like me to explain?",
        "This document contains important information. Which part would you like me to focus on?",
        "I've analyzed the document content. What questions do you have about it?",
        "Let me help you navigate through this document. What are you looking for?"
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setChatHistory(prev => [...prev, { text: randomResponse, isUser: false }]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !documentMeta) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Document Not Available</h1>
          <p className="text-slate-400 mb-6">
            {error || 'The shared document could not be loaded.'}
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
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* PDF Viewer */}
      <div className="flex-1 relative">
        <ViewerContainer>
          {/* Header with document title */}
          <HeaderBar>
            <DocumentTitle>
              <h1 title={documentMeta.title}>
                {documentMeta.title}
              </h1>
              <p>Shared Document</p>
            </DocumentTitle>
          </HeaderBar>

          {/* AI Assistant Toggle */}
          <TopControlsBar>
            <Tooltip content={showChat ? "Hide AI Assistant" : "Show AI Assistant"}>
              <IconButton
                variant="transparent"
                onClick={() => setShowChat(!showChat)}
              >
                <IconWrapper>
                  <MessageSquare />
                </IconWrapper>
              </IconButton>
            </Tooltip>
          </TopControlsBar>

          {/* PDF Canvas */}
          <CanvasWrapper>
            <PdfEngine canvasRef={canvasRef} />
          </CanvasWrapper>

          {/* Navigation and Zoom Controls */}
          <ControlsBar>
            {/* Page Navigation */}
            <Tooltip content="Previous Page">
              <IconButton 
                variant="transparent"
                onClick={goToPreviousPage} 
                disabled={currentPage <= 1}
              >
                <IconWrapper>
                  <ChevronLeft />
                </IconWrapper>
              </IconButton>
            </Tooltip>

            <PageDisplay>
              <PageInput
                type="text"
                value={pageInputValue}
                onChange={handlePageInputChange}
                onBlur={handlePageInputBlur}
                onKeyPress={handlePageInputKeyPress}
              />
              <span>of {totalPages}</span>
            </PageDisplay>

            <Tooltip content="Next Page">
              <IconButton 
                variant="transparent"
                onClick={goToNextPage} 
                disabled={currentPage >= totalPages}
              >
                <IconWrapper>
                  <ChevronRight />
                </IconWrapper>
              </IconButton>
            </Tooltip>

            {/* Divider */}
            <div style={{ 
              width: '1px', 
              height: '24px', 
              background: theme.colors.glass.border,
              margin: `0 ${theme.spacing[2]}`
            }} />

            {/* Zoom Controls */}
            <Tooltip content="Zoom Out">
              <IconButton 
                variant="transparent"
                onClick={zoomOut}
                disabled={scale <= 1.0}
              >
                <IconWrapper>
                  <Minus />
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
                  <Plus />
                </IconWrapper>
              </IconButton>
            </Tooltip>
          </ControlsBar>
        </ViewerContainer>
      </div>

      {/* AI Chat Panel */}
      {showChat && (
        <div className="w-80 bg-slate-800/90 backdrop-blur-md border-l border-slate-700/50 flex flex-col">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              AI Assistant
            </h3>
            <button
              onClick={() => setShowChat(false)}
              className="p-1 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Ask me anything about this document!</p>
                <p className="text-xs text-slate-500 mt-2">
                  I can help explain content, summarize sections, or answer questions.
                </p>
              </div>
            ) : (
              chatHistory.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-lg ${
                      message.isUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-200'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-slate-700/50">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about this document..."
                className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-slate-500 focus:bg-slate-700"
              />
              <button
                onClick={handleSendMessage}
                disabled={!chatMessage.trim()}
                className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PublicViewer: React.FC = () => {
  return (
    <PdfProvider>
      <PublicViewerContent />
    </PdfProvider>
  );
};

export default PublicViewer;