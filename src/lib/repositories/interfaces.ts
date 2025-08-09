/**
 * Repository interfaces for data abstraction layer
 * These interfaces allow seamless switching between local and cloud storage
 */

import { LibraryPDF, LibraryPDFMetadata } from '../../features/library/types';
import { ShareMeta } from '../../features/share/types';
import { AnalyticsData } from '../../contexts/AnalyticsContext';

// ==================== PDF Library Repository ====================

/**
 * Interface for PDF library operations
 */
export interface IPDFLibraryRepository {
  /**
   * Add a new PDF to the library
   */
  add(file: File): Promise<LibraryPDF>;
  
  /**
   * Get a PDF by ID (includes blob)
   */
  get(id: string): Promise<LibraryPDF | null>;
  
  /**
   * List all PDFs metadata (without blobs for performance)
   */
  list(): Promise<LibraryPDFMetadata[]>;
  
  /**
   * Delete a PDF by ID
   */
  delete(id: string): Promise<void>;
  
  /**
   * Clear all PDFs from library
   */
  clear(): Promise<void>;
  
  /**
   * Check if repository is available/connected
   */
  isAvailable(): Promise<boolean>;
  
  /**
   * Get repository health status
   */
  getHealth(): Promise<RepositoryHealth>;
}

// ==================== Share Repository ====================

/**
 * Interface for document sharing operations
 */
export interface IShareRepository {
  /**
   * Create a share link for a document
   */
  createShare(docId: string, options?: ShareOptions): Promise<{ token: string; meta: ShareMeta }>;
  
  /**
   * Resolve a share token to document info
   */
  resolveToken(token: string): Promise<{ docId: string; meta: ShareMeta } | null>;
  
  /**
   * List all share links
   */
  listShares(): Promise<Array<{ token: string; meta: ShareMeta }>>;
  
  /**
   * Revoke a share link
   */
  revokeShare(token: string): Promise<void>;
  
  /**
   * Get share statistics
   */
  getShareStats(token: string): Promise<ShareStats | null>;
  
  /**
   * Check if repository is available/connected
   */
  isAvailable(): Promise<boolean>;
  
  /**
   * Get repository health status
   */
  getHealth(): Promise<RepositoryHealth>;
}

// ==================== Analytics Repository ====================

/**
 * Interface for analytics data operations
 */
export interface IAnalyticsRepository {
  /**
   * Save analytics session data
   */
  saveSession(sessionId: string, data: AnalyticsData): Promise<void>;
  
  /**
   * Load analytics session data
   */
  loadSession(sessionId: string): Promise<AnalyticsData | null>;
  
  /**
   * List all session IDs
   */
  listSessions(): Promise<string[]>;
  
  /**
   * Delete session data
   */
  deleteSession(sessionId: string): Promise<void>;
  
  /**
   * Export all analytics data
   */
  exportAllData(): Promise<AnalyticsExportData>;
  
  /**
   * Import analytics data
   */
  importData(data: AnalyticsExportData): Promise<void>;
  
  /**
   * Clear all analytics data
   */
  clear(): Promise<void>;
  
  /**
   * Check if repository is available/connected
   */
  isAvailable(): Promise<boolean>;
  
  /**
   * Get repository health status
   */
  getHealth(): Promise<RepositoryHealth>;
}

// ==================== User Settings Repository ====================

/**
 * Interface for user settings operations
 */
export interface IUserSettingsRepository {
  /**
   * Get user setting value
   */
  get<T>(key: string): Promise<T | null>;
  
  /**
   * Set user setting value
   */
  set<T>(key: string, value: T): Promise<void>;
  
  /**
   * Get all user settings
   */
  getAll(): Promise<Record<string, any>>;
  
  /**
   * Update multiple settings at once
   */
  updateSettings(settings: Record<string, any>): Promise<void>;
  
  /**
   * Delete a setting
   */
  delete(key: string): Promise<void>;
  
  /**
   * Clear all settings
   */
  clear(): Promise<void>;
  
  /**
   * Check if repository is available/connected
   */
  isAvailable(): Promise<boolean>;
  
  /**
   * Get repository health status
   */
  getHealth(): Promise<RepositoryHealth>;
}

// ==================== Supporting Types ====================

/**
 * Repository health information
 */
export interface RepositoryHealth {
  /** Is the repository operational */
  isHealthy: boolean;
  /** Connection status */
  isConnected: boolean;
  /** Last successful operation timestamp */
  lastSuccess?: string;
  /** Error messages if any */
  errors: string[];
  /** Latency in milliseconds */
  latency?: number;
  /** Storage usage info */
  storage?: {
    used: number;
    available: number;
    percentage: number;
  };
}

/**
 * Share creation options
 */
export interface ShareOptions {
  /** Expiration date for the share */
  expiresAt?: Date;
  /** Password protection */
  password?: string;
  /** Allow analytics tracking */
  allowAnalytics?: boolean;
  /** Custom metadata */
  metadata?: Record<string, any>;
}

/**
 * Share statistics
 */
export interface ShareStats {
  /** Number of times accessed */
  accessCount: number;
  /** Last access timestamp */
  lastAccessed?: string;
  /** Creation timestamp */
  createdAt: string;
  /** Expiration timestamp */
  expiresAt?: string;
  /** Is share active */
  isActive: boolean;
  /** Unique visitors count */
  uniqueVisitors?: number;
}

/**
 * Analytics export data structure
 */
export interface AnalyticsExportData {
  sessions: Array<{
    sessionId: string;
    documentId: string;
    startTime: number;
    endTime?: number;
    interactions: any[];
    pageViews: any[];
    duration: number;
  }>;
  events: Array<{
    type: string;
    timestamp: number;
    data: any;
  }>;
  metadata?: Record<string, any>;
}

/**
 * Repository operation mode
 */
export type RepositoryMode = 'local' | 'cloud' | 'hybrid';

/**
 * Repository status for dual-mode operation
 */
export interface RepositoryStatus {
  mode: RepositoryMode;
  local: RepositoryHealth;
  cloud: RepositoryHealth;
  syncStatus?: {
    isEnabled: boolean;
    lastSync?: string;
    pendingOperations: number;
    conflicts: number;
  };
}

/**
 * Data synchronization conflict
 */
export interface SyncConflict {
  id: string;
  type: 'library' | 'share' | 'analytics' | 'settings';
  localData: any;
  cloudData: any;
  timestamp: string;
  resolution?: 'local' | 'cloud' | 'merge' | 'manual';
}

/**
 * Synchronization options
 */
export interface SyncOptions {
  /** Force sync even if no changes detected */
  force?: boolean;
  /** Sync direction */
  direction?: 'up' | 'down' | 'bidirectional';
  /** Include specific data types */
  include?: Array<'library' | 'share' | 'analytics' | 'settings'>;
  /** Exclude specific data types */
  exclude?: Array<'library' | 'share' | 'analytics' | 'settings'>;
  /** Conflict resolution strategy */
  conflictResolution?: 'local' | 'cloud' | 'latest' | 'manual';
}
