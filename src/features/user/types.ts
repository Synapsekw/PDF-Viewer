/**
 * User profile and settings types
 */

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  avatar?: string;
  createdAt: string;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    inApp: boolean;
  };
  privacy: {
    analyticsEnabled: boolean;
  };
  language: 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh';
}

export type SettingSection = 'appearance' | 'notifications' | 'privacy' | 'language';

export interface SettingOption<T = any> {
  label: string;
  value: T;
  description?: string;
  icon?: React.ReactNode;
}
