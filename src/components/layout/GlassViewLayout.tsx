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
  const { colorTheme } = useTheme();

  // Color theme configurations with enhanced gradients
  const getBackgroundClasses = () => {
    switch (colorTheme) {
      case 'green':
        return {
          base: 'bg-gradient-to-br from-emerald-950 via-emerald-800 via-emerald-600 to-emerald-950',
          cross1: 'bg-gradient-to-tr from-emerald-700/40 via-emerald-500/20 via-transparent to-emerald-800/40',
          cross2: 'bg-gradient-to-bl from-emerald-950/30 via-transparent via-emerald-600/20 to-emerald-700/30'
        };
      case 'blue':
        return {
          base: 'bg-gradient-to-br from-blue-950 via-blue-800 via-blue-600 to-blue-950',
          cross1: 'bg-gradient-to-tr from-blue-700/40 via-blue-500/20 via-transparent to-blue-800/40',
          cross2: 'bg-gradient-to-bl from-blue-950/30 via-transparent via-blue-600/20 to-blue-700/30'
        };
      case 'purple':
        return {
          base: 'bg-gradient-to-br from-purple-950 via-purple-800 via-purple-600 to-purple-950',
          cross1: 'bg-gradient-to-tr from-purple-700/40 via-purple-500/20 via-transparent to-purple-800/40',
          cross2: 'bg-gradient-to-bl from-purple-950/30 via-transparent via-purple-600/20 to-purple-700/30'
        };
      case 'pink':
        return {
          base: 'bg-gradient-to-br from-pink-950 via-pink-800 via-pink-600 to-pink-950',
          cross1: 'bg-gradient-to-tr from-pink-700/40 via-pink-500/20 via-transparent to-pink-800/40',
          cross2: 'bg-gradient-to-bl from-pink-950/30 via-transparent via-pink-600/20 to-pink-700/30'
        };
      case 'yellow':
        return {
          base: 'bg-gradient-to-br from-amber-950 via-amber-800 via-amber-600 to-amber-950',
          cross1: 'bg-gradient-to-tr from-amber-700/40 via-amber-500/20 via-transparent to-amber-800/40',
          cross2: 'bg-gradient-to-bl from-amber-950/30 via-transparent via-amber-600/20 to-amber-700/30'
        };
      default: // slate
        return {
          base: 'bg-gradient-to-br from-slate-950 via-slate-800 via-slate-600 to-slate-950',
          cross1: 'bg-gradient-to-tr from-slate-700/40 via-slate-500/20 via-transparent to-slate-800/40',
          cross2: 'bg-gradient-to-bl from-slate-950/30 via-transparent via-slate-600/20 to-slate-700/30'
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
      {/* Smooth background with multiple gradient layers for fluid effect */}
      <div className={`fixed inset-0 ${backgroundClasses.base}`}></div>
      <div className={`fixed inset-0 ${backgroundClasses.cross1}`}></div>
      <div className={`fixed inset-0 ${backgroundClasses.cross2}`}></div>
      {/* Subtle noise texture for more organic feel */}
      <div className="fixed inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px]"></div>
      </div>
      
      {/* Top Bar */}
      <header className="relative z-50 w-full backdrop-blur-xl bg-white/10 border-b border-white/20 shadow-xl">
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
              className="p-3 rounded-xl backdrop-blur-md bg-white/5 border border-white/20 hover:bg-white/10 transition-all duration-200 group"
              title="Upload PDF"
            >
              <Upload className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            </button>
            
            <button
              onClick={onDownload}
              disabled={false}
              className="p-3 rounded-xl backdrop-blur-md bg-white/5 border border-white/20 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group"
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
                className={`p-3 rounded-xl backdrop-blur-md border border-white/20 transition-all duration-200 group ${
                  isAnalyticsEnabled ? 'bg-blue-500/20 hover:bg-blue-500/30' : 'bg-white/5 hover:bg-white/10'
                }`}
                title={isAnalyticsEnabled ? "Disable Analytics" : "Select Analytics Type"}
              >
                <BarChart2 className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              </button>
              
              {/* Analytics Type Dropdown */}
              {showAnalyticsDropdown && !isAnalyticsEnabled && (
                <div className="absolute top-full right-0 mt-2 w-48 backdrop-blur-2xl bg-white/20 border border-white/30 rounded-xl shadow-2xl z-50">
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
              className="p-3 rounded-xl backdrop-blur-md bg-white/5 border border-white/20 hover:bg-white/10 transition-all duration-200 group"
              title="Export Analytics"
            >
              <FileDown className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            </button>
            
            <button
              onClick={onOpenSettings}
              className="p-3 rounded-xl backdrop-blur-md bg-white/5 border border-white/20 hover:bg-white/10 transition-all duration-200 group"
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
          <div className="h-full backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-xl">
            {/* PDF Viewer Content */}
            <div className="w-full h-full">
              {/* PDFViewer handles its own welcome/content states and styling */}
              {children}
            </div>
          </div>
        </div>

        {/* Right Panel - AI Assistant (30%) */}
        <div className="w-[30%] flex flex-col">
          <div className="h-full backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-xl overflow-hidden">
            {/* AI Assistant Header */}
            <div className="p-6 border-b border-white/20">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg backdrop-blur-md bg-white/10 border border-white/20">
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
                        ? 'bg-blue-500/80 backdrop-blur-md rounded-br-md'
                        : 'backdrop-blur-xl bg-white/10 border border-white/20 rounded-bl-md'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-white/20">
              <div className="flex items-center space-x-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-full p-2">
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
                  className="p-2 rounded-full bg-blue-500/80 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group"
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
