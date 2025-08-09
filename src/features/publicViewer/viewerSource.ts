/**
 * Viewer source utilities for loading PDFs in public viewer
 */

import { shareService } from '../share/shareService';
import { localLibraryRepo } from '../library/localRepo';

export class ViewerSource {
  private isInitialized = false;
  
  private async checkDatabaseConnectivity(): Promise<boolean> {
    try {
      // Check if IndexedDB is available
      if (typeof indexedDB === 'undefined') {
        console.error('ViewerSource: IndexedDB is not available');
        return false;
      }
      
      // Try to test database connectivity
      await shareService.listShares();
      console.log('ViewerSource: Database connectivity verified');
      return true;
    } catch (error) {
      console.error('ViewerSource: Database connectivity failed:', error);
      return false;
    }
  }
  
  private async ensureInitialized(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }
    
    console.log('ViewerSource: Initializing and checking database connectivity...');
    const isConnected = await this.checkDatabaseConnectivity();
    this.isInitialized = isConnected;
    return isConnected;
  }
  private blobCache = new Map<string, string>();

  async getBlobByToken(token: string): Promise<string | null> {
    try {
      console.log('ViewerSource: getBlobByToken called with token:', token);
      
      // Ensure database connectivity
      const isInitialized = await this.ensureInitialized();
      if (!isInitialized) {
        console.error('ViewerSource: Database not accessible, cannot retrieve PDF');
        return null;
      }
      
      // Check cache first
      if (this.blobCache.has(token)) {
        console.log('ViewerSource: Found cached URL for token');
        return this.blobCache.get(token)!;
      }

      console.log('ViewerSource: Resolving token to docId...');
      // Resolve token to get docId
      const resolved = await shareService.resolveToken(token);
      if (!resolved) {
        console.error('ViewerSource: Token could not be resolved - token may be invalid or expired');
        return null;
      }
      console.log('ViewerSource: Token resolved to docId:', resolved.docId);

      console.log('ViewerSource: Retrieving PDF from library...');
      // Get PDF blob from library
      const pdf = await localLibraryRepo.get(resolved.docId);
      if (!pdf) {
        console.error('ViewerSource: PDF not found in library for docId:', resolved.docId);
        return null;
      }
      console.log('ViewerSource: PDF retrieved from library, blob size:', pdf.blob.size, 'bytes');

      // Validate blob
      if (!pdf.blob || pdf.blob.size === 0) {
        console.error('ViewerSource: Invalid or empty PDF blob');
        return null;
      }

      // Verify blob type
      if (pdf.blob.type && !pdf.blob.type.includes('pdf')) {
        console.warn('ViewerSource: Blob type is not PDF:', pdf.blob.type);
      }

      console.log('ViewerSource: Creating object URL...');
      // Create object URL
      const objectUrl = URL.createObjectURL(pdf.blob);
      console.log('ViewerSource: Object URL created:', objectUrl);
      
      // Cache the URL
      this.blobCache.set(token, objectUrl);

      return objectUrl;
    } catch (error) {
      console.error('ViewerSource: Failed to get blob by token:', token, error);
      console.error('ViewerSource: Error stack:', error.stack);
      
      // Check if it's an IndexedDB related error
      if (error.name === 'InvalidStateError' || error.name === 'UnknownError') {
        console.error('ViewerSource: IndexedDB error detected - database may not be accessible');
      }
      
      return null;
    }
  }

  async getDocumentMeta(token: string): Promise<{ title: string; size: number } | null> {
    try {
      console.log('ViewerSource: getDocumentMeta called with token:', token);
      
      // Ensure database connectivity
      const isInitialized = await this.ensureInitialized();
      if (!isInitialized) {
        console.error('ViewerSource: Database not accessible, cannot retrieve meta data');
        return null;
      }
      
      const resolved = await shareService.resolveToken(token);
      if (!resolved) {
        console.error('ViewerSource: Token could not be resolved for meta data');
        return null;
      }

      console.log('ViewerSource: Meta data retrieved:', resolved.meta);
      return {
        title: resolved.meta.title,
        size: resolved.meta.size
      };
    } catch (error) {
      console.error('ViewerSource: Failed to get document meta:', token, error);
      return null;
    }
  }

  revokeObjectUrl(token: string): void {
    const url = this.blobCache.get(token);
    if (url) {
      URL.revokeObjectURL(url);
      this.blobCache.delete(token);
    }
  }

  cleanup(): void {
    // Revoke all cached URLs
    for (const [token, url] of this.blobCache) {
      URL.revokeObjectURL(url);
    }
    this.blobCache.clear();
  }
}

// Export singleton instance
export const viewerSource = new ViewerSource();