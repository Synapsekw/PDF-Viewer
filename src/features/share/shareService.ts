import { ShareRepository } from './types';
import { localLibraryRepo } from '../library/localRepo';

const SHARE_MODE: 'local' = 'local';

class ShareService {
  async createShare(docId: string) {
    console.log('ShareService: Creating share for docId:', docId);
    
    const pdf = await localLibraryRepo.get(docId);
    if (!pdf) {
      console.error('ShareService: Document not found:', docId);
      throw new Error('Document not found');
    }
    
    const token = 'shr_' + Math.random().toString(36).substring(2, 15);
    const meta = {
      title: pdf.name,
      size: pdf.size,
      createdAt: new Date().toISOString()
    };
    
    console.log('ShareService: Generated token:', token, 'for document:', pdf.name);
    
    // Store in localStorage for now
    const shares = JSON.parse(localStorage.getItem('shareLinks') || '{}');
    shares[token] = { docId, meta };
    localStorage.setItem('shareLinks', JSON.stringify(shares));
    
    console.log('ShareService: Stored share link in localStorage. Total shares:', Object.keys(shares).length);
    
    return { token, meta };
  }

  async resolveToken(token: string) {
    console.log('ShareService: Resolving token:', token);
    
    const shares = JSON.parse(localStorage.getItem('shareLinks') || '{}');
    const resolved = shares[token] || null;
    
    console.log('ShareService: Token resolved to:', resolved);
    console.log('ShareService: Available tokens:', Object.keys(shares));
    
    return resolved;
  }

  generatePublicUrl(token: string): string {
    return `${window.location.origin}/s/${token}`;
  }
}

export const shareService = new ShareService();
