/**
 * Repository Manager - Supabase-only configuration
 */

import { SupabaseClientManager } from '../supabase/client';
import { SupabasePDFLibraryRepository } from './supabase/LibraryRepository';
import { SupabaseShareRepository } from './supabase/ShareRepository';
import { SupabaseAnalyticsRepository } from './supabase/AnalyticsRepository';
import { shareService } from '../../features/share/shareService';

export type RepositoryMode = 'supabase';

export interface RepositoryConfig {
  mode: RepositoryMode;
  enableAuth: boolean;
  enableRealtime: boolean;
  enableOfflineSync: boolean;
}

class RepositoryManager {
  private config: RepositoryConfig = {
    mode: 'supabase',
    enableAuth: true,
    enableRealtime: true,
    enableOfflineSync: true
  };

  private libraryRepo: SupabasePDFLibraryRepository | null = null;
  private shareRepo: SupabaseShareRepository | null = null;
  private analyticsRepo: SupabaseAnalyticsRepository | null = null;

  /**
   * Initialize repositories for Supabase mode
   */
  initialize(): void {
    const supabase = SupabaseClientManager.getClient();
    
    console.log('🔧 Initializing Repository Manager for Supabase:', {
      mode: this.config.mode,
      supabaseAvailable: !!supabase,
      config: this.config
    });

    if (!supabase) {
      throw new Error('Supabase client not available - please check your configuration');
    }

    console.log('📡 Using Supabase repositories');
    this.libraryRepo = new SupabasePDFLibraryRepository(supabase);
    this.shareRepo = new SupabaseShareRepository(supabase);
    this.analyticsRepo = new SupabaseAnalyticsRepository(supabase);
    
    // Configure share service for Supabase mode
    shareService.setMode('supabase');
  }

  /**
   * Configure repository settings
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
  getLibraryRepository(): SupabasePDFLibraryRepository {
    if (!this.libraryRepo) {
      this.initialize();
    }
    return this.libraryRepo!;
  }

  /**
   * Get share repository
   */
  getShareRepository(): SupabaseShareRepository {
    if (!this.shareRepo) {
      this.initialize();
    }
    return this.shareRepo!;
  }

  /**
   * Get analytics repository
   */
  getAnalyticsRepository(): SupabaseAnalyticsRepository {
    if (!this.analyticsRepo) {
      this.initialize();
    }
    return this.analyticsRepo!;
  }

  /**
   * Check Supabase connection health
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
        errors: [`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Get current status information
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
        share: this.shareRepo?.constructor.name || 'Not initialized',
        analytics: this.analyticsRepo?.constructor.name || 'Not initialized'
      }
    };
  }
}

// Export singleton instance
export const repositoryManager = new RepositoryManager();

// Auto-load configuration on import
repositoryManager.loadConfiguration();
