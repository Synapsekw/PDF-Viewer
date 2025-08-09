/**
 * Local repository adapters that implement the repository interfaces
 * These wrap the existing local implementations to match the new interfaces
 */

import { LibraryPDF, LibraryPDFMetadata } from '../../../features/library/types';
import { ShareMeta } from '../../../features/share/types';
import { AnalyticsData } from '../../../contexts/AnalyticsContext';
import { 
  IPDFLibraryRepository, 
  IShareRepository, 
  IAnalyticsRepository, 
  IUserSettingsRepository,
  ShareOptions,
  ShareStats,
  AnalyticsExportData,
  RepositoryHealth 
} from '../interfaces';

// Import existing local implementations
import { localLibraryRepo } from '../../../features/library/localRepo';
import { localShareRepo } from '../../../features/share/shareRepo.local';
import { analyticsStorage } from '../../../features/analytics/persistence/storage';

export class LocalLibraryAdapter implements IPDFLibraryRepository {
  async add(file: File): Promise<LibraryPDF> {
    return await localLibraryRepo.add(file);
  }

  async get(id: string): Promise<LibraryPDF | null> {
    return await localLibraryRepo.get(id);
  }

  async list(): Promise<LibraryPDFMetadata[]> {
    return await localLibraryRepo.list();
  }

  async delete(id: string): Promise<void> {
    return await localLibraryRepo.delete(id);
  }

  async clear(): Promise<void> {
    return await localLibraryRepo.clear();
  }

  async isAvailable(): Promise<boolean> {
    return typeof indexedDB !== 'undefined';
  }

  async getHealth(): Promise<RepositoryHealth> {
    const startTime = Date.now();
    const errors: string[] = [];
    let isHealthy = true;
    let isConnected = false;

    try {
      if (typeof indexedDB === 'undefined') {
        errors.push('IndexedDB not available');
        isHealthy = false;
      } else {
        // Test database connectivity by attempting to list
        await localLibraryRepo.list();
        isConnected = true;
      }
    } catch (error) {
      errors.push(`IndexedDB error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

export class LocalShareAdapter implements IShareRepository {
  async createShare(docId: string, options?: ShareOptions): Promise<{ token: string; meta: ShareMeta }> {
    // Local implementation doesn't support options yet, just pass docId
    return await localShareRepo.createShare(docId);
  }

  async resolveToken(token: string): Promise<{ docId: string; meta: ShareMeta } | null> {
    return await localShareRepo.resolveToken(token);
  }

  async listShares(): Promise<Array<{ token: string; meta: ShareMeta }>> {
    return await localShareRepo.listShares();
  }

  async revokeShare(token: string): Promise<void> {
    return await localShareRepo.revokeShare(token);
  }

  async getShareStats(token: string): Promise<ShareStats | null> {
    // Local implementation doesn't have stats, return basic info
    const resolved = await localShareRepo.resolveToken(token);
    if (!resolved) return null;

    return {
      accessCount: 0, // Not tracked locally
      createdAt: resolved.meta.createdAt,
      isActive: true // All local shares are active
    };
  }

  async isAvailable(): Promise<boolean> {
    return typeof indexedDB !== 'undefined';
  }

  async getHealth(): Promise<RepositoryHealth> {
    const startTime = Date.now();
    const errors: string[] = [];
    let isHealthy = true;
    let isConnected = false;

    try {
      if (typeof indexedDB === 'undefined') {
        errors.push('IndexedDB not available');
        isHealthy = false;
      } else {
        // Test database connectivity
        await localShareRepo.listShares();
        isConnected = true;
      }
    } catch (error) {
      errors.push(`IndexedDB error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

export class LocalAnalyticsAdapter implements IAnalyticsRepository {
  async saveSession(sessionId: string, data: AnalyticsData): Promise<void> {
    return await analyticsStorage.saveSession(sessionId, data);
  }

  async loadSession(sessionId: string): Promise<AnalyticsData | null> {
    return await analyticsStorage.loadSession(sessionId);
  }

  async listSessions(): Promise<string[]> {
    const allData = await analyticsStorage.exportAllData();
    return allData.sessions?.map(s => s.sessionId) || [];
  }

  async deleteSession(sessionId: string): Promise<void> {
    return await analyticsStorage.clearSession(sessionId);
  }

  async exportAllData(): Promise<AnalyticsExportData> {
    const data = await analyticsStorage.exportAllData();
    
    // Transform to match interface format
    const sessions = (data.sessions || []).map(session => ({
      sessionId: session.sessionId || 'unknown',
      documentId: session.documentId || '',
      startTime: session.startTime || Date.now(),
      endTime: session.endTime,
      interactions: session.interactions || [],
      pageViews: session.pageViews || [],
      duration: session.duration || 0
    }));

    const events = (data.metadata || []).map(meta => ({
      type: 'session_metadata',
      timestamp: meta.timestamp || Date.now(),
      data: meta
    }));

    return { sessions, events };
  }

  async importData(data: AnalyticsExportData): Promise<void> {
    // Import sessions one by one
    for (const session of data.sessions) {
      const analyticsData: AnalyticsData = {
        documentId: session.documentId,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration,
        interactions: session.interactions,
        pageViews: session.pageViews
      };
      await this.saveSession(session.sessionId, analyticsData);
    }
  }

  async clear(): Promise<void> {
    return await analyticsStorage.clearAllData();
  }

  async isAvailable(): Promise<boolean> {
    return analyticsStorage.isStorageAvailable();
  }

  async getHealth(): Promise<RepositoryHealth> {
    const startTime = Date.now();
    const errors: string[] = [];
    let isHealthy = true;
    let isConnected = false;

    try {
      const isAvailable = await analyticsStorage.isStorageAvailable();
      if (!isAvailable) {
        errors.push('Analytics storage not available');
        isHealthy = false;
      } else {
        // Test storage by attempting to export data
        await analyticsStorage.exportAllData();
        isConnected = true;
      }
    } catch (error) {
      errors.push(`Storage error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

export class LocalUserSettingsAdapter implements IUserSettingsRepository {
  private readonly prefix = 'pdf_settings_';

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = localStorage.getItem(this.prefix + key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Failed to get setting from localStorage:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch (error) {
      throw new Error(`Failed to set setting: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAll(): Promise<Record<string, any>> {
    const settings: Record<string, any> = {};
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.prefix)) {
          const settingKey = key.slice(this.prefix.length);
          const value = localStorage.getItem(key);
          if (value) {
            try {
              settings[settingKey] = JSON.parse(value);
            } catch {
              settings[settingKey] = value;
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to get all settings:', error);
    }

    return settings;
  }

  async updateSettings(settings: Record<string, any>): Promise<void> {
    for (const [key, value] of Object.entries(settings)) {
      await this.set(key, value);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      throw new Error(`Failed to delete setting: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async clear(): Promise<void> {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      throw new Error(`Failed to clear settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
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
      // Test localStorage availability
      const test = 'health_test';
      localStorage.setItem(test, test);
      const retrieved = localStorage.getItem(test);
      localStorage.removeItem(test);
      
      if (retrieved === test) {
        isConnected = true;
      } else {
        errors.push('localStorage test failed');
        isHealthy = false;
      }
    } catch (error) {
      errors.push(`localStorage error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
