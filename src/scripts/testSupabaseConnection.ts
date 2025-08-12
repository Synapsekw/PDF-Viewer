/**
 * Test Supabase connection and configuration
 */

import { SupabaseClientManager } from '../lib/supabase/client';
import { SupabaseConfigManager } from '../lib/supabase/config';

async function testSupabaseConnection() {
  console.log('🔧 Testing Supabase Connection...\n');

  // 1. Check environment variables
  console.log('1️⃣ Checking environment variables:');
  console.log('   VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Not set');
  console.log('   VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set');
  console.log('   VITE_SUPABASE_SERVICE_ROLE_KEY:', import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Not set');
  console.log();

  // 2. Check configuration
  console.log('2️⃣ Checking configuration:');
  const config = SupabaseConfigManager.getConfig();
  console.log('   Config loaded:', config.enabled ? '✅ Enabled' : '❌ Disabled');
  console.log('   URL configured:', config.url ? '✅ Yes' : '❌ No');
  console.log('   Anon key configured:', config.anonKey ? '✅ Yes' : '❌ No');
  console.log('   Storage mode:', config.mode);
  console.log('   Features:', JSON.stringify(config.features, null, 2));
  console.log();

  // 3. Initialize and test client
  console.log('3️⃣ Initializing Supabase client:');
  SupabaseClientManager.initializeWithProject();
  const client = SupabaseClientManager.getClient();
  
  if (!client) {
    console.error('❌ Failed to initialize Supabase client');
    return;
  }
  console.log('✅ Client initialized successfully');
  console.log();

  // 4. Test connection health
  console.log('4️⃣ Testing connection health:');
  const health = await SupabaseClientManager.checkHealth();
  console.log('   Connected:', health.isConnected ? '✅ Yes' : '❌ No');
  console.log('   Latency:', health.latency ? `${health.latency}ms` : 'N/A');
  if (health.errors.length > 0) {
    console.log('   Errors:', health.errors);
  }
  console.log();

  // 5. Test authentication
  console.log('5️⃣ Testing authentication:');
  const authTest = await SupabaseClientManager.testAuth();
  console.log('   Auth working:', authTest.success ? '✅ Yes' : '❌ No');
  if (authTest.user) {
    console.log('   Current user:', authTest.user.email);
  } else {
    console.log('   No user logged in');
  }
  if (authTest.error) {
    console.log('   Auth error:', authTest.error);
  }
  console.log();

  // 6. Test storage access
  console.log('6️⃣ Testing storage access:');
  const storageTest = await SupabaseClientManager.testStorage();
  console.log('   Storage accessible:', storageTest.success ? '✅ Yes' : '❌ No');
  if (storageTest.error) {
    console.log('   Storage error:', storageTest.error);
  }
  console.log();

  // 7. Test database access
  console.log('7️⃣ Testing database access:');
  try {
    const { data, error } = await client
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('   ❌ Database error:', error.message);
    } else {
      console.log('   ✅ Database accessible');
    }
  } catch (err) {
    console.log('   ❌ Database error:', err);
  }

  console.log('\n✨ Supabase connection test complete!');
}

// Run the test
testSupabaseConnection().catch(console.error);
