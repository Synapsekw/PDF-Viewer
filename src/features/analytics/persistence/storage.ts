/**
 * Analytics data persistence layer with support for localStorage and IndexedDB.
 * Provides automatic fallback and data migration between storage methods.
 */

import { AnalyticsData, UserInteraction, PageView } from '../../../contexts/AnalyticsContext';
import { batch, performanceMonitor } from '../../../utils/performance';

/**
 * Storage configuration options.
 */
export interface StorageConfig {
  /** Storage method preference */
  preferredStorage: 'localStorage' | 'indexedDB' | 'auto';
  /** Maximum age of stored data in milliseconds */
  maxDataAge: number;
  /** Maximum number of sessions to keep */
  maxSessions: number;
  /** Enable data compression */
  enableCompression: boolean;
  /** Batch size for write operations */
  batchSize: number;
}

/**
 * Default storage configuration.
 */
export const DEFAULT_STORAGE_CONFIG: StorageConfig = {
  preferredStorage: 'auto',
  maxDataAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  maxSessions: 100,
  enableCompression: true,
  batchSize: 50,
};

/**
 * Storage interface for different storage implementations.
 */
export interface StorageAdapter {
  /** Check if storage is available */
  isAvailable(): boolean;
  /** Save analytics data */
  save(key: string, data: any): Promise<void>;
  /** Load analytics data */
  load(key: string): Promise<any | null>;
  /** Remove data by key */
  remove(key: string): Promise<void>;
  /** List all keys */
  listKeys(): Promise<string[]>;
  /** Clear all data */
  clear(): Promise<void>;
  /** Get storage usage statistics */
  getUsage(): Promise<{ used: number; available: number } | null>;
}

/**
 * localStorage adapter implementation.
 */
export class LocalStorageAdapter implements StorageAdapter {
  private readonly prefix = 'pdf_analytics_';
  
  isAvailable(): boolean {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
  
  async save(key: string, data: any): Promise<void> {
    const endTiming = performanceMonitor.startTiming('localStorage_save');
    
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(this.prefix + key, serialized);
    } catch (error) {
      console.warn('localStorage save failed:', error);
      throw error;
    } finally {
      endTiming();
    }
  }
  
  async load(key: string): Promise<any | null> {
    const endTiming = performanceMonitor.startTiming('localStorage_load');
    
    try {
      const data = localStorage.getItem(this.prefix + key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('localStorage load failed:', error);
      return null;
    } finally {
      endTiming();
    }
  }
  
  async remove(key: string): Promise<void> {
    localStorage.removeItem(this.prefix + key);
  }
  
  async listKeys(): Promise<string[]> {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        keys.push(key.substring(this.prefix.length));
      }
    }
    return keys;
  }
  
  async clear(): Promise<void> {
    const keys = await this.listKeys();
    for (const key of keys) {
      await this.remove(key);
    }
  }
  
  async getUsage(): Promise<{ used: number; available: number } | null> {
    try {
      // Estimate localStorage usage
      let used = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.prefix)) {
          const value = localStorage.getItem(key);
          used += (key.length + (value?.length || 0)) * 2; // UTF-16 encoding
        }
      }
      
      // Most browsers have ~5-10MB localStorage limit
      const available = 10 * 1024 * 1024; // 10MB estimate
      
      return { used, available };
    } catch {
      return null;
    }
  }
}

/**
 * IndexedDB adapter implementation.
 */
export class IndexedDBAdapter implements StorageAdapter {
  private dbName = 'PDFAnalyticsDB';
  private dbVersion = 1;
  private storeName = 'analytics';
  private db: IDBDatabase | null = null;
  
  private async openDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }
  
  isAvailable(): boolean {
    return typeof indexedDB !== 'undefined';
  }
  
  async save(key: string, data: any): Promise<void> {
    const endTiming = performanceMonitor.startTiming('indexedDB_save');
    
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      await new Promise((resolve, reject) => {
        const request = store.put({
          key,
          data,
          timestamp: Date.now(),
        });
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } finally {
      endTiming();
    }
  }
  
  async load(key: string): Promise<any | null> {
    const endTiming = performanceMonitor.startTiming('indexedDB_load');
    
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.get(key);
        
        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.data : null);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('IndexedDB load failed:', error);
      return null;
    } finally {
      endTiming();
    }
  }
  
  async remove(key: string): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    await new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  async listKeys(): Promise<string[]> {
    const db = await this.openDB();
    const transaction = db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.getAllKeys();
      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    });
  }
  
  async clear(): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    await new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  async getUsage(): Promise<{ used: number; available: number } | null> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage || 0,
          available: estimate.quota || 0,
        };
      }
    } catch {
      // Fallback: estimate based on data
    }
    
    return null;
  }
}

/**
 * Main storage manager that handles persistence operations.
 */
export class AnalyticsStorageManager {
  private adapter: StorageAdapter;
  private config: StorageConfig;
  private batchedSave: (item: { key: string; data: any }) => void;
  
  constructor(config: Partial<StorageConfig> = {}) {
    this.config = { ...DEFAULT_STORAGE_CONFIG, ...config };
    this.adapter = this.selectAdapter();
    
    // Create batched save function
    this.batchedSave = batch(
      (items: { key: string; data: any }[]) => {
        items.forEach(({ key, data }) => {
          this.adapter.save(key, data).catch(console.error);
        });
      },
      this.config.batchSize,
      5000 // Flush every 5 seconds
    );
  }
  
  private selectAdapter(): StorageAdapter {
    const indexedDB = new IndexedDBAdapter();
    const localStorage = new LocalStorageAdapter();
    
    switch (this.config.preferredStorage) {
      case 'indexedDB':
        return indexedDB.isAvailable() ? indexedDB : localStorage;
      case 'localStorage':
        return localStorage.isAvailable() ? localStorage : indexedDB;
      case 'auto':
      default:
        // Prefer IndexedDB for larger storage capacity
        return indexedDB.isAvailable() ? indexedDB : localStorage;
    }
  }
  
  /**
   * Save analytics session data.
   * @param sessionId - Session identifier
   * @param data - Analytics data to save
   */
  async saveSession(sessionId: string, data: AnalyticsData): Promise<void> {
    const key = `session_${sessionId}`;
    
    // Use batched save for performance
    this.batchedSave({ key, data });
    
    // Also save session metadata for quick access
    await this.saveSessionMetadata(sessionId, {
      sessionId,
      startTime: data.startTime,
      endTime: data.endTime,
      totalDuration: data.totalDuration,
      pdfFileName: data.pdfFileName,
      totalPages: data.totalPages,
      interactionCount: data.interactions.length,
      pageViewCount: data.pageViews.length,
    });
  }
  
  /**
   * Load analytics session data.
   * @param sessionId - Session identifier
   * @returns Analytics data or null if not found
   */
  async loadSession(sessionId: string): Promise<AnalyticsData | null> {
    const key = `session_${sessionId}`;
    return await this.adapter.load(key);
  }
  
  /**
   * Save session metadata for quick listing.
   * @param sessionId - Session identifier
   * @param metadata - Session metadata
   */
  private async saveSessionMetadata(sessionId: string, metadata: any): Promise<void> {
    const key = `metadata_${sessionId}`;
    await this.adapter.save(key, metadata);
  }
  
  /**
   * Get list of all stored sessions with metadata.
   * @returns Array of session metadata
   */
  async getSessionList(): Promise<any[]> {
    const keys = await this.adapter.listKeys();
    const metadataKeys = keys.filter(key => key.startsWith('metadata_'));
    
    const sessions = await Promise.all(
      metadataKeys.map(async (key) => {
        try {
          return await this.adapter.load(key);
        } catch {
          return null;
        }
      })
    );
    
    return sessions.filter(Boolean);
  }
  
  /**
   * Clean up old analytics data based on configuration.
   */
  async cleanup(): Promise<void> {
    const endTiming = performanceMonitor.startTiming('storage_cleanup');
    
    try {
      const sessions = await this.getSessionList();
      const now = Date.now();
      
      // Sort sessions by start time (oldest first)
      sessions.sort((a, b) => a.startTime - b.startTime);
      
      const sessionsToRemove: string[] = [];
      
      // Remove sessions older than maxDataAge
      for (const session of sessions) {
        if (now - session.startTime > this.config.maxDataAge) {
          sessionsToRemove.push(session.sessionId);
        }
      }
      
      // Remove excess sessions (keep only maxSessions newest)
      if (sessions.length > this.config.maxSessions) {
        const excess = sessions.length - this.config.maxSessions;
        for (let i = 0; i < excess; i++) {
          sessionsToRemove.push(sessions[i].sessionId);
        }
      }
      
      // Remove sessions and metadata
      for (const sessionId of sessionsToRemove) {
        await this.adapter.remove(`session_${sessionId}`);
        await this.adapter.remove(`metadata_${sessionId}`);
      }
      
      console.debug(`Cleaned up ${sessionsToRemove.length} old analytics sessions`);
    } finally {
      endTiming();
    }
  }
  
  /**
   * Export all analytics data for backup or migration.
   * @returns All stored analytics data
   */
  async exportAllData(): Promise<{ sessions: AnalyticsData[]; metadata: any[] }> {
    const sessionList = await this.getSessionList();
    const sessions = await Promise.all(
      sessionList.map(meta => this.loadSession(meta.sessionId))
    );
    
    return {
      sessions: sessions.filter(Boolean) as AnalyticsData[],
      metadata: sessionList,
    };
  }
  
  /**
   * Import analytics data from backup.
   * @param data - Exported data to import
   */
  async importData(data: { sessions: AnalyticsData[]; metadata: any[] }): Promise<void> {
    for (const session of data.sessions) {
      if (session && session.sessionId) {
        await this.saveSession(session.sessionId, session);
      }
    }
  }
  
  /**
   * Get storage usage statistics.
   * @returns Storage usage information
   */
  async getStorageInfo(): Promise<{
    adapter: string;
    usage: { used: number; available: number } | null;
    sessionCount: number;
  }> {
    const usage = await this.adapter.getUsage();
    const sessions = await this.getSessionList();
    
    return {
      adapter: this.adapter.constructor.name,
      usage,
      sessionCount: sessions.length,
    };
  }
  
  /**
   * Clear all analytics data.
   */
  async clearAll(): Promise<void> {
    await this.adapter.clear();
    console.debug('Cleared all analytics data');
  }
}

/**
 * Global analytics storage manager instance.
 */
export const analyticsStorage = new AnalyticsStorageManager();

export default analyticsStorage;