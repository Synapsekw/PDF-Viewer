import { ShareRepository } from './types';
import { localLibraryRepo } from '../library/localRepo';

const SHARE_MODE: 'local' = 'local';

class ShareService {
  async createShare(docId: string) {
    const pdf = await localLibraryRepo.get(docId);
    if (!pdf) throw new Error('Document not found');
    
    const token = 'shr_' + Math.random().toString(36).substring(2, 15);
    const meta = {
      title: pdf.name,
      size: pdf.size,
      createdAt: new Date().toISOString()
    };
    
    // Store in localStorage for now
    const shares = JSON.parse(localStorage.getItem('shareLinks') || '{}');
    shares[token] = { docId, meta };
    localStorage.setItem('shareLinks', JSON.stringify(shares));
    
    return { token, meta };
  }

  async resolveToken(token: string) {
    const shares = JSON.parse(localStorage.getItem('shareLinks') || '{}');
    return shares[token] || null;
  }

  generatePublicUrl(token: string): string {
    return `${window.location.origin}/s/${token}`;
  }
}

export const shareService = new ShareService();
