-- Comprehensive Admin Setup SQL Script for Spectra AI
-- This script fixes all profile and RLS issues at once

-- Step 1: Create RLS policies for profiles table
-- This allows users to create and manage their own profiles

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON profiles;

-- Create comprehensive RLS policies
CREATE POLICY "Users can create their own profile" ON profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles 
  FOR UPDATE 
  USING (auth.uid() = id OR (settings->>'role')::text = 'admin');

CREATE POLICY "Authenticated users can read profiles" ON profiles 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Step 2: Create the admin profile for your user
-- Replace the user ID with your actual user ID from the logs
INSERT INTO profiles (id, email, display_name, settings, created_at, updated_at)
VALUES (
  '3fb24523-70dc-4892-a000-4ba0c0497d46',
  'info@synapse-solutions.ai',
  'Synapse Solutions Admin',
  '{"role": "admin", "permissions": ["read", "write", "admin"], "created_by": "sql_setup"}'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  settings = '{"role": "admin", "permissions": ["read", "write", "admin"], "updated_by": "sql_setup"}'::jsonb,
  updated_at = NOW();

-- Step 3: Create a function to auto-create profiles for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, created_at, updated_at, settings)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    now(),
    now(),
    '{"role": "user", "permissions": ["read", "write"]}'::jsonb
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create trigger to auto-create profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Verify the setup
SELECT 
  id, 
  email, 
  display_name, 
  settings,
  created_at
FROM profiles 
WHERE id = '3fb24523-70dc-4892-a000-4ba0c0497d46';

-- Expected result: Should show your admin profile with role: admin

-- Step 6: Test the RLS policies
-- This should return your profile (when run by authenticated user)
SELECT id, email, display_name, settings->>'role' as role 
FROM profiles 
WHERE id = '3fb24523-70dc-4892-a000-4ba0c0497d46';

-- Step 7: Verify triggers work (optional test)
-- Check that the trigger function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Check that the trigger exists
SELECT tgname, tgrelid::regclass, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

/*
TROUBLESHOOTING:
1. If you get permission errors, make sure you're running this in Supabase SQL Editor as the service role
2. If the profile isn't created, check that the user ID matches exactly
3. After running this script, refresh your Spectra AI application
4. The console errors about profile creation should be resolved
*/
