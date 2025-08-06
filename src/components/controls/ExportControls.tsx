import React from 'react';
import { useAnalytics } from '../../contexts/AnalyticsContext';

interface ExportControlsProps {
  onOpenExportPanel: () => void;
}

export const ExportControls: React.FC<ExportControlsProps> = ({ onOpenExportPanel }) => {
  const { analyticsData } = useAnalytics();

  const hasData = analyticsData.pageViews.length > 0 || analyticsData.interactions.length > 0;

  return (
    <div className="export-controls">
      <button
        onClick={onOpenExportPanel}
        disabled={!hasData}
        className="export-button"
        title={hasData ? "Export analytics data" : "No analytics data available"}
      >
        📊 Export Analytics
      </button>
      
      {hasData && (
        <span className="data-indicator">
          {analyticsData.pageViews.length} pages • {analyticsData.interactions.length} actions
        </span>
      )}


    </div>
  );
};

export default ExportControls;