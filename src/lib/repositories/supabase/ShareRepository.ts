/**
 * Enhanced Supabase implementation of Share Repository with public bucket support
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database, DocumentShareInsert, DocumentShareUpdate } from '../../supabase/database.types';
import { ShareData, ShareRepository } from '../interfaces';
import { PDFStorageManager } from '../../storage/PDFStorageManager';

export interface PublicShareOptions {
  expirationDays?: number;
  requirePassword?: boolean;
  password?: string;
  allowDownload?: boolean;
  allowPrint?: boolean;
  trackAnalytics?: boolean;
  maxViews?: number;
  metadata?: Record<string, any>;
}

export interface PublicShareData extends ShareData {
  publicUrl: string;
  publicStoragePath?: string;
  accessCount: number;
  maxViews?: number;
  lastAccessed?: Date;
  expiresAt?: Date;
  isPasswordProtected: boolean;
  allowDownload: boolean;
  allowPrint: boolean;
  trackAnalytics: boolean;
}

export class SupabaseShareRepository implements ShareRepository {
  private storageManager: PDFStorageManager;

  constructor(private supabase: SupabaseClient<Database>) {
    this.storageManager = new PDFStorageManager(supabase);
  }

  async createShare(
    docId: string, 
    options: PublicShareOptions = {}
  ): Promise<PublicShareData> {
    const { data: userData } = await this.supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('User not authenticated');
    }

    // Get the document
    const { data: document, error: docError } = await this.supabase
      .from('documents')
      .select('*')
      .eq('id', docId)
      .eq('user_id', userData.user.id)
      .single();

    if (docError || !document) {
      throw new Error('Document not found or access denied');
    }

    // Generate share token
    const token = this.generateShareToken();
    
    // Calculate expiration
    const expirationDays = options.expirationDays || 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    // Copy document to public storage for public access
    let publicStoragePath: string | undefined;
    if (document.storage_path) {
      try {
        publicStoragePath = await this.copyToPublicStorage(document.storage_path, token);
      } catch (error) {
        console.warn('Failed to copy to public storage:', error);
        // Continue without public storage - will use regular storage with access control
      }
    }

    // Create share record
    const shareData: DocumentShareInsert = {
      token,
      document_id: docId,
      created_by: userData.user.id,
      expires_at: expiresAt.toISOString(),
      is_active: true,
      access_count: 0,
      metadata: {
        ...options.metadata,
        requirePassword: options.requirePassword || false,
        password: options.password ? await this.hashPassword(options.password) : null,
        allowDownload: options.allowDownload !== false,
        allowPrint: options.allowPrint !== false,
        trackAnalytics: options.trackAnalytics !== false,
        maxViews: options.maxViews,
        publicStoragePath
      }
    };

    const { data: share, error: shareError } = await this.supabase
      .from('document_shares')
      .insert(shareData)
      .select()
      .single();

    if (shareError) {
      // Clean up public storage if share creation fails
      if (publicStoragePath) {
        await this.deleteFromPublicStorage(publicStoragePath);
      }
      throw new Error(`Failed to create share: ${shareError.message}`);
    }

    return this.transformToPublicShareData(share, document);
  }

  async resolveToken(token: string): Promise<PublicShareData | null> {
    // Get share with document data
    const { data: share, error } = await this.supabase
      .from('document_shares')
      .select(`
        *,
        documents (*)
      `)
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (error || !share) {
      return null;
    }

    // Check expiration
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return null;
    }

    // Check max views
    const metadata = share.metadata as any;
    if (metadata?.maxViews && share.access_count >= metadata.maxViews) {
      return null;
    }

    return this.transformToPublicShareData(share, (share as any).documents);
  }

  async listShares(): Promise<PublicShareData[]> {
    const { data: userData } = await this.supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('User not authenticated');
    }

    const { data: shares, error } = await this.supabase
      .from('document_shares')
      .select(`
        *,
        documents (*)
      `)
      .eq('created_by', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to list shares: ${error.message}`);
    }

    return shares.map(share => 
      this.transformToPublicShareData(share, (share as any).documents)
    );
  }

  async revokeShare(token: string): Promise<void> {
    const { data: userData } = await this.supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('User not authenticated');
    }

    // Get share data first
    const { data: share, error: getError } = await this.supabase
      .from('document_shares')
      .select('metadata')
      .eq('token', token)
      .eq('created_by', userData.user.id)
      .single();

    if (getError && getError.code !== 'PGRST116') {
      throw new Error(`Failed to get share for revocation: ${getError.message}`);
    }

    // Deactivate share
    const { error: updateError } = await this.supabase
      .from('document_shares')
      .update({ is_active: false })
      .eq('token', token)
      .eq('created_by', userData.user.id);

    if (updateError) {
      throw new Error(`Failed to revoke share: ${updateError.message}`);
    }

    // Clean up public storage if exists
    if (share?.metadata) {
      const metadata = share.metadata as any;
      if (metadata.publicStoragePath) {
        await this.deleteFromPublicStorage(metadata.publicStoragePath);
      }
    }
  }

  /**
   * Get public document data by token (for public access)
   */
  async getPublicDocument(token: string): Promise<{
    document: any;
    blob?: Blob;
    metadata: any;
  } | null> {
    // Use Supabase function for secure token resolution
    const { data, error } = await this.supabase.rpc('get_public_document', {
      share_token: token
    });

    if (error || !data || data.length === 0) {
      return null;
    }

    const docData = data[0];
    
    // Get share metadata
    const { data: shareData, error: shareError } = await this.supabase
      .from('document_shares')
      .select('metadata, access_count')
      .eq('token', token)
      .single();

    if (shareError) {
      return null;
    }

    const metadata = shareData.metadata as any;
    
    // Try to get blob from public storage first, then fall back to regular storage
    let blob: Blob | undefined;
    try {
      if (metadata?.publicStoragePath) {
        blob = await this.getFromPublicStorage(metadata.publicStoragePath);
      } else if (docData.storage_path) {
        // Use storage manager for regular storage access
        blob = await this.storageManager.retrievePDF(docData.storage_path);
      }
    } catch (error) {
      console.warn('Failed to retrieve document blob:', error);
    }

    // Increment access count
    await this.supabase.rpc('increment_share_access', { share_token: token });

    return {
      document: {
        id: docData.document_id,
        name: docData.document_name,
        size: docData.document_size,
        pageCount: docData.page_count,
        createdAt: docData.created_at
      },
      blob,
      metadata: {
        allowDownload: metadata?.allowDownload !== false,
        allowPrint: metadata?.allowPrint !== false,
        trackAnalytics: metadata?.trackAnalytics !== false,
        accessCount: shareData.access_count + 1,
        maxViews: metadata?.maxViews
      }
    };
  }

  /**
   * Verify password for password-protected shares
   */
  async verifySharePassword(token: string, password: string): Promise<boolean> {
    const { data: share, error } = await this.supabase
      .from('document_shares')
      .select('metadata')
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (error || !share) {
      return false;
    }

    const metadata = share.metadata as any;
    if (!metadata?.requirePassword || !metadata?.password) {
      return true; // No password required
    }

    return await this.verifyPassword(password, metadata.password);
  }

  /**
   * Update share settings
   */
  async updateShare(
    token: string, 
    updates: Partial<PublicShareOptions>
  ): Promise<PublicShareData> {
    const { data: userData } = await this.supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('User not authenticated');
    }

    // Get current share
    const { data: currentShare, error: getError } = await this.supabase
      .from('document_shares')
      .select(`
        *,
        documents (*)
      `)
      .eq('token', token)
      .eq('created_by', userData.user.id)
      .single();

    if (getError || !currentShare) {
      throw new Error('Share not found or access denied');
    }

    const currentMetadata = currentShare.metadata as any || {};
    
    // Prepare updates
    const updateData: DocumentShareUpdate = {};
    
    if (updates.expirationDays !== undefined) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + updates.expirationDays);
      updateData.expires_at = expiresAt.toISOString();
    }

    // Update metadata
    const newMetadata = {
      ...currentMetadata,
      ...(updates.allowDownload !== undefined && { allowDownload: updates.allowDownload }),
      ...(updates.allowPrint !== undefined && { allowPrint: updates.allowPrint }),
      ...(updates.trackAnalytics !== undefined && { trackAnalytics: updates.trackAnalytics }),
      ...(updates.maxViews !== undefined && { maxViews: updates.maxViews }),
      ...(updates.requirePassword !== undefined && { requirePassword: updates.requirePassword }),
      ...(updates.password && { password: await this.hashPassword(updates.password) }),
      ...updates.metadata
    };

    updateData.metadata = newMetadata;

    // Apply updates
    const { data: updatedShare, error: updateError } = await this.supabase
      .from('document_shares')
      .update(updateData)
      .eq('token', token)
      .eq('created_by', userData.user.id)
      .select(`
        *,
        documents (*)
      `)
      .single();

    if (updateError) {
      throw new Error(`Failed to update share: ${updateError.message}`);
    }

    return this.transformToPublicShareData(updatedShare, (updatedShare as any).documents);
  }

  // Private helper methods

  private generateShareToken(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(36))
      .join('')
      .slice(0, 32);
  }

  private async copyToPublicStorage(sourcePath: string, token: string): Promise<string> {
    try {
      // Download from private storage
      const { data: sourceBlob, error: downloadError } = await this.supabase.storage
        .from('documents')
        .download(sourcePath);

      if (downloadError) {
        throw downloadError;
      }

      // Upload to public bucket
      const publicPath = `public-shares/${token}.pdf`;
      const { error: uploadError } = await this.supabase.storage
        .from('public-documents')
        .upload(publicPath, sourceBlob, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      return publicPath;
    } catch (error) {
      throw new Error(`Failed to copy to public storage: ${error.message}`);
    }
  }

  private async getFromPublicStorage(publicPath: string): Promise<Blob> {
    const { data, error } = await this.supabase.storage
      .from('public-documents')
      .download(publicPath);

    if (error) {
      throw new Error(`Failed to download from public storage: ${error.message}`);
    }

    return data;
  }

  private async deleteFromPublicStorage(publicPath: string): Promise<void> {
    await this.supabase.storage
      .from('public-documents')
      .remove([publicPath])
      .catch(error => {
        console.warn('Failed to delete from public storage:', error);
      });
  }

  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await this.hashPassword(password);
    return passwordHash === hash;
  }

  private transformToPublicShareData(share: any, document: any): PublicShareData {
    const metadata = share.metadata as any || {};
    
    return {
      token: share.token,
      docId: share.document_id,
      createdAt: new Date(share.created_at),
      isActive: share.is_active,
      publicUrl: this.generatePublicUrl(share.token),
      publicStoragePath: metadata.publicStoragePath,
      accessCount: share.access_count || 0,
      maxViews: metadata.maxViews,
      lastAccessed: share.last_accessed_at ? new Date(share.last_accessed_at) : undefined,
      expiresAt: share.expires_at ? new Date(share.expires_at) : undefined,
      isPasswordProtected: metadata.requirePassword || false,
      allowDownload: metadata.allowDownload !== false,
      allowPrint: metadata.allowPrint !== false,
      trackAnalytics: metadata.trackAnalytics !== false,
      docName: document?.name || 'Unknown Document',
      docSize: document?.size_bytes || 0
    };
  }

  private generatePublicUrl(token: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/s/${token}`;
  }
}