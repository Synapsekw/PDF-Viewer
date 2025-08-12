/**
 * Supabase configuration management with environment switching
 */

import { SupabaseConfig, StorageMode, MigrationStatus } from './types';

export class SupabaseConfigManager {
  private static readonly CONFIG_KEY = 'supabase_config';
  private static readonly MIGRATION_STATUS_KEY = 'migration_status';
  
  private static defaultConfig: SupabaseConfig = {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    serviceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '',
    enabled: !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    mode: (import.meta.env.VITE_STORAGE_MODE as StorageMode) || 'local',
    features: {
      auth: import.meta.env.VITE_ENABLE_AUTH === 'true',
      storage: import.meta.env.VITE_ENABLE_STORAGE === 'true',
      realtime: import.meta.env.VITE_ENABLE_REALTIME === 'true',
      analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true'
    },
    fallbackToLocal: true
  };

  /**
   * Get current Supabase configuration
   */
  static getConfig(): SupabaseConfig {
    try {
      const stored = localStorage.getItem(this.CONFIG_KEY);
      if (stored) {
        const config = JSON.parse(stored);
        return { ...this.defaultConfig, ...config };
      }
    } catch (error) {
      console.warn('Failed to load Supabase config from localStorage:', error);
    }
    
    return { ...this.defaultConfig };
  }

  /**
   * Update Supabase configuration
   */
  static setConfig(config: Partial<SupabaseConfig>): void {
    try {
      const currentConfig = this.getConfig();
      const newConfig = { ...currentConfig, ...config };
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(newConfig));
      
      console.log('Supabase config updated:', {
        enabled: newConfig.enabled,
        mode: newConfig.mode,
        features: newConfig.features
      });
    } catch (error) {
      console.error('Failed to save Supabase config:', error);
      throw new Error('Configuration save failed');
    }
  }

  /**
   * Initialize Supabase with project credentials
   */
  static initializeWithCredentials(url: string, anonKey: string, serviceRoleKey?: string): void {
    const config: Partial<SupabaseConfig> = {
      url,
      anonKey,
      serviceRoleKey,
      enabled: true,
      mode: 'hybrid', // Start in hybrid mode for safety
      features: {
        auth: true,
        storage: false, // Enable gradually
        realtime: false,
        analytics: false
      }
    };

    this.setConfig(config);
    console.log('Supabase initialized with credentials');
  }

  /**
   * Set storage mode (local, supabase, hybrid)
   */
  static setStorageMode(mode: StorageMode): void {
    this.setConfig({ mode });
    console.log('Storage mode changed to:', mode);
  }

  /**
   * Enable/disable specific features
   */
  static setFeatureEnabled(feature: keyof SupabaseConfig['features'], enabled: boolean): void {
    const config = this.getConfig();
    config.features[feature] = enabled;
    this.setConfig(config);
    console.log(`Feature ${feature} ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if Supabase is properly configured
   */
  static isConfigured(): boolean {
    const config = this.getConfig();
    return config.enabled && !!config.url && !!config.anonKey;
  }

  /**
   * Get migration status
   */
  static getMigrationStatus(): MigrationStatus {
    try {
      const stored = localStorage.getItem(this.MIGRATION_STATUS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load migration status:', error);
    }

    return {
      isComplete: false,
      currentPhase: 'not_started',
      progress: 0,
      errors: [],
      lastSync: null
    };
  }

  /**
   * Update migration status
   */
  static setMigrationStatus(status: Partial<MigrationStatus>): void {
    try {
      const currentStatus = this.getMigrationStatus();
      const newStatus = { ...currentStatus, ...status };
      localStorage.setItem(this.MIGRATION_STATUS_KEY, JSON.stringify(newStatus));
    } catch (error) {
      console.error('Failed to save migration status:', error);
    }
  }

  /**
   * Reset configuration to defaults
   */
  static reset(): void {
    localStorage.removeItem(this.CONFIG_KEY);
    localStorage.removeItem(this.MIGRATION_STATUS_KEY);
    console.log('Supabase configuration reset to defaults');
  }

  /**
   * Get environment-specific configuration
   */
  static getEnvironmentConfig(): { isDev: boolean; isProduction: boolean; baseUrl: string } {
    const isDev = import.meta.env.DEV;
    const baseUrl = window.location.origin;
    
    return {
      isDev,
      isProduction: !isDev,
      baseUrl
    };
  }

  /**
   * Validate configuration
   */
  static validateConfig(config: Partial<SupabaseConfig>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.enabled) {
      if (!config.url) {
        errors.push('Supabase URL is required when enabled');
      } else if (!config.url.includes('supabase.co')) {
        errors.push('Invalid Supabase URL format');
      }

      if (!config.anonKey) {
        errors.push('Anonymous key is required when enabled');
      } else if (!config.anonKey.startsWith('eyJ')) {
        errors.push('Invalid anonymous key format');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
