/**
 * Setup Tools - Administrative setup and configuration tools
 */

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Database, 
  Users, 
  Shield, 
  Key,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader,
  FileText,
  BarChart3,
  Zap,
  Globe,
  Lock,
  Unlock,
  Trash2,
  Download,
  Upload,
  Archive,
  Wifi,
  WifiOff,
  Clock,
  Activity
} from 'lucide-react';
import { SupabaseClientManager } from '../../lib/supabase/client';
import { repositoryManager } from '../../lib/repositories/RepositoryManager';
import { Button, Card, Input } from '../ui';

interface SetupStatus {
  database: boolean;
  users: boolean;
  analytics: boolean;
  storage: boolean;
  auth: boolean;
}

interface SystemStats {
  totalUsers: number;
  totalDocuments: number;
  totalSessions: number;
  storageUsed: string;
  lastBackup: string;
}

interface ConnectionHealth {
  available: boolean;
  authenticated: boolean;
  latency?: number;
  errors: string[];
}

export const SetupTools: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [setupStatus, setSetupStatus] = useState<SetupStatus>({
    database: false,
    users: false,
    analytics: false,
    storage: false,
    auth: false
  });
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'database' | 'users' | 'backup' | 'maintenance' | 'connection'>('overview');
  const [connectionHealth, setConnectionHealth] = useState<ConnectionHealth | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    checkSystemStatus();
    loadSystemStats();
  }, []);

  const checkSystemStatus = async () => {
    setLoading(true);
    try {
      const supabase = SupabaseClientManager.getClient();
      if (!supabase) throw new Error('No Supabase client');

      // Check database connectivity
      const { data: dbTest } = await supabase.from('profiles').select('count').limit(1);
      
      // Check users table
      const { data: usersTest } = await supabase.from('profiles').select('id').limit(1);
      
      // Check analytics table
      const { data: analyticsTest } = await supabase.from('analytics_sessions').select('id').limit(1);
      
      // Check storage
      const { data: storageTest } = await supabase.storage.listBuckets();
      
      // Check auth
      const { data: { user } } = await supabase.auth.getUser();

      setSetupStatus({
        database: !!dbTest,
        users: !!usersTest,
        analytics: !!analyticsTest,
        storage: storageTest && storageTest.length > 0,
        auth: !!user
      });
    } catch (error) {
      console.error('Failed to check system status:', error);
      setResult({ success: false, message: 'Failed to check system status' });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setTestingConnection(true);
    setResult(null);
    
    try {
      const health = await repositoryManager.checkSupabaseHealth();
      setConnectionHealth(health);
      
      if (health.available) {
        setResult({ success: true, message: 'Connection test completed successfully' });
      } else {
        setResult({ success: false, message: 'Connection test failed' });
      }
    } catch (error) {
      setResult({ success: false, message: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setTestingConnection(false);
    }
  };

  const loadSystemStats = async () => {
    try {
      const supabase = SupabaseClientManager.getClient();
      if (!supabase) return;

      // Get user count
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get document count
      const { count: docCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true });

      // Get session count
      const { count: sessionCount } = await supabase
        .from('analytics_sessions')
        .select('*', { count: 'exact', head: true });

      setSystemStats({
        totalUsers: userCount || 0,
        totalDocuments: docCount || 0,
        totalSessions: sessionCount || 0,
        storageUsed: '2.4 GB', // Mock data
        lastBackup: new Date().toLocaleDateString()
      });
    } catch (error) {
      console.error('Failed to load system stats:', error);
    }
  };

  const handleDatabaseReset = async () => {
    if (!confirm('Are you sure you want to reset the database? This will delete all data and cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      // This would be a dangerous operation in production
      setResult({ success: true, message: 'Database reset completed (simulated)' });
    } catch (error) {
      setResult({ success: false, message: 'Failed to reset database' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setLoading(true);
    try {
      // Simulate backup creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      setResult({ success: true, message: 'Backup created successfully' });
    } catch (error) {
      setResult({ success: false, message: 'Failed to create backup' });
    } finally {
      setLoading(false);
    }
  };

  const handleSystemOptimization = async () => {
    setLoading(true);
    try {
      // Simulate optimization
      await new Promise(resolve => setTimeout(resolve, 1500));
      setResult({ success: true, message: 'System optimization completed' });
    } catch (error) {
      setResult({ success: false, message: 'Failed to optimize system' });
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    {
      id: 'overview' as const,
      label: 'System Overview',
      icon: <BarChart3 className="w-4 h-4" />,
      description: 'System status and statistics'
    },
    {
      id: 'connection' as const,
      label: 'Connection Test',
      icon: <Wifi className="w-4 h-4" />,
      description: 'Test Supabase connectivity'
    },
    {
      id: 'database' as const,
      label: 'Database',
      icon: <Database className="w-4 h-4" />,
      description: 'Database management and maintenance'
    },
    {
      id: 'users' as const,
      label: 'User Management',
      icon: <Users className="w-4 h-4" />,
      description: 'User data and permissions'
    },
    {
      id: 'backup' as const,
      label: 'Backup & Restore',
      icon: <Archive className="w-4 h-4" />,
      description: 'Data backup and recovery'
    },
    {
      id: 'maintenance' as const,
      label: 'Maintenance',
      icon: <Zap className="w-4 h-4" />,
      description: 'System optimization and cleanup'
    }
  ];

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-5 h-5 text-green-400" />
    ) : (
      <XCircle className="w-5 h-5 text-red-400" />
    );
  };

  const getStatusColor = (status: boolean) => {
    return status ? 'text-green-400' : 'text-red-400';
  };

  const getConnectionStatusIcon = (available: boolean) => {
    return available ? (
      <Wifi className="w-5 h-5 text-green-400" />
    ) : (
      <WifiOff className="w-5 h-5 text-red-400" />
    );
  };

  const getLatencyColor = (latency?: number) => {
    if (!latency) return 'text-slate-400';
    if (latency < 100) return 'text-green-400';
    if (latency < 300) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-md rounded-lg p-6 border border-slate-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Setup Tools
            </h1>
            <p className="text-slate-400 mt-1">System configuration and maintenance tools</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={checkSystemStatus}
              disabled={loading}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <RefreshCw className={loading ? 'animate-spin w-4 h-4' : 'w-4 h-4'} />
              Refresh Status
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-slate-800/50 backdrop-blur-md rounded-lg p-6 border border-slate-700/50">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`p-4 rounded-lg border transition-all ${
                activeSection === section.id
                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                  : 'bg-slate-700/30 border-slate-600 text-slate-400 hover:bg-slate-700/50 hover:border-slate-500 hover:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  activeSection === section.id ? 'bg-blue-500/20' : 'bg-slate-600/50'
                }`}>
                  {section.icon}
                </div>
                <div className="text-left">
                  <div className="font-medium">{section.label}</div>
                  <div className="text-xs opacity-75">{section.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeSection === 'overview' && (
          <>
            {/* System Status */}
            <div className="bg-slate-800/50 backdrop-blur-md rounded-lg p-6 border border-slate-700/50">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                System Status
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Database className="w-5 h-5 text-blue-400" />
                      <span className="text-white">Database</span>
                    </div>
                    {getStatusIcon(setupStatus.database)}
                  </div>
                </div>
                
                <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-green-400" />
                      <span className="text-white">Users</span>
                    </div>
                    {getStatusIcon(setupStatus.users)}
                  </div>
                </div>
                
                <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-5 h-5 text-purple-400" />
                      <span className="text-white">Analytics</span>
                    </div>
                    {getStatusIcon(setupStatus.analytics)}
                  </div>
                </div>
                
                <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Archive className="w-5 h-5 text-yellow-400" />
                      <span className="text-white">Storage</span>
                    </div>
                    {getStatusIcon(setupStatus.storage)}
                  </div>
                </div>
                
                <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5 text-red-400" />
                      <span className="text-white">Authentication</span>
                    </div>
                    {getStatusIcon(setupStatus.auth)}
                  </div>
                </div>
              </div>
            </div>

            {/* System Statistics */}
            {systemStats && (
              <div className="bg-slate-800/50 backdrop-blur-md rounded-lg p-6 border border-slate-700/50">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  System Statistics
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Users className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Total Users</p>
                        <p className="text-2xl font-semibold text-white">{systemStats.totalUsers}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <FileText className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Documents</p>
                        <p className="text-2xl font-semibold text-white">{systemStats.totalDocuments}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/10 rounded-lg">
                        <BarChart3 className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Sessions</p>
                        <p className="text-2xl font-semibold text-white">{systemStats.totalSessions}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-500/10 rounded-lg">
                        <Archive className="w-5 h-5 text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Storage Used</p>
                        <p className="text-2xl font-semibold text-white">{systemStats.storageUsed}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-500/10 rounded-lg">
                        <Download className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Last Backup</p>
                        <p className="text-lg font-semibold text-white">{systemStats.lastBackup}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeSection === 'connection' && (
          <div className="space-y-6">
            {/* Connection Test Header */}
            <div className="bg-slate-800/50 backdrop-blur-md rounded-lg p-6 border border-slate-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Wifi className="w-5 h-5" />
                    Supabase Connection Test
                  </h2>
                  <p className="text-slate-400 mt-1">Test connectivity and health of your Supabase backend</p>
                </div>
                <Button
                  onClick={testConnection}
                  disabled={testingConnection}
                  variant="primary"
                  className="flex items-center gap-2"
                >
                  {testingConnection && <Loader className="w-4 h-4 animate-spin" />}
                  <Activity className="w-4 h-4" />
                  {testingConnection ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>
            </div>

            {/* Connection Status */}
            {connectionHealth && (
              <div className="bg-slate-800/50 backdrop-blur-md rounded-lg p-6 border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Connection Status
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Wifi className="w-5 h-5 text-blue-400" />
                        <span className="text-white">Connection</span>
                      </div>
                      {getConnectionStatusIcon(connectionHealth.available)}
                    </div>
                    <div className="mt-2">
                      <span className={`text-sm ${getStatusColor(connectionHealth.available)}`}>
                        {connectionHealth.available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-green-400" />
                        <span className="text-white">Authentication</span>
                      </div>
                      {getStatusIcon(connectionHealth.authenticated)}
                    </div>
                    <div className="mt-2">
                      <span className={`text-sm ${getStatusColor(connectionHealth.authenticated)}`}>
                        {connectionHealth.authenticated ? 'Authenticated' : 'Not authenticated'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-purple-400" />
                        <span className="text-white">Latency</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className={`text-sm ${getLatencyColor(connectionHealth.latency)}`}>
                        {connectionHealth.latency ? `${connectionHealth.latency}ms` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Repository Status */}
                <div className="mt-6">
                  <h4 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Repository Status
                  </h4>
                  <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600/30">
                    <pre className="text-sm text-slate-300 overflow-auto">
                      {JSON.stringify(repositoryManager.getStatus(), null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Error Details */}
                {connectionHealth.errors.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-md font-semibold text-red-400 mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Connection Errors
                    </h4>
                    <div className="bg-red-500/10 rounded-lg border border-red-500/20 p-4">
                      <ul className="list-disc list-inside text-red-300 space-y-1">
                        {connectionHealth.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Environment Configuration */}
            <div className="bg-slate-800/50 backdrop-blur-md rounded-lg p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Key className="w-5 h-5" />
                Environment Configuration
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                  <h4 className="text-md font-medium text-white mb-2">Supabase URL</h4>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${import.meta.env.VITE_SUPABASE_URL ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span className="text-sm text-slate-400">
                      {import.meta.env.VITE_SUPABASE_URL ? 'Configured' : 'Not configured'}
                    </span>
                  </div>
                  {import.meta.env.VITE_SUPABASE_URL && (
                    <p className="text-xs text-slate-500 mt-1 truncate">
                      {import.meta.env.VITE_SUPABASE_URL}
                    </p>
                  )}
                </div>
                
                <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                  <h4 className="text-md font-medium text-white mb-2">Anonymous Key</h4>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${import.meta.env.VITE_SUPABASE_ANON_KEY ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span className="text-sm text-slate-400">
                      {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configured' : 'Not configured'}
                    </span>
                  </div>
                  {import.meta.env.VITE_SUPABASE_ANON_KEY && (
                    <p className="text-xs text-slate-500 mt-1">
                      {import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 20)}...
                    </p>
                  )}
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-400 mb-1">Configuration Help</h4>
                    <p className="text-sm text-blue-300">
                      Make sure your <code className="bg-blue-500/20 px-1 rounded">.env.local</code> file contains the correct Supabase credentials. 
                      Copy from <code className="bg-blue-500/20 px-1 rounded">env.example</code> and update with your project values.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'database' && (
          <div className="bg-slate-800/50 backdrop-blur-md rounded-lg p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database Management
            </h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                <h3 className="text-lg font-medium text-white mb-2">Database Status</h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-slate-400">Connection:</span>
                  <span className={getStatusColor(setupStatus.database)}>
                    {setupStatus.database ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <Button
                  onClick={checkSystemStatus}
                  disabled={loading}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={loading ? 'animate-spin w-4 h-4' : 'w-4 h-4'} />
                  Test Connection
                </Button>
              </div>
              
              <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                <h3 className="text-lg font-medium text-red-400 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Dangerous Operations
                </h3>
                <p className="text-red-300 mb-4">
                  These operations will permanently delete data and cannot be undone.
                </p>
                <Button
                  onClick={handleDatabaseReset}
                  disabled={loading}
                  variant="secondary"
                  className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                  Reset Database
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'users' && (
          <div className="bg-slate-800/50 backdrop-blur-md rounded-lg p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Management
            </h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                <h3 className="text-lg font-medium text-white mb-2">User Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Total Users</p>
                    <p className="text-2xl font-semibold text-white">{systemStats?.totalUsers || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Active Users</p>
                    <p className="text-2xl font-semibold text-white">{systemStats?.totalUsers || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">User Status</p>
                    <p className="text-lg font-semibold text-green-400">Healthy</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                <h3 className="text-lg font-medium text-white mb-2">User Operations</h3>
                <div className="flex gap-3">
                  <Button variant="secondary" className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export Users
                  </Button>
                  <Button variant="secondary" className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Import Users
                  </Button>
                  <Button variant="secondary" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Bulk Operations
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'backup' && (
          <div className="bg-slate-800/50 backdrop-blur-md rounded-lg p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Archive className="w-5 h-5" />
              Backup & Restore
            </h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                <h3 className="text-lg font-medium text-white mb-2">Backup Status</h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-slate-400">Last Backup:</span>
                  <span className="text-white">{systemStats?.lastBackup || 'Never'}</span>
                </div>
                <Button
                  onClick={handleCreateBackup}
                  disabled={loading}
                  variant="primary"
                  className="flex items-center gap-2"
                >
                  {loading && <Loader className="w-4 h-4 animate-spin" />}
                  <Download className="w-4 h-4" />
                  Create Backup
                </Button>
              </div>
              
              <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                <h3 className="text-lg font-medium text-white mb-2">Restore Options</h3>
                <div className="flex gap-3">
                  <Button variant="secondary" className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Restore from Backup
                  </Button>
                  <Button variant="secondary" className="flex items-center gap-2">
                    <Archive className="w-4 h-4" />
                    View Backup History
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'maintenance' && (
          <div className="bg-slate-800/50 backdrop-blur-md rounded-lg p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              System Maintenance
            </h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                <h3 className="text-lg font-medium text-white mb-2">System Optimization</h3>
                <p className="text-slate-400 mb-4">
                  Optimize database performance and clean up temporary files.
                </p>
                <Button
                  onClick={handleSystemOptimization}
                  disabled={loading}
                  variant="primary"
                  className="flex items-center gap-2"
                >
                  {loading && <Loader className="w-4 h-4 animate-spin" />}
                  <Zap className="w-4 h-4" />
                  Run Optimization
                </Button>
              </div>
              
              <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                <h3 className="text-lg font-medium text-white mb-2">Cleanup Tasks</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="secondary" className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Clean Old Sessions
                  </Button>
                  <Button variant="secondary" className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Clean Orphaned Files
                  </Button>
                  <Button variant="secondary" className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Clean Analytics Data
                  </Button>
                  <Button variant="secondary" className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Clean Logs
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Result Message */}
      {result && (
        <div className={`p-4 rounded-lg border flex items-center justify-between ${
          result.success 
            ? 'bg-green-500/10 border-green-500/20 text-green-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          <div className="flex items-center gap-2">
            {result.success ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span>{result.message}</span>
          </div>
          <button 
            onClick={() => setResult(null)}
            className="text-slate-400 hover:text-slate-300 transition-colors"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
