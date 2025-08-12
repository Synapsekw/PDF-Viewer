/**
 * Enhanced Share service with Supabase integration and fallback support
 */

import { ShareRepository } from './types';
import { localShareRepo } from './shareRepo.local';
import { SupabaseShareRepository } from '../../lib/repositories/supabase/ShareRepository';
import { SupabaseClientManager } from '../../lib/supabase/client';

// Configuration - can be changed at runtime
let SHARE_MODE: 'local' | 'supabase' | 'auto' = 'auto';

class ShareService {
  private repo: ShareRepository | null = null;
  private supabaseRepo: SupabaseShareRepository | null = null;
  private localRepo: ShareRepository;

  constructor() {
    this.localRepo = localShareRepo;
    this.initializeRepository();
  }

  private initializeRepository(): void {
    const supabase = SupabaseClientManager.getClient();
    
    if (supabase) {
      this.supabaseRepo = new SupabaseShareRepository(supabase);
    }

    this.repo = this.getRepository();
  }

  private getRepository(): ShareRepository {
    switch (SHARE_MODE) {
      case 'local':
        return this.localRepo;
      case 'supabase':
        if (!this.supabaseRepo) {
          throw new Error('Supabase not available, falling back to local');
        }
        return this.supabaseRepo;
      case 'auto':
        // Prefer Supabase if available, fallback to local
        return this.supabaseRepo || this.localRepo;
      default:
        throw new Error(`Unknown share mode: ${SHARE_MODE}`);
    }
  }

  /**
   * Set the sharing mode
   */
  setMode(mode: 'local' | 'supabase' | 'auto'): void {
    SHARE_MODE = mode;
    this.repo = this.getRepository();
  }

  /**
   * Get current sharing mode
   */
  getMode(): 'local' | 'supabase' | 'auto' {
    return SHARE_MODE;
  }

  /**
   * Check if Supabase sharing is available
   */
  isSupabaseAvailable(): boolean {
    return this.supabaseRepo !== null;
  }

  async createShare(docId: string, expiryDays?: number) {
    if (!this.repo) {
      throw new Error('Share repository not initialized');
    }

    try {
      return await this.repo.createShare(docId, expiryDays);
    } catch (error) {
      // If Supabase fails and we're in auto mode, try local fallback
      if (SHARE_MODE === 'auto' && this.supabaseRepo && this.repo === this.supabaseRepo) {
        console.warn('Supabase share creation failed, falling back to local:', error);
        return await this.localRepo.createShare(docId, expiryDays);
      }
      throw error;
    }
  }

  async resolveToken(token: string) {
    if (!this.repo) {
      throw new Error('Share repository not initialized');
    }

    try {
      return await this.repo.resolveToken(token);
    } catch (error) {
      // If Supabase fails and we're in auto mode, try local fallback
      if (SHARE_MODE === 'auto' && this.supabaseRepo && this.repo === this.supabaseRepo) {
        console.warn('Supabase token resolution failed, trying local:', error);
        return await this.localRepo.resolveToken(token);
      }
      throw error;
    }
  }

  async listShares() {
    if (!this.repo) {
      throw new Error('Share repository not initialized');
    }

    try {
      return await this.repo.listShares();
    } catch (error) {
      // If Supabase fails and we're in auto mode, try local fallback
      if (SHARE_MODE === 'auto' && this.supabaseRepo && this.repo === this.supabaseRepo) {
        console.warn('Supabase shares listing failed, falling back to local:', error);
        return await this.localRepo.listShares();
      }
      throw error;
    }
  }

  async revokeShare(token: string) {
    if (!this.repo) {
      throw new Error('Share repository not initialized');
    }

    return await this.repo.revokeShare(token);
  }

  /**
   * Create an enhanced share with advanced options (Supabase only)
   */
  async createEnhancedShare(docId: string, options: {
    expirationDays?: number;
    requirePassword?: boolean;
    password?: string;
    allowDownload?: boolean;
    allowPrint?: boolean;
    trackAnalytics?: boolean;
    maxViews?: number;
    metadata?: Record<string, any>;
  }) {
    if (!this.supabaseRepo) {
      throw new Error('Enhanced sharing requires Supabase integration');
    }

    return await this.supabaseRepo.createShare(docId, options);
  }

  /**
   * Update share settings (Supabase only)
   */
  async updateShare(token: string, updates: any) {
    if (!this.supabaseRepo) {
      throw new Error('Share updates require Supabase integration');
    }

    return await this.supabaseRepo.updateShare(token, updates);
  }

  /**
   * Get public document data (Supabase only)
   */
  async getPublicDocument(token: string) {
    if (!this.supabaseRepo) {
      throw new Error('Public document access requires Supabase integration');
    }

    return await this.supabaseRepo.getPublicDocument(token);
  }

  /**
   * Verify share password (Supabase only)
   */
  async verifySharePassword(token: string, password: string) {
    if (!this.supabaseRepo) {
      throw new Error('Password verification requires Supabase integration');
    }

    return await this.supabaseRepo.verifySharePassword(token, password);
  }

  generatePublicUrl(token: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/s/${token}`;
  }

  generateViewerUrl(token: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/v/${token}`;
  }

  generateEnhancedViewerUrl(token: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/enhanced/${token}`;
  }

  /**
   * Get sharing statistics
   */
  async getShareStats(token: string) {
    if (!this.supabaseRepo) {
      return null;
    }

    try {
      const shareData = await this.supabaseRepo.resolveToken(token);
      return shareData ? {
        accessCount: shareData.accessCount,
        maxViews: shareData.maxViews,
        lastAccessed: shareData.lastAccessed,
        expiresAt: shareData.expiresAt,
        isPasswordProtected: shareData.isPasswordProtected
      } : null;
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const shareService = new ShareService();