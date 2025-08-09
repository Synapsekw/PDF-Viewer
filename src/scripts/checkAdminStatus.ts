/**
 * Script to check admin status and debug authentication issues
 */

import { SupabaseClientManager } from '../lib/supabase/client';

export const checkCurrentUserAdmin = async () => {
  console.log('=== Admin Status Check ===');
  
  try {
    const supabase = SupabaseClientManager.getClient();
    if (!supabase) {
      console.log('❌ Supabase client not available');
      return false;
    }

    // Check auth user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Current user:', user?.email);
    console.log('Auth error:', authError);

    if (!user) {
      console.log('❌ No user logged in');
      return false;
    }

    // Check profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    console.log('Profile:', profile);
    console.log('Profile error:', profileError);

    if (!profile) {
      console.log('❌ No profile found - creating one...');
      
      // Try to create profile
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          display_name: user.email?.split('@')[0],
          settings: {
            role: 'admin',
            permissions: ['read', 'write', 'admin'],
            created_by: 'debug_script'
          }
        });

      if (insertError) {
        console.log('❌ Failed to create profile:', insertError);
        return false;
      }

      console.log('✅ Profile created with admin privileges');
      return true;
    }

    const settings = profile.settings as any || {};
    const isAdmin = settings.role === 'admin' || settings.permissions?.includes('admin');
    
    console.log('Settings:', settings);
    console.log('Is Admin:', isAdmin);

    if (!isAdmin) {
      console.log('⚠️  User is not admin - updating to admin...');
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          settings: {
            ...settings,
            role: 'admin',
            permissions: ['read', 'write', 'admin'],
            promoted_by: 'debug_script',
            promoted_at: new Date().toISOString()
          }
        })
        .eq('id', user.id);

      if (updateError) {
        console.log('❌ Failed to promote to admin:', updateError);
        return false;
      }

      console.log('✅ User promoted to admin');
      return true;
    }

    console.log('✅ User is already admin');
    return true;

  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Run the check if called directly
if (typeof window !== 'undefined') {
  (window as any).checkAdminStatus = checkCurrentUserAdmin;
  console.log('Run checkAdminStatus() in console to debug admin status');
}
