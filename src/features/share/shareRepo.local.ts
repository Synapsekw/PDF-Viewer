/**
 * Local IndexedDB implementation of ShareRepository
 */

import { ShareRepository, ShareMeta, ShareLink } from './types';
import { localLibraryRepo } from '../library/localRepo';

const DB_NAME = 'PDFShareLinks';
const DB_VERSION = 1;
const STORE_NAME = 'shares';

class LocalShareRepository implements ShareRepository {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = this.initDB();
  }

  private async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'token' });
          store.createIndex('docId', 'docId', { unique: false });
          store.createIndex('createdAt', 'meta.createdAt', { unique: false });
        }
      };
    });
  }

  private generateToken(): string {
    // Generate a URL-safe random token
    return 'shr_' + Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(36))
      .join('')
      .substring(0, 16);
  }

  async createShare(docId: string, expiryDays?: number): Promise<{ token: string; meta: ShareMeta }> {
    // Get document metadata from library
    const pdf = await localLibraryRepo.get(docId);
    if (!pdf) {
      throw new Error('Document not found');
    }

    const token = this.generateToken();
    const now = new Date();
    const expiresAt = expiryDays ? new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000).toISOString() : undefined;
    
    const meta: ShareMeta = {
      title: pdf.name,
      size: pdf.size,
      createdAt: now.toISOString(),
      expiresAt
    };

    const shareLink: ShareLink = {
      token,
      docId,
      meta
    };

    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(shareLink);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve({ token, meta });
    });
  }

  async resolveToken(token: string): Promise<{ docId: string; meta: ShareMeta } | null> {
    try {
      console.log('LocalShareRepository: Resolving token:', token);
      const db = await this.dbPromise;
      console.log('LocalShareRepository: Database connection established for token resolution');
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(token);

        request.onerror = () => {
          console.error('LocalShareRepository: Error resolving token:', request.error);
          reject(request.error);
        };
        request.onsuccess = () => {
          const result = request.result as ShareLink;
          if (result) {
            // Check if share has expired
            if (result.meta.expiresAt && new Date(result.meta.expiresAt) < new Date()) {
              console.log('LocalShareRepository: Token has expired:', token);
              resolve(null);
              return;
            }
            
            console.log('LocalShareRepository: Token resolved successfully:', {
              docId: result.docId,
              title: result.meta.title
            });
            resolve({
              docId: result.docId,
              meta: result.meta
            });
          } else {
            console.log('LocalShareRepository: Token not found in database:', token);
            resolve(null);
          }
        };
      });
    } catch (error) {
      console.error('LocalShareRepository: Database connection failed for token resolution:', error);
      throw error;
    }
  }

  async listShares(): Promise<Array<{ token: string; meta: ShareMeta }>> {
    const db = await this.dbPromise;
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const results = request.result as ShareLink[];
        resolve(results.map(share => ({
          token: share.token,
          meta: share.meta
        })));
      };
    });
  }

  async revokeShare(token: string): Promise<void> {
    const db = await this.dbPromise;
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(token);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// Export singleton instance
export const localShareRepo = new LocalShareRepository();