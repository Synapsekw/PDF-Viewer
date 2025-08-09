/**
 * Auto-setup admin user for development
 */

import { SupabaseClientManager } from '../lib/supabase/client';

export const setupAdmin = async () => {
  console.log('🔧 Setting up admin user...');
  
  try {
    const supabase = SupabaseClientManager.getClient();
    if (!supabase) {
      console.log('❌ Supabase client not available for admin setup');
      return false;
    }

    // Check if the admin user exists in auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.log('⚠️  Cannot access auth.admin.listUsers - likely need service role key');
      // Try with regular auth
      return await setupAdminForCurrentUser();
    }

    const adminUser = users?.find(u => u.email === 'info@synapse-solutions.ai');
    
    if (!adminUser) {
      console.log('❌ Admin user info@synapse-solutions.ai not found in auth');
      return false;
    }

    console.log('✅ Found admin user in auth:', adminUser.id);

    // Check/create profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', adminUser.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.log('❌ Error checking profile:', profileError);
      return false;
    }

    if (!profile) {
      console.log('📝 Creating admin profile...');
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: adminUser.id,
          email: adminUser.email,
          display_name: 'Synapse Solutions Admin',
          settings: {
            role: 'admin',
            permissions: ['read', 'write', 'admin'],
            created_by: 'auto_setup',
            created_at: new Date().toISOString()
          }
        });

      if (insertError) {
        console.log('❌ Failed to create admin profile:', insertError);
        return false;
      }

      console.log('✅ Admin profile created');
    } else {
      // Ensure admin privileges
      const settings = profile.settings as any || {};
      if (settings.role !== 'admin') {
        console.log('📝 Updating user to admin...');
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            settings: {
              ...settings,
              role: 'admin',
              permissions: ['read', 'write', 'admin'],
              updated_by: 'auto_setup',
              updated_at: new Date().toISOString()
            }
          })
          .eq('id', adminUser.id);

        if (updateError) {
          console.log('❌ Failed to update to admin:', updateError);
          return false;
        }

        console.log('✅ User updated to admin');
      } else {
        console.log('✅ User is already admin');
      }
    }

    return true;

  } catch (error) {
    console.error('❌ Error in admin setup:', error);
    return false;
  }
};

const setupAdminForCurrentUser = async () => {
  console.log('🔧 Trying to setup admin for current user...');
  
  const supabase = SupabaseClientManager.getClient();
  if (!supabase) return false;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('❌ No current user to make admin');
    return false;
  }

  console.log('👤 Setting up admin for current user:', user.email);

  // Check if profile exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    // Create profile
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        display_name: user.email?.split('@')[0] || 'Admin',
        settings: {
          role: 'admin',
          permissions: ['read', 'write', 'admin'],
          created_by: 'current_user_setup'
        }
      });

    if (insertError) {
      console.log('❌ Failed to create profile for current user:', insertError);
      return false;
    }

    console.log('✅ Profile created for current user with admin privileges');
  } else {
    // Update to admin
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        settings: {
          role: 'admin',
          permissions: ['read', 'write', 'admin'],
          updated_by: 'current_user_setup',
          updated_at: new Date().toISOString()
        }
      })
      .eq('id', user.id);

    if (updateError) {
      console.log('❌ Failed to update current user to admin:', updateError);
      return false;
    }

    console.log('✅ Current user updated to admin');
  }

  return true;
};

// Auto-run in development
if (process.env.NODE_ENV === 'development') {
  // Wait a bit for Supabase to initialize
  setTimeout(async () => {
    const success = await setupAdmin();
    if (success) {
      console.log('🎉 Admin setup completed successfully!');
    } else {
      console.log('⚠️  Admin setup failed - you may need to login first');
    }
  }, 2000);
}

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).setupAdmin = setupAdmin;
}
