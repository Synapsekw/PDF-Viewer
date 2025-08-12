/**
 * Migration Control Panel - Switch between local and Supabase modes
 */

import React, { useState, useEffect } from 'react';
import {
  Database,
  HardDrive,
  Wifi,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Settings,
  Zap,
  ArrowRight
} from 'lucide-react';
import { repositoryManager, RepositoryConfig } from '../../lib/repositories/RepositoryManager';
import { SupabaseClientManager } from '../../lib/supabase/client';
import { Button, Card, Tooltip } from '../ui';

interface MigrationControlPanelProps {
  className?: string;
  onMigrationComplete?: () => void;
}

export const MigrationControlPanel: React.FC<MigrationControlPanelProps> = ({
  className = "",
  onMigrationComplete
}) => {
  const [config, setConfig] = useState<RepositoryConfig>(repositoryManager.getConfiguration());
  const [status, setStatus] = useState(repositoryManager.getStatus());
  const [health, setHealth] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{ success: boolean; errors: string[] } | null>(null);

  useEffect(() => {
    updateStatus();
    checkHealth();
  }, []);

  const updateStatus = () => {
    setConfig(repositoryManager.getConfiguration());
    setStatus(repositoryManager.getStatus());
  };

  const checkHealth = async () => {
    setIsLoading(true);
    try {
      const healthCheck = await repositoryManager.checkSupabaseHealth();
      setHealth(healthCheck);
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMigrateToSupabase = async () => {
    setIsLoading(true);
    setMigrationResult(null);
    
    try {
      const result = await repositoryManager.migrateToSupabase();
      setMigrationResult(result);
      
      if (result.success) {
        updateStatus();
        onMigrationComplete?.();
      }
    } catch (error) {
      setMigrationResult({
        success: false,
        errors: [`Migration failed: ${error.message}`]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRollbackToLocal = () => {
    repositoryManager.rollbackToLocal();
    updateStatus();
    setMigrationResult(null);
  };

  const handleConfigChange = (newConfig: Partial<RepositoryConfig>) => {
    repositoryManager.configure(newConfig);
    updateStatus();
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'supabase':
        return <Database className="w-5 h-5 text-blue-500" />;
      case 'local':
        return <HardDrive className="w-5 h-5 text-gray-500" />;
      default:
        return <Settings className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getHealthIcon = () => {
    if (isLoading) return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />;
    if (!health) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    if (health.available && health.authenticated) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (health.available && !health.authenticated) return <Shield className="w-4 h-4 text-yellow-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getHealthText = () => {
    if (isLoading) return 'Checking...';
    if (!health) return 'Unknown';
    if (health.available && health.authenticated) return 'Ready';
    if (health.available && !health.authenticated) return 'Not Authenticated';
    return 'Unavailable';
  };

  const canMigrateToSupabase = health?.available && health?.authenticated && status.mode !== 'supabase';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Migration Control Panel
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Switch between local and Supabase storage modes
          </p>
        </div>
        
        <Button
          onClick={checkHealth}
          disabled={isLoading}
          size="sm"
          variant="secondary"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mode Status */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {getModeIcon(status.mode)}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Current Mode
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {status.mode.charAt(0).toUpperCase() + status.mode.slice(1)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Library:</span>
              <span className="font-medium">{status.repositories.library}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Sharing:</span>
              <span className="font-medium">{status.repositories.share}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Analytics:</span>
              <span className="font-medium">{status.repositories.analytics}</span>
            </div>
          </div>
        </Card>

        {/* Supabase Health */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {getHealthIcon()}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Supabase Status
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {getHealthText()}
                </p>
              </div>
            </div>
          </div>

          {health && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Available:</span>
                <span className={`font-medium ${health.available ? 'text-green-600' : 'text-red-600'}`}>
                  {health.available ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Authenticated:</span>
                <span className={`font-medium ${health.authenticated ? 'text-green-600' : 'text-yellow-600'}`}>
                  {health.authenticated ? 'Yes' : 'No'}
                </span>
              </div>
              {health.latency && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Latency:</span>
                  <span className="font-medium">{health.latency}ms</span>
                </div>
              )}
            </div>
          )}

          {health?.errors && health.errors.length > 0 && (
            <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
              <p className="text-xs text-red-600 dark:text-red-400">
                {health.errors.join(', ')}
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Migration Actions */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Migration Actions
        </h3>

        <div className="space-y-4">
          {/* Migrate to Supabase */}
          {status.mode !== 'supabase' && (
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-200">
                    Migrate to Supabase
                  </h4>
                  <p className="text-sm text-blue-600 dark:text-blue-300">
                    Switch to cloud storage with real-time features
                  </p>
                </div>
              </div>
              
              <Button
                onClick={handleMigrateToSupabase}
                disabled={!canMigrateToSupabase || isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                Migrate
              </Button>
            </div>
          )}

          {/* Current Supabase Mode */}
          {status.mode === 'supabase' && (
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <h4 className="font-medium text-green-800 dark:text-green-200">
                    Running on Supabase
                  </h4>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    Full cloud storage with all features enabled
                  </p>
                </div>
              </div>
              
              <Button
                onClick={handleRollbackToLocal}
                variant="secondary"
                size="sm"
              >
                Rollback to Local
              </Button>
            </div>
          )}
        </div>

        {/* Migration Result */}
        {migrationResult && (
          <div className={`mt-4 p-4 rounded-lg border ${
            migrationResult.success 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {migrationResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <h4 className={`font-medium ${
                migrationResult.success 
                  ? 'text-green-800 dark:text-green-200' 
                  : 'text-red-800 dark:text-red-200'
              }`}>
                {migrationResult.success ? 'Migration Successful!' : 'Migration Failed'}
              </h4>
            </div>
            
            {migrationResult.errors.length > 0 && (
              <ul className={`text-sm ${
                migrationResult.success 
                  ? 'text-green-700 dark:text-green-300' 
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {migrationResult.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Card>

      {/* Configuration Options */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Advanced Configuration
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={config.enableAuth}
              onChange={(e) => handleConfigChange({ enableAuth: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="font-medium text-gray-900 dark:text-gray-100">Authentication</span>
              <p className="text-sm text-gray-600 dark:text-gray-400">Enable Supabase Auth</p>
            </div>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={config.enableRealtime}
              onChange={(e) => handleConfigChange({ enableRealtime: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="font-medium text-gray-900 dark:text-gray-100">Real-time</span>
              <p className="text-sm text-gray-600 dark:text-gray-400">Live updates and collaboration</p>
            </div>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={config.enableOfflineSync}
              onChange={(e) => handleConfigChange({ enableOfflineSync: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="font-medium text-gray-900 dark:text-gray-100">Offline Sync</span>
              <p className="text-sm text-gray-600 dark:text-gray-400">Background data synchronization</p>
            </div>
          </label>
        </div>
      </Card>

      {/* Quick Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Database className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
              Migration Information
            </p>
            <p className="text-blue-600 dark:text-blue-300">
              • <strong>Local Mode:</strong> Data stored in browser (IndexedDB)<br/>
              • <strong>Supabase Mode:</strong> Cloud storage with real-time sync<br/>
              • <strong>Auto Mode:</strong> Uses Supabase when available, falls back to local
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
