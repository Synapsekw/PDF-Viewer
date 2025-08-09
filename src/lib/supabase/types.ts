/**
 * Supabase-related types and interfaces
 */

export type StorageMode = 'local' | 'supabase' | 'hybrid';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
  enabled: boolean;
  mode: StorageMode;
  features: {
    auth: boolean;
    storage: boolean;
    realtime: boolean;
    analytics: boolean;
  };
  fallbackToLocal: boolean;
}

export interface MigrationStatus {
  isComplete: boolean;
  currentPhase: string;
  progress: number; // 0-100
  errors: string[];
  lastSync: string | null;
}

export interface SupabaseHealth {
  isConnected: boolean;
  latency: number | null;
  lastCheck: string;
  errors: string[];
}

// Database table types (will be generated from Supabase later)
export interface DbProfile {
  id: string;
  email?: string;
  display_name?: string;
  created_at: string;
  updated_at: string;
}

export interface DbDocument {
  id: string;
  user_id: string;
  name: string;
  original_name: string;
  size_bytes: number;
  page_count?: number;
  mime_type: string;
  storage_path?: string;
  created_at: string;
  updated_at: string;
}

export interface DbDocumentShare {
  token: string;
  document_id: string;
  created_by: string;
  created_at: string;
  expires_at?: string;
  is_active: boolean;
}

export interface DbAnalyticsSession {
  id: string;
  document_id?: string;
  session_token?: string;
  user_id?: string;
  start_time: string;
  end_time?: string;
  total_duration?: number;
  pages_viewed?: number[];
  created_at: string;
}

export interface DbAnalyticsEvent {
  id: string;
  session_id: string;
  event_type: string;
  page_number?: number;
  coordinates?: any; // JSONB
  timestamp: string;
}
