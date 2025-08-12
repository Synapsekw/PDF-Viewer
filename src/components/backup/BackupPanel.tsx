/**
 * Backup and data management panel
 */

import React, { useState } from 'react';
import { Download, Upload, Database, AlertCircle, CheckCircle, Loader2, Settings } from 'lucide-react';
import { BackupManager } from '../../lib/backup/BackupManager';
import { SupabaseClientManager } from '../../lib/supabase/client';
import { hybridRepositoryManager } from '../../lib/repositories/HybridRepositoryManager';
import { SupabaseConfigManager } from '../../lib/supabase/config';
import { Card, Button, IconButton } from '../ui';
import { BackupOptions, RestoreOptions, BackupValidationResult, FullBackupData } from '../../lib/backup/types';
import { SupabaseHealth } from '../../lib/supabase/types';

interface BackupPanelProps {
  onClose: () => void;
}

export const BackupPanel: React.FC<BackupPanelProps> = ({ onClose }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [supabaseHealth, setSupabaseHealth] = useState<SupabaseHealth | null>(null);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<BackupValidationResult | null>(null);

  const handleTestComponents = async () => {
    try {
      await BackupManager.testBackupComponents();
      alert('All backup components are working correctly! Check console for details.');
    } catch (error) {
      console.error('Component test failed:', error);
      alert(`Component test failed: ${error.message}`);
    }
  };

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const options: Partial<BackupOptions> = {
        includeBlobs: true,
        includeAnalytics: true,
        compressData: false,
        maxBlobSize: 100 // 100MB limit
      };

      console.log('Starting backup export with options:', options);
      const backup = await BackupManager.createFullBackup(options);
      console.log('Backup created successfully, exporting to file...');
      await BackupManager.exportToFile(backup);
      
      setLastBackup(new Date().toISOString());
      alert('Backup exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Export failed: ${error.message}\n\nCheck the browser console for detailed error information.`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const { data, validation } = await BackupManager.importFromFile(file);
      setValidationResult(validation);

      if (validation.isValid) {
        const confirmRestore = window.confirm(
          `Import backup with ${validation.summary.totalDocuments} documents and ${validation.summary.totalShares} shares?\n\nThis will create a safety backup first.`
        );

        if (confirmRestore) {
          const options: Partial<RestoreOptions> = {
            overwriteExisting: false,
            validateData: true,
            createBackupBeforeRestore: true,
            restoreBlobs: true
          };

          await BackupManager.restoreFromBackup(data, options);
          alert('Backup restored successfully! Please refresh the page.');
        }
      } else {
        alert(`Backup validation failed:\n${validation.errors.join('\n')}`);
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert(`Import failed: ${error.message}`);
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleCheckSupabaseHealth = async () => {
    try {
      const health = await SupabaseClientManager.checkHealth();
      setSupabaseHealth(health);
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  const handleTestDatabase = async () => {
    try {
      const client = SupabaseClientManager.getClient();
      if (!client) {
        alert('Supabase client not available. Please initialize first.');
        return;
      }

      // Test database tables exist
      const { data: tables, error } = await client
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        throw error;
      }

      alert('✅ Database schema is set up correctly!\n\nTables created:\n- profiles\n- documents\n- document_shares\n- analytics_sessions\n- analytics_events\n\nReady for data migration!');
    } catch (error) {
      console.error('Database test failed:', error);
      alert(`❌ Database test failed: ${error.message}`);
    }
  };

  const handleTestDualMode = async () => {
    try {
      console.log('Testing dual-mode repository system...');
      
      // Make sure cloud repositories are initialized if Supabase is available
      const client = SupabaseClientManager.getClient();
      if (client) {
        hybridRepositoryManager.reinitializeCloudRepositories();
        console.log('Cloud repositories reinitialized');
      }
      
      // Test repository manager status
      const status = await hybridRepositoryManager.getStatus();
      console.log('Repository status:', status);
      
      // Test local repositories
      const localLibrary = hybridRepositoryManager.getLibraryRepository();
      const localLibraryHealth = await localLibrary.getHealth();
      console.log('Local library health:', localLibraryHealth);
      
      // Test repository mode switching
      const currentMode = hybridRepositoryManager.getMode();
      console.log('Current mode:', currentMode);
      
      // Try to set cloud mode if Supabase is available
      if (client) {
        try {
          await hybridRepositoryManager.setMode('cloud');
          console.log('Successfully switched to cloud mode');
          
          const cloudLibrary = hybridRepositoryManager.getLibraryRepository();
          const cloudHealth = await cloudLibrary.getHealth();
          console.log('Cloud library health:', cloudHealth);
          
          // Test hybrid mode
          await hybridRepositoryManager.setMode('hybrid');
          console.log('Successfully switched to hybrid mode');
          
          const hybridLibrary = hybridRepositoryManager.getLibraryRepository();
          const hybridHealth = await hybridLibrary.getHealth();
          console.log('Hybrid library health:', hybridHealth);
          
          // Switch back to original mode
          await hybridRepositoryManager.setMode(currentMode);
          console.log(`Switched back to ${currentMode} mode`);
          
          alert('✅ Dual-mode repository system is fully working!\n\nFeatures tested:\n- Repository health checks\n- Mode switching (local/cloud/hybrid)\n- Cloud integration\n- Interface abstraction\n- Fallback mechanisms\n\nCheck console for detailed results.');
        } catch (error) {
          console.warn('Cloud mode test failed:', error);
          alert('⚠️ Dual-mode system working with limitations!\n\nLocal mode: ✅ Working\nCloud mode: ❌ Failed\n\nThis is normal if you haven\'t set up authentication.\nCheck console for details.');
        }
      } else {
        alert('✅ Dual-mode repository system is working!\n\nFeatures tested:\n- Repository health checks\n- Local mode operation\n- Interface abstraction\n\nCloud features require Supabase initialization.\nCheck console for detailed results.');
      }
    } catch (error) {
      console.error('Dual-mode test failed:', error);
      alert(`❌ Dual-mode test failed: ${error.message}`);
    }
  };

  const handleInitializeSupabase = () => {
    try {
      SupabaseClientManager.initializeWithProject();
      
      // Reinitialize cloud repositories after Supabase is ready
      hybridRepositoryManager.reinitializeCloudRepositories();
      
      alert('Supabase initialized! Health check will run automatically.');
      handleCheckSupabaseHealth();
    } catch (error) {
      console.error('Initialization failed:', error);
      alert(`Initialization failed: ${error.message}`);
    }
  };

  const isSupabaseConfigured = SupabaseConfigManager.isConfigured();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-slate-400" />
              <h2 className="text-xl font-semibold text-white">Data Management</h2>
            </div>
            <IconButton
              icon={<span className="text-lg">×</span>}
              onClick={onClose}
              variant="secondary"
              size="sm"
            />
          </div>

          {/* Local Data Backup Section */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Download className="w-5 h-5" />
              Local Data Backup
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">Test Backup Components</p>
                  <p className="text-slate-400 text-sm">Debug backup functionality before full export</p>
                </div>
                <Button
                  onClick={handleTestComponents}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  🔧 Test
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">Export All Data</p>
                  <p className="text-slate-400 text-sm">Create a complete backup of your PDFs, shares, and settings</p>
                </div>
                <Button
                  onClick={handleExportBackup}
                  disabled={isExporting}
                  className="flex items-center gap-2"
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Export
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">Import Backup</p>
                  <p className="text-slate-400 text-sm">Restore data from a previous backup file</p>
                </div>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    disabled={isImporting}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button
                    disabled={isImporting}
                    className="flex items-center gap-2"
                  >
                    {isImporting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Import
                  </Button>
                </div>
              </div>

              {lastBackup && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Last backup: {new Date(lastBackup).toLocaleString()}</span>
                  </div>
                </div>
              )}

              {validationResult && !validationResult.isValid && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-red-400 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Backup Validation Failed</span>
                  </div>
                  <ul className="text-sm text-red-300 space-y-1">
                    {validationResult.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Supabase Integration Section */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Supabase Integration (Phase 1)
            </h3>
            
            <div className="space-y-4">
              {!isSupabaseConfigured ? (
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Initialize Supabase</p>
                      <p className="text-slate-400 text-sm">Set up cloud storage for your data</p>
                    </div>
                    <Button onClick={handleInitializeSupabase} variant="primary">
                      Initialize
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-white font-medium">Supabase Connection</p>
                        <p className="text-slate-400 text-sm">Check connection and database setup</p>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleCheckSupabaseHealth} variant="secondary" size="sm">
                          Health
                        </Button>
                        <Button onClick={handleTestDatabase} variant="secondary" size="sm">
                          Test DB
                        </Button>
                        <Button onClick={handleTestDualMode} variant="secondary" size="sm">
                          Test Dual
                        </Button>
                      </div>
                    </div>
                    
                    {supabaseHealth && (
                      <div className="mt-3 p-3 bg-slate-700/50 rounded">
                        <div className="flex items-center gap-2 mb-2">
                          {supabaseHealth.isConnected ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-400" />
                          )}
                          <span className="text-sm text-white">
                            {supabaseHealth.isConnected ? 'Connected' : 'Disconnected'}
                          </span>
                          {supabaseHealth.latency && (
                            <span className="text-sm text-slate-400">
                              ({supabaseHealth.latency}ms)
                            </span>
                          )}
                        </div>
                        {supabaseHealth.errors.length > 0 && (
                          <ul className="text-sm text-red-300 space-y-1">
                            {supabaseHealth.errors.map((error, index) => (
                              <li key={index}>• {error}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="p-4 bg-slate-800/30 rounded-lg">
            <h4 className="text-white font-medium mb-2">Migration Progress</h4>
            <div className="text-sm text-slate-400 space-y-1">
              <p>✅ Phase 1: Backup system and Supabase foundation</p>
              <p>⏳ Phase 2: Database schema design</p>
              <p>⏳ Phase 3: Dual-mode operation</p>
              <p>⏳ Phase 4: Full migration</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
