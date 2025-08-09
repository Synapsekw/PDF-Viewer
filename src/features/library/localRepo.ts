/**
 * Local storage repository using IndexedDB for PDF library
 */

import * as pdfjsLib from 'pdfjs-dist';
import { LibraryPDF, LibraryPDFMetadata, LibraryRepository } from './types';

const DB_NAME = 'PDFLibrary';
const DB_VERSION = 1;
const STORE_NAME = 'pdfs';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';

class LocalLibraryRepository implements LibraryRepository {
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
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('addedDate', 'addedDate', { unique: false });
          store.createIndex('size', 'size', { unique: false });
        }
      };
    });
  }

  private async generateThumbnail(blob: Blob): Promise<string | undefined> {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      if (pdf.numPages > 0) {
        const page = await pdf.getPage(1);
        
        // Calculate scale to get ultra-high quality thumbnail
        // Target width: 800px for crystal clear quality with no pixelation
        const viewport = page.getViewport({ scale: 1.0 });
        const targetWidth = 800;
        const scale = targetWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return undefined;
        
        // Set canvas size
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        
        // Enable image smoothing for better quality
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        
        await page.render({
          canvasContext: context,
          viewport: scaledViewport,
          canvas: canvas,
        }).promise;
        
        // Use maximum quality JPEG compression for crystal clear thumbnails
        return canvas.toDataURL('image/jpeg', 0.95);
      }
    } catch (error) {
      console.warn('Failed to generate thumbnail:', error);
    }
    return undefined;
  }

  private async getPageCount(blob: Blob): Promise<number | undefined> {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      return pdf.numPages;
    } catch (error) {
      console.warn('Failed to get page count:', error);
      return undefined;
    }
  }

  async add(file: File): Promise<LibraryPDF> {
    const db = await this.dbPromise;
    const id = `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate thumbnail and get page count
    const [thumbnail, pageCount] = await Promise.all([
      this.generateThumbnail(file),
      this.getPageCount(file)
    ]);
    
    const pdfData: LibraryPDF = {
      id,
      name: file.name.replace(/\.pdf$/i, ''),
      originalName: file.name,
      size: file.size,
      addedDate: new Date(),
      pageCount,
      blob: file,
      thumbnail
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(pdfData);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(pdfData);
    });
  }

  async get(id: string): Promise<LibraryPDF | null> {
    const db = await this.dbPromise;
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Convert addedDate back to Date object
          result.addedDate = new Date(result.addedDate);
          resolve(result);
        } else {
          resolve(null);
        }
      };
    });
  }

  async list(): Promise<LibraryPDFMetadata[]> {
    const db = await this.dbPromise;
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const results = request.result.map((pdf: LibraryPDF): LibraryPDFMetadata => ({
          id: pdf.id,
          name: pdf.name,
          originalName: pdf.originalName,
          size: pdf.size,
          addedDate: new Date(pdf.addedDate),
          pageCount: pdf.pageCount,
          thumbnail: pdf.thumbnail
        }));
        resolve(results);
      };
    });
  }

  async delete(id: string): Promise<void> {
    const db = await this.dbPromise;
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    const db = await this.dbPromise;
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }


}

// Export singleton instance
export const localLibraryRepo = new LocalLibraryRepository();
