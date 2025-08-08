import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../theme/ThemeProvider';
import { 
  Upload, 
  Download, 
  Settings, 
  Send,
  Menu,
  FileText,
  BarChart2,
  FileDown,
  ChevronDown
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

  const handleLogoClick = () => {
    console.log('Logo clicked, navigating to landing page');
    navigate('/');
  };
  const [inputMessage, setInputMessage] = useState('');
  const [showAnalyticsDropdown, setShowAnalyticsDropdown] = useState(false);
  const [selectedAnalyticsType, setSelectedAnalyticsType] = useState('heatmap');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAnalyticsDropdown(false);
      }
    };

    if (showAnalyticsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAnalyticsDropdown]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('GlassViewLayout: File input change event triggered');
    const file = event.target.files?.[0];
    console.log('GlassViewLayout: Selected file:', file ? `${file.name} (${file.size} bytes)` : 'none');
    if (file && onFileUpload) {
      console.log('GlassViewLayout: Calling onFileUpload with file');
      onFileUpload(file);
    } else {
      console.log('GlassViewLayout: No file or onFileUpload not provided');
    }
  };

  const handleSendMessage = () => {
    if (inputMessage.trim() && onSendMessage) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };



  return (
    <div className="min-h-screen font-inter relative overflow-hidden">
      {/* Background - always use landing page background for consistency */}
      <>
        {/* Landing page background - pixel perfect match */}
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm"></div>
      </>
      
      {/* Top Bar */}
      <header className="relative z-50 w-full bg-[rgba(35,47,61,0.6)] backdrop-blur-[10px] border-b border-[rgba(255,255,255,0.1)] shadow-lg">
        <div className="flex items-center justify-between px-6 py-0">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="/Spectra.png" 
              alt="Spectra Logo" 
              className="object-contain cursor-pointer transition-all duration-300 hover:scale-105"
              style={{ 
                width: '100px', 
                height: '100px',
                filter: 'brightness(0) invert(1)' 
              }}
              onClick={handleLogoClick}
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-xl bg-[rgba(35,47,61,0.6)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(35,47,61,0.8)] hover:border-[rgba(255,255,255,0.2)] transition-all duration-300 group"
              title="Upload PDF"
            >
              <Upload className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            </button>
            
            <button
              onClick={onDownload}
              disabled={false}
              className="p-3 rounded-xl bg-[rgba(35,47,61,0.6)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(35,47,61,0.8)] hover:border-[rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 group"
              title="Download PDF"
            >
              <Download className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            </button>
            
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => {
                  if (isAnalyticsEnabled) {
                    onToggleAnalytics?.();
                  } else {
                    setShowAnalyticsDropdown(!showAnalyticsDropdown);
                  }
                }}
                className={`p-3 rounded-xl backdrop-blur-[10px] border border-[rgba(255,255,255,0.1)] transition-all duration-300 group ${
                  isAnalyticsEnabled ? 'bg-blue-500/25 hover:bg-blue-500/35' : 'bg-[rgba(35,47,61,0.6)] hover:bg-[rgba(35,47,61,0.8)] hover:border-[rgba(255,255,255,0.2)]'
                }`}
                title={isAnalyticsEnabled ? "Disable Analytics" : "Select Analytics Type"}
              >
                <BarChart2 className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              </button>
              
              {/* Analytics Type Dropdown */}
              {showAnalyticsDropdown && !isAnalyticsEnabled && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-[rgba(35,47,61,0.8)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-lg z-50">
                  <div className="p-2">
                    <div className="text-xs text-white/80 px-3 py-1 mb-2 font-medium">Select Analytics Type</div>
                    {[
                      { value: 'heatmap', label: '🔥 Mouse Heatmap', description: 'Track mouse movements' },
                      { value: 'interactions', label: '📍 Interaction Points', description: 'Show clicks and actions' },
                      { value: 'page_time', label: '⏱️ Time Spent', description: 'Areas you view longest' },
                      { value: 'none', label: '🚫 Disable', description: 'Turn off analytics' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          console.log('Analytics dropdown clicked:', option.value);
                          setSelectedAnalyticsType(option.value);
                          setShowAnalyticsDropdown(false);
                          if (option.value !== 'none') {
                            // Update the analytics DOM element
                            let analyticsElement = window.document.getElementById('analytics-live-view-element');
                            if (!analyticsElement) {
                              analyticsElement = window.document.createElement('div');
                              analyticsElement.id = 'analytics-live-view-element';
                              analyticsElement.style.display = 'none';
                              window.document.body.appendChild(analyticsElement);
                            }
                            analyticsElement.setAttribute('data-analytics-live-view', 'true');
                            analyticsElement.setAttribute('data-analytics-type', option.value);
                            console.log('Updated DOM element:', {
                              'data-analytics-live-view': analyticsElement.getAttribute('data-analytics-live-view'),
                              'data-analytics-type': analyticsElement.getAttribute('data-analytics-type')
                            });
                            onToggleAnalytics?.();
                          } else {
                            // Disable analytics
                            const analyticsElement = window.document.getElementById('analytics-live-view-element');
                            if (analyticsElement) {
                              analyticsElement.setAttribute('data-analytics-live-view', 'false');
                              analyticsElement.setAttribute('data-analytics-type', 'none');
                              console.log('Disabled analytics');
                            }
                          }
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/20 transition-colors text-sm"
                      >
                        <div className="text-white font-medium">{option.label}</div>
                        <div className="text-white/80 text-xs">{option.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={onExportAnalytics}
              className="p-3 rounded-xl bg-[rgba(35,47,61,0.6)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(35,47,61,0.8)] hover:border-[rgba(255,255,255,0.2)] transition-all duration-300 group"
              title="Export Analytics"
            >
              <FileDown className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            </button>
            
            <button
              onClick={onOpenSettings}
              className="p-3 rounded-xl bg-[rgba(35,47,61,0.6)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(35,47,61,0.8)] hover:border-[rgba(255,255,255,0.2)] transition-all duration-300 group"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex h-[calc(100vh-80px)] p-6 space-x-6">
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
