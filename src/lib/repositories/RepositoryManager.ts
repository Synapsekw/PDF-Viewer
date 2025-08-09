/**
 * Repository Manager - Central configuration for switching between local and Supabase
 */

import { SupabaseClientManager } from '../supabase/client';
import { localLibraryRepo } from '../../features/library/localRepo';
import { SupabasePDFLibraryRepository } from './supabase/LibraryRepository';
import { SupabaseShareRepository } from './supabase/ShareRepository';
import { SupabaseAnalyticsRepository } from './supabase/AnalyticsRepository';
import { shareService } from '../../features/share/shareService';

export type RepositoryMode = 'local' | 'supabase' | 'auto';

export interface RepositoryConfig {
  mode: RepositoryMode;
  enableAuth: boolean;
  enableRealtime: boolean;
  enableOfflineSync: boolean;
}

class RepositoryManager {
  private config: RepositoryConfig = {
    mode: 'auto',
    enableAuth: true,
    enableRealtime: true,
    enableOfflineSync: true
  };

  private libraryRepo: any = null;
  private shareRepo: any = null;
  private analyticsRepo: any = null;

  /**
   * Initialize repositories based on current configuration
   */
  initialize(): void {
    const supabase = SupabaseClientManager.getClient();
    
    console.log('🔧 Initializing Repository Manager:', {
      mode: this.config.mode,
      supabaseAvailable: !!supabase,
      config: this.config
    });

    // Initialize repositories based on mode
    if (this.config.mode === 'supabase' && !supabase) {
      throw new Error('Supabase mode selected but client not available');
    }

    const useSupabase = supabase && (this.config.mode === 'supabase' || this.config.mode === 'auto');

    if (useSupabase) {
      console.log('📡 Using Supabase repositories');
      this.libraryRepo = new SupabasePDFLibraryRepository(supabase!);
      this.shareRepo = new SupabaseShareRepository(supabase!);
      this.analyticsRepo = new SupabaseAnalyticsRepository(supabase!);
      
      // Configure share service for Supabase mode
      shareService.setMode('supabase');
    } else {
      console.log('💾 Using local repositories');
      this.libraryRepo = localLibraryRepo;
      // shareRepo and analyticsRepo will use local implementations
      
      // Configure share service for local mode
      shareService.setMode('local');
    }
  }

  /**
   * Configure repository mode
   */
  configure(config: Partial<RepositoryConfig>): void {
    this.config = { ...this.config, ...config };
    this.initialize();
    
    // Store configuration in localStorage for persistence
    localStorage.setItem('repository_config', JSON.stringify(this.config));
    
    console.log('⚙️ Repository configuration updated:', this.config);
  }

  /**
   * Load configuration from localStorage
   */
  loadConfiguration(): void {
    try {
      const stored = localStorage.getItem('repository_config');
      if (stored) {
        const config = JSON.parse(stored);
        this.config = { ...this.config, ...config };
      }
    } catch (error) {
      console.warn('Failed to load repository configuration:', error);
    }
  }

  /**
   * Get current configuration
   */
  getConfiguration(): RepositoryConfig {
    return { ...this.config };
  }

  /**
   * Get library repository
   */
  getLibraryRepository() {
    if (!this.libraryRepo) {
      this.initialize();
    }
    return this.libraryRepo;
  }

  /**
   * Get share repository
   */
  getShareRepository() {
    if (!this.shareRepo) {
      this.initialize();
    }
    return this.shareRepo;
  }

  /**
   * Get analytics repository
   */
  getAnalyticsRepository() {
    if (!this.analyticsRepo) {
      this.initialize();
    }
    return this.analyticsRepo;
  }

  /**
   * Check if Supabase is available and healthy
   */
  async checkSupabaseHealth(): Promise<{
    available: boolean;
    authenticated: boolean;
    latency?: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    const startTime = Date.now();
    
    const supabase = SupabaseClientManager.getClient();
    if (!supabase) {
      return {
        available: false,
        authenticated: false,
        errors: ['Supabase client not available']
      };
    }

    try {
      // Test basic connectivity
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      const latency = Date.now() - startTime;

      if (error) {
        errors.push(`Database error: ${error.message}`);
      }

      // Check authentication
      const { data: userData, error: authError } = await supabase.auth.getUser();
      const authenticated = !authError && !!userData.user;

      if (authError) {
        errors.push(`Auth error: ${authError.message}`);
      }

      return {
        available: !error,
        authenticated,
        latency,
        errors
      };

    } catch (error) {
      return {
        available: false,
        authenticated: false,
        latency: Date.now() - startTime,
        errors: [`Connection failed: ${error.message}`]
      };
    }
  }

  /**
   * Switch to Supabase mode (full migration)
   */
  async migrateToSupabase(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      // Check if Supabase is healthy
      const health = await this.checkSupabaseHealth();
      if (!health.available) {
        errors.push('Supabase not available');
        return { success: false, errors };
      }

      if (!health.authenticated) {
        errors.push('User not authenticated - please log in first');
        return { success: false, errors };
      }

      // Configure for full Supabase mode
      this.configure({
        mode: 'supabase',
        enableAuth: true,
        enableRealtime: true,
        enableOfflineSync: true
      });

      console.log('🚀 Successfully migrated to Supabase mode!');
      return { success: true, errors: [] };

    } catch (error) {
      errors.push(`Migration failed: ${error.message}`);
      return { success: false, errors };
    }
  }

  /**
   * Switch to local mode (rollback)
   */
  rollbackToLocal(): void {
    this.configure({
      mode: 'local',
      enableAuth: false,
      enableRealtime: false,
      enableOfflineSync: false
    });
    
    console.log('🔄 Rolled back to local mode');
  }

  /**
   * Get current mode information
   */
  getStatus(): {
    mode: RepositoryMode;
    supabaseAvailable: boolean;
    repositories: {
      library: string;
      share: string;
      analytics: string;
    };
  } {
    const supabase = SupabaseClientManager.getClient();
    
    return {
      mode: this.config.mode,
      supabaseAvailable: !!supabase,
      repositories: {
        library: this.libraryRepo?.constructor.name || 'Not initialized',
        share: shareService.isSupabaseAvailable() ? 'Supabase' : 'Local',
        analytics: this.analyticsRepo?.constructor.name || 'Not initialized'
      }
    };
  }
}

// Export singleton instance
export const repositoryManager = new RepositoryManager();

// Auto-load configuration on import
repositoryManager.loadConfiguration();
