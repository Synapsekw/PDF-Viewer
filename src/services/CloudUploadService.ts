/**
 * Cloud Upload Service - Handles PDF upload from viewer to cloud storage
 */

import { SupabaseClientManager } from '../lib/supabase/client';
import { repositoryManager } from '../lib/repositories/RepositoryManager';
import { UploadProgress } from '../lib/repositories/supabase/LibraryRepository';

export interface CloudUploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (documentId: string) => void;
  onError?: (error: Error) => void;
}

export interface UploadState {
  isUploading: boolean;
  progress: UploadProgress | null;
  error: Error | null;
  documentId: string | null;
}

export class CloudUploadService {
  private static instance: CloudUploadService;
  
  private constructor() {}
  
  static getInstance(): CloudUploadService {
    if (!CloudUploadService.instance) {
      CloudUploadService.instance = new CloudUploadService();
    }
    return CloudUploadService.instance;
  }
  
  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const supabase = SupabaseClientManager.getClient();
    if (!supabase) return false;
    
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  }
  
  /**
   * Get current user
   */
  async getCurrentUser() {
    const supabase = SupabaseClientManager.getClient();
    if (!supabase) return null;
    
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }
  
  /**
   * Upload PDF from viewer to cloud
   */
  async uploadPDFToCloud(
    pdfData: Uint8Array | ArrayBuffer,
    fileName: string,
    options?: CloudUploadOptions
  ): Promise<{ success: boolean; documentId?: string; error?: Error }> {
    try {
      // Ensure user is authenticated
      const isAuth = await this.isAuthenticated();
      if (!isAuth) {
        throw new Error('User must be authenticated to upload files');
      }
      
      // Configure repository manager for Supabase
      repositoryManager.configure({ mode: 'supabase' });
      
      // Convert data to File object
      const blob = new Blob([pdfData], { type: 'application/pdf' });
      const file = new File([blob], fileName, { type: 'application/pdf' });
      
      // Get library repository
      const libraryRepo = repositoryManager.getLibraryRepository();
      
      // Upload with progress tracking
      const uploadedPDF = await libraryRepo.add(file, options?.onProgress);
      
      // Call success callback
      options?.onSuccess?.(uploadedPDF.id);
      
      return {
        success: true,
        documentId: uploadedPDF.id
      };
      
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown upload error');
      options?.onError?.(err);
      
      return {
        success: false,
        error: err
      };
    }
  }
  
  /**
   * Convert File to Uint8Array for compatibility
   */
  async fileToUint8Array(file: File): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }
  
  /**
   * Get upload size limit based on user's plan
   */
  getUploadSizeLimit(): number {
    // 50MB for Supabase storage, but we might want to limit based on user plan
    return 50 * 1024 * 1024; // 50MB
  }
  
  /**
   * Validate file before upload
   */
  validateFile(file: File | Blob): { valid: boolean; error?: string } {
    const sizeLimit = this.getUploadSizeLimit();
    
    if (file.size > sizeLimit) {
      return {
        valid: false,
        error: `File size exceeds limit of ${Math.round(sizeLimit / 1024 / 1024)}MB`
      };
    }
    
    if (file.type !== 'application/pdf') {
      return {
        valid: false,
        error: 'Only PDF files are supported'
      };
    }
    
    return { valid: true };
  }
}

export const cloudUploadService = CloudUploadService.getInstance();
