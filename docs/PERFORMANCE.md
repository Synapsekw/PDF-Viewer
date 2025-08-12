# Performance & Persistence Guide

This document describes the performance optimizations and persistence features implemented in the PDF Viewer.

## Overview

The PDF Viewer includes comprehensive performance optimizations and data persistence capabilities designed to handle large PDFs and analytics datasets efficiently.

## Performance Optimizations

### 1. Analytics Throttling & Sampling

#### Adaptive Sampling
- **Mouse movements**: Automatically reduces sampling rate when event frequency is high
- **Base sample rate**: 10% of mouse movements (configurable)
- **Max events per second**: 100 (automatically adjusts sampling to maintain this limit)

#### Debouncing & Throttling
- **Debounced persistence**: Analytics data is saved with 300ms debounce to reduce I/O
- **Throttled heatmap updates**: Heatmap rendering throttled to 100ms intervals
- **Mouse movement optimization**: 50ms throttling with 20% sampling for mouse tracking

#### Memory Management
- **Circular Buffer**: Analytics events stored in memory-efficient circular buffer (max 10,000 events)
- **Automatic cleanup**: Old analytics data automatically removed (30 days max age, 100 sessions max)
- **Garbage collection**: Unused canvas memory automatically released

### 2. PDF Virtualization

#### Page Management
```typescript
const virtualizationManager = new PDFVirtualizationManager({
  preloadRange: 2,        // Pages to preload around current page
  maxCachedPages: 10,     // Maximum pages in memory
  maxCanvasMemory: 100,   // Maximum canvas memory (MB)
  enablePageRecycling: true
});
```

#### Virtual Scrolling
- **Large documents**: Efficiently handles PDFs with thousands of pages
- **Memory optimization**: Only renders visible pages
- **Preloading**: Intelligently preloads adjacent pages
- **Thumbnail generation**: Fast thumbnail generation for page overviews

### 3. Performance Monitoring

#### Real-time Metrics
Press `Ctrl+Shift+P` to view performance metrics:
- Operation timing (analytics, rendering, storage)
- Memory usage and storage statistics
- Cache hit rates and optimization effectiveness

#### Available Metrics
- `record_interaction`: Time to record user interactions
- `heatmap_mouse_move`: Mouse movement processing time
- `localStorage_save/load`: Storage operation performance
- `indexedDB_save/load`: Database operation performance
- `storage_cleanup`: Data cleanup operation timing

## Persistence Layer

### 1. Storage Adapters

#### IndexedDB (Preferred)
- **Capacity**: ~1GB+ storage (browser dependent)
- **Performance**: Asynchronous, non-blocking operations
- **Features**: Advanced querying, transactions, compression support
- **Fallback**: Automatically falls back to localStorage if unavailable

#### localStorage (Fallback)
- **Capacity**: ~5-10MB (browser dependent)
- **Performance**: Synchronous operations
- **Features**: Simple key-value storage
- **Usage**: Automatic fallback when IndexedDB is unavailable

### 2. Data Management

#### Automatic Persistence
```typescript
// Data is automatically saved:
- Every 1 second (session duration updates)
- When tab becomes hidden
- Before page unload
- When component unmounts
- After significant interactions
```

#### Data Cleanup
```typescript
const storageConfig = {
  maxDataAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  maxSessions: 100,                       // Maximum sessions to keep
  enableCompression: true,                // Compress stored data
  batchSize: 100                         // Batch size for operations
};
```

#### Storage API
```typescript
import { analyticsStorage } from './features/analytics/persistence/storage';

// Save session data
await analyticsStorage.saveSession(sessionId, analyticsData);

// Load session data
const data = await analyticsStorage.loadSession(sessionId);

// Get all sessions
const sessions = await analyticsStorage.getSessionList();

// Cleanup old data
await analyticsStorage.cleanup();

// Export all data
const backup = await analyticsStorage.exportAllData();

// Import data
await analyticsStorage.importData(backup);
```

## Configuration

### Performance Settings

```typescript
// src/utils/performance.ts
export const DEFAULT_PERFORMANCE_CONFIG = {
  debounceDelay: 300,           // Debounce delay (ms)
  throttleInterval: 100,        // Throttle interval (ms)
  maxAnalyticsEvents: 10000,    // Max events in memory
  mouseSampleRate: 0.1,         // Mouse sampling rate (10%)
  persistenceBatchSize: 100,    // Persistence batch size
};
```

### Storage Settings

```typescript
// src/features/analytics/persistence/storage.ts
export const DEFAULT_STORAGE_CONFIG = {
  preferredStorage: 'auto',     // 'localStorage', 'indexedDB', 'auto'
  maxDataAge: 30 * 24 * 60 * 60 * 1000,  // 30 days
  maxSessions: 100,             // Maximum sessions to keep
  enableCompression: true,      // Enable data compression
  batchSize: 50,               // Batch size for operations
};
```

### Virtualization Settings

```typescript
// src/utils/virtualization.ts
export const DEFAULT_VIRTUALIZATION_CONFIG = {
  preloadRange: 2,              // Pages to preload
  maxCachedPages: 10,           // Max pages in cache
  maxCanvasMemory: 100,         // Max canvas memory (MB)
  enablePageRecycling: true,    // Enable memory recycling
  thumbnailSize: { width: 150, height: 200 },
};
```

## Performance Best Practices

### For Plugin Developers

1. **Use Performance Utilities**:
```typescript
import { throttle, debounce, sample } from '../utils/performance';

// Throttle high-frequency events
const throttledHandler = throttle(handler, 100);

// Debounce expensive operations
const debouncedSave = debounce(saveData, 300);

// Sample events to reduce volume
const sampledTracker = sample(trackEvent, 0.1);
```

2. **Monitor Performance**:
```typescript
import { performanceMonitor } from '../utils/performance';

const endTiming = performanceMonitor.startTiming('my_operation');
// ... do work ...
endTiming();
```

3. **Use Circular Buffers**:
```typescript
import { CircularBuffer } from '../utils/performance';

const buffer = new CircularBuffer<Event>(1000);
buffer.push(event);  // Automatically manages memory
const events = buffer.toArray();
```

### For Large PDFs

1. **Enable Virtualization**:
```typescript
const manager = new PDFVirtualizationManager({
  preloadRange: 1,      // Reduce for very large PDFs
  maxCachedPages: 5,    // Reduce for memory-constrained devices
  maxCanvasMemory: 50,  // Reduce for mobile devices
});
```

2. **Optimize Analytics**:
```typescript
// Reduce sampling for large documents
const sampler = new AdaptiveSampler(0.05, 50); // 5% base rate, 50 events/sec max

// Use smaller grid sizes for heatmaps
const heatmapConfig = {
  gridSize: 40,          // Larger grid = less memory
  maxIntensity: 50,      // Reduce intensity calculations
  fadeTime: 15000,       // Shorter fade time = less memory
};
```

## Troubleshooting

### Performance Issues

1. **High Memory Usage**:
   - Reduce `maxCachedPages` in virtualization config
   - Decrease `maxAnalyticsEvents` in performance config
   - Enable aggressive cleanup with shorter `maxDataAge`

2. **Slow Analytics**:
   - Increase throttle intervals
   - Reduce mouse sampling rate
   - Enable adaptive sampling

3. **Storage Full**:
   - Run `analyticsStorage.cleanup()` manually
   - Reduce `maxSessions` in storage config
   - Enable compression if not already enabled

### Storage Issues

1. **Data Not Persisting**:
   - Check browser storage permissions
   - Verify IndexedDB availability
   - Check storage quota limits

2. **Performance Degradation**:
   - Enable batching for write operations
   - Use compression for large datasets
   - Implement regular cleanup schedules

### Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| IndexedDB | ✅ | ✅ | ✅ | ✅ |
| localStorage | ✅ | ✅ | ✅ | ✅ |
| Web Workers | ✅ | ✅ | ✅ | ✅ |
| Storage API | ✅ | ✅ | ⚠️ | ✅ |
| Performance API | ✅ | ✅ | ✅ | ✅ |

**Legend**: ✅ Full Support, ⚠️ Partial Support, ❌ No Support

## Monitoring & Debugging

### Performance Monitor

Enable the performance monitor (Ctrl+Shift+P) to view:
- Real-time performance metrics
- Storage usage statistics
- Memory consumption
- Cache effectiveness

### Console Debugging

```javascript
// Enable debug logging
localStorage.setItem('pdf-viewer-debug', 'true');

// View performance stats
console.log('Performance:', performanceMonitor.getAllStats());

// Check storage info
analyticsStorage.getStorageInfo().then(console.log);

// Monitor cache status
virtualizationManager.getCacheStats();
```

### Production Monitoring

For production environments, implement custom monitoring:

```typescript
// Monitor critical performance metrics
performanceMonitor.recordMetric('user_interaction_latency', latency);

// Track storage usage
const storageInfo = await analyticsStorage.getStorageInfo();
if (storageInfo.usage.used > threshold) {
  // Alert or cleanup
}

// Monitor error rates
window.addEventListener('error', (event) => {
  performanceMonitor.recordMetric('error_count', 1);
});
```

## Future Optimizations

### Planned Features

1. **Web Workers**: Move heavy analytics processing to background threads
2. **Streaming**: Stream large PDF processing for better responsiveness
3. **CDN Integration**: Cache frequently accessed pages
4. **Compression**: Advanced compression algorithms for storage
5. **Predictive Loading**: ML-based page preloading

### Experimental Features

1. **OffscreenCanvas**: Render PDF pages in background
2. **WebAssembly**: High-performance data processing
3. **SharedArrayBuffer**: Cross-thread data sharing
4. **Storage Estimation**: Better storage quota management

## Support

For performance-related issues:
1. Check the Performance Monitor (Ctrl+Shift+P)
2. Review browser console for warnings
3. Test with different performance configurations
4. Report issues with performance metrics attached