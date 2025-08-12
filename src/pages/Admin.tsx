/**
 * Admin Page - Main admin interface
 */

import React, { useState, useEffect } from 'react';
import { Shield, Users, Settings, Activity, AlertTriangle } from 'lucide-react';
import { AdminDashboard, AdminUserPanel, UserActivityMonitor, SetupTools } from '../components/admin';
import { SupabaseClientManager } from '../lib/supabase/client';
import { Card } from '../components/ui';

type AdminTab = 'dashboard' | 'activity' | 'legacy';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      console.log('🔍 Admin page: Checking admin access...');
      const supabase = SupabaseClientManager.getClient();
      if (!supabase) {
        console.log('❌ Admin page: No Supabase client');
        setIsAuthorized(false);
        return;
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('👤 Admin page: Current user:', user?.email, 'Error:', authError);
      
      if (authError || !user) {
        console.log('❌ Admin page: No authenticated user');
        setIsAuthorized(false);
        return;
      }

      // Check if user has admin role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle(); // Use maybeSingle to avoid error on no rows

      console.log('👤 Admin page: Profile data:', profile, 'Error:', profileError);

      if (profileError || !profile) {
        console.log('❌ Admin page: No profile found');
        setIsAuthorized(false);
        return;
      }

      const settings = profile.settings as any || {};
      const isAdmin = settings.role === 'admin' || settings.permissions?.includes('admin');
      
      console.log('⚡ Admin page: Settings:', settings, 'Is Admin:', isAdmin);
      
      setCurrentUser(profile);
      setIsAuthorized(isAdmin);
    } catch (error) {
      console.error('❌ Admin page: Failed to check admin access:', error);
      setIsAuthorized(false);
    }
  };

  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized && process.env.NODE_ENV !== 'development') {
    return (
      <div className="flex items-center justify-center">
        <Card className="p-8 max-w-md mx-auto text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don't have permission to access the admin panel. Please contact an administrator if you believe this is an error.
          </p>
          <div className="space-y-3">
            <button 
              onClick={checkAdminAccess}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-3"
            >
              Retry Check
            </button>
            <button 
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // Development mode bypass
  if (!isAuthorized && process.env.NODE_ENV === 'development') {
    console.log('🔧 Development mode: Bypassing admin check');
  }

  const tabs = [
    {
      id: 'dashboard' as AdminTab,
      label: 'User Management',
      icon: <Users className="w-4 h-4" />,
      description: 'User management and administration'
    },
    {
      id: 'activity' as AdminTab,
      label: 'Activity Monitor',
      icon: <Activity className="w-4 h-4" />,
      description: 'Real-time user activity tracking'
    },
    {
      id: 'legacy' as AdminTab,
      label: 'Setup Tools',
      icon: <Settings className="w-4 h-4" />,
      description: 'System configuration and maintenance'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
        {/* Welcome Card - Profile page style */}
        <div className="bg-slate-800/50 backdrop-blur-md rounded-lg p-6 border border-slate-700/50">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center">
              <Shield className="w-10 h-10 text-blue-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-white">Admin Panel</h1>
              <p className="text-slate-400">Welcome, {currentUser?.display_name || currentUser?.email}</p>
              <p className="text-sm text-slate-500 mt-1">
                Admin • System Management and User Control
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Card - Profile page style */}
        <div className="bg-slate-800/50 backdrop-blur-md rounded-lg p-6 border border-slate-700/50">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Admin Tools
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`p-4 rounded-lg border transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                    : 'bg-slate-700/30 border-slate-600 text-slate-400 hover:bg-slate-700/50 hover:border-slate-500 hover:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    activeTab === tab.id ? 'bg-blue-500/20' : 'bg-slate-600/50'
                  }`}>
                    {tab.icon}
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{tab.label}</div>
                    <div className="text-xs opacity-75">{tab.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'dashboard' && <AdminDashboard />}
          {activeTab === 'activity' && <UserActivityMonitor />}
          {activeTab === 'legacy' && <SetupTools />}
        </div>
      </div>
  );
}
