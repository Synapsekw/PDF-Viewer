/**
 * Types for backup and data export system
 */

export interface BackupMetadata {
  version: string;
  timestamp: string;
  appVersion: string;
  platform: string;
  totalSize: number;
  dataTypes: string[];
  checksum: string;
}

export interface LibraryBackupData {
  pdfs: Array<{
    id: string;
    name: string;
    originalName: string;
    size: number;
    addedDate: string;
    pageCount?: number;
    thumbnail?: string;
    blobData: string; // base64 encoded
  }>;
}

export interface ShareBackupData {
  shares: Array<{
    token: string;
    docId: string;
    meta: {
      title: string;
      size: number;
      createdAt: string;
    };
  }>;
}

export interface AnalyticsBackupData {
  sessions: Array<{
    sessionId: string;
    documentId?: string;
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
}

export interface PublicSessionBackupData {
  sessions: Array<{
    sessionId: string;
    token: string;
    docId: string;
    startTime: number;
    pagesViewed: number[];
    events: any[];
  }>;
}

export interface UserSettingsBackupData {
  settings: {
    theme: string;
    notifications: any;
    privacy: any;
    display: any;
    language: string;
  };
}

export interface FullBackupData {
  metadata: BackupMetadata;
  library: LibraryBackupData;
  shares: ShareBackupData;
  analytics: AnalyticsBackupData;
  publicSessions: PublicSessionBackupData;
  userSettings: UserSettingsBackupData;
}

export interface BackupOptions {
  includeBlobs: boolean;
  compressData: boolean;
  includeAnalytics: boolean;
  includePublicSessions: boolean;
  maxBlobSize?: number; // in MB
}

export interface RestoreOptions {
  overwriteExisting: boolean;
  validateData: boolean;
  createBackupBeforeRestore: boolean;
  restoreBlobs: boolean;
}

export interface BackupValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    totalDocuments: number;
    totalShares: number;
    totalSessions: number;
    totalSize: number;
  };
}
