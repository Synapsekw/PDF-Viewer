import React, { useState } from 'react';
import { useAnalytics } from '../../contexts/AnalyticsContext';

interface SnippingControlsProps {
  onToggle: (enabled: boolean) => void;
  onSnippingAction?: (action: string, data?: any) => void;
}

export const SnippingControls: React.FC<SnippingControlsProps> = ({ 
  onToggle, 
  onSnippingAction 
}) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const { recordInteraction } = useAnalytics();

  const handleToggle = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    onToggle(newState);
    
    recordInteraction({ 
      type: 'snip', 
      details: { action: newState ? 'enable' : 'disable' } 
    });
    
    if (!newState) {
      setLastAction(null);
    }
  };

  const handleSnippingAction = (action: string, data?: any) => {
    setLastAction(action);
    onSnippingAction?.(action, data);
    
    recordInteraction({ 
      type: 'snip', 
      details: { action, data } 
    });
    
    // Clear the action feedback after a delay
    setTimeout(() => setLastAction(null), 2000);
  };

  return (
    <div className="snipping-controls">
      <button
        onClick={handleToggle}
        className={`snipping-toggle ${isEnabled ? 'active' : ''}`}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: isEnabled ? '#2196F3' : '#f0f0f0',
          color: isEnabled ? 'white' : '#333',
          border: '1px solid #ddd',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: isEnabled ? 'bold' : 'normal',
        }}
        title={isEnabled ? 'Disable snipping tool' : 'Enable snipping tool'}
      >
        ✂️ {isEnabled ? 'Snipping Active' : 'Snipping Tool'}
      </button>
      
      {lastAction && (
        <span 
          style={{
            marginLeft: '10px',
            padding: '2px 6px',
            backgroundColor: lastAction === 'copy' ? '#4CAF50' : '#2196F3',
            color: 'white',
            borderRadius: '3px',
            fontSize: '12px',
          }}
        >
          {lastAction === 'copy' ? 'Copied!' : 
           lastAction === 'download' ? 'Downloaded!' : 
           lastAction}
        </span>
      )}
      
      {isEnabled && (
        <span 
          style={{
            marginLeft: '10px',
            fontSize: '12px',
            color: '#666',
            fontStyle: 'italic',
          }}
        >
          Click and drag to select area
        </span>
      )}
    </div>
  );
};

export default SnippingControls;