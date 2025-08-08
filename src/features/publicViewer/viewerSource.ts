import { shareService } from '../share/shareService';
import { localLibraryRepo } from '../library/localRepo';

export class ViewerSource {
  private blobCache = new Map<string, string>();

  async getBlobByToken(token: string): Promise<string | null> {
    try {
      console.log('ViewerSource: Getting blob for token:', token);
      
      // Check cache first
      if (this.blobCache.has(token)) {
        console.log('ViewerSource: Found cached URL for token');
        return this.blobCache.get(token)!;
      }

      const resolved = await shareService.resolveToken(token);
      console.log('ViewerSource: Resolved token:', resolved);
      
      if (!resolved) {
        console.log('ViewerSource: Token not found');
        return null;
      }

      const pdf = await localLibraryRepo.get(resolved.docId);
      console.log('ViewerSource: Got PDF from library:', pdf ? 'found' : 'not found');
      
      if (!pdf || !pdf.blob) {
        console.log('ViewerSource: PDF or blob not found');
        return null;
      }

      const objectUrl = URL.createObjectURL(pdf.blob);
      console.log('ViewerSource: Created object URL:', objectUrl);
      
      // Cache the URL
      this.blobCache.set(token, objectUrl);

      return objectUrl;
    } catch (error) {
      console.error('ViewerSource: Failed to get blob by token:', error);
      return null;
    }
  }

  async getDocumentMeta(token: string): Promise<{ title: string; size: number } | null> {
    try {
      console.log('ViewerSource: Getting meta for token:', token);
      const resolved = await shareService.resolveToken(token);
      console.log('ViewerSource: Meta resolved:', resolved);
      return resolved ? { title: resolved.meta.title, size: resolved.meta.size } : null;
    } catch (error) {
      console.error('ViewerSource: Failed to get document meta:', error);
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

export const viewerSource = new ViewerSource();
