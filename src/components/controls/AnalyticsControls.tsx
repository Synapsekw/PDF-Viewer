import React, { useState } from 'react';
import { AnalyticsVisualizationType } from '../../features/analytics/AnalyticsOverlay';

/**
 * Simple analytics toggle button for the toolbar
 */
const AnalyticsControls: React.FC = () => {
  const [isLiveViewEnabled, setIsLiveViewEnabled] = useState(false);
  const [selectedAnalyticsType, setSelectedAnalyticsType] = useState<AnalyticsVisualizationType>('heatmap');

  const handleToggle = () => {
    console.log('AnalyticsControls: Button clicked, current state:', { isLiveViewEnabled });
    setIsLiveViewEnabled(!isLiveViewEnabled);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log('AnalyticsControls: Type changed to:', e.target.value);
    setSelectedAnalyticsType(e.target.value as AnalyticsVisualizationType);
  };

  // Update the DOM with analytics settings for other components to read
  React.useEffect(() => {
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

  return (
    <div className="control-group">
      <button
        onClick={handleToggle}
        className={`control-button ${isLiveViewEnabled ? 'active' : ''}`}
        title={`${isLiveViewEnabled ? 'Disable' : 'Enable'} live analytics visualization`}
      >
        📊 Analytics {isLiveViewEnabled ? 'ON' : 'OFF'}
      </button>
      
      {isLiveViewEnabled && (
        <select
          value={selectedAnalyticsType}
          onChange={handleTypeChange}
          className="analytics-type-selector"
          title="Select analytics visualization type"
        >
          <option value="heatmap">🔥 Mouse Heatmap</option>
          <option value="interactions">📍 Interaction Points</option>
          <option value="page_time">⏱️ Time Spent</option>
          <option value="none">🚫 Hide All</option>
        </select>
      )}
    </div>
  );
};

export default AnalyticsControls;