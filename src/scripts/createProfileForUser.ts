/**
 * Simple script to create profile for existing auth user
 */

import { SupabaseClientManager } from '../lib/supabase/client';

export const createProfileForUser = async () => {
  console.log('🔧 Creating profile for info@synapse-solutions.ai...');
  
  try {
    // Initialize Supabase client first
    SupabaseClientManager.initializeWithProject();
    const supabase = SupabaseClientManager.getClient();
    
    if (!supabase) {
      console.log('❌ Supabase client not available');
      return false;
    }

    // Get the current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('❌ Auth error:', authError);
      return false;
    }

    if (!user) {
      console.log('❌ No authenticated user found');
      console.log('ℹ️  Please login first at /auth');
      return false;
    }

    console.log('✅ Found authenticated user:', user.email);

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (existingProfile) {
      console.log('📝 Profile already exists, updating to admin...');
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          settings: {
            role: 'admin',
            permissions: ['read', 'write', 'admin'],
            updated_by: 'profile_script',
            updated_at: new Date().toISOString()
          }
        })
        .eq('id', user.id);

      if (updateError) {
        console.log('❌ Failed to update profile:', updateError);
        return false;
      }

      console.log('✅ Profile updated to admin');
      return true;
    }

    // Create new profile
    console.log('📝 Creating new profile...');
    
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        display_name: user.email?.split('@')[0] || 'Admin User',
        settings: {
          role: 'admin',
          permissions: ['read', 'write', 'admin'],
          created_by: 'profile_script',
          created_at: new Date().toISOString()
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      console.log('❌ Failed to create profile:', insertError);
      return false;
    }

    console.log('✅ Profile created successfully with admin privileges');
    return true;

  } catch (error) {
    console.error('❌ Error creating profile:', error);
    return false;
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).createProfileForUser = createProfileForUser;
  console.log('🔧 Run createProfileForUser() in console after logging in');
}
