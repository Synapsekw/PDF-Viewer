/**
 * Script to make a specific user an admin
 */

import { SupabaseClientManager } from '../lib/supabase/client';

export const makeUserAdmin = async (email: string) => {
  console.log(`🔧 Making user admin: ${email}`);
  
  try {
    const supabase = SupabaseClientManager.getClient();
    if (!supabase) {
      console.log('❌ Supabase client not available');
      return false;
    }

    // First, check if the user exists in auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.log('❌ Failed to list users:', listError);
      return false;
    }

    const authUser = users?.find(u => u.email === email);
    if (!authUser) {
      console.log('❌ User not found in auth system');
      return false;
    }

    console.log('✅ Found user in auth system:', authUser.id);

    // Check if profile exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.log('❌ Error checking profile:', profileError);
      return false;
    }

    if (!existingProfile) {
      console.log('📝 Creating new profile with admin privileges...');
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.id,
          email: email,
          display_name: email.split('@')[0],
          settings: {
            role: 'admin',
            permissions: ['read', 'write', 'admin'],
            created_by: 'admin_script',
            created_at: new Date().toISOString()
          }
        });

      if (insertError) {
        console.log('❌ Failed to create profile:', insertError);
        return false;
      }

      console.log('✅ Profile created with admin privileges');
    } else {
      console.log('📝 Updating existing profile to admin...');
      
      const currentSettings = existingProfile.settings as any || {};
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          settings: {
            ...currentSettings,
            role: 'admin',
            permissions: ['read', 'write', 'admin'],
            promoted_by: 'admin_script',
            promoted_at: new Date().toISOString()
          }
        })
        .eq('id', authUser.id);

      if (updateError) {
        console.log('❌ Failed to update profile:', updateError);
        return false;
      }

      console.log('✅ Profile updated with admin privileges');
    }

    // Verify the update
    const { data: verifyProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (verifyProfile) {
      const settings = verifyProfile.settings as any || {};
      console.log('🔍 Verification - User settings:', settings);
      console.log('✅ Admin status confirmed:', settings.role === 'admin');
    }

    return true;

  } catch (error) {
    console.error('❌ Error making user admin:', error);
    return false;
  }
};

// Immediately run for the specified user
makeUserAdmin('info@synapse-solutions.ai')
  .then(success => {
    if (success) {
      console.log('🎉 Successfully made info@synapse-solutions.ai an admin!');
      console.log('🔄 Please refresh your browser to see the admin panel.');
    } else {
      console.log('❌ Failed to make user admin. Check the logs above.');
    }
  })
  .catch(error => {
    console.error('❌ Script execution failed:', error);
  });

// Also make it available globally
if (typeof window !== 'undefined') {
  (window as any).makeUserAdmin = makeUserAdmin;
}
