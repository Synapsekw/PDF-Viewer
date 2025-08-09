/**
 * Enhanced Analytics Event Manager with batching, offline support, and real-time updates
 */

import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Database, AnalyticsEventInsert, AnalyticsSessionInsert } from '../supabase/database.types';

export interface AnalyticsEvent {
  id?: string;
  sessionId: string;
  type: string;
  pageNumber?: number;
  timestamp: number;
  coordinates?: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  data?: Record<string, any>;
}

export interface AnalyticsSession {
  id: string;
  documentId?: string;
  shareToken?: string;
  userId?: string;
  startTime: number;
  endTime?: number;
  pagesViewed: number[];
  metadata?: Record<string, any>;
}

export interface BatchConfig {
  maxBatchSize: number;
  maxBatchDelay: number; // milliseconds
  retryCount: number;
  retryDelay: number; // milliseconds
}

export interface EventManagerConfig {
  batch: BatchConfig;
  offline: {
    maxQueueSize: number;
    persistenceKey: string;
  };
  realtime: {
    enabled: boolean;
    channel?: string;
  };
}

const DEFAULT_CONFIG: EventManagerConfig = {
  batch: {
    maxBatchSize: 50,
    maxBatchDelay: 5000, // 5 seconds
    retryCount: 3,
    retryDelay: 1000
  },
  offline: {
    maxQueueSize: 1000,
    persistenceKey: 'analytics_offline_queue'
  },
  realtime: {
    enabled: true,
    channel: 'analytics_updates'
  }
};

export class AnalyticsEventManager {
  private supabase: SupabaseClient<Database>;
  private config: EventManagerConfig;
  private eventQueue: AnalyticsEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private isOnline: boolean = navigator.onLine;
  private offlineQueue: AnalyticsEvent[] = [];
  private realtimeChannel: RealtimeChannel | null = null;
  private activeSessionId: string | null = null;

  constructor(
    supabase: SupabaseClient<Database>,
    config: Partial<EventManagerConfig> = {}
  ) {
    this.supabase = supabase;
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    this.initializeEventHandlers();
    this.loadOfflineQueue();
    
    if (this.config.realtime.enabled) {
      this.initializeRealtime();
    }
  }

  /**
   * Start a new analytics session
   */
  async startSession(sessionData: Omit<AnalyticsSession, 'startTime'>): Promise<AnalyticsSession> {
    const session: AnalyticsSession = {
      ...sessionData,
      startTime: Date.now()
    };

    this.activeSessionId = session.id;

    // Try to save session immediately
    if (this.isOnline) {
      try {
        await this.saveSessionToDatabase(session);
      } catch (error) {
        console.warn('Failed to save session to database, will retry later:', error);
        this.queueForOffline({ 
          sessionId: session.id, 
          type: 'session_start', 
          timestamp: session.startTime,
          data: session 
        });
      }
    } else {
      this.queueForOffline({ 
        sessionId: session.id, 
        type: 'session_start', 
        timestamp: session.startTime,
        data: session 
      });
    }

    return session;
  }

  /**
   * End the current analytics session
   */
  async endSession(sessionId: string, endData?: Record<string, any>): Promise<void> {
    const endTime = Date.now();
    
    // Flush any remaining events for this session
    await this.flushEvents();

    // Update session end time
    if (this.isOnline) {
      try {
        await this.updateSessionEndTime(sessionId, endTime, endData);
      } catch (error) {
        console.warn('Failed to update session end time:', error);
        this.queueForOffline({
          sessionId,
          type: 'session_end',
          timestamp: endTime,
          data: { endTime, ...endData }
        });
      }
    } else {
      this.queueForOffline({
        sessionId,
        type: 'session_end',
        timestamp: endTime,
        data: { endTime, ...endData }
      });
    }

    if (this.activeSessionId === sessionId) {
      this.activeSessionId = null;
    }
  }

  /**
   * Track an analytics event
   */
  async trackEvent(event: Omit<AnalyticsEvent, 'timestamp'>): Promise<void> {
    const fullEvent: AnalyticsEvent = {
      ...event,
      timestamp: Date.now()
    };

    // Add to batch queue
    this.eventQueue.push(fullEvent);

    // Check if we should flush immediately
    if (this.eventQueue.length >= this.config.batch.maxBatchSize) {
      await this.flushEvents();
    } else if (!this.batchTimer) {
      // Start batch timer
      this.batchTimer = setTimeout(() => {
        this.flushEvents();
      }, this.config.batch.maxBatchDelay);
    }
  }

  /**
   * Track multiple events at once
   */
  async trackEvents(events: Omit<AnalyticsEvent, 'timestamp'>[]): Promise<void> {
    const timestamp = Date.now();
    const fullEvents = events.map(event => ({ ...event, timestamp }));
    
    this.eventQueue.push(...fullEvents);
    
    if (this.eventQueue.length >= this.config.batch.maxBatchSize) {
      await this.flushEvents();
    }
  }

  /**
   * Flush all pending events
   */
  async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    // Clear batch timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.isOnline) {
      try {
        await this.saveEventsToDatabase(eventsToFlush);
      } catch (error) {
        console.warn('Failed to save events, queuing for offline:', error);
        this.queueForOffline(...eventsToFlush);
      }
    } else {
      this.queueForOffline(...eventsToFlush);
    }
  }

  /**
   * Get analytics summary for current user
   */
  async getAnalyticsSummary(timeRange?: { start: Date; end: Date }): Promise<{
    totalSessions: number;
    totalEvents: number;
    totalDuration: number;
    topPages: Array<{ page: number; views: number }>;
    recentSessions: Array<{ id: string; startTime: Date; duration: number }>;
  }> {
    const { data: userData } = await this.supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('User not authenticated');
    }

    let sessionsQuery = this.supabase
      .from('analytics_sessions')
      .select('*')
      .eq('user_id', userData.user.id);

    if (timeRange) {
      sessionsQuery = sessionsQuery
        .gte('start_time', timeRange.start.toISOString())
        .lte('start_time', timeRange.end.toISOString());
    }

    const { data: sessions, error: sessionsError } = await sessionsQuery
      .order('start_time', { ascending: false });

    if (sessionsError) {
      throw new Error(`Failed to get analytics summary: ${sessionsError.message}`);
    }

    // Get events for these sessions
    const sessionIds = sessions.map(s => s.id);
    const { data: events, error: eventsError } = await this.supabase
      .from('analytics_events')
      .select('*')
      .in('session_id', sessionIds);

    if (eventsError) {
      throw new Error(`Failed to get events for summary: ${eventsError.message}`);
    }

    // Calculate statistics
    const totalSessions = sessions.length;
    const totalEvents = events.length;
    const totalDuration = sessions.reduce((sum, s) => sum + (s.total_duration || 0), 0);

    // Calculate top pages
    const pageViews = new Map<number, number>();
    events
      .filter(e => e.event_type === 'page_view' && e.page_number !== null)
      .forEach(e => {
        const page = e.page_number!;
        pageViews.set(page, (pageViews.get(page) || 0) + 1);
      });

    const topPages = Array.from(pageViews.entries())
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Recent sessions
    const recentSessions = sessions.slice(0, 10).map(s => ({
      id: s.id,
      startTime: new Date(s.start_time!),
      duration: s.total_duration || 0
    }));

    return {
      totalSessions,
      totalEvents,
      totalDuration,
      topPages,
      recentSessions
    };
  }

  /**
   * Subscribe to real-time analytics updates
   */
  subscribeToUpdates(callback: (event: AnalyticsEvent) => void): () => void {
    if (!this.realtimeChannel) {
      console.warn('Real-time not initialized');
      return () => {};
    }

    const subscription = this.realtimeChannel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'analytics_events'
      },
      (payload) => {
        const event = this.transformDatabaseEvent(payload.new);
        if (event) {
          callback(event);
        }
      }
    );

    return () => {
      if (this.realtimeChannel) {
        this.realtimeChannel.unsubscribe();
      }
    };
  }

  /**
   * Clean up resources
   */
  async destroy(): Promise<void> {
    // Flush any remaining events
    await this.flushEvents();

    // Clear timers
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    // Cleanup realtime
    if (this.realtimeChannel) {
      await this.supabase.removeChannel(this.realtimeChannel);
    }

    // Save offline queue
    this.saveOfflineQueue();
  }

  // Private methods

  private initializeEventHandlers(): void {
    // Online/offline handlers
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Beforeunload handler to save data
    window.addEventListener('beforeunload', () => {
      this.saveOfflineQueue();
      if (this.activeSessionId) {
        this.endSession(this.activeSessionId, { reason: 'page_unload' });
      }
    });
  }

  private initializeRealtime(): void {
    if (!this.config.realtime.channel) return;

    this.realtimeChannel = this.supabase.channel(this.config.realtime.channel);
    this.realtimeChannel.subscribe();
  }

  private async saveSessionToDatabase(session: AnalyticsSession): Promise<void> {
    const sessionData: AnalyticsSessionInsert = {
      id: session.id,
      document_id: session.documentId || null,
      share_token: session.shareToken || null,
      user_id: session.userId || null,
      start_time: new Date(session.startTime).toISOString(),
      end_time: session.endTime ? new Date(session.endTime).toISOString() : null,
      pages_viewed: session.pagesViewed,
      unique_pages_count: new Set(session.pagesViewed).size,
      metadata: session.metadata
    };

    const { error } = await this.supabase
      .from('analytics_sessions')
      .upsert(sessionData);

    if (error) {
      throw new Error(`Failed to save session: ${error.message}`);
    }
  }

  private async updateSessionEndTime(sessionId: string, endTime: number, endData?: Record<string, any>): Promise<void> {
    const { error } = await this.supabase
      .from('analytics_sessions')
      .update({
        end_time: new Date(endTime).toISOString(),
        metadata: endData
      })
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Failed to update session end time: ${error.message}`);
    }
  }

  private async saveEventsToDatabase(events: AnalyticsEvent[]): Promise<void> {
    if (events.length === 0) return;

    // Retry logic
    for (let attempt = 0; attempt < this.config.batch.retryCount; attempt++) {
      try {
        const eventData: AnalyticsEventInsert[] = events.map(event => ({
          id: event.id,
          session_id: event.sessionId,
          event_type: event.type,
          page_number: event.pageNumber || null,
          coordinates: event.coordinates || null,
          data: event.data || null,
          timestamp: new Date(event.timestamp).toISOString()
        }));

        const { error } = await this.supabase
          .from('analytics_events')
          .upsert(eventData);

        if (error) {
          throw new Error(`Failed to save events: ${error.message}`);
        }

        return; // Success, exit retry loop

      } catch (error) {
        console.warn(`Attempt ${attempt + 1} failed:`, error);
        
        if (attempt < this.config.batch.retryCount - 1) {
          await new Promise(resolve => 
            setTimeout(resolve, this.config.batch.retryDelay * (attempt + 1))
          );
        } else {
          throw error; // Final attempt failed
        }
      }
    }
  }

  private queueForOffline(...events: AnalyticsEvent[]): void {
    this.offlineQueue.push(...events);
    
    // Limit queue size
    if (this.offlineQueue.length > this.config.offline.maxQueueSize) {
      this.offlineQueue = this.offlineQueue.slice(-this.config.offline.maxQueueSize);
    }
    
    this.saveOfflineQueue();
  }

  private saveOfflineQueue(): void {
    try {
      localStorage.setItem(
        this.config.offline.persistenceKey,
        JSON.stringify(this.offlineQueue)
      );
    } catch (error) {
      console.warn('Failed to save offline queue:', error);
    }
  }

  private loadOfflineQueue(): void {
    try {
      const stored = localStorage.getItem(this.config.offline.persistenceKey);
      if (stored) {
        this.offlineQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load offline queue:', error);
      this.offlineQueue = [];
    }
  }

  private async processOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) return;

    const eventsToProcess = [...this.offlineQueue];
    this.offlineQueue = [];

    try {
      // Separate sessions and events
      const sessionEvents = eventsToProcess.filter(e => e.type === 'session_start' || e.type === 'session_end');
      const regularEvents = eventsToProcess.filter(e => e.type !== 'session_start' && e.type !== 'session_end');

      // Process session events first
      for (const event of sessionEvents) {
        if (event.type === 'session_start') {
          await this.saveSessionToDatabase(event.data as AnalyticsSession);
        } else if (event.type === 'session_end') {
          await this.updateSessionEndTime(event.sessionId, event.data.endTime, event.data);
        }
      }

      // Process regular events in batches
      if (regularEvents.length > 0) {
        await this.saveEventsToDatabase(regularEvents);
      }

      // Clear stored queue
      localStorage.removeItem(this.config.offline.persistenceKey);

    } catch (error) {
      console.warn('Failed to process offline queue, will retry later:', error);
      // Put events back in queue
      this.offlineQueue.unshift(...eventsToProcess);
      this.saveOfflineQueue();
    }
  }

  private transformDatabaseEvent(dbEvent: any): AnalyticsEvent | null {
    try {
      return {
        id: dbEvent.id,
        sessionId: dbEvent.session_id,
        type: dbEvent.event_type,
        pageNumber: dbEvent.page_number,
        timestamp: new Date(dbEvent.timestamp).getTime(),
        coordinates: dbEvent.coordinates,
        data: dbEvent.data
      };
    } catch (error) {
      console.warn('Failed to transform database event:', error);
      return null;
    }
  }
}
