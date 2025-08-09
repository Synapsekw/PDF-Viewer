/**
 * Enhanced Supabase implementation of PDF Library Repository with progressive storage
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { LibraryPDF, LibraryPDFMetadata } from '../../../features/library/types';
import { IPDFLibraryRepository, RepositoryHealth } from '../interfaces';
import { Database, DocumentInsert, DocumentUpdate } from '../../supabase/database.types';
import { PDFStorageManager, UploadProgress, StorageResult } from '../../storage/PDFStorageManager';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export class SupabasePDFLibraryRepository implements IPDFLibraryRepository {
  private storageManager: PDFStorageManager;

  constructor(private supabase: SupabaseClient<Database>) {
    this.storageManager = new PDFStorageManager(supabase);
  }

  private async generateThumbnail(blob: Blob): Promise<string | undefined> {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      if (pdf.numPages > 0) {
        const page = await pdf.getPage(1);
        
        // Calculate scale for high quality thumbnail
        const viewport = page.getViewport({ scale: 1.0 });
        const targetWidth = 800;
        const scale = targetWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return undefined;
        
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        
        await page.render({
          canvasContext: context,
          viewport: scaledViewport,
          canvas: canvas,
        }).promise;
        
        return canvas.toDataURL('image/jpeg', 0.95);
      }
    } catch (error) {
      console.warn('Failed to generate thumbnail:', error);
    }
    return undefined;
  }

  private async getPageCount(blob: Blob): Promise<number | undefined> {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      return pdf.numPages;
    } catch (error) {
      console.warn('Failed to get page count:', error);
      return undefined;
    }
  }

  private async storeDocument(
    file: File, 
    documentId: string, 
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<StorageResult> {
    return await this.storageManager.storePDF(file, documentId, userId, onProgress);
  }

  private async retrieveDocument(storagePath?: string, base64Data?: string): Promise<Blob> {
    return await this.storageManager.retrievePDF(storagePath, base64Data);
  }

  async add(file: File, onProgress?: (progress: UploadProgress) => void): Promise<LibraryPDF> {
    const { data: userData } = await this.supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('User not authenticated');
    }

    const documentId = crypto.randomUUID();
    
    // Generate thumbnail and get page count
    const [thumbnail, pageCount] = await Promise.all([
      this.generateThumbnail(file),
      this.getPageCount(file)
    ]);

    // Store document using progressive storage strategy
    const storageResult = await this.storeDocument(file, documentId, userData.user.id, onProgress);
    
    if (!storageResult.success) {
      throw new Error(`Failed to store document: ${storageResult.error}`);
    }

    // Create document record with appropriate storage information
    const documentData: DocumentInsert = {
      id: documentId,
      user_id: userData.user.id,
      name: file.name.replace(/\.pdf$/i, ''),
      original_name: file.name,
      size_bytes: file.size,
      page_count: pageCount,
      storage_path: storageResult.storagePath,
      storage_bucket: storageResult.storageType === 'supabase' ? 'documents' : null,
      thumbnail_data: thumbnail,
      metadata: {
        storageType: storageResult.storageType,
        base64Data: storageResult.base64Data
      }
    };

    const { data, error } = await this.supabase
      .from('documents')
      .insert(documentData)
      .select()
      .single();

    if (error) {
      // Clean up uploaded file if database insert fails
      if (storageResult.storagePath) {
        await this.storageManager.deletePDF(storageResult.storagePath);
      }
      throw new Error(`Failed to save document: ${error.message}`);
    }

    // Return LibraryPDF format
    return {
      id: data.id,
      name: data.name,
      originalName: data.original_name,
      size: data.size_bytes,
      addedDate: new Date(data.created_at!),
      pageCount: data.page_count || undefined,
      blob: file,
      thumbnail: data.thumbnail_data || undefined
    };
  }

  async get(id: string): Promise<LibraryPDF | null> {
    const { data: userData } = await this.supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('User not authenticated');
    }

    // Get document metadata
    const { data, error } = await this.supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('user_id', userData.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Document not found
      }
      throw new Error(`Failed to get document: ${error.message}`);
    }

    // Retrieve blob from appropriate storage
    let blob: Blob;
    try {
      const metadata = data.metadata as any;
      const base64Data = metadata?.base64Data;
      
      blob = await this.retrieveDocument(data.storage_path, base64Data);
    } catch (error) {
      console.error('Failed to retrieve document blob:', error);
      // Return empty blob if retrieval fails
      blob = new Blob();
    }

    return {
      id: data.id,
      name: data.name,
      originalName: data.original_name,
      size: data.size_bytes,
      addedDate: new Date(data.created_at!),
      pageCount: data.page_count || undefined,
      blob,
      thumbnail: data.thumbnail_data || undefined
    };
  }

  async list(): Promise<LibraryPDFMetadata[]> {
    const { data: userData } = await this.supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await this.supabase
      .from('documents')
      .select('id, name, original_name, size_bytes, page_count, thumbnail_data, created_at')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to list documents: ${error.message}`);
    }

    return data.map(doc => ({
      id: doc.id,
      name: doc.name,
      originalName: doc.original_name,
      size: doc.size_bytes,
      addedDate: new Date(doc.created_at!),
      pageCount: doc.page_count || undefined,
      thumbnail: doc.thumbnail_data || undefined
    }));
  }

  async delete(id: string): Promise<void> {
    const { data: userData } = await this.supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('User not authenticated');
    }

    // Get document to find storage path
    const { data: doc, error: getError } = await this.supabase
      .from('documents')
      .select('storage_path')
      .eq('id', id)
      .eq('user_id', userData.user.id)
      .single();

    if (getError) {
      if (getError.code === 'PGRST116') {
        return; // Document not found, consider it deleted
      }
      throw new Error(`Failed to get document for deletion: ${getError.message}`);
    }

    // Delete from database first (cascades to related records)
    const { error: deleteError } = await this.supabase
      .from('documents')
      .delete()
      .eq('id', id)
      .eq('user_id', userData.user.id);

    if (deleteError) {
      throw new Error(`Failed to delete document: ${deleteError.message}`);
    }

    // Delete from storage using storage manager (handles both types)
    if (doc.storage_path) {
      await this.storageManager.deletePDF(doc.storage_path);
    }
  }

  async clear(): Promise<void> {
    const { data: userData } = await this.supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('User not authenticated');
    }

    // Get all documents to find storage paths
    const { data: docs, error: listError } = await this.supabase
      .from('documents')
      .select('storage_path')
      .eq('user_id', userData.user.id);

    if (listError) {
      throw new Error(`Failed to list documents for clearing: ${listError.message}`);
    }

    // Delete all documents from database
    const { error: deleteError } = await this.supabase
      .from('documents')
      .delete()
      .eq('user_id', userData.user.id);

    if (deleteError) {
      throw new Error(`Failed to clear documents: ${deleteError.message}`);
    }

    // Delete all files from storage using storage manager
    if (docs && docs.length > 0) {
      const storagePaths = docs
        .map(doc => doc.storage_path)
        .filter(Boolean) as string[];
      
      // Delete each file individually to handle mixed storage types
      for (const storagePath of storagePaths) {
        await this.storageManager.deletePDF(storagePath);
      }
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('documents')
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
        .from('documents')
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

      // Test storage connectivity
      const { data: buckets, error: storageError } = await this.supabase.storage.listBuckets();
      if (storageError) {
        errors.push(`Storage error: ${storageError.message}`);
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

  /**
   * Get storage statistics for the current user
   */
  async getStorageStats(): Promise<{
    totalDocuments: number;
    supabaseStorageUsed: number;
    base64StorageUsed: number;
    totalStorageUsed: number;
  }> {
    const { data: userData } = await this.supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('User not authenticated');
    }

    return await this.storageManager.getStorageStats(userData.user.id);
  }
}

// Export the UploadProgress type for use in components
export type { UploadProgress } from '../../storage/PDFStorageManager';
