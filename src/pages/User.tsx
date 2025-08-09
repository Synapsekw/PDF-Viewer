import React, { useState, useEffect } from 'react';
import { User as UserIcon, Mail, Bell, Shield, Globe, Settings } from 'lucide-react';
import { useTheme } from '../theme/ThemeProvider';
import { ThemeSelector } from '../features/user/components/ThemeSelector';
import { ToggleSetting } from '../features/user/components/ToggleSetting';
import { DropdownSetting } from '../features/user/components/DropdownSetting';
import { Toast } from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';
import { UserProfile, UserSettings } from '../features/user/types';
import { useAnalytics } from '../contexts/AnalyticsContext';

// Mock user data - replace with actual API/auth data
const mockUserProfile: UserProfile = {
  id: '1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  role: 'admin',
  createdAt: '2024-01-01',
};

const languageOptions = [
  { value: 'en' as const, label: 'English', description: 'English (US)' },
  { value: 'es' as const, label: 'Español', description: 'Spanish' },
  { value: 'fr' as const, label: 'Français', description: 'French' },
  { value: 'de' as const, label: 'Deutsch', description: 'German' },
  { value: 'ja' as const, label: '日本語', description: 'Japanese' },
  { value: 'zh' as const, label: '中文', description: 'Chinese' },
];

const User: React.FC = () => {
  const { setCurrentTheme } = useTheme();
  const { toast, showToast, hideToast } = useToast();
  const { setAnalyticsEnabled } = useAnalytics();
  
  // Initialize settings from localStorage or defaults
  const [settings, setSettings] = useState<UserSettings>(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
    return {
      theme: 'dark',
      notifications: {
        email: true,
        inApp: true,
      },
      privacy: {
        analyticsEnabled: true,
      },
      language: 'en',
    };
  });

  // Apply theme on mount and when it changes
  useEffect(() => {
    const applyTheme = () => {
      if (settings.theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setCurrentTheme(prefersDark ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', prefersDark);
      } else {
        setCurrentTheme(settings.theme);
        document.documentElement.classList.toggle('dark', settings.theme === 'dark');
      }
    };

    applyTheme();

    // Listen for system theme changes if using system theme
    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.theme, setCurrentTheme]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
    showToast('Settings saved successfully');
  };

  const updateNestedSettings = <
    K extends keyof UserSettings,
    NK extends keyof UserSettings[K]
  >(
    key: K,
    nestedKey: NK,
    value: UserSettings[K][NK]
  ) => {
    setSettings(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [nestedKey]: value,
      },
    }));
    showToast('Settings saved successfully');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Card */}
        <div className="bg-slate-800/50 backdrop-blur-md rounded-lg p-6 border border-slate-700/50">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center">
              {mockUserProfile.avatar ? (
                <img 
                  src={mockUserProfile.avatar} 
                  alt={mockUserProfile.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <UserIcon className="w-10 h-10 text-slate-400" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-white">{mockUserProfile.name}</h1>
              <p className="text-slate-400">{mockUserProfile.email}</p>
              <p className="text-sm text-slate-500 mt-1">
                {mockUserProfile.role.charAt(0).toUpperCase() + mockUserProfile.role.slice(1)} • 
                Member since {new Date(mockUserProfile.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="bg-slate-800/50 backdrop-blur-md rounded-lg p-6 border border-slate-700/50">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Account Settings
          </h2>

          <div className="space-y-8">
            {/* Theme Selection */}
            <section>
              <h3 className="text-lg font-medium text-slate-200 mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Appearance
              </h3>
              <ThemeSelector 
                value={settings.theme}
                onChange={(theme) => updateSettings('theme', theme)}
              />
            </section>

            {/* Notification Preferences */}
            <section>
              <h3 className="text-lg font-medium text-slate-200 mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </h3>
              <div className="space-y-3">
                <ToggleSetting
                  label="Email Notifications"
                  description="Receive important updates and alerts via email"
                  checked={settings.notifications.email}
                  onChange={(checked) => updateNestedSettings('notifications', 'email', checked)}
                />
                <ToggleSetting
                  label="In-App Notifications"
                  description="Show notifications within the application"
                  checked={settings.notifications.inApp}
                  onChange={(checked) => updateNestedSettings('notifications', 'inApp', checked)}
                />
              </div>
            </section>

            {/* Privacy Settings */}
            <section>
              <h3 className="text-lg font-medium text-slate-200 mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Privacy
              </h3>
              <ToggleSetting
                label="Analytics Tracking"
                description="Help us improve by sharing anonymous usage data"
                checked={settings.privacy.analyticsEnabled}
                onChange={(checked) => {
                  updateNestedSettings('privacy', 'analyticsEnabled', checked);
                  setAnalyticsEnabled(checked);
                  showToast(
                    checked ? 'Analytics tracking enabled' : 'Analytics tracking disabled', 
                    'info'
                  );
                }}
              />
            </section>

            {/* Language Selection */}
            <section>
              <h3 className="text-lg font-medium text-slate-200 mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Language
              </h3>
              <DropdownSetting
                label="Display Language"
                description="Choose your preferred language"
                value={settings.language}
                options={languageOptions}
                onChange={(language) => updateSettings('language', language)}
              />
            </section>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
};

export default User;
