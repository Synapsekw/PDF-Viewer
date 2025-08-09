/**
 * Supabase implementation of Analytics Repository
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { AnalyticsData } from '../../../contexts/AnalyticsContext';
import { IAnalyticsRepository, AnalyticsExportData, RepositoryHealth } from '../interfaces';
import { Database, AnalyticsSessionInsert, AnalyticsEventInsert } from '../../supabase/database.types';

export class SupabaseAnalyticsRepository implements IAnalyticsRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  async saveSession(sessionId: string, data: AnalyticsData): Promise<void> {
    const { data: userData } = await this.supabase.auth.getUser();
    
    // Create analytics session
    const sessionData: AnalyticsSessionInsert = {
      id: sessionId,
      document_id: data.documentId || null,
      session_token: sessionId,
      user_id: userData.user?.id || null,
      start_time: new Date(data.startTime).toISOString(),
      end_time: data.endTime ? new Date(data.endTime).toISOString() : null,
      total_duration: data.duration || null,
      pages_viewed: data.pageViews?.map(pv => pv.page) || [],
      unique_pages_count: data.pageViews ? 
        new Set(data.pageViews.map(pv => pv.page)).size : 0
    };

    // Insert session
    const { error: sessionError } = await this.supabase
      .from('analytics_sessions')
      .upsert(sessionData);

    if (sessionError) {
      throw new Error(`Failed to save analytics session: ${sessionError.message}`);
    }

    // Insert interactions as events
    if (data.interactions && data.interactions.length > 0) {
      const events: AnalyticsEventInsert[] = data.interactions.map(interaction => ({
        session_id: sessionId,
        event_type: interaction.type,
        page_number: interaction.page || null,
        coordinates: interaction.coordinates ? {
          x: interaction.coordinates.x,
          y: interaction.coordinates.y,
          width: interaction.coordinates.width || null,
          height: interaction.coordinates.height || null
        } : null,
        data: {
          duration: interaction.duration,
          element: interaction.element,
          ...interaction.data
        },
        timestamp: new Date(interaction.timestamp).toISOString()
      }));

      const { error: eventsError } = await this.supabase
        .from('analytics_events')
        .upsert(events);

      if (eventsError) {
        throw new Error(`Failed to save analytics events: ${eventsError.message}`);
      }
    }

    // Insert page views as events
    if (data.pageViews && data.pageViews.length > 0) {
      const pageViewEvents: AnalyticsEventInsert[] = data.pageViews.map(pageView => ({
        session_id: sessionId,
        event_type: 'page_view',
        page_number: pageView.page,
        data: {
          duration: pageView.duration,
          entryTime: pageView.entryTime,
          exitTime: pageView.exitTime
        },
        timestamp: new Date(pageView.entryTime).toISOString()
      }));

      const { error: pageViewError } = await this.supabase
        .from('analytics_events')
        .upsert(pageViewEvents);

      if (pageViewError) {
        throw new Error(`Failed to save page view events: ${pageViewError.message}`);
      }
    }
  }

  async loadSession(sessionId: string): Promise<AnalyticsData | null> {
    // Get session data
    const { data: session, error: sessionError } = await this.supabase
      .from('analytics_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      if (sessionError.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to load analytics session: ${sessionError.message}`);
    }

    // Get events data
    const { data: events, error: eventsError } = await this.supabase
      .from('analytics_events')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp');

    if (eventsError) {
      throw new Error(`Failed to load analytics events: ${eventsError.message}`);
    }

    // Transform back to AnalyticsData format
    const interactions = events
      .filter(event => event.event_type !== 'page_view')
      .map(event => ({
        type: event.event_type as any,
        timestamp: new Date(event.timestamp!).getTime(),
        page: event.page_number || undefined,
        coordinates: event.coordinates ? {
          x: (event.coordinates as any).x,
          y: (event.coordinates as any).y,
          width: (event.coordinates as any).width,
          height: (event.coordinates as any).height
        } : undefined,
        duration: (event.data as any)?.duration,
        element: (event.data as any)?.element,
        data: event.data as any
      }));

    const pageViews = events
      .filter(event => event.event_type === 'page_view')
      .map(event => ({
        page: event.page_number!,
        entryTime: new Date(event.timestamp!).getTime(),
        exitTime: (event.data as any)?.exitTime || new Date(event.timestamp!).getTime(),
        duration: (event.data as any)?.duration || 0
      }));

    return {
      documentId: session.document_id || undefined,
      startTime: new Date(session.start_time!).getTime(),
      endTime: session.end_time ? new Date(session.end_time).getTime() : undefined,
      duration: session.total_duration || 0,
      interactions,
      pageViews
    };
  }

  async listSessions(): Promise<string[]> {
    const { data: userData } = await this.supabase.auth.getUser();
    
    const { data, error } = await this.supabase
      .from('analytics_sessions')
      .select('id')
      .eq('user_id', userData.user?.id || null)
      .order('start_time', { ascending: false });

    if (error) {
      throw new Error(`Failed to list analytics sessions: ${error.message}`);
    }

    return data.map(session => session.id);
  }

  async deleteSession(sessionId: string): Promise<void> {
    // Delete session (events will be cascade deleted)
    const { error } = await this.supabase
      .from('analytics_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Failed to delete analytics session: ${error.message}`);
    }
  }

  async exportAllData(): Promise<AnalyticsExportData> {
    const { data: userData } = await this.supabase.auth.getUser();
    
    // Get all sessions
    const { data: sessions, error: sessionsError } = await this.supabase
      .from('analytics_sessions')
      .select('*')
      .eq('user_id', userData.user?.id || null)
      .order('start_time');

    if (sessionsError) {
      throw new Error(`Failed to export analytics sessions: ${sessionsError.message}`);
    }

    // Get all events
    const { data: events, error: eventsError } = await this.supabase
      .from('analytics_events')
      .select(`
        *,
        analytics_sessions!inner(user_id)
      `)
      .eq('analytics_sessions.user_id', userData.user?.id || null)
      .order('timestamp');

    if (eventsError) {
      throw new Error(`Failed to export analytics events: ${eventsError.message}`);
    }

    // Transform to export format
    const exportedSessions = sessions.map(session => ({
      sessionId: session.id,
      documentId: session.document_id || '',
      startTime: new Date(session.start_time!).getTime(),
      endTime: session.end_time ? new Date(session.end_time).getTime() : undefined,
      interactions: events
        .filter(event => event.session_id === session.id && event.event_type !== 'page_view')
        .map(event => ({
          type: event.event_type,
          timestamp: new Date(event.timestamp!).getTime(),
          page: event.page_number,
          coordinates: event.coordinates,
          data: event.data
        })),
      pageViews: events
        .filter(event => event.session_id === session.id && event.event_type === 'page_view')
        .map(event => ({
          page: event.page_number!,
          entryTime: new Date(event.timestamp!).getTime(),
          duration: (event.data as any)?.duration || 0
        })),
      duration: session.total_duration || 0
    }));

    const exportedEvents = events.map(event => ({
      type: event.event_type,
      timestamp: new Date(event.timestamp!).getTime(),
      data: {
        sessionId: event.session_id,
        page: event.page_number,
        coordinates: event.coordinates,
        ...event.data as any
      }
    }));

    return {
      sessions: exportedSessions,
      events: exportedEvents,
      metadata: {
        exportedAt: new Date().toISOString(),
        userId: userData.user?.id,
        totalSessions: exportedSessions.length,
        totalEvents: exportedEvents.length
      }
    };
  }

  async importData(data: AnalyticsExportData): Promise<void> {
    // Import sessions and events
    for (const session of data.sessions) {
      await this.saveSession(session.sessionId, {
        documentId: session.documentId,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration,
        interactions: session.interactions,
        pageViews: session.pageViews
      });
    }
  }

  async clear(): Promise<void> {
    const { data: userData } = await this.supabase.auth.getUser();
    
    // Delete all user sessions (events will cascade)
    const { error } = await this.supabase
      .from('analytics_sessions')
      .delete()
      .eq('user_id', userData.user?.id || null);

    if (error) {
      throw new Error(`Failed to clear analytics data: ${error.message}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('analytics_sessions')
        .select('count')
        .limit(1);
      
      return !error;
    } catch {
      return false;
    }
  }

  async getHealth(): Promise<RepositoryHealth> {
    const startTime = Date.now();
    const errors: string[] = [];
    let isHealthy = true;
    let isConnected = false;

    try {
      // Test database connectivity
      const { data, error } = await this.supabase
        .from('analytics_sessions')
        .select('count')
        .limit(1);

      if (error) {
        errors.push(`Database error: ${error.message}`);
        isHealthy = false;
      } else {
        isConnected = true;
      }

      // Test events table
      const { data: eventsData, error: eventsError } = await this.supabase
        .from('analytics_events')
        .select('count')
        .limit(1);

      if (eventsError) {
        errors.push(`Events table error: ${eventsError.message}`);
        isHealthy = false;
      }

    } catch (error) {
      errors.push(`Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      isHealthy = false;
    }

    return {
      isHealthy,
      isConnected,
      lastSuccess: isHealthy ? new Date().toISOString() : undefined,
      errors,
      latency: Date.now() - startTime
    };
  }
}
