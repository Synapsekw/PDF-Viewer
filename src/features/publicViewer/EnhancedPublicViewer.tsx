/**
 * Enhanced Public Viewer with Supabase integration and analytics tracking
 */

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
  FileText,
  Lock,
  Download,
  Printer,
  Eye,
  EyeOff
} from 'lucide-react';
import styled from '@emotion/styled';
import { PdfProvider, usePdf } from '../../pdf/PdfContext';
import { PdfEngine } from '../../pdf/PdfEngine';
import { IconButton, Card, Tooltip, Input, Button } from '../../components/ui';
import { EnhancedAnalyticsProvider, useEnhancedAnalytics } from '../../contexts/EnhancedAnalyticsContext';
import { SupabaseShareRepository } from '../../lib/repositories/supabase/ShareRepository';
import { SupabaseClientManager } from '../../lib/supabase/client';
import theme from '../../theme';

// Styled Components (reusing from PublicViewer)
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

interface DocumentData {
  id: string;
  name: string;
  size: number;
  pageCount: number;
  createdAt: string;
}

interface DocumentMetadata {
  allowDownload: boolean;
  allowPrint: boolean;
  trackAnalytics: boolean;
  accessCount: number;
  maxViews?: number;
}

const EnhancedPublicViewerContent: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [documentMetadata, setDocumentMetadata] = useState<DocumentMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ text: string; isUser: boolean }>>([]);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [isPasswordVerifying, setIsPasswordVerifying] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shareRepoRef = useRef<SupabaseShareRepository | null>(null);
  const { startSession, recordPageView, recordInteraction } = useEnhancedAnalytics();
  
  const { 
    setFile, 
    currentPage, 
    totalPages, 
    setCurrentPage, 
    scale, 
    setScale 
  } = usePdf();
  
  const [pageInputValue, setPageInputValue] = useState<string>(currentPage.toString());

  // Initialize Supabase share repository
  useEffect(() => {
    const supabase = SupabaseClientManager.getClient();
    if (supabase) {
      shareRepoRef.current = new SupabaseShareRepository(supabase);
    }
  }, []);

  // Sync page input with current page
  useEffect(() => {
    setPageInputValue(currentPage.toString());
  }, [currentPage]);

  // Track page views
  useEffect(() => {
    if (documentMetadata?.trackAnalytics && currentPage > 0) {
      recordPageView(currentPage);
    }
  }, [currentPage, documentMetadata?.trackAnalytics, recordPageView]);

  const verifyPassword = async () => {
    if (!shareRepoRef.current || !token) return;

    setIsPasswordVerifying(true);
    setPasswordError(null);

    try {
      const isValid = await shareRepoRef.current.verifySharePassword(token, password);
      if (isValid) {
        setRequiresPassword(false);
        loadDocument();
      } else {
        setPasswordError('Incorrect password');
      }
    } catch (error) {
      setPasswordError('Failed to verify password');
    } finally {
      setIsPasswordVerifying(false);
    }
  };

  const loadDocument = async () => {
    if (!token || !shareRepoRef.current) {
      setError('Invalid share link');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Get public document data
      const publicData = await shareRepoRef.current.getPublicDocument(token);
      
      if (!publicData) {
        setError('Document not found or share link has expired');
        setIsLoading(false);
        return;
      }

      setDocumentData(publicData.document);
      setDocumentMetadata(publicData.metadata);

      // Start analytics session if tracking is enabled
      if (publicData.metadata.trackAnalytics) {
        await startSession(publicData.document.id, token);
      }

      // Load PDF blob if available
      if (publicData.blob) {
        const arrayBuffer = await publicData.blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Validate PDF header
        if (uint8Array.length < 4 || 
            uint8Array[0] !== 0x25 || uint8Array[1] !== 0x50 || 
            uint8Array[2] !== 0x44 || uint8Array[3] !== 0x46) {
          throw new Error('Invalid PDF file format');
        }
        
        setFile(uint8Array);
      } else {
        setError('Document content not available');
      }

      setIsLoading(false);

    } catch (err) {
      console.error('Failed to load document:', err);
      
      if (err.message.includes('password')) {
        setRequiresPassword(true);
        setIsLoading(false);
      } else {
        setError(`Failed to load document: ${err.message}`);
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    loadDocument();
  }, [token]);

  // Navigation functions
  const goToPreviousPage = () => {
    const newPage = Math.max(1, currentPage - 1);
    setCurrentPage(newPage);
    if (documentMetadata?.trackAnalytics) {
      recordInteraction({
        type: 'click',
        page: newPage,
        element: 'previous_page_button'
      });
    }
  };

  const goToNextPage = () => {
    const newPage = Math.min(totalPages, currentPage + 1);
    setCurrentPage(newPage);
    if (documentMetadata?.trackAnalytics) {
      recordInteraction({
        type: 'click',
        page: newPage,
        element: 'next_page_button'
      });
    }
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInputValue(e.target.value);
  };

  const handlePageInputBlur = () => {
    const pageNumber = parseInt(pageInputValue, 10);
    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      if (documentMetadata?.trackAnalytics) {
        recordInteraction({
          type: 'click',
          page: pageNumber,
          element: 'page_input',
          data: { directNavigation: true }
        });
      }
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
    if (documentMetadata?.trackAnalytics) {
      recordInteraction({
        type: 'zoom',
        page: currentPage,
        data: { scale: newScale, action: 'zoom_in' }
      });
    }
  };

  const zoomOut = () => {
    const newScale = Math.max(scale / 1.2, 1.0);
    setScale(newScale);
    if (documentMetadata?.trackAnalytics) {
      recordInteraction({
        type: 'zoom',
        page: currentPage,
        data: { scale: newScale, action: 'zoom_out' }
      });
    }
  };

  // Download function
  const handleDownload = async () => {
    if (!documentMetadata?.allowDownload || !shareRepoRef.current || !token) return;

    try {
      const publicData = await shareRepoRef.current.getPublicDocument(token);
      if (publicData?.blob) {
        const url = URL.createObjectURL(publicData.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${documentData?.name || 'document'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        if (documentMetadata?.trackAnalytics) {
          recordInteraction({
            type: 'click',
            element: 'download_button',
            data: { action: 'download' }
          });
        }
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // Print function
  const handlePrint = () => {
    if (!documentMetadata?.allowPrint) return;
    
    window.print();
    if (documentMetadata?.trackAnalytics) {
      recordInteraction({
        type: 'click',
        element: 'print_button',
        data: { action: 'print' }
      });
    }
  };

  // Chat functions
  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;

    const userMessage = chatMessage.trim();
    setChatMessage('');
    setChatHistory(prev => [...prev, { text: userMessage, isUser: true }]);

    if (documentMetadata?.trackAnalytics) {
      recordInteraction({
        type: 'click',
        element: 'chat_input',
        data: { message: userMessage, messageLength: userMessage.length }
      });
    }

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

  // Password screen
  if (requiresPassword) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <Lock className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Password Protected</h1>
          <p className="text-slate-400 mb-6">
            This document is password protected. Please enter the password to view it.
          </p>
          <div className="space-y-4">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && verifyPassword()}
              placeholder="Enter password"
              className="w-full"
            />
            {passwordError && (
              <p className="text-red-400 text-sm">{passwordError}</p>
            )}
            <Button
              onClick={verifyPassword}
              disabled={!password.trim() || isPasswordVerifying}
              className="w-full"
            >
              {isPasswordVerifying ? 'Verifying...' : 'Access Document'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Loading screen
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

  // Error screen
  if (error || !documentData) {
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
              <h1 title={documentData.name}>
                {documentData.name}
              </h1>
              <p>
                Shared Document 
                {documentMetadata?.accessCount && (
                  <span className="ml-2">• {documentMetadata.accessCount} views</span>
                )}
              </p>
            </DocumentTitle>
          </HeaderBar>

          {/* Top Controls */}
          <TopControlsBar>
            {documentMetadata?.allowDownload && (
              <Tooltip content="Download Document">
                <IconButton variant="transparent" onClick={handleDownload}>
                  <Download className="w-4 h-4" />
                </IconButton>
              </Tooltip>
            )}
            
            {documentMetadata?.allowPrint && (
              <Tooltip content="Print Document">
                <IconButton variant="transparent" onClick={handlePrint}>
                  <Printer className="w-4 h-4" />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip content={showChat ? "Hide AI Assistant" : "Show AI Assistant"}>
              <IconButton
                variant="transparent"
                onClick={() => setShowChat(!showChat)}
              >
                <MessageSquare className="w-4 h-4" />
              </IconButton>
            </Tooltip>

            {documentMetadata?.trackAnalytics && (
              <Tooltip content="Analytics Enabled">
                <IconButton variant="transparent" disabled>
                  <Eye className="w-4 h-4 text-green-400" />
                </IconButton>
              </Tooltip>
            )}
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
                <ChevronLeft className="w-4 h-4" />
              </IconButton>
            </Tooltip>

            <div className="flex items-center px-3 text-sm text-slate-300">
              <input
                type="text"
                value={pageInputValue}
                onChange={handlePageInputChange}
                onBlur={handlePageInputBlur}
                onKeyPress={handlePageInputKeyPress}
                className="bg-transparent border-none text-center w-12 focus:outline-none focus:bg-slate-700 rounded px-1"
              />
              <span className="ml-2">of {totalPages}</span>
            </div>

            <Tooltip content="Next Page">
              <IconButton 
                variant="transparent"
                onClick={goToNextPage} 
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </IconButton>
            </Tooltip>

            {/* Divider */}
            <div className="w-px h-6 bg-slate-600 mx-2" />

            {/* Zoom Controls */}
            <Tooltip content="Zoom Out">
              <IconButton 
                variant="transparent"
                onClick={zoomOut}
                disabled={scale <= 1.0}
              >
                <Minus className="w-4 h-4" />
              </IconButton>
            </Tooltip>

            <div className="px-3 text-sm text-slate-300">
              {Math.round(scale * 100)}%
            </div>

            <Tooltip content="Zoom In">
              <IconButton 
                variant="transparent"
                onClick={zoomIn}
                disabled={scale >= 2.49}
              >
                <Plus className="w-4 h-4" />
              </IconButton>
            </Tooltip>
          </ControlsBar>
        </ViewerContainer>
      </div>

      {/* AI Chat Panel - same as original */}
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

const EnhancedPublicViewer: React.FC = () => {
  return (
    <PdfProvider>
      <EnhancedAnalyticsProvider initialConfig={{ realtimeUpdates: true }}>
        <EnhancedPublicViewerContent />
      </EnhancedAnalyticsProvider>
    </PdfProvider>
  );
};

export default EnhancedPublicViewer;
