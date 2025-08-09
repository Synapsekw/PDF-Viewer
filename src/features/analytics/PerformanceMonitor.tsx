/**
 * Performance monitoring component for analytics features.
 * Displays real-time performance metrics and storage usage.
 */

import React, { useState, useEffect } from 'react';
import { PdfFeatureProps, PdfFeatureComponent } from '../../pdf/types';
import { performanceMonitor } from '../../utils/performance';
import { analyticsStorage } from './persistence/storage';
import { FeatureOverlay } from '../base/FeatureOverlay';

/**
 * Performance metrics display component.
 */
const PerformanceMonitorComponent: React.FC<PdfFeatureProps> = ({ 
  canvasRef, 
  containerRef 
}) => {
  const [metrics, setMetrics] = useState<Map<string, any>>(new Map());
  const [storageInfo, setStorageInfo] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Update metrics periodically
  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(new Map(performanceMonitor.getAllStats()));
    };

    const updateStorageInfo = async () => {
      try {
        const info = await analyticsStorage.getStorageInfo();
        setStorageInfo(info);
      } catch (error) {
        console.warn('Failed to get storage info:', error);
      }
    };

    updateMetrics();
    updateStorageInfo();

    const interval = setInterval(() => {
      updateMetrics();
      updateStorageInfo();
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  // Toggle visibility with keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        setIsVisible(prev => !prev);
        event.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number): string => {
    return `${ms.toFixed(2)}ms`;
  };

  if (!isVisible) {
    return (
      <FeatureOverlay 
        canvasRef={canvasRef} 
        containerRef={containerRef}
        zIndex={9999}
      >
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'monospace',
          pointerEvents: 'none',
        }}>
          Ctrl+Shift+P for performance
        </div>
      </FeatureOverlay>
    );
  }

  return (
    <FeatureOverlay 
      canvasRef={canvasRef} 
      containerRef={containerRef}
      zIndex={9999}
    >
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'monospace',
        maxWidth: '400px',
        maxHeight: '70vh',
        overflow: 'auto',
        border: '1px solid #444',
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '10px',
          borderBottom: '1px solid #444',
          paddingBottom: '5px'
        }}>
          <h3 style={{ margin: 0, color: '#4CAF50' }}>Performance Monitor</h3>
          <button
            onClick={() => setIsVisible(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            ×
          </button>
        </div>

        {/* Performance Metrics */}
        <div style={{ marginBottom: '15px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#81C784' }}>Performance Metrics</h4>
          {metrics.size > 0 ? (
            <div>
              {Array.from(metrics.entries()).map(([name, stats]) => (
                <div key={name} style={{ marginBottom: '8px' }}>
                  <div style={{ color: '#FFF59D', fontWeight: 'bold' }}>{name}:</div>
                  {stats && (
                    <div style={{ marginLeft: '10px', color: '#E0E0E0' }}>
                      <div>Avg: {formatDuration(stats.avg)}</div>
                      <div>Min: {formatDuration(stats.min)}</div>
                      <div>Max: {formatDuration(stats.max)}</div>
                      <div>Count: {stats.count}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#999' }}>No metrics available</div>
          )}
        </div>

        {/* Storage Information */}
        <div style={{ marginBottom: '15px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#81C784' }}>Storage Information</h4>
          {storageInfo ? (
            <div style={{ color: '#E0E0E0' }}>
              <div>Adapter: {storageInfo.adapter}</div>
              <div>Sessions: {storageInfo.sessionCount}</div>
              {storageInfo.usage && (
                <>
                  <div>Used: {formatBytes(storageInfo.usage.used)}</div>
                  <div>Available: {formatBytes(storageInfo.usage.available)}</div>
                  <div>Usage: {((storageInfo.usage.used / storageInfo.usage.available) * 100).toFixed(1)}%</div>
                </>
              )}
            </div>
          ) : (
            <div style={{ color: '#999' }}>Loading storage info...</div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h4 style={{ margin: '0 0 8px 0', color: '#81C784' }}>Quick Actions</h4>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => performanceMonitor.clear()}
              style={{
                background: '#FF7043',
                color: 'white',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Clear Metrics
            </button>
            <button
              onClick={() => analyticsStorage.cleanup()}
              style={{
                background: '#FFB74D',
                color: 'white',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Cleanup Storage
            </button>
            <button
              onClick={() => console.log('Performance metrics:', Object.fromEntries(metrics))}
              style={{
                background: '#42A5F5',
                color: 'white',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Log to Console
            </button>
          </div>
        </div>

        <div style={{ 
          marginTop: '10px', 
          fontSize: '10px', 
          color: '#666',
          borderTop: '1px solid #444',
          paddingTop: '5px'
        }}>
          Press Ctrl+Shift+P to toggle • Updates every 2s
        </div>
      </div>
    </FeatureOverlay>
  );
};

/**
 * Performance monitor feature component.
 */
export const PerformanceMonitor: PdfFeatureComponent = {
  displayName: 'PerformanceMonitor',
  Component: PerformanceMonitorComponent,
  config: {
    enabledInProduction: false, // Only enable in development by default
    keyboardShortcut: 'Ctrl+Shift+P',
  },
};

export default PerformanceMonitor;