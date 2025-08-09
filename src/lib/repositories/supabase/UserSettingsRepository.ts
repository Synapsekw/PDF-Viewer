/**
 * Supabase implementation of User Settings Repository
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { IUserSettingsRepository, RepositoryHealth } from '../interfaces';
import { Database, ProfileUpdate } from '../../supabase/database.types';

export class SupabaseUserSettingsRepository implements IUserSettingsRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  private async ensureProfile(): Promise<string> {
    const { data: userData } = await this.supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('User not authenticated');
    }

    // Check if profile exists
    const { data: profile, error: getError } = await this.supabase
      .from('profiles')
      .select('id')
      .eq('id', userData.user.id)
      .single();

    if (getError && getError.code === 'PGRST116') {
      // Profile doesn't exist, create it
      const { error: insertError } = await this.supabase
        .from('profiles')
        .insert({
          id: userData.user.id,
          email: userData.user.email,
          display_name: userData.user.user_metadata?.display_name || null,
          settings: {}
        });

      if (insertError) {
        throw new Error(`Failed to create profile: ${insertError.message}`);
      }
    } else if (getError) {
      throw new Error(`Failed to check profile: ${getError.message}`);
    }

    return userData.user.id;
  }

  async get<T>(key: string): Promise<T | null> {
    const userId = await this.ensureProfile();

    const { data, error } = await this.supabase
      .from('profiles')
      .select('settings')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to get settings: ${error.message}`);
    }

    const settings = data.settings as Record<string, any> || {};
    return settings[key] as T || null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    const userId = await this.ensureProfile();

    // Get current settings
    const { data: currentData, error: getError } = await this.supabase
      .from('profiles')
      .select('settings')
      .eq('id', userId)
      .single();

    if (getError) {
      throw new Error(`Failed to get current settings: ${getError.message}`);
    }

    const currentSettings = currentData.settings as Record<string, any> || {};
    const updatedSettings = {
      ...currentSettings,
      [key]: value
    };

    const { error } = await this.supabase
      .from('profiles')
      .update({ settings: updatedSettings })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to set setting: ${error.message}`);
    }
  }

  async getAll(): Promise<Record<string, any>> {
    const userId = await this.ensureProfile();

    const { data, error } = await this.supabase
      .from('profiles')
      .select('settings')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to get all settings: ${error.message}`);
    }

    return data.settings as Record<string, any> || {};
  }

  async updateSettings(settings: Record<string, any>): Promise<void> {
    const userId = await this.ensureProfile();

    // Get current settings
    const { data: currentData, error: getError } = await this.supabase
      .from('profiles')
      .select('settings')
      .eq('id', userId)
      .single();

    if (getError) {
      throw new Error(`Failed to get current settings: ${getError.message}`);
    }

    const currentSettings = currentData.settings as Record<string, any> || {};
    const updatedSettings = {
      ...currentSettings,
      ...settings
    };

    const { error } = await this.supabase
      .from('profiles')
      .update({ settings: updatedSettings })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to update settings: ${error.message}`);
    }
  }

  async delete(key: string): Promise<void> {
    const userId = await this.ensureProfile();

    // Get current settings
    const { data: currentData, error: getError } = await this.supabase
      .from('profiles')
      .select('settings')
      .eq('id', userId)
      .single();

    if (getError) {
      throw new Error(`Failed to get current settings: ${getError.message}`);
    }

    const currentSettings = currentData.settings as Record<string, any> || {};
    const { [key]: deleted, ...remainingSettings } = currentSettings;

    const { error } = await this.supabase
      .from('profiles')
      .update({ settings: remainingSettings })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to delete setting: ${error.message}`);
    }
  }

  async clear(): Promise<void> {
    const userId = await this.ensureProfile();

    const { error } = await this.supabase
      .from('profiles')
      .update({ settings: {} })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to clear settings: ${error.message}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
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
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        errors.push(`Database error: ${error.message}`);
        isHealthy = false;
      } else {
        isConnected = true;
      }

      // Test authentication
      const { data: userData, error: authError } = await this.supabase.auth.getUser();
      if (authError || !userData.user) {
        errors.push('User not authenticated');
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
