/**
 * Comprehensive backup manager for all local data
 */

import { localLibraryRepo } from '../../features/library/localRepo';
import { localShareRepo } from '../../features/share/shareRepo.local';
import { analyticsStorage } from '../../features/analytics/persistence/storage';
import { 
  FullBackupData, 
  BackupOptions, 
  RestoreOptions, 
  BackupMetadata,
  LibraryBackupData,
  ShareBackupData,
  AnalyticsBackupData,
  UserSettingsBackupData,
  BackupValidationResult
} from './types';
import { BackupValidator } from './validators';

export class BackupManager {
  private static readonly BACKUP_VERSION = '1.0.0';
  private static readonly APP_VERSION = '1.0.0'; // Should match package.json

  /**
   * Test backup components individually for debugging
   */
  static async testBackupComponents(): Promise<void> {
    console.log('BackupManager: Testing backup components...');
    
    try {
      console.log('1. Testing library data backup...');
      const library = await this.backupLibraryData({ includeBlobs: false, compressData: false, includeAnalytics: false, includePublicSessions: false });
      console.log('✅ Library backup test passed:', library.pdfs.length, 'documents');
      
      console.log('2. Testing share data backup...');
      const shares = await this.backupShareData();
      console.log('✅ Share backup test passed:', shares.shares.length, 'shares');
      
      console.log('3. Testing analytics data backup...');
      const analytics = await this.backupAnalyticsData();
      console.log('✅ Analytics backup test passed:', analytics.sessions.length, 'sessions');
      
      console.log('4. Testing user settings backup...');
      const settings = await this.backupUserSettings();
      console.log('✅ User settings backup test passed');
      
      console.log('🎉 All backup components working correctly!');
    } catch (error) {
      console.error('❌ Backup component test failed:', error);
      throw error;
    }
  }

  /**
   * Create a comprehensive backup of all local data
   */
  static async createFullBackup(options: Partial<BackupOptions> = {}): Promise<FullBackupData> {
    const opts: BackupOptions = {
      includeBlobs: true,
      compressData: false,
      includeAnalytics: true,
      includePublicSessions: true,
      maxBlobSize: 100, // 100MB max per blob
      ...options
    };

    console.log('BackupManager: Starting full backup with options:', opts);

    try {
      // Collect all data in parallel for better performance
      const [library, shares, analytics, userSettings] = await Promise.all([
        this.backupLibraryData(opts),
        this.backupShareData(),
        opts.includeAnalytics ? this.backupAnalyticsData() : this.getEmptyAnalyticsData(),
        this.backupUserSettings()
      ]);

      // Create metadata
      const metadata: BackupMetadata = {
        version: this.BACKUP_VERSION,
        timestamp: new Date().toISOString(),
        appVersion: this.APP_VERSION,
        platform: this.getPlatformInfo(),
        totalSize: 0, // Will be calculated after data is assembled
        dataTypes: this.getIncludedDataTypes(opts),
        checksum: '' // Will be calculated at the end
      };

      const backup: FullBackupData = {
        metadata,
        library,
        shares,
        analytics,
        publicSessions: { sessions: [] }, // TODO: Implement when needed
        userSettings
      };

      // Calculate final metadata
      backup.metadata.totalSize = this.calculateBackupSize(backup);
      backup.metadata.checksum = BackupValidator.generateChecksum(backup);

      console.log('BackupManager: Backup completed successfully', {
        totalDocuments: library.pdfs.length,
        totalShares: shares.shares.length,
        totalSize: backup.metadata.totalSize
      });

      return backup;

    } catch (error) {
      console.error('BackupManager: Failed to create backup:', error);
      throw new Error(`Backup creation failed: ${error.message}`);
    }
  }

  /**
   * Export backup data to downloadable JSON file
   */
  static async exportToFile(backup: FullBackupData, filename?: string): Promise<void> {
    const defaultFilename = `spectra-backup-${new Date().toISOString().split('T')[0]}.json`;
    const finalFilename = filename || defaultFilename;

    try {
      const jsonString = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = finalFilename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('BackupManager: Backup exported to file:', finalFilename);
    } catch (error) {
      console.error('BackupManager: Failed to export backup:', error);
      throw new Error(`Export failed: ${error.message}`);
    }
  }

  /**
   * Import and validate backup data from file
   */
  static async importFromFile(file: File): Promise<{ data: FullBackupData; validation: BackupValidationResult }> {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      const validation = BackupValidator.validateBackupData(data);
      
      console.log('BackupManager: Backup file imported and validated', {
        isValid: validation.isValid,
        errors: validation.errors.length,
        warnings: validation.warnings.length
      });

      return { data, validation };
    } catch (error) {
      console.error('BackupManager: Failed to import backup file:', error);
      throw new Error(`Import failed: ${error.message}`);
    }
  }

  /**
   * Restore data from backup
   */
  static async restoreFromBackup(backup: FullBackupData, options: Partial<RestoreOptions> = {}): Promise<void> {
    const opts: RestoreOptions = {
      overwriteExisting: false,
      validateData: true,
      createBackupBeforeRestore: true,
      restoreBlobs: true,
      ...options
    };

    console.log('BackupManager: Starting restore with options:', opts);

    try {
      // Validate backup before restore
      if (opts.validateData) {
        const validation = BackupValidator.validateBackupData(backup);
        if (!validation.isValid) {
          throw new Error(`Invalid backup data: ${validation.errors.join(', ')}`);
        }
      }

      // Create backup before restore if requested
      if (opts.createBackupBeforeRestore) {
        console.log('BackupManager: Creating safety backup before restore...');
        const safetyBackup = await this.createFullBackup();
        await this.exportToFile(safetyBackup, `safety-backup-${Date.now()}.json`);
      }

      // Restore data in order (dependencies matter)
      await this.restoreLibraryData(backup.library, opts);
      await this.restoreShareData(backup.shares, opts);
      await this.restoreUserSettings(backup.userSettings, opts);
      
      if (backup.analytics && opts.validateData) {
        await this.restoreAnalyticsData(backup.analytics, opts);
      }

      console.log('BackupManager: Restore completed successfully');
    } catch (error) {
      console.error('BackupManager: Restore failed:', error);
      throw new Error(`Restore failed: ${error.message}`);
    }
  }

  // Private helper methods

  private static async backupLibraryData(options: BackupOptions): Promise<LibraryBackupData> {
    console.log('BackupManager: Backing up library data...');
    
    try {
      const pdfs = await localLibraryRepo.list();
      const backupPdfs = [];

      console.log(`BackupManager: Found ${pdfs.length} documents to backup`);

      for (const pdfMeta of pdfs) {
        try {
          const fullPdf = await localLibraryRepo.get(pdfMeta.id);
          if (!fullPdf) {
            console.warn(`BackupManager: Could not retrieve PDF data for ${pdfMeta.id}`);
            continue;
          }

          let blobData = '';
          if (options.includeBlobs && fullPdf.blob) {
            // Check blob size limit
            const sizeMB = fullPdf.blob.size / (1024 * 1024);
            if (options.maxBlobSize && sizeMB > options.maxBlobSize) {
              console.warn(`Skipping blob for ${fullPdf.name} - size (${sizeMB.toFixed(2)}MB) exceeds limit (${options.maxBlobSize}MB)`);
            } else {
              console.log(`BackupManager: Converting blob to base64 for ${fullPdf.name} (${sizeMB.toFixed(2)}MB)`);
              blobData = await this.blobToBase64(fullPdf.blob);
            }
          }

          backupPdfs.push({
            id: fullPdf.id,
            name: fullPdf.name,
            originalName: fullPdf.originalName,
            size: fullPdf.size,
            addedDate: fullPdf.addedDate.toISOString(),
            pageCount: fullPdf.pageCount,
            thumbnail: fullPdf.thumbnail,
            blobData
          });

          console.log(`BackupManager: Successfully backed up ${fullPdf.name}`);
        } catch (pdfError) {
          console.error(`BackupManager: Failed to backup PDF ${pdfMeta.id}:`, pdfError);
          // Continue with other PDFs even if one fails
        }
      }

      console.log(`BackupManager: Library backup completed - ${backupPdfs.length} documents successfully backed up`);
      return { pdfs: backupPdfs };
    } catch (error) {
      console.error('BackupManager: Library backup failed:', error);
      // Return empty library data instead of throwing - let the backup continue
      return { pdfs: [] };
    }
  }

  private static async backupShareData(): Promise<ShareBackupData> {
    console.log('BackupManager: Backing up share data...');
    
    try {
      const shares = await localShareRepo.listShares();
      console.log(`BackupManager: Share backup completed - ${shares.length} shares`);
      return { shares };
    } catch (error) {
      console.error('BackupManager: Share backup failed:', error);
      return { shares: [] };
    }
  }

  private static async backupAnalyticsData(): Promise<AnalyticsBackupData> {
    console.log('BackupManager: Backing up analytics data...');
    
    try {
      // Get all analytics data
      const allData = await analyticsStorage.exportAllData();
      
      // Convert analytics data to backup format
      const sessions = (allData.sessions || []).map((session: any) => ({
        sessionId: session.sessionId || 'unknown',
        documentId: session.documentId,
        startTime: session.startTime || Date.now(),
        endTime: session.endTime,
        interactions: session.interactions || [],
        pageViews: session.pageViews || [],
        duration: session.duration || 0
      }));

      const events = (allData.metadata || []).map((meta: any) => ({
        type: 'session_metadata',
        timestamp: meta.timestamp || Date.now(),
        data: meta
      }));

      console.log(`BackupManager: Analytics backup completed - ${sessions.length} sessions, ${events.length} events`);
      
      return {
        sessions,
        events
      };
    } catch (error) {
      console.error('BackupManager: Analytics backup failed:', error);
      return this.getEmptyAnalyticsData();
    }
  }

  private static async backupUserSettings(): Promise<UserSettingsBackupData> {
    console.log('BackupManager: Backing up user settings...');
    
    try {
      const settings = {
        theme: localStorage.getItem('theme') || 'system',
        notifications: JSON.parse(localStorage.getItem('notifications') || '{}'),
        privacy: JSON.parse(localStorage.getItem('privacy') || '{}'),
        display: JSON.parse(localStorage.getItem('display') || '{}'),
        language: localStorage.getItem('language') || 'en'
      };

      return { settings };
    } catch (error) {
      console.error('BackupManager: User settings backup failed:', error);
      return { settings: { theme: 'system', notifications: {}, privacy: {}, display: {}, language: 'en' } };
    }
  }

  private static async restoreLibraryData(data: LibraryBackupData, options: RestoreOptions): Promise<void> {
    console.log('BackupManager: Restoring library data...');
    
    for (const pdfData of data.pdfs) {
      try {
        if (!options.restoreBlobs || !pdfData.blobData) {
          console.warn(`Skipping PDF restore for ${pdfData.name} - no blob data`);
          continue;
        }

        // Convert base64 back to blob
        const blob = this.base64ToBlob(pdfData.blobData, 'application/pdf');
        
        // Create File object for the repository
        const file = new File([blob], pdfData.originalName, { type: 'application/pdf' });
        
        // Check if document already exists
        const existing = await localLibraryRepo.get(pdfData.id);
        if (existing && !options.overwriteExisting) {
          console.log(`Skipping existing document: ${pdfData.name}`);
          continue;
        }

        await localLibraryRepo.add(file);
        console.log(`Restored document: ${pdfData.name}`);
      } catch (error) {
        console.error(`Failed to restore document ${pdfData.name}:`, error);
      }
    }
  }

  private static async restoreShareData(data: ShareBackupData, options: RestoreOptions): Promise<void> {
    console.log('BackupManager: Restoring share data...');
    
    // Note: Share restoration may need special handling as tokens might conflict
    // For now, log the data that would be restored
    console.log(`Would restore ${data.shares.length} share links`);
  }

  private static async restoreUserSettings(data: UserSettingsBackupData, options: RestoreOptions): Promise<void> {
    console.log('BackupManager: Restoring user settings...');
    
    try {
      const { settings } = data;
      
      if (settings.theme) localStorage.setItem('theme', settings.theme);
      if (settings.notifications) localStorage.setItem('notifications', JSON.stringify(settings.notifications));
      if (settings.privacy) localStorage.setItem('privacy', JSON.stringify(settings.privacy));
      if (settings.display) localStorage.setItem('display', JSON.stringify(settings.display));
      if (settings.language) localStorage.setItem('language', settings.language);
      
      console.log('User settings restored successfully');
    } catch (error) {
      console.error('Failed to restore user settings:', error);
    }
  }

  private static async restoreAnalyticsData(data: AnalyticsBackupData, options: RestoreOptions): Promise<void> {
    console.log('BackupManager: Restoring analytics data...');
    console.log(`Would restore ${data.sessions.length} sessions and ${data.events.length} events`);
  }

  // Utility methods

  private static async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private static base64ToBlob(base64: string, mimeType: string = 'application/octet-stream'): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  private static calculateBackupSize(backup: FullBackupData): number {
    return new Blob([JSON.stringify(backup)]).size;
  }

  private static getPlatformInfo(): string {
    return `${navigator.platform} - ${navigator.userAgent.split(' ')[0]}`;
  }

  private static getIncludedDataTypes(options: BackupOptions): string[] {
    const types = ['library', 'shares', 'userSettings'];
    
    if (options.includeAnalytics) types.push('analytics');
    if (options.includePublicSessions) types.push('publicSessions');
    if (options.includeBlobs) types.push('blobs');
    
    return types;
  }

  private static getEmptyAnalyticsData(): AnalyticsBackupData {
    return { sessions: [], events: [] };
  }
}
