import React from 'react';
import { PdfFeatureComponent, PdfFeatureProps } from '../../pdf/types';

/**
 * Available analytics visualization types
 */
export type AnalyticsVisualizationType = 
  | 'heatmap' 
  | 'interactions' 
  | 'page_time' 
  | 'scroll_patterns'
  | 'click_density'
  | 'none';

// Simple hidden component that just manages global analytics state
const AnalyticsControlsComponent: React.FC<PdfFeatureProps> = () => {
  // This component is now just a placeholder for the analytics system
  // All controls are moved to the toolbar
  return null;
};

export const AnalyticsOverlay: PdfFeatureComponent = {
  displayName: 'AnalyticsControls',
  Component: AnalyticsControlsComponent,
  config: {
    position: 'top-left',
    expandable: true,
    showLiveStats: true,
  },
};

export default AnalyticsOverlay;