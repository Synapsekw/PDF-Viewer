/**
 * Logout helper script
 * Run this in the browser console to log out
 */

import { SupabaseClientManager } from '../lib/supabase/client';

export const logout = async () => {
  const supabase = SupabaseClientManager.getClient();
  if (supabase) {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
    } else {
      console.log('Successfully logged out');
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }
  } else {
    console.log('No Supabase client, clearing local storage');
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  }
};

// Make it available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).logout = logout;
}
