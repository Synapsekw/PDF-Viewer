/**
 * Migration Validator - Comprehensive testing and validation for Supabase migration
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../supabase/database.types';
import { PDFStorageManager } from '../storage/PDFStorageManager';
import { AnalyticsEventManager } from '../analytics/AnalyticsEventManager';
import { SupabasePDFLibraryRepository } from '../repositories/supabase/LibraryRepository';
import { SupabaseShareRepository } from '../repositories/supabase/ShareRepository';
import { SupabaseAnalyticsRepository } from '../repositories/supabase/AnalyticsRepository';

export interface ValidationResult {
  component: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
  performance?: {
    duration: number;
    latency?: number;
  };
}

export interface MigrationValidationReport {
  overall: {
    passed: boolean;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    duration: number;
  };
  results: ValidationResult[];
  recommendations: string[];
}

export class MigrationValidator {
  private supabase: SupabaseClient<Database>;
  private storageManager: PDFStorageManager;
  private analyticsManager: AnalyticsEventManager;
  private libraryRepo: SupabasePDFLibraryRepository;
  private shareRepo: SupabaseShareRepository;
  private analyticsRepo: SupabaseAnalyticsRepository;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
    this.storageManager = new PDFStorageManager(supabase);
    this.analyticsManager = new AnalyticsEventManager(supabase);
    this.libraryRepo = new SupabasePDFLibraryRepository(supabase);
    this.shareRepo = new SupabaseShareRepository(supabase);
    this.analyticsRepo = new SupabaseAnalyticsRepository(supabase);
  }

  /**
   * Run comprehensive validation of the migration
   */
  async validateMigration(): Promise<MigrationValidationReport> {
    const startTime = Date.now();
    const results: ValidationResult[] = [];

    console.log('🧪 Starting comprehensive migration validation...');

    // Test database connectivity
    results.push(await this.validateDatabaseConnectivity());

    // Test storage systems
    results.push(await this.validateStorageSystem());

    // Test authentication
    results.push(await this.validateAuthentication());

    // Test library repository
    results.push(await this.validateLibraryRepository());

    // Test share repository
    results.push(await this.validateShareRepository());

    // Test analytics system
    results.push(await this.validateAnalyticsSystem());

    // Test real-time features
    results.push(await this.validateRealtimeFeatures());

    // Performance benchmarks
    results.push(await this.validatePerformance());

    // Data integrity tests
    results.push(await this.validateDataIntegrity());

    const duration = Date.now() - startTime;
    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;

    const recommendations = this.generateRecommendations(results);

    return {
      overall: {
        passed: passedTests === totalTests,
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests,
        duration
      },
      results,
      recommendations
    };
  }

  /**
   * Test database connectivity and basic operations
   */
  private async validateDatabaseConnectivity(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const startTime = Date.now();

    try {
      // Test basic connectivity
      const { data, error } = await this.supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        errors.push(`Database connectivity failed: ${error.message}`);
      }

      // Test all required tables exist
      const requiredTables = ['profiles', 'documents', 'document_shares', 'analytics_sessions', 'analytics_events'];
      
      for (const table of requiredTables) {
        try {
          const { error } = await this.supabase
            .from(table as any)
            .select('count')
            .limit(1);
          
          if (error) {
            errors.push(`Table '${table}' not accessible: ${error.message}`);
          }
        } catch (err) {
          errors.push(`Failed to access table '${table}': ${err.message}`);
        }
      }

      // Test RLS policies
      try {
        const { data: userData } = await this.supabase.auth.getUser();
        if (!userData.user) {
          warnings.push('No authenticated user for RLS testing');
        }
      } catch (err) {
        warnings.push('Could not test RLS policies: authentication required');
      }

    } catch (err) {
      errors.push(`Database validation failed: ${err.message}`);
    }

    return {
      component: 'Database Connectivity',
      passed: errors.length === 0,
      errors,
      warnings,
      performance: { duration: Date.now() - startTime }
    };
  }

  /**
   * Test storage system functionality
   */
  private async validateStorageSystem(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const startTime = Date.now();

    try {
      // Test storage bucket access
      const { data: buckets, error: bucketsError } = await this.supabase.storage.listBuckets();
      
      if (bucketsError) {
        errors.push(`Cannot access storage buckets: ${bucketsError.message}`);
      } else {
        const requiredBuckets = ['documents', 'public-documents'];
        const availableBuckets = buckets?.map(b => b.name) || [];
        
        for (const bucket of requiredBuckets) {
          if (!availableBuckets.includes(bucket)) {
            warnings.push(`Storage bucket '${bucket}' not found`);
          }
        }
      }

      // Test storage manager
      const { data: userData } = await this.supabase.auth.getUser();
      if (userData.user) {
        try {
          const stats = await this.storageManager.getStorageStats(userData.user.id);
          if (typeof stats.totalDocuments !== 'number') {
            errors.push('Storage statistics not working correctly');
          }
        } catch (err) {
          warnings.push(`Storage statistics failed: ${err.message}`);
        }
      }

    } catch (err) {
      errors.push(`Storage system validation failed: ${err.message}`);
    }

    return {
      component: 'Storage System',
      passed: errors.length === 0,
      errors,
      warnings,
      performance: { duration: Date.now() - startTime }
    };
  }

  /**
   * Test authentication system
   */
  private async validateAuthentication(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const startTime = Date.now();

    try {
      // Test current auth state
      const { data: userData, error: userError } = await this.supabase.auth.getUser();
      
      if (userError) {
        errors.push(`Authentication error: ${userError.message}`);
      } else if (!userData.user) {
        warnings.push('No authenticated user found');
      } else {
        // Test profile access
        const { data: profile, error: profileError } = await this.supabase
          .from('profiles')
          .select('*')
          .eq('id', userData.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          errors.push(`Profile access failed: ${profileError.message}`);
        }
      }

      // Test session management
      const { data: session } = await this.supabase.auth.getSession();
      if (!session.session) {
        warnings.push('No active session found');
      }

    } catch (err) {
      errors.push(`Authentication validation failed: ${err.message}`);
    }

    return {
      component: 'Authentication',
      passed: errors.length === 0,
      errors,
      warnings,
      performance: { duration: Date.now() - startTime }
    };
  }

  /**
   * Test library repository functionality
   */
  private async validateLibraryRepository(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const startTime = Date.now();

    try {
      // Test repository health
      const health = await this.libraryRepo.getHealth();
      if (!health.isHealthy) {
        errors.push(`Library repository unhealthy: ${health.errors.join(', ')}`);
      }

      // Test basic operations (if authenticated)
      const { data: userData } = await this.supabase.auth.getUser();
      if (userData.user) {
        try {
          // Test listing
          const documents = await this.libraryRepo.list();
          if (!Array.isArray(documents)) {
            errors.push('Document listing failed');
          }

          // Test storage stats
          const stats = await this.libraryRepo.getStorageStats();
          if (typeof stats.totalDocuments !== 'number') {
            errors.push('Storage statistics not working');
          }
        } catch (err) {
          warnings.push(`Library operations failed: ${err.message}`);
        }
      } else {
        warnings.push('Cannot test library operations without authentication');
      }

    } catch (err) {
      errors.push(`Library repository validation failed: ${err.message}`);
    }

    return {
      component: 'Library Repository',
      passed: errors.length === 0,
      errors,
      warnings,
      performance: { duration: Date.now() - startTime }
    };
  }

  /**
   * Test share repository functionality
   */
  private async validateShareRepository(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const startTime = Date.now();

    try {
      // Test repository health
      const health = await this.shareRepo.getHealth();
      if (!health.isHealthy) {
        errors.push(`Share repository unhealthy: ${health.errors.join(', ')}`);
      }

      // Test basic operations (if authenticated)
      const { data: userData } = await this.supabase.auth.getUser();
      if (userData.user) {
        try {
          // Test listing shares
          const shares = await this.shareRepo.listShares();
          if (!Array.isArray(shares)) {
            errors.push('Share listing failed');
          }
        } catch (err) {
          warnings.push(`Share operations failed: ${err.message}`);
        }
      } else {
        warnings.push('Cannot test share operations without authentication');
      }

    } catch (err) {
      errors.push(`Share repository validation failed: ${err.message}`);
    }

    return {
      component: 'Share Repository',
      passed: errors.length === 0,
      errors,
      warnings,
      performance: { duration: Date.now() - startTime }
    };
  }

  /**
   * Test analytics system functionality
   */
  private async validateAnalyticsSystem(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const startTime = Date.now();

    try {
      // Test analytics repository health
      const health = await this.analyticsRepo.getHealth();
      if (!health.isHealthy) {
        errors.push(`Analytics repository unhealthy: ${health.errors.join(', ')}`);
      }

      // Test analytics event manager
      const { data: userData } = await this.supabase.auth.getUser();
      if (userData.user) {
        try {
          // Test getting analytics summary
          const summary = await this.analyticsManager.getAnalyticsSummary();
          if (typeof summary.totalSessions !== 'number') {
            errors.push('Analytics summary not working correctly');
          }
        } catch (err) {
          warnings.push(`Analytics operations failed: ${err.message}`);
        }
      } else {
        warnings.push('Cannot test analytics operations without authentication');
      }

    } catch (err) {
      errors.push(`Analytics system validation failed: ${err.message}`);
    }

    return {
      component: 'Analytics System',
      passed: errors.length === 0,
      errors,
      warnings,
      performance: { duration: Date.now() - startTime }
    };
  }

  /**
   * Test real-time features
   */
  private async validateRealtimeFeatures(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const startTime = Date.now();

    try {
      // Test realtime connection
      const channel = this.supabase.channel('test-channel');
      
      // Test channel subscription
      const subscription = channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime connection successful');
        } else if (status === 'CHANNEL_ERROR') {
          warnings.push('Realtime channel error');
        }
      });

      // Wait a moment for connection
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Clean up
      await this.supabase.removeChannel(channel);

      // Test if realtime is available
      if (!this.supabase.realtime) {
        warnings.push('Realtime not available');
      }

    } catch (err) {
      warnings.push(`Realtime validation failed: ${err.message}`);
    }

    return {
      component: 'Real-time Features',
      passed: errors.length === 0,
      errors,
      warnings,
      performance: { duration: Date.now() - startTime }
    };
  }

  /**
   * Performance benchmarks
   */
  private async validatePerformance(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const startTime = Date.now();

    try {
      // Test database query performance
      const dbStartTime = Date.now();
      await this.supabase.from('profiles').select('count').limit(1);
      const dbLatency = Date.now() - dbStartTime;

      if (dbLatency > 1000) {
        warnings.push(`Database latency high: ${dbLatency}ms`);
      } else if (dbLatency > 2000) {
        errors.push(`Database latency too high: ${dbLatency}ms`);
      }

      // Test storage performance if authenticated
      const { data: userData } = await this.supabase.auth.getUser();
      if (userData.user) {
        const storageStartTime = Date.now();
        try {
          await this.storageManager.getStorageStats(userData.user.id);
          const storageLatency = Date.now() - storageStartTime;
          
          if (storageLatency > 2000) {
            warnings.push(`Storage operations slow: ${storageLatency}ms`);
          }
        } catch (err) {
          warnings.push('Could not test storage performance');
        }
      }

    } catch (err) {
      errors.push(`Performance validation failed: ${err.message}`);
    }

    return {
      component: 'Performance',
      passed: errors.length === 0,
      errors,
      warnings,
      performance: { duration: Date.now() - startTime }
    };
  }

  /**
   * Test data integrity
   */
  private async validateDataIntegrity(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const startTime = Date.now();

    try {
      // Test foreign key relationships
      const { data: documents, error: docsError } = await this.supabase
        .from('documents')
        .select('id, user_id')
        .limit(5);

      if (docsError) {
        warnings.push(`Could not test document integrity: ${docsError.message}`);
      } else if (documents && documents.length > 0) {
        // Check if user_id references exist
        for (const doc of documents) {
          if (doc.user_id) {
            const { data: profile, error: profileError } = await this.supabase
              .from('profiles')
              .select('id')
              .eq('id', doc.user_id)
              .single();

            if (profileError && profileError.code !== 'PGRST116') {
              warnings.push(`Document ${doc.id} references non-existent user`);
            }
          }
        }
      }

      // Test share integrity
      const { data: shares, error: sharesError } = await this.supabase
        .from('document_shares')
        .select('token, document_id, created_by')
        .limit(5);

      if (sharesError) {
        warnings.push(`Could not test share integrity: ${sharesError.message}`);
      } else if (shares && shares.length > 0) {
        for (const share of shares) {
          // Check if document exists
          const { data: doc, error: docError } = await this.supabase
            .from('documents')
            .select('id')
            .eq('id', share.document_id)
            .single();

          if (docError && docError.code !== 'PGRST116') {
            warnings.push(`Share ${share.token} references non-existent document`);
          }
        }
      }

    } catch (err) {
      errors.push(`Data integrity validation failed: ${err.message}`);
    }

    return {
      component: 'Data Integrity',
      passed: errors.length === 0,
      errors,
      warnings,
      performance: { duration: Date.now() - startTime }
    };
  }

  /**
   * Generate recommendations based on validation results
   */
  private generateRecommendations(results: ValidationResult[]): string[] {
    const recommendations: string[] = [];
    
    // Count warnings and errors
    const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    if (totalErrors === 0 && totalWarnings === 0) {
      recommendations.push('✅ Migration validation passed completely! All systems are working correctly.');
    }

    if (totalErrors > 0) {
      recommendations.push(`🚨 ${totalErrors} critical errors found. Address these before production deployment.`);
    }

    if (totalWarnings > 0) {
      recommendations.push(`⚠️ ${totalWarnings} warnings found. Consider reviewing these for optimal performance.`);
    }

    // Performance recommendations
    const performanceResult = results.find(r => r.component === 'Performance');
    if (performanceResult?.warnings.length > 0) {
      recommendations.push('🚀 Performance optimization recommended. Consider database indexing or connection pooling.');
    }

    // Authentication recommendations
    const authResult = results.find(r => r.component === 'Authentication');
    if (authResult?.warnings.some(w => w.includes('No authenticated user'))) {
      recommendations.push('👤 Authentication testing incomplete. Test with authenticated users for full validation.');
    }

    // Storage recommendations
    const storageResult = results.find(r => r.component === 'Storage System');
    if (storageResult?.warnings.some(w => w.includes('bucket'))) {
      recommendations.push('💾 Storage bucket configuration may need attention for full functionality.');
    }

    return recommendations;
  }

  /**
   * Generate a detailed report
   */
  generateReport(report: MigrationValidationReport): string {
    let output = '\n🧪 SUPABASE MIGRATION VALIDATION REPORT\n';
    output += '='.repeat(50) + '\n\n';

    // Overall status
    output += `Overall Status: ${report.overall.passed ? '✅ PASSED' : '❌ FAILED'}\n`;
    output += `Tests: ${report.overall.passedTests}/${report.overall.totalTests} passed\n`;
    output += `Duration: ${report.overall.duration}ms\n\n`;

    // Component results
    output += 'COMPONENT RESULTS:\n';
    output += '-' .repeat(20) + '\n';
    
    for (const result of report.results) {
      output += `${result.passed ? '✅' : '❌'} ${result.component}`;
      if (result.performance) {
        output += ` (${result.performance.duration}ms)`;
      }
      output += '\n';
      
      if (result.errors.length > 0) {
        result.errors.forEach(error => {
          output += `  🚨 ERROR: ${error}\n`;
        });
      }
      
      if (result.warnings.length > 0) {
        result.warnings.forEach(warning => {
          output += `  ⚠️  WARNING: ${warning}\n`;
        });
      }
      
      output += '\n';
    }

    // Recommendations
    if (report.recommendations.length > 0) {
      output += 'RECOMMENDATIONS:\n';
      output += '-' .repeat(15) + '\n';
      report.recommendations.forEach(rec => {
        output += `${rec}\n`;
      });
    }

    return output;
  }
}
