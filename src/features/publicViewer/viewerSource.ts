import { shareService } from '../share/shareService';
import { localLibraryRepo } from '../library/localRepo';

export class ViewerSource {
  async getBlobByToken(token: string): Promise<string | null> {
    try {
      const resolved = await shareService.resolveToken(token);
      if (!resolved) return null;

      const pdf = await localLibraryRepo.get(resolved.docId);
      if (!pdf) return null;

      return URL.createObjectURL(pdf.blob);
    } catch (error) {
      console.error('Failed to get blob by token:', error);
      return null;
    }
  }

  async getDocumentMeta(token: string): Promise<{ title: string; size: number } | null> {
    try {
      const resolved = await shareService.resolveToken(token);
      return resolved ? { title: resolved.meta.title, size: resolved.meta.size } : null;
    } catch (error) {
      return null;
    }
  }
}

export const viewerSource = new ViewerSource();
