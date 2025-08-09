/**
 * Viewer source utilities for loading PDFs in public viewer
 */

import { shareService } from '../share/shareService';
import { localLibraryRepo } from '../library/localRepo';

export class ViewerSource {
  private blobCache = new Map<string, string>();

  async getBlobByToken(token: string): Promise<string | null> {
    try {
      // Check cache first
      if (this.blobCache.has(token)) {
        return this.blobCache.get(token)!;
      }

      // Resolve token to get docId
      const resolved = await shareService.resolveToken(token);
      if (!resolved) {
        return null;
      }

      // Get PDF blob from library
      const pdf = await localLibraryRepo.get(resolved.docId);
      if (!pdf) {
        return null;
      }

      // Create object URL
      const objectUrl = URL.createObjectURL(pdf.blob);
      
      // Cache the URL
      this.blobCache.set(token, objectUrl);

      return objectUrl;
    } catch (error) {
      console.error('Failed to get blob by token:', error);
      return null;
    }
  }

  async getDocumentMeta(token: string): Promise<{ title: string; size: number } | null> {
    try {
      const resolved = await shareService.resolveToken(token);
      if (!resolved) {
        return null;
      }

      return {
        title: resolved.meta.title,
        size: resolved.meta.size
      };
    } catch (error) {
      console.error('Failed to get document meta:', error);
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