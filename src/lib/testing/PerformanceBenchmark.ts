/**
 * Performance Benchmark Suite for Supabase Migration
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../supabase/database.types';
import { PDFStorageManager } from '../storage/PDFStorageManager';
import { AnalyticsEventManager } from '../analytics/AnalyticsEventManager';

export interface BenchmarkResult {
  operation: string;
  averageTime: number;
  minTime: number;
  maxTime: number;
  iterations: number;
  throughput?: number; // operations per second
  memoryUsage?: {
    before: number;
    after: number;
    peak: number;
  };
}

export interface BenchmarkReport {
  environment: {
    userAgent: string;
    timestamp: Date;
    connectionType?: string;
  };
  results: BenchmarkResult[];
  summary: {
    totalOperations: number;
    totalTime: number;
    overallThroughput: number;
  };
}

export class PerformanceBenchmark {
  private supabase: SupabaseClient<Database>;
  private storageManager: PDFStorageManager;
  private analyticsManager: AnalyticsEventManager;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
    this.storageManager = new PDFStorageManager(supabase);
    this.analyticsManager = new AnalyticsEventManager(supabase);
  }

  /**
   * Run comprehensive performance benchmarks
   */
  async runBenchmarks(): Promise<BenchmarkReport> {
    console.log('🏁 Starting performance benchmarks...');
    
    const results: BenchmarkResult[] = [];
    
    // Database operations
    results.push(await this.benchmarkDatabaseReads());
    results.push(await this.benchmarkDatabaseWrites());
    results.push(await this.benchmarkComplexQueries());
    
    // Storage operations
    results.push(await this.benchmarkStorageStats());
    
    // Analytics operations
    results.push(await this.benchmarkAnalyticsEvents());
    results.push(await this.benchmarkAnalyticsSummary());
    
    // Real-time operations
    results.push(await this.benchmarkRealtimeConnection());
    
    const totalTime = results.reduce((sum, r) => sum + (r.averageTime * r.iterations), 0);
    const totalOperations = results.reduce((sum, r) => sum + r.iterations, 0);
    
    return {
      environment: {
        userAgent: navigator.userAgent,
        timestamp: new Date(),
        connectionType: (navigator as any).connection?.effectiveType
      },
      results,
      summary: {
        totalOperations,
        totalTime,
        overallThroughput: totalOperations / (totalTime / 1000)
      }
    };
  }

  /**
   * Benchmark database read operations
   */
  private async benchmarkDatabaseReads(): Promise<BenchmarkResult> {
    const iterations = 10;
    const times: number[] = [];
    
    const memoryBefore = this.getMemoryUsage();
    let memoryPeak = memoryBefore;
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      try {
        await this.supabase
          .from('documents')
          .select('id, name, size_bytes, created_at')
          .limit(10);
          
        const end = performance.now();
        times.push(end - start);
        
        const currentMemory = this.getMemoryUsage();
        if (currentMemory > memoryPeak) {
          memoryPeak = currentMemory;
        }
        
      } catch (error) {
        console.warn('Read benchmark iteration failed:', error);
      }
      
      // Small delay between iterations
      await this.delay(50);
    }
    
    const memoryAfter = this.getMemoryUsage();
    
    return {
      operation: 'Database Reads',
      averageTime: this.average(times),
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      iterations,
      throughput: iterations / (this.sum(times) / 1000),
      memoryUsage: {
        before: memoryBefore,
        after: memoryAfter,
        peak: memoryPeak
      }
    };
  }

  /**
   * Benchmark database write operations
   */
  private async benchmarkDatabaseWrites(): Promise<BenchmarkResult> {
    const iterations = 5; // Fewer iterations for writes
    const times: number[] = [];
    
    const { data: userData } = await this.supabase.auth.getUser();
    if (!userData.user) {
      return {
        operation: 'Database Writes',
        averageTime: 0,
        minTime: 0,
        maxTime: 0,
        iterations: 0
      };
    }
    
    const memoryBefore = this.getMemoryUsage();
    let memoryPeak = memoryBefore;
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      try {
        // Create a test session
        const sessionId = `bench_${Date.now()}_${i}`;
        await this.supabase
          .from('analytics_sessions')
          .insert({
            id: sessionId,
            user_id: userData.user.id,
            start_time: new Date().toISOString(),
            pages_viewed: [1, 2, 3],
            unique_pages_count: 3
          });
          
        // Clean up immediately
        await this.supabase
          .from('analytics_sessions')
          .delete()
          .eq('id', sessionId);
        
        const end = performance.now();
        times.push(end - start);
        
        const currentMemory = this.getMemoryUsage();
        if (currentMemory > memoryPeak) {
          memoryPeak = currentMemory;
        }
        
      } catch (error) {
        console.warn('Write benchmark iteration failed:', error);
      }
      
      await this.delay(100);
    }
    
    const memoryAfter = this.getMemoryUsage();
    
    return {
      operation: 'Database Writes',
      averageTime: this.average(times),
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      iterations,
      throughput: iterations / (this.sum(times) / 1000),
      memoryUsage: {
        before: memoryBefore,
        after: memoryAfter,
        peak: memoryPeak
      }
    };
  }

  /**
   * Benchmark complex queries with joins
   */
  private async benchmarkComplexQueries(): Promise<BenchmarkResult> {
    const iterations = 5;
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      try {
        await this.supabase
          .from('document_shares')
          .select(`
            *,
            documents (
              id,
              name,
              size_bytes,
              page_count
            )
          `)
          .limit(5);
          
        const end = performance.now();
        times.push(end - start);
        
      } catch (error) {
        console.warn('Complex query benchmark iteration failed:', error);
      }
      
      await this.delay(100);
    }
    
    return {
      operation: 'Complex Queries',
      averageTime: this.average(times),
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      iterations,
      throughput: iterations / (this.sum(times) / 1000)
    };
  }

  /**
   * Benchmark storage statistics
   */
  private async benchmarkStorageStats(): Promise<BenchmarkResult> {
    const iterations = 5;
    const times: number[] = [];
    
    const { data: userData } = await this.supabase.auth.getUser();
    if (!userData.user) {
      return {
        operation: 'Storage Statistics',
        averageTime: 0,
        minTime: 0,
        maxTime: 0,
        iterations: 0
      };
    }
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      try {
        await this.storageManager.getStorageStats(userData.user.id);
        const end = performance.now();
        times.push(end - start);
        
      } catch (error) {
        console.warn('Storage stats benchmark iteration failed:', error);
      }
      
      await this.delay(100);
    }
    
    return {
      operation: 'Storage Statistics',
      averageTime: this.average(times),
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      iterations,
      throughput: iterations / (this.sum(times) / 1000)
    };
  }

  /**
   * Benchmark analytics event processing
   */
  private async benchmarkAnalyticsEvents(): Promise<BenchmarkResult> {
    const iterations = 10;
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      try {
        // Create multiple events to test batching
        const events = Array.from({ length: 5 }, (_, j) => ({
          sessionId: `bench_session_${i}`,
          type: 'click',
          pageNumber: j + 1,
          data: { benchmarkIteration: i, eventIndex: j }
        }));
        
        await this.analyticsManager.trackEvents(events);
        const end = performance.now();
        times.push(end - start);
        
      } catch (error) {
        console.warn('Analytics events benchmark iteration failed:', error);
      }
      
      await this.delay(50);
    }
    
    return {
      operation: 'Analytics Events',
      averageTime: this.average(times),
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      iterations,
      throughput: (iterations * 5) / (this.sum(times) / 1000) // 5 events per iteration
    };
  }

  /**
   * Benchmark analytics summary generation
   */
  private async benchmarkAnalyticsSummary(): Promise<BenchmarkResult> {
    const iterations = 3;
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      try {
        await this.analyticsManager.getAnalyticsSummary();
        const end = performance.now();
        times.push(end - start);
        
      } catch (error) {
        console.warn('Analytics summary benchmark iteration failed:', error);
      }
      
      await this.delay(200);
    }
    
    return {
      operation: 'Analytics Summary',
      averageTime: this.average(times),
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      iterations,
      throughput: iterations / (this.sum(times) / 1000)
    };
  }

  /**
   * Benchmark real-time connection establishment
   */
  private async benchmarkRealtimeConnection(): Promise<BenchmarkResult> {
    const iterations = 3;
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      try {
        const channel = this.supabase.channel(`benchmark_${i}`);
        
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Connection timeout'));
          }, 5000);
          
          channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              clearTimeout(timeout);
              const end = performance.now();
              times.push(end - start);
              resolve();
            } else if (status === 'CHANNEL_ERROR') {
              clearTimeout(timeout);
              reject(new Error('Channel error'));
            }
          });
        });
        
        await this.supabase.removeChannel(channel);
        
      } catch (error) {
        console.warn('Realtime benchmark iteration failed:', error);
      }
      
      await this.delay(500);
    }
    
    return {
      operation: 'Realtime Connection',
      averageTime: this.average(times),
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      iterations,
      throughput: iterations / (this.sum(times) / 1000)
    };
  }

  /**
   * Generate performance report
   */
  generateReport(report: BenchmarkReport): string {
    let output = '\n🏁 PERFORMANCE BENCHMARK REPORT\n';
    output += '='.repeat(40) + '\n\n';
    
    // Environment info
    output += 'ENVIRONMENT:\n';
    output += `-----------\n`;
    output += `Timestamp: ${report.environment.timestamp.toISOString()}\n`;
    output += `User Agent: ${report.environment.userAgent}\n`;
    if (report.environment.connectionType) {
      output += `Connection: ${report.environment.connectionType}\n`;
    }
    output += '\n';
    
    // Summary
    output += 'SUMMARY:\n';
    output += `--------\n`;
    output += `Total Operations: ${report.summary.totalOperations}\n`;
    output += `Total Time: ${report.summary.totalTime.toFixed(2)}ms\n`;
    output += `Overall Throughput: ${report.summary.overallThroughput.toFixed(2)} ops/sec\n\n`;
    
    // Individual results
    output += 'DETAILED RESULTS:\n';
    output += `-----------------\n`;
    
    for (const result of report.results) {
      output += `\n${result.operation}:\n`;
      output += `  Average: ${result.averageTime.toFixed(2)}ms\n`;
      output += `  Min: ${result.minTime.toFixed(2)}ms\n`;
      output += `  Max: ${result.maxTime.toFixed(2)}ms\n`;
      output += `  Iterations: ${result.iterations}\n`;
      
      if (result.throughput) {
        output += `  Throughput: ${result.throughput.toFixed(2)} ops/sec\n`;
      }
      
      if (result.memoryUsage) {
        output += `  Memory (MB): ${(result.memoryUsage.before / 1024 / 1024).toFixed(2)} → `;
        output += `${(result.memoryUsage.after / 1024 / 1024).toFixed(2)} `;
        output += `(peak: ${(result.memoryUsage.peak / 1024 / 1024).toFixed(2)})\n`;
      }
    }
    
    // Performance recommendations
    output += '\nRECOMMENDations:\n';
    output += `----------------\n`;
    
    const slowOperations = report.results.filter(r => r.averageTime > 1000);
    if (slowOperations.length > 0) {
      output += `⚠️  Slow operations detected:\n`;
      slowOperations.forEach(op => {
        output += `   - ${op.operation}: ${op.averageTime.toFixed(2)}ms average\n`;
      });
    }
    
    const lowThroughput = report.results.filter(r => r.throughput && r.throughput < 1);
    if (lowThroughput.length > 0) {
      output += `⚠️  Low throughput operations:\n`;
      lowThroughput.forEach(op => {
        output += `   - ${op.operation}: ${op.throughput?.toFixed(2)} ops/sec\n`;
      });
    }
    
    if (slowOperations.length === 0 && lowThroughput.length === 0) {
      output += `✅ All operations performing within acceptable limits\n`;
    }
    
    return output;
  }

  // Helper methods
  private average(numbers: number[]): number {
    return numbers.length > 0 ? this.sum(numbers) / numbers.length : 0;
  }

  private sum(numbers: number[]): number {
    return numbers.reduce((sum, n) => sum + n, 0);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }
}
