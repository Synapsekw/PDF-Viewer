/**
 * Share service with mode switching capability
 */

import { ShareRepository } from './types';
import { localShareRepo } from './shareRepo.local';

// Configuration
const SHARE_MODE: 'local' | 'supabase' = 'local';

class ShareService {
  private repo: ShareRepository;

  constructor() {
    this.repo = this.getRepository();
  }

  private getRepository(): ShareRepository {
    switch (SHARE_MODE) {
      case 'local':
        return localShareRepo;
      case 'supabase':
        // TODO: Implement when backend is ready
        throw new Error('Supabase share repository not implemented yet');
      default:
        throw new Error(`Unknown share mode: ${SHARE_MODE}`);
    }
  }

  async createShare(docId: string) {
    return this.repo.createShare(docId);
  }

  async resolveToken(token: string) {
    return this.repo.resolveToken(token);
  }

  async listShares() {
    return this.repo.listShares();
  }

  async revokeShare(token: string) {
    return this.repo.revokeShare(token);
  }

  generatePublicUrl(token: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/s/${token}`;
  }

  generateViewerUrl(token: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/v/${token}`;
  }
}

// Export singleton instance
export const shareService = new ShareService();