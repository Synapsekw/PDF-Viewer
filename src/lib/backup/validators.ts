/**
 * Data validation utilities for backup system
 */

import { FullBackupData, BackupValidationResult } from './types';

export class BackupValidator {
  static validateBackupData(data: any): BackupValidationResult {
    const result: BackupValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      summary: {
        totalDocuments: 0,
        totalShares: 0,
        totalSessions: 0,
        totalSize: 0
      }
    };

    try {
      // Validate metadata
      if (!data.metadata) {
        result.errors.push('Missing backup metadata');
        result.isValid = false;
      } else {
        if (!data.metadata.version || !data.metadata.timestamp) {
          result.errors.push('Invalid metadata structure');
          result.isValid = false;
        }
      }

      // Validate library data
      if (data.library && data.library.pdfs) {
        result.summary.totalDocuments = data.library.pdfs.length;
        
        data.library.pdfs.forEach((pdf: any, index: number) => {
          if (!pdf.id || !pdf.name || !pdf.blobData) {
            result.errors.push(`Invalid PDF data at index ${index}`);
            result.isValid = false;
          }
          
          // Validate base64 blob data
          if (pdf.blobData && !this.isValidBase64(pdf.blobData)) {
            result.errors.push(`Invalid blob data for PDF: ${pdf.name}`);
            result.isValid = false;
          }
        });
      }

      // Validate shares
      if (data.shares && data.shares.shares) {
        result.summary.totalShares = data.shares.shares.length;
        
        data.shares.shares.forEach((share: any, index: number) => {
          if (!share.token || !share.docId) {
            result.errors.push(`Invalid share data at index ${index}`);
            result.isValid = false;
          }
        });
      }

      // Validate analytics
      if (data.analytics && data.analytics.sessions) {
        result.summary.totalSessions = data.analytics.sessions.length;
      }

      // Calculate total size
      const dataString = JSON.stringify(data);
      result.summary.totalSize = new Blob([dataString]).size;

      // Add warnings for large datasets
      if (result.summary.totalDocuments > 100) {
        result.warnings.push(`Large number of documents (${result.summary.totalDocuments}). Import may take time.`);
      }

      if (result.summary.totalSize > 50 * 1024 * 1024) { // 50MB
        result.warnings.push(`Large backup size (${Math.round(result.summary.totalSize / 1024 / 1024)}MB). Import may take time.`);
      }

    } catch (error) {
      result.errors.push(`Validation error: ${error.message}`);
      result.isValid = false;
    }

    return result;
  }

  static isValidBase64(str: string): boolean {
    try {
      return btoa(atob(str)) === str;
    } catch (err) {
      return false;
    }
  }

  static generateChecksum(data: any): string {
    const dataString = JSON.stringify(data);
    let hash = 0;
    
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16);
  }
}
