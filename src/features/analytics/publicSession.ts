/**
 * Public session analytics for shared PDF viewers
 */

import { 
  PublicSession, 
  PublicSessionHandle, 
  PublicAnalyticsEvent,
  PublicSessionStartEvent,
  PublicDocOpenEvent,
  PublicSessionEndEvent
} from '../share/types';

const DB_NAME = 'PublicAnalytics';
const DB_VERSION = 1;
const EVENTS_STORE = 'events_public';
const SESSIONS_STORE = 'sessions_public';

class PublicSessionManager {
  private dbPromise: Promise<IDBDatabase>;
  private activeSessions: Map<string, PublicSession> = new Map();
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.dbPromise = this.initDB();
    this.setupUnloadHandlers();
  }

  private async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(EVENTS_STORE)) {
          const eventStore = db.createObjectStore(EVENTS_STORE, { keyPath: 'id', autoIncrement: true });
          eventStore.createIndex('sessionId', 'sessionId', { unique: false });
          eventStore.createIndex('token', 'token', { unique: false });
          eventStore.createIndex('type', 'type', { unique: false });
          eventStore.createIndex('ts', 'ts', { unique: false });
        }

        if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
          const sessionStore = db.createObjectStore(SESSIONS_STORE, { keyPath: 'sessionId' });
          sessionStore.createIndex('token', 'token', { unique: false });
          sessionStore.createIndex('docId', 'docId', { unique: false });
          sessionStore.createIndex('startTime', 'startTime', { unique: false });
        }
      };
    });
  }

  private generateSessionId(): string {
    return 'sess_' + Array.from(crypto.getRandomValues(new Uint8Array(12)))
      .map(b => b.toString(36))
      .join('')
      .substring(0, 16);
  }

  private setupUnloadHandlers(): void {
    const endAllSessions = () => {
      this.activeSessions.forEach((session) => {
        this.endSessionSync(session.sessionId);
      });
    };

    window.addEventListener('beforeunload', endAllSessions);
    window.addEventListener('pagehide', endAllSessions);
    
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.activeSessions.forEach((session) => {
          this.endSessionSync(session.sessionId);
        });
      }
    });
  }

  private async storeEvent(event: PublicAnalyticsEvent): Promise<void> {
    const db = await this.dbPromise;
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([EVENTS_STORE], 'readwrite');
      const store = transaction.objectStore(EVENTS_STORE);
      const request = store.add({ ...event, id: undefined });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async storeSession(session: PublicSession): Promise<void> {
    const db = await this.dbPromise;
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SESSIONS_STORE], 'readwrite');
      const store = transaction.objectStore(SESSIONS_STORE);
      
      // Convert Set to Array for storage
      const sessionData = {
        ...session,
        pagesViewed: Array.from(session.pagesViewed)
      };
      
      const request = store.put(sessionData);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private startHeartbeat(sessionId: string): void {
    const interval = setInterval(() => {
      const session = this.activeSessions.get(sessionId);
      if (session) {
        const secondsVisible = Math.floor((Date.now() - session.startTime) / 1000);
        this.trackEvent(sessionId, {
          type: 'public_heartbeat',
          secondsVisible
        });
      }
    }, 15000); // Every 15 seconds

    this.heartbeatIntervals.set(sessionId, interval);
  }

  private stopHeartbeat(sessionId: string): void {
    const interval = this.heartbeatIntervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(sessionId);
    }
  }

  async startPublicSession({ token, docId }: { token: string; docId: string }): Promise<PublicSessionHandle> {
    const sessionId = this.generateSessionId();
    const startTime = Date.now();

    const session: PublicSession = {
      sessionId,
      token,
      docId,
      startTime,
      pagesViewed: new Set(),
      events: []
    };

    this.activeSessions.set(sessionId, session);

    // Track session start
    const startEvent: PublicSessionStartEvent = {
      type: 'public_session_start',
      token,
      docId,
      sessionId,
      ts: startTime
    };

    await this.storeEvent(startEvent);
    session.events.push(startEvent);

    // Track document open
    const openEvent: PublicDocOpenEvent = {
      type: 'public_doc_open',
      token,
      docId,
      sessionId,
      ts: Date.now()
    };

    await this.storeEvent(openEvent);
    session.events.push(openEvent);

    // Start heartbeat
    this.startHeartbeat(sessionId);

    return {
      track: (eventData) => this.trackEvent(sessionId, eventData),
      end: () => this.endSession(sessionId)
    };
  }

  private async trackEvent(sessionId: string, eventData: Omit<PublicAnalyticsEvent, 'token' | 'docId' | 'sessionId' | 'ts'>): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const event: PublicAnalyticsEvent = {
      ...eventData,
      token: session.token,
      docId: session.docId,
      sessionId,
      ts: Date.now()
    } as PublicAnalyticsEvent;

    // Track page views
    if (event.type === 'public_page_view') {
      session.pagesViewed.add(event.pageIndex);
    }

    session.events.push(event);
    await this.storeEvent(event);
  }

  private async endSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    this.stopHeartbeat(sessionId);

    const duration = Math.floor((Date.now() - session.startTime) / 1000);
    const endEvent: PublicSessionEndEvent = {
      type: 'public_session_end',
      token: session.token,
      docId: session.docId,
      sessionId,
      durationSec: duration,
      pagesViewed: session.pagesViewed.size,
      ts: Date.now()
    };

    await this.storeEvent(endEvent);
    session.events.push(endEvent);

    // Store final session data
    await this.storeSession(session);

    this.activeSessions.delete(sessionId);

    // Trigger report generation
    await this.generateReport(session);
  }

  private endSessionSync(sessionId: string): void {
    // Synchronous version for unload handlers
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    this.stopHeartbeat(sessionId);
    this.activeSessions.delete(sessionId);

    // Use sendBeacon for reliable data sending on unload
    const duration = Math.floor((Date.now() - session.startTime) / 1000);
    const endEvent: PublicSessionEndEvent = {
      type: 'public_session_end',
      token: session.token,
      docId: session.docId,
      sessionId,
      durationSec: duration,
      pagesViewed: session.pagesViewed.size,
      ts: Date.now()
    };

    // Store in IndexedDB synchronously if possible
    try {
      navigator.sendBeacon('/api/analytics/end-session', JSON.stringify(endEvent));
    } catch (error) {
      console.warn('Failed to send end session beacon:', error);
    }
  }

  private async generateReport(session: PublicSession): Promise<void> {
    // This will be implemented when we create the reports system
    console.log('Report generation triggered for session:', session.sessionId);
  }

  async getSessionsByToken(token: string): Promise<PublicSession[]> {
    const db = await this.dbPromise;
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SESSIONS_STORE], 'readonly');
      const store = transaction.objectStore(SESSIONS_STORE);
      const index = store.index('token');
      const request = index.getAll(token);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const results = request.result.map((session: any) => ({
          ...session,
          pagesViewed: new Set(session.pagesViewed) // Convert back to Set
        }));
        resolve(results);
      };
    });
  }

  async getAllSessions(): Promise<PublicSession[]> {
    const db = await this.dbPromise;
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SESSIONS_STORE], 'readonly');
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const results = request.result.map((session: any) => ({
          ...session,
          pagesViewed: new Set(session.pagesViewed)
        }));
        resolve(results);
      };
    });
  }
}

// Export singleton instance
export const publicSessionManager = new PublicSessionManager();

// Convenience function for starting sessions
export function startPublicSession(params: { token: string; docId: string }): Promise<PublicSessionHandle> {
  return publicSessionManager.startPublicSession(params);
}
