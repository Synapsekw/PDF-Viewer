/**
 * Admin Page - Main admin interface
 */

import React, { useState, useEffect } from 'react';
import { Shield, Users, Settings, Activity, AlertTriangle } from 'lucide-react';
import { AdminDashboard, AdminUserPanel, UserActivityMonitor } from '../components/admin';
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized && process.env.NODE_ENV !== 'development') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
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
      description: 'Create default admin user'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Admin Panel
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Welcome, {currentUser?.display_name || currentUser?.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {activeTab === 'dashboard' && <AdminDashboard />}
        {activeTab === 'activity' && <UserActivityMonitor />}
        {activeTab === 'legacy' && (
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
            <AdminUserPanel />
          </div>
        )}
      </div>
    </div>
  );
}
