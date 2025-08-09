/**
 * Fix admin profile with proper SQL commands
 * This bypasses RLS by using direct SQL in Supabase dashboard
 */

import { SupabaseClientManager } from '../lib/supabase/client';

export const getAdminFixSQL = () => {
  console.log('🔧 Admin Profile Fix SQL Commands');
  console.log('Copy and paste these commands into your Supabase SQL Editor:');
  console.log('');
  
  const userId = '3fb24523-70dc-4892-a000-4ba0c0497d46'; // From the logs
  
  const sqlCommands = `
-- Step 1: Check if profile exists
SELECT * FROM profiles WHERE id = '${userId}';

-- Step 2: Create RLS policy to allow profile creation for authenticated users
CREATE POLICY IF NOT EXISTS "Users can create their own profile" ON profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Step 3: Create RLS policy to allow profile updates for owners and admins
CREATE POLICY IF NOT EXISTS "Users can update their own profile" ON profiles 
  FOR UPDATE 
  USING (auth.uid() = id OR (settings->>'role')::text = 'admin');

-- Step 4: Create RLS policy to allow profile reading for all authenticated users
CREATE POLICY IF NOT EXISTS "Authenticated users can read profiles" ON profiles 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Step 5: Create the admin profile (bypasses RLS when run by service role)
INSERT INTO profiles (id, email, display_name, settings, created_at, updated_at)
VALUES (
  '${userId}',
  'info@synapse-solutions.ai',
  'Synapse Solutions Admin',
  '{"role": "admin", "permissions": ["read", "write", "admin"], "created_by": "sql_fix"}'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  settings = '{"role": "admin", "permissions": ["read", "write", "admin"], "updated_by": "sql_fix"}'::jsonb,
  updated_at = NOW();

-- Step 6: Verify the profile was created/updated
SELECT id, email, display_name, settings FROM profiles WHERE id = '${userId}';

-- Step 7: Create a function to auto-create profiles for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create trigger to auto-create profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`;

  console.log(sqlCommands);
  return sqlCommands;
};

export const fixAdminProfileDirectly = async () => {
  console.log('🔧 Attempting to fix admin profile...');
  
  try {
    const supabase = SupabaseClientManager.getClient();
    if (!supabase) {
      console.log('❌ No Supabase client available');
      return false;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ No authenticated user');
      return false;
    }

    console.log('👤 Current user ID:', user.id);
    console.log('👤 Current user email:', user.email);

    // First check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle(); // Use maybeSingle instead of single to avoid error on no rows

    if (existingProfile) {
      console.log('✅ Profile already exists:', existingProfile);
      
      // Check if it has admin role
      const settings = existingProfile.settings as any || {};
      if (settings.role === 'admin') {
        console.log('✅ Profile already has admin role');
        return true;
      } else {
        console.log('🔧 Updating profile to admin role...');
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            settings: {
              ...settings,
              role: 'admin',
              permissions: ['read', 'write', 'admin'],
              updated_by: 'fix_script',
              updated_at: new Date().toISOString()
            }
          })
          .eq('id', user.id);

        if (updateError) {
          console.log('❌ Update failed:', updateError);
          return false;
        }
        
        console.log('✅ Profile updated to admin role');
        return true;
      }
    }

    // Profile doesn't exist, try to create it
    console.log('🔧 Creating new profile...');
    
    try {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          display_name: user.email?.split('@')[0] || 'Admin',
          settings: {
            role: 'admin',
            permissions: ['read', 'write', 'admin'],
            created_by: 'fix_script'
          }
        });

      if (insertError) {
        console.log('❌ Insert failed:', insertError);
        throw insertError;
      }

      console.log('✅ Profile created successfully!');
      return true;

    } catch (insertError) {
      console.log('❌ Profile creation failed:', insertError);
      
      // Output SQL commands for manual execution
      const sqlCommands = getAdminFixSQL();
      
      console.log('');
      console.log('📋 MANUAL FIX REQUIRED:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Open SQL Editor');
      console.log('3. Run the SQL commands shown above OR use the ADMIN_SETUP_COMPLETE.sql file');
      console.log('4. Refresh this page');
      console.log('');
      console.log('💡 TIP: The ADMIN_SETUP_COMPLETE.sql file in your project root contains all necessary fixes!');
      
      return false;
    }

  } catch (error) {
    console.error('❌ Error fixing admin profile:', error);
    return false;
  }
};

// Auto-run and make available globally
if (typeof window !== 'undefined') {
  (window as any).fixAdminProfile = fixAdminProfileDirectly;
  (window as any).getAdminFixSQL = getAdminFixSQL;
  
  console.log('🔧 Run fixAdminProfile() or getAdminFixSQL() in console');
}

// Auto-run the fix
setTimeout(() => {
  fixAdminProfileDirectly();
}, 1000);
