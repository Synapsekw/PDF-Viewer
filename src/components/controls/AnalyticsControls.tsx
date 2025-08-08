import React, { useState, useRef, useEffect } from 'react';
import { AnalyticsVisualizationType } from '../../features/analytics/AnalyticsOverlay';

interface AnalyticsOption {
  value: AnalyticsVisualizationType;
  label: string;
  icon: string;
  description: string;
}

const analyticsOptions: AnalyticsOption[] = [
  {
    value: 'heatmap',
    label: 'Mouse Heatmap',
    icon: '🔥',
    description: 'Shows where your mouse has been most active'
  },
  {
    value: 'interactions',
    label: 'Interaction Points',
    icon: '📍',
    description: 'Displays click and scroll locations'
  },
  {
    value: 'page_time',
    label: 'Time Spent',
    icon: '⏱️',
    description: 'Shows time spent on each page section'
  },
  {
    value: 'scroll_patterns',
    label: 'Scroll Patterns',
    icon: '📜',
    description: 'Visualizes reading flow and scroll behavior'
  },
  {
    value: 'click_density',
    label: 'Click Density',
    icon: '🎯',
    description: 'Highlights areas with most clicks'
  },
  {
    value: 'none',
    label: 'Hide All',
    icon: '🚫',
    description: 'Disable all analytics visualizations'
  }
];

/**
 * Enhanced analytics controls with dropdown menu
 */
const AnalyticsControls: React.FC = () => {
  const [isLiveViewEnabled, setIsLiveViewEnabled] = useState(false);
  const [selectedAnalyticsType, setSelectedAnalyticsType] = useState<AnalyticsVisualizationType>('heatmap');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    console.log('AnalyticsControls: Button clicked, current state:', { isLiveViewEnabled });
    setIsLiveViewEnabled(!isLiveViewEnabled);
    if (!isLiveViewEnabled) {
      setIsDropdownOpen(true);
    }
  };

  const handleAnalyticsTypeSelect = (type: AnalyticsVisualizationType) => {
    console.log('AnalyticsControls: Type changed to:', type);
    setSelectedAnalyticsType(type);
    setIsDropdownOpen(false);
    
    // If "Hide All" is selected, disable live view
    if (type === 'none') {
      setIsLiveViewEnabled(false);
    }
  };

  // Update the DOM with analytics settings for other components to read
  useEffect(() => {
    // Always create the element with a consistent ID for reliable access
    let analyticsElement = document.getElementById('analytics-live-view-element');
    
    if (!analyticsElement) {
      analyticsElement = document.createElement('div');
      analyticsElement.id = 'analytics-live-view-element';
      analyticsElement.style.display = 'none';
      document.body.appendChild(analyticsElement);
    }
    
    // Set the attribute value based on enabled state
    analyticsElement.setAttribute('data-analytics-live-view', isLiveViewEnabled.toString());
    analyticsElement.setAttribute('data-analytics-type', selectedAnalyticsType);
    
    // Debug logging
    console.log('AnalyticsControls setting DOM element:', {
      isLiveViewEnabled,
      selectedAnalyticsType,
      elementId: analyticsElement.id,
      dataLiveView: analyticsElement.getAttribute('data-analytics-live-view'),
      dataType: analyticsElement.getAttribute('data-analytics-type')
    });
  }, [isLiveViewEnabled, selectedAnalyticsType]);

  const selectedOption = analyticsOptions.find(option => option.value === selectedAnalyticsType);

  return (
    <div className="control-group relative">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={`control-button ${isLiveViewEnabled ? 'active' : ''} flex items-center gap-2`}
        title={`${isLiveViewEnabled ? 'Disable' : 'Enable'} live analytics visualization`}
      >
        📊 Analytics
        {isLiveViewEnabled && selectedOption && (
          <span className="text-xs opacity-75">
            {selectedOption.icon} {selectedOption.label}
          </span>
        )}
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full mb-2 left-0 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50"
          style={{ minWidth: '320px' }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Select Analytics Visualization
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Choose which analytics to display live on the PDF
            </p>
          </div>

          {/* Options List */}
          <div className="py-2">
            {analyticsOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnalyticsTypeSelect(option.value)}
                className={`w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150 flex items-start gap-3 ${
                  selectedAnalyticsType === option.value 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500' 
                    : ''
                }`}
              >
                <span className="text-lg flex-shrink-0">{option.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 dark:text-white text-sm">
                    {option.label}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {option.description}
                  </div>
                </div>
                {selectedAnalyticsType === option.value && (
                  <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Live visualization is {isLiveViewEnabled ? 'enabled' : 'disabled'}</span>
              <button
                onClick={() => setIsDropdownOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsControls;