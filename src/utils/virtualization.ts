/**
 * Virtualization utilities for handling large PDFs efficiently.
 * Implements page preloading, caching, and memory management.
 */

import { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

/**
 * Configuration for PDF virtualization.
 */
export interface VirtualizationConfig {
  /** Number of pages to preload around current page */
  preloadRange: number;
  /** Maximum number of rendered pages to keep in memory */
  maxCachedPages: number;
  /** Maximum canvas memory usage (MB) */
  maxCanvasMemory: number;
  /** Enable page recycling for memory optimization */
  enablePageRecycling: boolean;
  /** Thumbnail size for page previews */
  thumbnailSize: { width: number; height: number };
}

/**
 * Default virtualization configuration.
 */
export const DEFAULT_VIRTUALIZATION_CONFIG: VirtualizationConfig = {
  preloadRange: 2,
  maxCachedPages: 10,
  maxCanvasMemory: 100, // 100MB
  enablePageRecycling: true,
  thumbnailSize: { width: 150, height: 200 },
};

/**
 * Cached page data structure.
 */
interface CachedPage {
  pageNumber: number;
  page: PDFPageProxy;
  canvas?: HTMLCanvasElement;
  thumbnail?: HTMLCanvasElement;
  lastAccessed: number;
  memoryUsage: number;
}

/**
 * Page loading task.
 */
interface PageLoadingTask {
  pageNumber: number;
  promise: Promise<PDFPageProxy>;
  priority: number;
}

/**
 * Viewport configuration for page rendering.
 */
export interface ViewportConfig {
  scale: number;
  rotation: number;
}

/**
 * PDF page virtualization manager.
 * Handles efficient loading, caching, and rendering of PDF pages.
 */
export class PDFVirtualizationManager {
  private document: PDFDocumentProxy | null = null;
  private pageCache = new Map<number, CachedPage>();
  private loadingTasks = new Map<number, PageLoadingTask>();
  private config: VirtualizationConfig;
  private currentPage = 1;
  private currentMemoryUsage = 0;
  
  constructor(config: Partial<VirtualizationConfig> = {}) {
    this.config = { ...DEFAULT_VIRTUALIZATION_CONFIG, ...config };
  }
  
  /**
   * Set the PDF document to virtualize.
   * @param document - PDF document proxy
   */
  setDocument(document: PDFDocumentProxy): void {
    this.document = document;
    this.clearCache();
  }
  
  /**
   * Set the current page number.
   * @param pageNumber - Current page number
   */
  setCurrentPage(pageNumber: number): void {
    if (pageNumber === this.currentPage) return;
    
    this.currentPage = pageNumber;
    this.preloadPages();
    this.cleanupCache();
  }
  
  /**
   * Get a page with caching and preloading.
   * @param pageNumber - Page number to get
   * @returns Promise that resolves to the page proxy
   */
  async getPage(pageNumber: number): Promise<PDFPageProxy> {
    if (!this.document) {
      throw new Error('No document set');
    }
    
    // Check cache first
    const cached = this.pageCache.get(pageNumber);
    if (cached) {
      cached.lastAccessed = Date.now();
      return cached.page;
    }
    
    // Check if already loading
    const loadingTask = this.loadingTasks.get(pageNumber);
    if (loadingTask) {
      return loadingTask.promise;
    }
    
    // Start loading the page
    const promise = this.loadPage(pageNumber);
    this.loadingTasks.set(pageNumber, {
      pageNumber,
      promise,
      priority: this.getLoadingPriority(pageNumber),
    });
    
    return promise;
  }
  
  /**
   * Render a page to canvas with caching.
   * @param pageNumber - Page number to render
   * @param canvas - Canvas element to render to
   * @param viewport - Viewport configuration
   */
  async renderPage(
    pageNumber: number,
    canvas: HTMLCanvasElement,
    viewport: ViewportConfig
  ): Promise<void> {
    const page = await this.getPage(pageNumber);
    const pdfViewport = page.getViewport({
      scale: viewport.scale,
      rotation: viewport.rotation,
    });
    
    // Set canvas dimensions
    canvas.width = pdfViewport.width;
    canvas.height = pdfViewport.height;
    
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get canvas context');
    }
    
    // Render the page
    const renderContext = {
      canvasContext: context,
      viewport: pdfViewport,
    };
    
    await page.render(renderContext).promise;
    
    // Update cache with rendered canvas
    const cached = this.pageCache.get(pageNumber);
    if (cached) {
      cached.canvas = canvas;
      cached.memoryUsage = this.calculateCanvasMemory(canvas);
      this.currentMemoryUsage += cached.memoryUsage;
    }
  }
  
  /**
   * Generate thumbnail for a page.
   * @param pageNumber - Page number
   * @returns Promise that resolves to thumbnail canvas
   */
  async generateThumbnail(pageNumber: number): Promise<HTMLCanvasElement> {
    const cached = this.pageCache.get(pageNumber);
    if (cached?.thumbnail) {
      return cached.thumbnail;
    }
    
    const page = await this.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 0.2 }); // Small scale for thumbnail
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get canvas context');
    }
    
    // Scale to thumbnail size while maintaining aspect ratio
    const scale = Math.min(
      this.config.thumbnailSize.width / viewport.width,
      this.config.thumbnailSize.height / viewport.height
    );
    
    canvas.width = viewport.width * scale;
    canvas.height = viewport.height * scale;
    
    const scaledViewport = page.getViewport({ scale: scale * 0.2 });
    
    await page.render({
      canvasContext: context,
      viewport: scaledViewport,
    }).promise;
    
    // Cache the thumbnail
    if (cached) {
      cached.thumbnail = canvas;
    }
    
    return canvas;
  }
  
  /**
   * Preload pages around the current page.
   */
  private async preloadPages(): Promise<void> {
    if (!this.document) return;
    
    const totalPages = this.document.numPages;
    const start = Math.max(1, this.currentPage - this.config.preloadRange);
    const end = Math.min(totalPages, this.currentPage + this.config.preloadRange);
    
    const preloadPromises: Promise<void>[] = [];
    
    for (let pageNum = start; pageNum <= end; pageNum++) {
      if (!this.pageCache.has(pageNum) && !this.loadingTasks.has(pageNum)) {
        preloadPromises.push(
          this.getPage(pageNum).then(() => {
            // Page loaded and cached
          }).catch((error) => {
            console.warn(`Failed to preload page ${pageNum}:`, error);
          })
        );
      }
    }
    
    // Don't wait for all preloads to complete
    Promise.all(preloadPromises).catch(() => {
      // Ignore preload failures
    });
  }
  
  /**
   * Load a single page.
   * @param pageNumber - Page number to load
   * @returns Promise that resolves to the page proxy
   */
  private async loadPage(pageNumber: number): Promise<PDFPageProxy> {
    if (!this.document) {
      throw new Error('No document set');
    }
    
    try {
      const page = await this.document.getPage(pageNumber);
      
      // Cache the page
      const cached: CachedPage = {
        pageNumber,
        page,
        lastAccessed: Date.now(),
        memoryUsage: 0, // Will be updated when rendered
      };
      
      this.pageCache.set(pageNumber, cached);
      this.loadingTasks.delete(pageNumber);
      
      return page;
    } catch (error) {
      this.loadingTasks.delete(pageNumber);
      throw error;
    }
  }
  
  /**
   * Calculate loading priority for a page.
   * @param pageNumber - Page number
   * @returns Priority score (lower = higher priority)
   */
  private getLoadingPriority(pageNumber: number): number {
    const distance = Math.abs(pageNumber - this.currentPage);
    
    // Current page has highest priority (0)
    // Adjacent pages have priority 1, etc.
    return distance;
  }
  
  /**
   * Clean up old cached pages to free memory.
   */
  private cleanupCache(): void {
    const cached = Array.from(this.pageCache.values());
    
    // Sort by last accessed time (oldest first)
    cached.sort((a, b) => a.lastAccessed - b.lastAccessed);
    
    // Remove pages until we're under limits
    while (
      this.pageCache.size > this.config.maxCachedPages ||
      this.currentMemoryUsage > this.config.maxCanvasMemory * 1024 * 1024
    ) {
      const oldest = cached.shift();
      if (!oldest) break;
      
      // Don't remove pages in the preload range
      const distance = Math.abs(oldest.pageNumber - this.currentPage);
      if (distance <= this.config.preloadRange) {
        continue;
      }
      
      this.pageCache.delete(oldest.pageNumber);
      this.currentMemoryUsage -= oldest.memoryUsage;
      
      // Clean up canvas memory
      if (oldest.canvas) {
        oldest.canvas.width = 0;
        oldest.canvas.height = 0;
      }
      if (oldest.thumbnail) {
        oldest.thumbnail.width = 0;
        oldest.thumbnail.height = 0;
      }
    }
  }
  
  /**
   * Calculate approximate memory usage of a canvas.
   * @param canvas - Canvas element
   * @returns Memory usage in bytes
   */
  private calculateCanvasMemory(canvas: HTMLCanvasElement): number {
    // RGBA = 4 bytes per pixel
    return canvas.width * canvas.height * 4;
  }
  
  /**
   * Clear all cached pages.
   */
  clearCache(): void {
    this.pageCache.clear();
    this.loadingTasks.clear();
    this.currentMemoryUsage = 0;
  }
  
  /**
   * Get cache statistics.
   * @returns Cache statistics
   */
  getCacheStats(): {
    cachedPages: number;
    memoryUsage: number;
    loadingTasks: number;
  } {
    return {
      cachedPages: this.pageCache.size,
      memoryUsage: this.currentMemoryUsage,
      loadingTasks: this.loadingTasks.size,
    };
  }
  
  /**
   * Check if a page is cached.
   * @param pageNumber - Page number to check
   * @returns True if page is cached
   */
  isPageCached(pageNumber: number): boolean {
    return this.pageCache.has(pageNumber);
  }
  
  /**
   * Get all cached page numbers.
   * @returns Array of cached page numbers
   */
  getCachedPageNumbers(): number[] {
    return Array.from(this.pageCache.keys());
  }
}

/**
 * Virtual scrolling helper for large page lists.
 */
export class VirtualScrollManager {
  private itemHeight: number;
  private containerHeight: number;
  private totalItems: number;
  private overscan: number;
  
  constructor(
    itemHeight: number,
    containerHeight: number,
    totalItems: number,
    overscan: number = 3
  ) {
    this.itemHeight = itemHeight;
    this.containerHeight = containerHeight;
    this.totalItems = totalItems;
    this.overscan = overscan;
  }
  
  /**
   * Calculate which items should be visible given scroll position.
   * @param scrollTop - Current scroll position
   * @returns Visible range information
   */
  getVisibleRange(scrollTop: number): {
    start: number;
    end: number;
    visibleItems: number[];
    totalHeight: number;
    offsetY: number;
  } {
    const visibleStart = Math.floor(scrollTop / this.itemHeight);
    const visibleEnd = Math.min(
      this.totalItems - 1,
      Math.ceil((scrollTop + this.containerHeight) / this.itemHeight)
    );
    
    // Add overscan
    const start = Math.max(0, visibleStart - this.overscan);
    const end = Math.min(this.totalItems - 1, visibleEnd + this.overscan);
    
    const visibleItems = [];
    for (let i = start; i <= end; i++) {
      visibleItems.push(i);
    }
    
    return {
      start,
      end,
      visibleItems,
      totalHeight: this.totalItems * this.itemHeight,
      offsetY: start * this.itemHeight,
    };
  }
  
  /**
   * Update container dimensions.
   * @param containerHeight - New container height
   */
  updateContainerHeight(containerHeight: number): void {
    this.containerHeight = containerHeight;
  }
  
  /**
   * Update total number of items.
   * @param totalItems - New total item count
   */
  updateTotalItems(totalItems: number): void {
    this.totalItems = totalItems;
  }
}

export default {
  PDFVirtualizationManager,
  VirtualScrollManager,
  DEFAULT_VIRTUALIZATION_CONFIG,
};