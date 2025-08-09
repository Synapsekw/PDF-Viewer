/**
 * Enhanced Analytics Context with real-time capabilities and offline support
 */

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { AnalyticsEventManager, AnalyticsEvent, AnalyticsSession } from '../lib/analytics/AnalyticsEventManager';
import { SupabaseClientManager } from '../lib/supabase/client';
import { usePdf } from '../pdf/PdfContext';

export interface InteractionEvent {
  type: 'click' | 'scroll' | 'hover' | 'focus' | 'input' | 'page_view' | 'zoom' | 'rotate';
  timestamp: number;
  page?: number;
  coordinates?: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  duration?: number;
  element?: string;
  data?: Record<string, any>;
}

export interface AnalyticsConfig {
  enabled: boolean;
  batchSize: number;
  batchDelay: number;
  offlineSupport: boolean;
  realtimeUpdates: boolean;
}

export interface AnalyticsState {
  isEnabled: boolean;
  currentSession: AnalyticsSession | null;
  isOnline: boolean;
  pendingEvents: number;
  totalSessionTime: number;
  config: AnalyticsConfig;
}

export interface AnalyticsContextType {
  // State
  state: AnalyticsState;
  
  // Session management
  startSession: (documentId?: string, shareToken?: string) => Promise<void>;
  endSession: () => Promise<void>;
  
  // Event tracking
  recordInteraction: (interaction: Omit<InteractionEvent, 'timestamp'>) => Promise<void>;
  recordPageView: (pageNumber: number) => Promise<void>;
  recordCustomEvent: (eventType: string, data?: Record<string, any>) => Promise<void>;
  
  // Batch operations
  recordMultipleEvents: (events: Omit<InteractionEvent, 'timestamp'>[]) => Promise<void>;
  flushPendingEvents: () => Promise<void>;
  
  // Configuration
  updateConfig: (newConfig: Partial<AnalyticsConfig>) => void;
  toggleAnalytics: (enabled: boolean) => void;
  
  // Real-time subscriptions
  subscribeToUpdates: (callback: (event: AnalyticsEvent) => void) => () => void;
  
  // Analytics data
  getSessionSummary: () => Promise<{
    totalSessions: number;
    totalEvents: number;
    totalDuration: number;
    topPages: Array<{ page: number; views: number }>;
  }>;
}

const DEFAULT_CONFIG: AnalyticsConfig = {
  enabled: true,
  batchSize: 25,
  batchDelay: 3000,
  offlineSupport: true,
  realtimeUpdates: true
};

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

interface AnalyticsProviderProps {
  children: ReactNode;
  initialConfig?: Partial<AnalyticsConfig>;
}

export const EnhancedAnalyticsProvider: React.FC<AnalyticsProviderProps> = ({
  children,
  initialConfig = {}
}) => {
  const { document: pdfDocument } = usePdf();
  const [state, setState] = useState<AnalyticsState>({
    isEnabled: true,
    currentSession: null,
    isOnline: navigator.onLine,
    pendingEvents: 0,
    totalSessionTime: 0,
    config: { ...DEFAULT_CONFIG, ...initialConfig }
  });

  const eventManagerRef = useRef<AnalyticsEventManager | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Initialize event manager
  useEffect(() => {
    const supabase = SupabaseClientManager.getClient();
    if (!supabase) {
      console.warn('Supabase client not available, analytics disabled');
      return;
    }

    eventManagerRef.current = new AnalyticsEventManager(supabase, {
      batch: {
        maxBatchSize: state.config.batchSize,
        maxBatchDelay: state.config.batchDelay,
        retryCount: 3,
        retryDelay: 1000
      },
      offline: {
        maxQueueSize: 1000,
        persistenceKey: 'enhanced_analytics_queue'
      },
      realtime: {
        enabled: state.config.realtimeUpdates
      }
    });

    return () => {
      if (eventManagerRef.current) {
        eventManagerRef.current.destroy();
      }
    };
  }, [state.config.batchSize, state.config.batchDelay, state.config.realtimeUpdates]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update session timer
  useEffect(() => {
    if (state.currentSession && startTimeRef.current) {
      sessionTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current!;
        setState(prev => ({ ...prev, totalSessionTime: elapsed }));
      }, 1000);
    } else if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, [state.currentSession]);

  const startSession = async (documentId?: string, shareToken?: string): Promise<void> => {
    if (!state.isEnabled || !eventManagerRef.current) return;

    // End existing session if any
    if (state.currentSession) {
      await endSession();
    }

    const sessionId = crypto.randomUUID();
    const sessionData: Omit<AnalyticsSession, 'startTime'> = {
      id: sessionId,
      documentId,
      shareToken,
      pagesViewed: [],
      metadata: {
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        documentTitle: document.title
      }
    };

    try {
      const session = await eventManagerRef.current.startSession(sessionData);
      startTimeRef.current = session.startTime;
      
      setState(prev => ({
        ...prev,
        currentSession: session,
        totalSessionTime: 0
      }));

      // Record session start event
      await recordCustomEvent('session_start', {
        documentId,
        shareToken,
        timestamp: session.startTime
      });

    } catch (error) {
      console.error('Failed to start analytics session:', error);
    }
  };

  const endSession = async (): Promise<void> => {
    if (!state.currentSession || !eventManagerRef.current) return;

    try {
      // Record session end event
      await recordCustomEvent('session_end', {
        duration: state.totalSessionTime,
        pagesViewed: state.currentSession.pagesViewed
      });

      // Flush any pending events
      await eventManagerRef.current.flushEvents();

      // End the session
      await eventManagerRef.current.endSession(state.currentSession.id, {
        totalDuration: state.totalSessionTime,
        endReason: 'manual'
      });

      setState(prev => ({
        ...prev,
        currentSession: null,
        totalSessionTime: 0
      }));

      startTimeRef.current = null;

    } catch (error) {
      console.error('Failed to end analytics session:', error);
    }
  };

  const recordInteraction = async (interaction: Omit<InteractionEvent, 'timestamp'>): Promise<void> => {
    if (!state.isEnabled || !state.currentSession || !eventManagerRef.current) return;

    try {
      await eventManagerRef.current.trackEvent({
        sessionId: state.currentSession.id,
        type: interaction.type,
        pageNumber: interaction.page,
        coordinates: interaction.coordinates,
        data: {
          duration: interaction.duration,
          element: interaction.element,
          ...interaction.data
        }
      });

      setState(prev => ({ ...prev, pendingEvents: prev.pendingEvents + 1 }));
    } catch (error) {
      console.error('Failed to record interaction:', error);
    }
  };

  const recordPageView = async (pageNumber: number): Promise<void> => {
    if (!state.isEnabled || !state.currentSession) return;

    // Update session pages viewed
    const updatedSession = {
      ...state.currentSession,
      pagesViewed: [...new Set([...state.currentSession.pagesViewed, pageNumber])]
    };

    setState(prev => ({ ...prev, currentSession: updatedSession }));

    // Record the page view event
    await recordInteraction({
      type: 'page_view',
      page: pageNumber,
      data: { pageNumber }
    });
  };

  const recordCustomEvent = async (eventType: string, data?: Record<string, any>): Promise<void> => {
    if (!state.isEnabled || !state.currentSession || !eventManagerRef.current) return;

    try {
      await eventManagerRef.current.trackEvent({
        sessionId: state.currentSession.id,
        type: eventType,
        data
      });

      setState(prev => ({ ...prev, pendingEvents: prev.pendingEvents + 1 }));
    } catch (error) {
      console.error('Failed to record custom event:', error);
    }
  };

  const recordMultipleEvents = async (events: Omit<InteractionEvent, 'timestamp'>[]): Promise<void> => {
    if (!state.isEnabled || !state.currentSession || !eventManagerRef.current) return;

    try {
      const analyticsEvents = events.map(event => ({
        sessionId: state.currentSession!.id,
        type: event.type,
        pageNumber: event.page,
        coordinates: event.coordinates,
        data: {
          duration: event.duration,
          element: event.element,
          ...event.data
        }
      }));

      await eventManagerRef.current.trackEvents(analyticsEvents);
      setState(prev => ({ ...prev, pendingEvents: prev.pendingEvents + events.length }));
    } catch (error) {
      console.error('Failed to record multiple events:', error);
    }
  };

  const flushPendingEvents = async (): Promise<void> => {
    if (!eventManagerRef.current) return;

    try {
      await eventManagerRef.current.flushEvents();
      setState(prev => ({ ...prev, pendingEvents: 0 }));
    } catch (error) {
      console.error('Failed to flush pending events:', error);
    }
  };

  const updateConfig = (newConfig: Partial<AnalyticsConfig>): void => {
    setState(prev => ({
      ...prev,
      config: { ...prev.config, ...newConfig }
    }));
  };

  const toggleAnalytics = (enabled: boolean): void => {
    setState(prev => ({ ...prev, isEnabled: enabled }));
    
    if (!enabled && state.currentSession) {
      endSession();
    }
  };

  const subscribeToUpdates = (callback: (event: AnalyticsEvent) => void): () => void => {
    if (!eventManagerRef.current) {
      return () => {};
    }

    return eventManagerRef.current.subscribeToUpdates(callback);
  };

  const getSessionSummary = async (): Promise<{
    totalSessions: number;
    totalEvents: number;
    totalDuration: number;
    topPages: Array<{ page: number; views: number }>;
  }> => {
    if (!eventManagerRef.current) {
      throw new Error('Analytics not initialized');
    }

    const summary = await eventManagerRef.current.getAnalyticsSummary();
    return {
      totalSessions: summary.totalSessions,
      totalEvents: summary.totalEvents,
      totalDuration: summary.totalDuration,
      topPages: summary.topPages
    };
  };

  // Auto-start session when PDF document is loaded
  useEffect(() => {
    if (pdfDocument && state.isEnabled && !state.currentSession) {
      startSession(pdfDocument.fingerprint);
    }
  }, [pdfDocument, state.isEnabled]);

  // Auto-end session on component unmount
  useEffect(() => {
    return () => {
      if (state.currentSession) {
        endSession();
      }
    };
  }, []);

  const contextValue: AnalyticsContextType = {
    state,
    startSession,
    endSession,
    recordInteraction,
    recordPageView,
    recordCustomEvent,
    recordMultipleEvents,
    flushPendingEvents,
    updateConfig,
    toggleAnalytics,
    subscribeToUpdates,
    getSessionSummary
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useEnhancedAnalytics = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useEnhancedAnalytics must be used within an EnhancedAnalyticsProvider');
  }
  return context;
};
