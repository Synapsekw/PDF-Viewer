/**
 * Hybrid Repository Manager for dual-mode operation
 * Manages switching between local and cloud repositories seamlessly
 */

import { SupabaseClientManager } from '../supabase/client';
import { 
  IPDFLibraryRepository, 
  IShareRepository, 
  IAnalyticsRepository, 
  IUserSettingsRepository,
  RepositoryMode,
  RepositoryStatus,
  SyncOptions,
  SyncConflict
} from './interfaces';

// Local repository imports
import { localLibraryRepo } from '../../features/library/localRepo';
import { localShareRepo } from '../../features/share/shareRepo.local';
import { analyticsStorage } from '../../features/analytics/persistence/storage';

// Supabase repository imports
import { 
  SupabasePDFLibraryRepository, 
  SupabaseShareRepository, 
  SupabaseAnalyticsRepository, 
  SupabaseUserSettingsRepository 
} from './supabase';

// Local adapters to match interfaces
import { LocalLibraryAdapter, LocalShareAdapter, LocalAnalyticsAdapter, LocalUserSettingsAdapter } from './local';

export interface HybridRepositoryManagerOptions {
  /** Default repository mode */
  defaultMode: RepositoryMode;
  /** Enable automatic fallback to local if cloud fails */
  enableFallback: boolean;
  /** Enable automatic synchronization */
  enableAutoSync: boolean;
  /** Sync interval in milliseconds */
  syncInterval?: number;
}

export class HybridRepositoryManager {
  private currentMode: RepositoryMode;
  private options: HybridRepositoryManagerOptions;
  private syncInterval?: NodeJS.Timeout;

  // Repository instances
  private localLibrary: IPDFLibraryRepository;
  private cloudLibrary: IPDFLibraryRepository | null = null;
  private localShare: IShareRepository;
  private cloudShare: IShareRepository | null = null;
  private localAnalytics: IAnalyticsRepository;
  private cloudAnalytics: IAnalyticsRepository | null = null;
  private localSettings: IUserSettingsRepository;
  private cloudSettings: IUserSettingsRepository | null = null;

  constructor(options: Partial<HybridRepositoryManagerOptions> = {}) {
    this.options = {
      defaultMode: 'local',
      enableFallback: true,
      enableAutoSync: false,
      syncInterval: 5 * 60 * 1000, // 5 minutes
      ...options
    };

    this.currentMode = this.options.defaultMode;

    // Initialize local repositories
    this.localLibrary = new LocalLibraryAdapter();
    this.localShare = new LocalShareAdapter();
    this.localAnalytics = new LocalAnalyticsAdapter();
    this.localSettings = new LocalUserSettingsAdapter();

    // Initialize cloud repositories if Supabase is available
    this.initializeCloudRepositories();

    // Setup auto-sync if enabled
    if (this.options.enableAutoSync) {
      this.startAutoSync();
    }
  }

  private initializeCloudRepositories(): void {
    const supabaseClient = SupabaseClientManager.getClient();
    if (supabaseClient) {
      this.cloudLibrary = new SupabasePDFLibraryRepository(supabaseClient);
      this.cloudShare = new SupabaseShareRepository(supabaseClient);
      this.cloudAnalytics = new SupabaseAnalyticsRepository(supabaseClient);
      this.cloudSettings = new SupabaseUserSettingsRepository(supabaseClient);
      console.log('Cloud repositories initialized successfully');
    } else {
      console.log('Supabase client not available, cloud repositories not initialized');
    }
  }

  /**
   * Reinitialize cloud repositories (call after Supabase initialization)
   */
  reinitializeCloudRepositories(): void {
    this.initializeCloudRepositories();
  }

  private startAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      try {
        await this.syncAll();
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    }, this.options.syncInterval);
  }

  private stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }
  }

  // ==================== Mode Management ====================

  async setMode(mode: RepositoryMode): Promise<void> {
    if (mode === 'cloud' || mode === 'hybrid') {
      if (!this.cloudLibrary) {
        throw new Error('Cloud repositories not available. Please initialize Supabase first.');
      }
      
      // Test cloud connectivity
      const isCloudAvailable = await this.cloudLibrary.isAvailable();
      if (!isCloudAvailable) {
        if (this.options.enableFallback) {
          console.warn('Cloud repositories not available, falling back to local mode');
          this.currentMode = 'local';
          return;
        } else {
          throw new Error('Cloud repositories not available');
        }
      }
    }

    this.currentMode = mode;
    console.log(`Repository mode changed to: ${mode}`);
  }

  getMode(): RepositoryMode {
    return this.currentMode;
  }

  async getStatus(): Promise<RepositoryStatus> {
    const localHealth = await this.localLibrary.getHealth();
    const cloudHealth = this.cloudLibrary ? await this.cloudLibrary.getHealth() : {
      isHealthy: false,
      isConnected: false,
      errors: ['Cloud repositories not initialized']
    };

    return {
      mode: this.currentMode,
      local: localHealth,
      cloud: cloudHealth,
      syncStatus: this.options.enableAutoSync ? {
        isEnabled: true,
        lastSync: undefined, // TODO: Track last sync time
        pendingOperations: 0, // TODO: Track pending operations
        conflicts: 0 // TODO: Track conflicts
      } : undefined
    };
  }

  // ==================== Repository Access ====================

  getLibraryRepository(): IPDFLibraryRepository {
    switch (this.currentMode) {
      case 'local':
        return this.localLibrary;
      case 'cloud':
        return this.cloudLibrary || this.localLibrary;
      case 'hybrid':
        return new HybridLibraryRepository(this.localLibrary, this.cloudLibrary);
      default:
        return this.localLibrary;
    }
  }

  getShareRepository(): IShareRepository {
    switch (this.currentMode) {
      case 'local':
        return this.localShare;
      case 'cloud':
        return this.cloudShare || this.localShare;
      case 'hybrid':
        return new HybridShareRepository(this.localShare, this.cloudShare);
      default:
        return this.localShare;
    }
  }

  getAnalyticsRepository(): IAnalyticsRepository {
    switch (this.currentMode) {
      case 'local':
        return this.localAnalytics;
      case 'cloud':
        return this.cloudAnalytics || this.localAnalytics;
      case 'hybrid':
        return new HybridAnalyticsRepository(this.localAnalytics, this.cloudAnalytics);
      default:
        return this.localAnalytics;
    }
  }

  getUserSettingsRepository(): IUserSettingsRepository {
    switch (this.currentMode) {
      case 'local':
        return this.localSettings;
      case 'cloud':
        return this.cloudSettings || this.localSettings;
      case 'hybrid':
        return new HybridUserSettingsRepository(this.localSettings, this.cloudSettings);
      default:
        return this.localSettings;
    }
  }

  // ==================== Synchronization ====================

  async syncAll(options: SyncOptions = {}): Promise<void> {
    if (!this.cloudLibrary) {
      throw new Error('Cloud repositories not available for sync');
    }

    const operations = [];

    if (!options.exclude?.includes('library')) {
      operations.push(this.syncLibrary(options));
    }
    if (!options.exclude?.includes('share')) {
      operations.push(this.syncShares(options));
    }
    if (!options.exclude?.includes('analytics')) {
      operations.push(this.syncAnalytics(options));
    }
    if (!options.exclude?.includes('settings')) {
      operations.push(this.syncSettings(options));
    }

    await Promise.all(operations);
  }

  private async syncLibrary(options: SyncOptions): Promise<void> {
    // TODO: Implement library synchronization
    console.log('Library sync not yet implemented');
  }

  private async syncShares(options: SyncOptions): Promise<void> {
    // TODO: Implement share synchronization
    console.log('Share sync not yet implemented');
  }

  private async syncAnalytics(options: SyncOptions): Promise<void> {
    // TODO: Implement analytics synchronization
    console.log('Analytics sync not yet implemented');
  }

  private async syncSettings(options: SyncOptions): Promise<void> {
    // TODO: Implement settings synchronization
    console.log('Settings sync not yet implemented');
  }

  // ==================== Migration Support ====================

  async migrateToCloud(options: { includeBlobs: boolean } = { includeBlobs: true }): Promise<void> {
    if (!this.cloudLibrary) {
      throw new Error('Cloud repositories not available for migration');
    }

    console.log('Starting migration to cloud...');

    // TODO: Implement full migration logic
    console.log('Migration not yet implemented');
  }

  async migrateToLocal(): Promise<void> {
    console.log('Starting migration to local...');

    // TODO: Implement migration from cloud to local
    console.log('Migration not yet implemented');
  }

  // ==================== Cleanup ====================

  destroy(): void {
    this.stopAutoSync();
  }
}

// ==================== Hybrid Repository Implementations ====================

// These classes implement read-through, write-through caching patterns
// for hybrid mode operation

class HybridLibraryRepository implements IPDFLibraryRepository {
  constructor(
    private local: IPDFLibraryRepository,
    private cloud: IPDFLibraryRepository | null
  ) {}

  async add(file: File) {
    // Write to both local and cloud
    const result = await this.local.add(file);
    if (this.cloud) {
      try {
        await this.cloud.add(file);
      } catch (error) {
        console.warn('Failed to add to cloud:', error);
      }
    }
    return result;
  }

  async get(id: string) {
    // Try local first, then cloud
    let result = await this.local.get(id);
    if (!result && this.cloud) {
      result = await this.cloud.get(id);
      // Cache in local if found in cloud
      if (result) {
        try {
          await this.local.add(result.blob as File);
        } catch (error) {
          console.warn('Failed to cache from cloud:', error);
        }
      }
    }
    return result;
  }

  async list() {
    // Merge results from both sources
    const localResults = await this.local.list();
    if (!this.cloud) return localResults;
    
    try {
      const cloudResults = await this.cloud.list();
      // TODO: Implement proper merging logic
      return localResults;
    } catch (error) {
      console.warn('Failed to list from cloud:', error);
      return localResults;
    }
  }

  async delete(id: string) {
    // Delete from both
    await this.local.delete(id);
    if (this.cloud) {
      try {
        await this.cloud.delete(id);
      } catch (error) {
        console.warn('Failed to delete from cloud:', error);
      }
    }
  }

  async clear() {
    await this.local.clear();
    if (this.cloud) {
      try {
        await this.cloud.clear();
      } catch (error) {
        console.warn('Failed to clear cloud:', error);
      }
    }
  }

  async isAvailable() {
    return await this.local.isAvailable();
  }

  async getHealth() {
    return await this.local.getHealth();
  }
}

class HybridShareRepository implements IShareRepository {
  constructor(
    private local: IShareRepository,
    private cloud: IShareRepository | null
  ) {}

  async createShare(docId: string, options?) {
    const result = await this.local.createShare(docId, options);
    if (this.cloud) {
      try {
        await this.cloud.createShare(docId, options);
      } catch (error) {
        console.warn('Failed to create share in cloud:', error);
      }
    }
    return result;
  }

  async resolveToken(token: string) {
    let result = await this.local.resolveToken(token);
    if (!result && this.cloud) {
      result = await this.cloud.resolveToken(token);
    }
    return result;
  }

  async listShares() {
    return await this.local.listShares();
  }

  async revokeShare(token: string) {
    await this.local.revokeShare(token);
    if (this.cloud) {
      try {
        await this.cloud.revokeShare(token);
      } catch (error) {
        console.warn('Failed to revoke share in cloud:', error);
      }
    }
  }

  async getShareStats(token: string) {
    return await this.local.getShareStats?.(token) || null;
  }

  async isAvailable() {
    return await this.local.isAvailable();
  }

  async getHealth() {
    return await this.local.getHealth();
  }
}

class HybridAnalyticsRepository implements IAnalyticsRepository {
  constructor(
    private local: IAnalyticsRepository,
    private cloud: IAnalyticsRepository | null
  ) {}

  async saveSession(sessionId: string, data: any) {
    await this.local.saveSession(sessionId, data);
    if (this.cloud) {
      try {
        await this.cloud.saveSession(sessionId, data);
      } catch (error) {
        console.warn('Failed to save session to cloud:', error);
      }
    }
  }

  async loadSession(sessionId: string) {
    return await this.local.loadSession(sessionId);
  }

  async listSessions() {
    return await this.local.listSessions();
  }

  async deleteSession(sessionId: string) {
    await this.local.deleteSession(sessionId);
    if (this.cloud) {
      try {
        await this.cloud.deleteSession(sessionId);
      } catch (error) {
        console.warn('Failed to delete session from cloud:', error);
      }
    }
  }

  async exportAllData() {
    return await this.local.exportAllData();
  }

  async importData(data: any) {
    await this.local.importData(data);
    if (this.cloud) {
      try {
        await this.cloud.importData(data);
      } catch (error) {
        console.warn('Failed to import data to cloud:', error);
      }
    }
  }

  async clear() {
    await this.local.clear();
    if (this.cloud) {
      try {
        await this.cloud.clear();
      } catch (error) {
        console.warn('Failed to clear cloud analytics:', error);
      }
    }
  }

  async isAvailable() {
    return await this.local.isAvailable();
  }

  async getHealth() {
    return await this.local.getHealth();
  }
}

class HybridUserSettingsRepository implements IUserSettingsRepository {
  constructor(
    private local: IUserSettingsRepository,
    private cloud: IUserSettingsRepository | null
  ) {}

  async get<T>(key: string): Promise<T | null> {
    // Try cloud first for settings, then local
    if (this.cloud) {
      try {
        const result = await this.cloud.get<T>(key);
        if (result !== null) return result;
      } catch (error) {
        console.warn('Failed to get setting from cloud:', error);
      }
    }
    return await this.local.get<T>(key);
  }

  async set<T>(key: string, value: T) {
    await this.local.set(key, value);
    if (this.cloud) {
      try {
        await this.cloud.set(key, value);
      } catch (error) {
        console.warn('Failed to set setting in cloud:', error);
      }
    }
  }

  async getAll() {
    return await this.local.getAll();
  }

  async updateSettings(settings: Record<string, any>) {
    await this.local.updateSettings(settings);
    if (this.cloud) {
      try {
        await this.cloud.updateSettings(settings);
      } catch (error) {
        console.warn('Failed to update settings in cloud:', error);
      }
    }
  }

  async delete(key: string) {
    await this.local.delete(key);
    if (this.cloud) {
      try {
        await this.cloud.delete(key);
      } catch (error) {
        console.warn('Failed to delete setting from cloud:', error);
      }
    }
  }

  async clear() {
    await this.local.clear();
    if (this.cloud) {
      try {
        await this.cloud.clear();
      } catch (error) {
        console.warn('Failed to clear cloud settings:', error);
      }
    }
  }

  async isAvailable() {
    return await this.local.isAvailable();
  }

  async getHealth() {
    return await this.local.getHealth();
  }
}

// Global instance
export const hybridRepositoryManager = new HybridRepositoryManager();
