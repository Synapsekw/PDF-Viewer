/**
 * Supabase client initialization and management
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfigManager } from './config';
import { SupabaseHealth } from './types';
import { Database } from './database.types';

export class SupabaseClientManager {
  private static client: SupabaseClient<Database> | null = null;
  private static healthStatus: SupabaseHealth = {
    isConnected: false,
    latency: null,
    lastCheck: new Date().toISOString(),
    errors: []
  };

  /**
   * Get or initialize Supabase client
   */
  static getClient(): SupabaseClient<Database> | null {
    const config = SupabaseConfigManager.getConfig();
    
    if (!config.enabled || !config.url || !config.anonKey) {
      console.log('Supabase client not available - configuration incomplete');
      return null;
    }

    if (!this.client) {
      try {
        this.client = createClient<Database>(config.url, config.anonKey, {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            storageKey: 'spectra-ai-auth', // Unique storage key to prevent conflicts
            flowType: 'pkce'
          },
          realtime: {
            params: {
              eventsPerSecond: 10
            }
          },
          global: {
            headers: {
              'X-Client-Info': 'spectra-ai'
            }
          }
        });

        console.log('Supabase client initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Supabase client:', error);
        this.healthStatus.errors.push(`Client initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return null;
      }
    }

    return this.client;
  }

  /**
   * Check Supabase connection health
   */
  static async checkHealth(): Promise<SupabaseHealth> {
    const startTime = Date.now();
    
    try {
      const client = this.getClient();
      if (!client) {
        this.healthStatus = {
          isConnected: false,
          latency: null,
          lastCheck: new Date().toISOString(),
          errors: ['Client not available']
        };
        return this.healthStatus;
      }

      // Simple connectivity test
      const { data, error } = await client
        .from('profiles')
        .select('count')
        .limit(1);

      const latency = Date.now() - startTime;

      if (error) {
        this.healthStatus = {
          isConnected: false,
          latency,
          lastCheck: new Date().toISOString(),
          errors: [error instanceof Error ? error.message : 'Unknown error']
        };
      } else {
        this.healthStatus = {
          isConnected: true,
          latency,
          lastCheck: new Date().toISOString(),
          errors: []
        };
      }

    } catch (error) {
      this.healthStatus = {
        isConnected: false,
        latency: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }

    console.log('Supabase health check completed:', this.healthStatus);
    return this.healthStatus;
  }

  /**
   * Get current health status
   */
  static getHealthStatus(): SupabaseHealth {
    return { ...this.healthStatus };
  }

  /**
   * Reset client (force re-initialization)
   */
  static resetClient(): void {
    this.client = null;
    this.healthStatus = {
      isConnected: false,
      latency: null,
      lastCheck: new Date().toISOString(),
      errors: []
    };
    console.log('Supabase client reset');
  }

  /**
   * Test authentication
   */
  static async testAuth(): Promise<{ success: boolean; user: any | null; error: string | null }> {
    try {
      const client = this.getClient();
      if (!client) {
        return { success: false, user: null, error: 'Client not available' };
      }

      const { data, error } = await client.auth.getUser();
      
      return {
        success: !error,
        user: data.user,
        error: error?.message || null
      };
    } catch (error) {
      return {
        success: false,
        user: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test storage access
   */
  static async testStorage(): Promise<{ success: boolean; error: string | null }> {
    try {
      const client = this.getClient();
      if (!client) {
        return { success: false, error: 'Client not available' };
      }

      // Try to list buckets (this will fail gracefully if no access)
      const { data, error } = await client.storage.listBuckets();
      
      return {
        success: !error,
        error: error?.message || null
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Initialize with automatic configuration from your project
   */
  static initializeWithProject(): void {
    try {
      // Use your project credentials
      const projectUrl = 'https://ajgtdraknmayclhawwlq.supabase.co';
      const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqZ3RkcmFrbm1heWNsaGF3d2xxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NjMwNzcsImV4cCI6MjA3MDMzOTA3N30.l9lpihHadKs_rtXaWNpr0jQiABrKdGt7-2757mf1GD0';

      console.log('🔧 Initializing Supabase with project credentials...');
      SupabaseConfigManager.initializeWithCredentials(projectUrl, anonKey);
      
      // Reset client to force re-initialization with new config
      this.resetClient();
      
      // Force creation of new client
      const testClient = this.getClient();
      if (testClient) {
        console.log('✅ Supabase client successfully initialized');
      } else {
        console.log('❌ Failed to initialize Supabase client');
      }
      
      console.log('✅ Supabase initialized with project credentials');
    } catch (error) {
      console.error('❌ Failed to initialize Supabase with project credentials:', error);
    }
  }
}
