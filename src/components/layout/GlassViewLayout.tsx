import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../theme/ThemeProvider';
import { 
  Send,
  Menu,
  FileText
} from 'lucide-react';

interface GlassViewLayoutProps {
  children?: React.ReactNode;
  // File handling
  onFileUpload?: (file: File) => void;
  onDownload?: () => void;
  
  // AI Assistant Props
  messages?: Array<{ id: string; text: string; isUser: boolean }>;
  onSendMessage?: (message: string) => void;
  
  // Settings
  onOpenSettings?: () => void;
  
  // Analytics
  isAnalyticsEnabled?: boolean;
  onToggleAnalytics?: () => void;
  
  // Export
  onExportAnalytics?: () => void;
}

export const GlassViewLayout: React.FC<GlassViewLayoutProps> = ({
  children,
  onFileUpload,
  onDownload,
  messages = [
    { id: '1', text: 'Hello! How can I assist you with this PDF?', isUser: false }
  ],
  onSendMessage,
  onOpenSettings,
  isAnalyticsEnabled = false,
  onToggleAnalytics,
  onExportAnalytics
}) => {
  const navigate = useNavigate();
  const { colorTheme, backgroundVariant } = useTheme();

  // Color theme configurations with smoother gradients
  const getBackgroundClasses = () => {
    switch (colorTheme) {
      case 'green':
        return {
          base: 'bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950',
          cross1: 'bg-gradient-to-tr from-emerald-800/30 via-emerald-600/15 via-transparent to-emerald-800/30',
          cross2: 'bg-gradient-to-bl from-emerald-950/20 via-transparent via-emerald-700/10 to-emerald-800/20'
        };
      case 'blue':
        return {
          base: 'bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950',
          cross1: 'bg-gradient-to-tr from-blue-800/30 via-blue-600/15 via-transparent to-blue-800/30',
          cross2: 'bg-gradient-to-bl from-blue-950/20 via-transparent via-blue-700/10 to-blue-800/20'
        };
      case 'purple':
        return {
          base: 'bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950',
          cross1: 'bg-gradient-to-tr from-purple-800/30 via-purple-600/15 via-transparent to-purple-800/30',
          cross2: 'bg-gradient-to-bl from-purple-950/20 via-transparent via-purple-700/10 to-purple-800/20'
        };
      case 'pink':
        return {
          base: 'bg-gradient-to-br from-pink-950 via-pink-900 to-pink-950',
          cross1: 'bg-gradient-to-tr from-pink-800/30 via-pink-600/15 via-transparent to-pink-800/30',
          cross2: 'bg-gradient-to-bl from-pink-950/20 via-transparent via-pink-700/10 to-pink-800/20'
        };
      case 'yellow':
        return {
          base: 'bg-gradient-to-br from-amber-950 via-amber-900 to-amber-950',
          cross1: 'bg-gradient-to-tr from-amber-800/30 via-amber-600/15 via-transparent to-amber-800/30',
          cross2: 'bg-gradient-to-bl from-amber-950/20 via-transparent via-amber-700/10 to-amber-800/20'
        };
      default: // slate
        return {
          base: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
          cross1: 'bg-gradient-to-tr from-slate-800/30 via-slate-600/15 via-transparent to-slate-800/30',
          cross2: 'bg-gradient-to-bl from-slate-900/20 via-transparent via-slate-700/10 to-slate-800/20'
        };
    }
  };

  const backgroundClasses = getBackgroundClasses();

  const [inputMessage, setInputMessage] = useState('');

  const handleSendMessage = () => {
    if (inputMessage.trim() && onSendMessage) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };



  return (
    <div className="min-h-screen font-inter relative">
      {/* Background - always use landing page background for consistency */}
      <>
        {/* Landing page background - pixel perfect match */}
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm"></div>
      </>
      


      {/* Main Content */}
      <div className="relative z-10 flex h-screen p-6 space-x-6">
        {/* Left Panel - PDF Viewer (70%) */}
        <div className="flex-1 w-[70%] relative">
          <div className="h-full bg-[rgba(35,47,61,0.6)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-lg">
            {/* PDF Viewer Content */}
            <div className="w-full h-full">
              {/* PDFViewer handles its own welcome/content states and styling */}
              {children}
            </div>
          </div>
        </div>

        {/* Right Panel - AI Assistant (30%) */}
        <div className="w-[30%] flex flex-col">
          <div className="h-full bg-[rgba(35,47,61,0.6)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-lg overflow-hidden">
            {/* AI Assistant Header */}
            <div className="p-6 border-b border-[rgba(255,255,255,0.1)]">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)]">
                  <Menu className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-white">AI Assistant</h2>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-4 rounded-2xl text-white text-sm leading-relaxed ${
                      message.isUser
                        ? 'bg-blue-500/70 backdrop-blur-2xl rounded-br-md'
                        : 'bg-[rgba(35,47,61,0.6)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.1)] rounded-bl-md'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-[rgba(255,255,255,0.1)]">
              <div className="flex items-center space-x-3 bg-[rgba(35,47,61,0.6)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.1)] rounded-full p-2">
                <input
                  type="text"
                  placeholder="Ask anything about this PDF..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 bg-transparent text-white placeholder-white/60 text-sm px-4 py-2 border-none outline-none"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className="p-2 rounded-full bg-blue-500/70 hover:bg-blue-500/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 group"
                >
                  <Send className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default GlassViewLayout;
