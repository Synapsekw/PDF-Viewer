/**
 * Real-time Analytics Dashboard Component
 */

import React, { useState, useEffect, useRef } from 'react';
import { useEnhancedAnalytics } from '../../contexts/EnhancedAnalyticsContext';
import { AnalyticsEvent } from '../../lib/analytics/AnalyticsEventManager';

interface RealTimeStats {
  activeUsers: number;
  eventsPerMinute: number;
  popularPages: Map<number, number>;
  recentEvents: AnalyticsEvent[];
}

interface RealtimeAnalyticsProps {
  className?: string;
  updateInterval?: number; // milliseconds
}

export const RealtimeAnalytics: React.FC<RealtimeAnalyticsProps> = ({
  className = "",
  updateInterval = 5000
}) => {
  const { state, subscribeToUpdates, getSessionSummary } = useEnhancedAnalytics();
  const [realTimeStats, setRealTimeStats] = useState<RealTimeStats>({
    activeUsers: 0,
    eventsPerMinute: 0,
    popularPages: new Map(),
    recentEvents: []
  });

  const [isLive, setIsLive] = useState(false);
  const eventCountRef = useRef(0);
  const lastMinuteRef = useRef(Date.now());
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Subscribe to real-time updates
  useEffect(() => {
    if (state.config.realtimeUpdates) {
      unsubscribeRef.current = subscribeToUpdates((event: AnalyticsEvent) => {
        setRealTimeStats(prev => {
          // Update recent events
          const recentEvents = [event, ...prev.recentEvents].slice(0, 10);
          
          // Update popular pages
          const popularPages = new Map(prev.popularPages);
          if (event.pageNumber && event.type === 'page_view') {
            popularPages.set(event.pageNumber, (popularPages.get(event.pageNumber) || 0) + 1);
          }

          // Update events per minute counter
          const now = Date.now();
          if (now - lastMinuteRef.current >= 60000) {
            // Reset counter for new minute
            eventCountRef.current = 1;
            lastMinuteRef.current = now;
          } else {
            eventCountRef.current++;
          }

          return {
            ...prev,
            recentEvents,
            popularPages,
            eventsPerMinute: eventCountRef.current
          };
        });

        setIsLive(true);
        // Reset live indicator after a short delay
        setTimeout(() => setIsLive(false), 1000);
      });
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [state.config.realtimeUpdates, subscribeToUpdates]);

  // Periodic stats update
  useEffect(() => {
    const updateStats = async () => {
      try {
        const summary = await getSessionSummary();
        setRealTimeStats(prev => ({
          ...prev,
          activeUsers: summary.totalSessions // This would need adjustment for true active users
        }));
      } catch (error) {
        console.error('Failed to update real-time stats:', error);
      }
    };

    // Initial update
    updateStats();

    // Set up periodic updates
    const interval = setInterval(updateStats, updateInterval);

    return () => clearInterval(interval);
  }, [getSessionSummary, updateInterval]);

  const formatEventType = (type: string): string => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getEventIcon = (type: string): string => {
    switch (type) {
      case 'page_view': return '👁️';
      case 'click': return '👆';
      case 'scroll': return '📜';
      case 'zoom': return '🔍';
      case 'session_start': return '🚀';
      case 'session_end': return '✅';
      default: return '📊';
    }
  };

  const getTopPages = (): Array<{ page: number; views: number }> => {
    return Array.from(realTimeStats.popularPages.entries())
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Real-time Analytics
          </h3>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {state.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {realTimeStats.activeUsers}
            </div>
            <div className="text-sm text-blue-800 dark:text-blue-300">
              Active Sessions
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {realTimeStats.eventsPerMinute}
            </div>
            <div className="text-sm text-green-800 dark:text-green-300">
              Events/Min
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {state.pendingEvents}
            </div>
            <div className="text-sm text-purple-800 dark:text-purple-300">
              Pending Events
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {Math.floor(state.totalSessionTime / 1000)}s
            </div>
            <div className="text-sm text-orange-800 dark:text-orange-300">
              Session Time
            </div>
          </div>
        </div>

        {/* Popular Pages */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Popular Pages
          </h4>
          <div className="space-y-2">
            {getTopPages().map(({ page, views }) => (
              <div key={page} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Page {page}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((views / Math.max(...getTopPages().map(p => p.views))) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {views}
                  </span>
                </div>
              </div>
            ))}
            {getTopPages().length === 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No page views yet
              </div>
            )}
          </div>
        </div>

        {/* Recent Events */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Recent Events
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {realTimeStats.recentEvents.map((event, index) => (
              <div 
                key={`${event.id || event.timestamp}-${index}`}
                className="flex items-center space-x-3 py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded text-sm"
              >
                <span className="text-lg" title={event.type}>
                  {getEventIcon(event.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-gray-900 dark:text-gray-100 font-medium truncate">
                    {formatEventType(event.type)}
                  </div>
                  {event.pageNumber && (
                    <div className="text-gray-500 dark:text-gray-400 text-xs">
                      Page {event.pageNumber}
                    </div>
                  )}
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-xs">
                  {formatTimestamp(event.timestamp)}
                </div>
              </div>
            ))}
            {realTimeStats.recentEvents.length === 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No recent events
              </div>
            )}
          </div>
        </div>

        {/* Configuration */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700 dark:text-gray-300">
              Batch Size: {state.config.batchSize} events
            </span>
            <span className="text-gray-700 dark:text-gray-300">
              Batch Delay: {state.config.batchDelay / 1000}s
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-700 dark:text-gray-300">
              Offline Support: {state.config.offlineSupport ? 'Enabled' : 'Disabled'}
            </span>
            <span className="text-gray-700 dark:text-gray-300">
              Real-time: {state.config.realtimeUpdates ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
