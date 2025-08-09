/**
 * Migration Test Dashboard - UI for running and viewing migration validation results
 */

import React, { useState, useRef } from 'react';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Database, 
  HardDrive, 
  Shield, 
  Activity,
  Share,
  BarChart3,
  Wifi,
  Gauge,
  Download,
  Loader
} from 'lucide-react';
import { SupabaseClientManager } from '../../lib/supabase/client';
import { MigrationValidator, MigrationValidationReport } from '../../lib/testing/MigrationValidator';
import { PerformanceBenchmark, BenchmarkReport } from '../../lib/testing/PerformanceBenchmark';
import { Button, Card, Tooltip } from '../ui';

interface TestDashboardProps {
  className?: string;
}

type TestStatus = 'idle' | 'running' | 'completed' | 'failed';

export const MigrationTestDashboard: React.FC<TestDashboardProps> = ({ className = "" }) => {
  const [validationStatus, setValidationStatus] = useState<TestStatus>('idle');
  const [benchmarkStatus, setBenchmarkStatus] = useState<TestStatus>('idle');
  const [validationReport, setValidationReport] = useState<MigrationValidationReport | null>(null);
  const [benchmarkReport, setBenchmarkReport] = useState<BenchmarkReport | null>(null);
  const [currentTest, setCurrentTest] = useState<string>('');
  
  const validatorRef = useRef<MigrationValidator | null>(null);
  const benchmarkRef = useRef<PerformanceBenchmark | null>(null);

  // Initialize validators
  React.useEffect(() => {
    const supabase = SupabaseClientManager.getClient();
    if (supabase) {
      validatorRef.current = new MigrationValidator(supabase);
      benchmarkRef.current = new PerformanceBenchmark(supabase);
    }
  }, []);

  const runValidation = async () => {
    if (!validatorRef.current) {
      alert('Supabase client not available');
      return;
    }

    setValidationStatus('running');
    setCurrentTest('validation');
    
    try {
      const report = await validatorRef.current.validateMigration();
      setValidationReport(report);
      setValidationStatus('completed');
    } catch (error) {
      console.error('Validation failed:', error);
      setValidationStatus('failed');
    } finally {
      setCurrentTest('');
    }
  };

  const runBenchmarks = async () => {
    if (!benchmarkRef.current) {
      alert('Supabase client not available');
      return;
    }

    setBenchmarkStatus('running');
    setCurrentTest('benchmark');
    
    try {
      const report = await benchmarkRef.current.runBenchmarks();
      setBenchmarkReport(report);
      setBenchmarkStatus('completed');
    } catch (error) {
      console.error('Benchmarks failed:', error);
      setBenchmarkStatus('failed');
    } finally {
      setCurrentTest('');
    }
  };

  const downloadReport = (type: 'validation' | 'benchmark') => {
    let content = '';
    let filename = '';
    
    if (type === 'validation' && validationReport && validatorRef.current) {
      content = validatorRef.current.generateReport(validationReport);
      filename = `validation-report-${new Date().toISOString().split('T')[0]}.txt`;
    } else if (type === 'benchmark' && benchmarkReport && benchmarkRef.current) {
      content = benchmarkRef.current.generateReport(benchmarkReport);
      filename = `benchmark-report-${new Date().toISOString().split('T')[0]}.txt`;
    }
    
    if (content) {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const getStatusIcon = (status: TestStatus) => {
    switch (status) {
      case 'running':
        return <Loader className="w-4 h-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Play className="w-4 h-4 text-gray-500" />;
    }
  };

  const getComponentIcon = (component: string) => {
    switch (component) {
      case 'Database Connectivity':
        return <Database className="w-4 h-4" />;
      case 'Storage System':
        return <HardDrive className="w-4 h-4" />;
      case 'Authentication':
        return <Shield className="w-4 h-4" />;
      case 'Library Repository':
      case 'Share Repository':
        return <Share className="w-4 h-4" />;
      case 'Analytics System':
        return <BarChart3 className="w-4 h-4" />;
      case 'Real-time Features':
        return <Wifi className="w-4 h-4" />;
      case 'Performance':
        return <Gauge className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Migration Test Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Validate and benchmark your Supabase migration
          </p>
        </div>
        
        {currentTest && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Loader className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-blue-800 dark:text-blue-200 text-sm font-medium">
              Running {currentTest}...
            </span>
          </div>
        )}
      </div>

      {/* Test Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Validation Tests */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {getStatusIcon(validationStatus)}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Migration Validation
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Test all components and integrations
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {validationReport && (
                <Tooltip content="Download Report">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadReport('validation')}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </Tooltip>
              )}
              
              <Button
                onClick={runValidation}
                disabled={validationStatus === 'running'}
                size="sm"
              >
                {validationStatus === 'running' ? 'Running...' : 'Run Tests'}
              </Button>
            </div>
          </div>

          {validationReport && (
            <div className="space-y-3">
              {/* Overall Status */}
              <div className={`p-3 rounded-lg ${
                validationReport.overall.passed 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {validationReport.overall.passed ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`font-medium ${
                    validationReport.overall.passed ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                  }`}>
                    {validationReport.overall.passed ? 'All Tests Passed' : 'Some Tests Failed'}
                  </span>
                </div>
                <div className="text-sm">
                  <span className={validationReport.overall.passed ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                    {validationReport.overall.passedTests}/{validationReport.overall.totalTests} tests passed
                  </span>
                  <span className="mx-2">•</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {validationReport.overall.duration}ms
                  </span>
                </div>
              </div>

              {/* Component Results */}
              <div className="space-y-2">
                {validationReport.results.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="flex items-center gap-2">
                      {getComponentIcon(result.component)}
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {result.component}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {result.warnings.length > 0 && (
                        <Tooltip content={`${result.warnings.length} warnings`}>
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        </Tooltip>
                      )}
                      
                      {result.performance && (
                        <span className="text-xs text-gray-500">
                          {result.performance.duration}ms
                        </span>
                      )}
                      
                      {result.passed ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              {validationReport.recommendations.length > 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Recommendations
                  </h4>
                  <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                    {validationReport.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Performance Benchmarks */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {getStatusIcon(benchmarkStatus)}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Performance Benchmarks
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Measure system performance metrics
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {benchmarkReport && (
                <Tooltip content="Download Report">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadReport('benchmark')}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </Tooltip>
              )}
              
              <Button
                onClick={runBenchmarks}
                disabled={benchmarkStatus === 'running'}
                size="sm"
              >
                {benchmarkStatus === 'running' ? 'Running...' : 'Run Benchmarks'}
              </Button>
            </div>
          </div>

          {benchmarkReport && (
            <div className="space-y-3">
              {/* Summary */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Gauge className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-800 dark:text-blue-200">
                    Performance Summary
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Operations:</span>
                    <span className="ml-2 font-medium text-blue-800 dark:text-blue-200">
                      {benchmarkReport.summary.totalOperations}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Throughput:</span>
                    <span className="ml-2 font-medium text-blue-800 dark:text-blue-200">
                      {benchmarkReport.summary.overallThroughput.toFixed(2)} ops/sec
                    </span>
                  </div>
                </div>
              </div>

              {/* Benchmark Results */}
              <div className="space-y-2">
                {benchmarkReport.results.map((result, index) => (
                  <div key={index} className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {result.operation}
                      </span>
                      <span className="text-xs text-gray-500">
                        {result.iterations} iterations
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Avg:</span>
                        <span className="ml-1 font-medium">{result.averageTime.toFixed(2)}ms</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Min:</span>
                        <span className="ml-1 font-medium">{result.minTime.toFixed(2)}ms</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Max:</span>
                        <span className="ml-1 font-medium">{result.maxTime.toFixed(2)}ms</span>
                      </div>
                    </div>
                    
                    {result.throughput && (
                      <div className="mt-1 text-xs">
                        <span className="text-gray-600 dark:text-gray-400">Throughput:</span>
                        <span className="ml-1 font-medium text-green-600 dark:text-green-400">
                          {result.throughput.toFixed(2)} ops/sec
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Environment Info */}
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3 h-3 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {benchmarkReport.environment.timestamp.toLocaleString()}
                  </span>
                </div>
                {benchmarkReport.environment.connectionType && (
                  <div className="text-gray-600 dark:text-gray-400">
                    Connection: {benchmarkReport.environment.connectionType}
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              runValidation();
              setTimeout(() => runBenchmarks(), 1000);
            }}
            disabled={validationStatus === 'running' || benchmarkStatus === 'running'}
          >
            Run All Tests
          </Button>
          
          {(validationReport || benchmarkReport) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setValidationReport(null);
                setBenchmarkReport(null);
                setValidationStatus('idle');
                setBenchmarkStatus('idle');
              }}
            >
              Clear Results
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
