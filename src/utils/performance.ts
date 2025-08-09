/**
 * Performance utilities for optimizing analytics and UI responsiveness.
 * These utilities help manage high-frequency events and large datasets.
 */

/**
 * Configuration for performance optimizations.
 */
export interface PerformanceConfig {
  /** Debounce delay in milliseconds */
  debounceDelay: number;
  /** Throttle interval in milliseconds */
  throttleInterval: number;
  /** Maximum number of analytics events to keep in memory */
  maxAnalyticsEvents: number;
  /** Sample rate for mouse movement tracking (0-1) */
  mouseSampleRate: number;
  /** Batch size for persistence operations */
  persistenceBatchSize: number;
}

/**
 * Default performance configuration.
 */
export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  debounceDelay: 300,
  throttleInterval: 100,
  maxAnalyticsEvents: 10000,
  mouseSampleRate: 0.1, // Sample 10% of mouse movements
  persistenceBatchSize: 100,
};

/**
 * Debounces a function call, ensuring it only executes after a delay with no new calls.
 * Useful for expensive operations like analytics data processing.
 * 
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttles a function call, ensuring it executes at most once per interval.
 * Useful for high-frequency events like mouse movements.
 * 
 * @param func - Function to throttle
 * @param interval - Minimum interval between calls in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  interval: number
): (...args: Parameters<T>) => void {
  let lastCallTime = 0;
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCallTime >= interval) {
      lastCallTime = now;
      func(...args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now();
        func(...args);
        timeoutId = null;
      }, interval - (now - lastCallTime));
    }
  };
}

/**
 * Creates a sampled version of a function that only executes based on sample rate.
 * Useful for reducing analytics data volume while maintaining statistical significance.
 * 
 * @param func - Function to sample
 * @param sampleRate - Rate between 0 and 1 (0.1 = 10% of calls)
 * @returns Sampled function
 */
export function sample<T extends (...args: any[]) => any>(
  func: T,
  sampleRate: number
): (...args: Parameters<T>) => void {
  return (...args: Parameters<T>) => {
    if (Math.random() < sampleRate) {
      func(...args);
    }
  };
}

/**
 * Combines throttling and sampling for optimal performance.
 * 
 * @param func - Function to optimize
 * @param interval - Throttle interval in milliseconds
 * @param sampleRate - Sample rate between 0 and 1
 * @returns Optimized function
 */
export function throttleAndSample<T extends (...args: any[]) => any>(
  func: T,
  interval: number,
  sampleRate: number
): (...args: Parameters<T>) => void {
  const sampledFunc = sample(func, sampleRate);
  return throttle(sampledFunc, interval);
}

/**
 * Creates a batched function that collects calls and executes them in batches.
 * Useful for reducing database/storage write operations.
 * 
 * @param func - Function that processes a batch of items
 * @param batchSize - Maximum batch size
 * @param flushInterval - Maximum time to wait before flushing batch (ms)
 * @returns Batched function
 */
export function batch<T>(
  func: (items: T[]) => void,
  batchSize: number = 100,
  flushInterval: number = 5000
): (item: T) => void {
  let batch: T[] = [];
  let timeoutId: NodeJS.Timeout | null = null;
  
  const flush = () => {
    if (batch.length > 0) {
      func([...batch]);
      batch = [];
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  
  return (item: T) => {
    batch.push(item);
    
    if (batch.length >= batchSize) {
      flush();
    } else if (!timeoutId) {
      timeoutId = setTimeout(flush, flushInterval);
    }
  };
}

/**
 * Memory-efficient circular buffer for storing analytics events.
 * Automatically removes old events when capacity is exceeded.
 */
export class CircularBuffer<T> {
  private buffer: T[];
  private head: number = 0;
  private size: number = 0;
  
  constructor(private capacity: number) {
    this.buffer = new Array(capacity);
  }
  
  /**
   * Add an item to the buffer.
   * @param item - Item to add
   */
  push(item: T): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    
    if (this.size < this.capacity) {
      this.size++;
    }
  }
  
  /**
   * Get all items in chronological order.
   * @returns Array of items
   */
  toArray(): T[] {
    if (this.size === 0) return [];
    
    if (this.size < this.capacity) {
      return this.buffer.slice(0, this.size);
    }
    
    return [
      ...this.buffer.slice(this.head),
      ...this.buffer.slice(0, this.head)
    ];
  }
  
  /**
   * Get the current size of the buffer.
   * @returns Number of items
   */
  getSize(): number {
    return this.size;
  }
  
  /**
   * Clear all items from the buffer.
   */
  clear(): void {
    this.size = 0;
    this.head = 0;
  }
  
  /**
   * Check if buffer is at capacity.
   * @returns True if at capacity
   */
  isFull(): boolean {
    return this.size === this.capacity;
  }
}

/**
 * Adaptive sampler that adjusts sample rate based on data volume.
 * Reduces sampling when data volume is high to maintain performance.
 */
export class AdaptiveSampler {
  private eventCount = 0;
  private lastReset = Date.now();
  private currentSampleRate: number;
  
  constructor(
    private baseSampleRate: number = 0.1,
    private maxEventsPerSecond: number = 100,
    private resetInterval: number = 1000
  ) {
    this.currentSampleRate = baseSampleRate;
  }
  
  /**
   * Determine if an event should be sampled.
   * @returns True if event should be processed
   */
  shouldSample(): boolean {
    const now = Date.now();
    
    // Reset counter periodically
    if (now - this.lastReset > this.resetInterval) {
      this.eventCount = 0;
      this.lastReset = now;
      this.currentSampleRate = this.baseSampleRate;
    }
    
    this.eventCount++;
    
    // Adjust sample rate based on event frequency
    const eventsPerSecond = this.eventCount / ((now - this.lastReset) / 1000);
    if (eventsPerSecond > this.maxEventsPerSecond) {
      this.currentSampleRate = Math.max(
        0.01, 
        this.baseSampleRate * (this.maxEventsPerSecond / eventsPerSecond)
      );
    }
    
    return Math.random() < this.currentSampleRate;
  }
  
  /**
   * Get the current sample rate.
   * @returns Current sample rate (0-1)
   */
  getCurrentSampleRate(): number {
    return this.currentSampleRate;
  }
}

/**
 * Performance monitor for tracking analytics overhead.
 */
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  
  /**
   * Start timing an operation.
   * @param name - Operation name
   * @returns Function to end timing
   */
  startTiming(name: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
    };
  }
  
  /**
   * Record a performance metric.
   * @param name - Metric name
   * @param value - Metric value
   */
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }
  
  /**
   * Get performance statistics for a metric.
   * @param name - Metric name
   * @returns Statistics object
   */
  getStats(name: string): {
    avg: number;
    min: number;
    max: number;
    count: number;
  } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;
    
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return { avg, min, max, count: values.length };
  }
  
  /**
   * Get all recorded metrics.
   * @returns Map of metric names to statistics
   */
  getAllStats(): Map<string, ReturnType<PerformanceMonitor['getStats']>> {
    const allStats = new Map();
    
    for (const [name] of this.metrics) {
      allStats.set(name, this.getStats(name));
    }
    
    return allStats;
  }
  
  /**
   * Clear all metrics.
   */
  clear(): void {
    this.metrics.clear();
  }
}

/**
 * Global performance monitor instance.
 */
export const performanceMonitor = new PerformanceMonitor();

export default {
  debounce,
  throttle,
  sample,
  throttleAndSample,
  batch,
  CircularBuffer,
  AdaptiveSampler,
  PerformanceMonitor,
  performanceMonitor,
  DEFAULT_PERFORMANCE_CONFIG,
};