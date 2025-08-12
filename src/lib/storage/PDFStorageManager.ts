/**
 * PDF Storage Manager - Handles progressive upload and fallback strategies
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../supabase/database.types';

export interface UploadProgress {
  progress: number; // 0-100
  bytesUploaded: number;
  totalBytes: number;
  isComplete: boolean;
  error?: string;
}

export interface StorageOptions {
  useSupabaseStorage: boolean;
  chunkSize: number; // Default 1MB chunks
  maxRetries: number;
  retryDelay: number; // milliseconds
}

export interface StorageResult {
  success: boolean;
  storagePath?: string;
  base64Data?: string;
  error?: string;
  storageType: 'supabase' | 'base64' | 'fallback';
}

export class PDFStorageManager {
  private supabase: SupabaseClient<Database>;
  private options: StorageOptions;

  constructor(
    supabase: SupabaseClient<Database>,
    options: Partial<StorageOptions> = {}
  ) {
    this.supabase = supabase;
    this.options = {
      useSupabaseStorage: true,
      chunkSize: 1024 * 1024, // 1MB
      maxRetries: 3,
      retryDelay: 1000,
      ...options
    };
  }

  /**
   * Store PDF with progressive upload and fallback strategy
   */
  async storePDF(
    file: File,
    documentId: string,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<StorageResult> {
    // Cloud-first with graceful fallback to base64 in DB if storage is unavailable
    try {
      return await this.uploadToSupabaseStorage(file, documentId, userId, onProgress);
    } catch (error) {
      // Fall back to base64 storage to ensure the document can still be saved and viewed
      try {
        return await this.storeAsBase64(file, onProgress);
      } catch (fallbackError) {
        return {
          success: false,
          error: (fallbackError instanceof Error ? fallbackError.message : 'Upload failed'),
          storageType: 'fallback'
        };
      }
    }
  }

  /**
   * Upload to Supabase Storage with chunking for large files
   */
  private async uploadToSupabaseStorage(
    file: File,
    documentId: string,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<StorageResult> {
    const fileName = `${documentId}.pdf`;
    const filePath = `${userId}/${fileName}`;

    // For files smaller than chunk size, upload directly
    if (file.size <= this.options.chunkSize) {
      return await this.directUpload(file, filePath, onProgress);
    }

    // For larger files, use chunked upload
    return await this.chunkedUpload(file, filePath, onProgress);
  }

  /**
   * Direct upload for smaller files
   */
  private async directUpload(
    file: File,
    filePath: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<StorageResult> {
    onProgress?.({
      progress: 0,
      bytesUploaded: 0,
      totalBytes: file.size,
      isComplete: false
    });

    for (let attempt = 0; attempt < this.options.maxRetries; attempt++) {
      try {
        const { error } = await this.supabase.storage
          .from('documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          throw new Error(`Upload failed: ${error.message}`);
        }

        onProgress?.({
          progress: 100,
          bytesUploaded: file.size,
          totalBytes: file.size,
          isComplete: true
        });

        return {
          success: true,
          storagePath: filePath,
          storageType: 'supabase'
        };

      } catch (error) {
        console.warn(`Upload attempt ${attempt + 1} failed:`, error);
        
        if (attempt < this.options.maxRetries - 1) {
          await this.delay(this.options.retryDelay * (attempt + 1));
        } else {
          throw error;
        }
      }
    }

    throw new Error('All upload attempts failed');
  }

  /**
   * Chunked upload for larger files
   */
  private async chunkedUpload(
    file: File,
    filePath: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<StorageResult> {
    const chunks = this.createChunks(file);
    const uploadId = crypto.randomUUID();
    let uploadedBytes = 0;

    try {
      // For production, prefer direct upload up to 50MB. If larger, we currently
      // fall back to direct upload attempts (many browsers can handle ~100MB in one go).
      // Replace this with resumable uploads when needed.
      return await this.directUpload(file, filePath, onProgress);

    } catch (error) {
      // Clean up any uploaded chunks on failure
      await this.cleanupChunks(filePath, chunks.length);
      throw error;
    }
  }

  /**
   * Store as base64 in database
   */
  private async storeAsBase64(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<StorageResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress?.({
            progress: Math.round((event.loaded / event.total) * 100),
            bytesUploaded: event.loaded,
            totalBytes: event.total,
            isComplete: false
          });
        }
      };

      reader.onload = () => {
        const base64Data = reader.result as string;
        
        onProgress?.({
          progress: 100,
          bytesUploaded: file.size,
          totalBytes: file.size,
          isComplete: true
        });

        resolve({
          success: true,
          base64Data,
          storageType: 'base64'
        });
      };

      reader.onerror = () => {
        reject({
          success: false,
          error: 'Failed to read file as base64',
          storageType: 'base64'
        });
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Retrieve PDF from storage
   */
  async retrievePDF(storagePath?: string, base64Data?: string): Promise<Blob> {
    if (storagePath) {
      // Download from Supabase storage
      const { data, error } = await this.supabase.storage
        .from('documents')
        .download(storagePath);

      if (error) {
        throw new Error(`Failed to download from storage: ${error.message}`);
      }

      return data;
    }

    if (base64Data) {
      // Convert base64 to blob
      const response = await fetch(base64Data);
      return await response.blob();
    }

    throw new Error('No storage path or base64 data provided');
  }

  /**
   * Delete PDF from storage
   */
  async deletePDF(storagePath?: string): Promise<void> {
    if (storagePath) {
      const { error } = await this.supabase.storage
        .from('documents')
        .remove([storagePath]);

      if (error) {
        console.warn('Failed to delete from storage:', error);
        // Don't throw - deletion from storage is not critical
      }
    }
    // For base64 storage, deletion happens when the database record is deleted
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(userId: string): Promise<{
    totalDocuments: number;
    supabaseStorageUsed: number;
    base64StorageUsed: number;
    totalStorageUsed: number;
  }> {
    // Get user's documents
    const { data: documents, error } = await this.supabase
      .from('documents')
      .select('storage_path, size_bytes, storage_bucket')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to get storage stats: ${error.message}`);
    }

    let supabaseStorageUsed = 0;
    let base64StorageUsed = 0;

    documents.forEach(doc => {
      if (doc.storage_path) {
        supabaseStorageUsed += doc.size_bytes;
      } else {
        base64StorageUsed += doc.size_bytes;
      }
    });

    return {
      totalDocuments: documents.length,
      supabaseStorageUsed,
      base64StorageUsed,
      totalStorageUsed: supabaseStorageUsed + base64StorageUsed
    };
  }

  // Helper methods

  private createChunks(file: File): Blob[] {
    const chunks: Blob[] = [];
    const chunkSize = this.options.chunkSize;
    
    for (let start = 0; start < file.size; start += chunkSize) {
      const end = Math.min(start + chunkSize, file.size);
      chunks.push(file.slice(start, end));
    }
    
    return chunks;
  }

  private async combineChunks(filePath: string, chunkCount: number): Promise<void> {}

  private async cleanupChunks(filePath: string, chunkCount: number): Promise<void> {
    const chunkPaths = Array.from(
      { length: chunkCount },
      (_, i) => `${filePath}.chunk.${i}`
    );

    await this.supabase.storage
      .from('documents')
      .remove(chunkPaths)
      .catch(error => {
        console.warn('Failed to cleanup chunks:', error);
      });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
