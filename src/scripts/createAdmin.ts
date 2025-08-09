/**
 * Script to create admin user
 * Usage: Run this in browser console or as a development utility
 */

import { SupabaseClientManager } from '../lib/supabase/client';
import { AdminUserManager } from '../lib/admin/AdminUserManager';

export async function createAdminUser() {
  console.log('🚀 Starting admin user creation...');
  
  const supabase = SupabaseClientManager.getClient();
  if (!supabase) {
    console.error('❌ Supabase client not available');
    return false;
  }

  const adminManager = new AdminUserManager(supabase);
  
  // Admin user details
  const adminUser = {
    email: 'info@synapse-solutions.ai',
    password: 'Orbit2024$',
    role: 'admin' as const,
    metadata: {
      displayName: 'Synapse Solutions Admin',
      company: 'Synapse Solutions',
      createdBy: 'system'
    }
  };

  try {
    // Check if user already exists
    const exists = await adminManager.userExists(adminUser.email);
    if (exists) {
      console.log('👤 User already exists, promoting to admin...');
      const existingUser = await adminManager.getUserByEmail(adminUser.email);
      if (existingUser) {
        const result = await adminManager.promoteToAdmin(existingUser.id);
        if (result.success) {
          console.log('✅ User promoted to admin successfully');
          return true;
        } else {
          console.error('❌ Failed to promote user:', result.error);
          return false;
        }
      }
    }

    // Try primary method (requires admin/service role)
    console.log('🔐 Attempting to create admin user...');
    let result = await adminManager.createAdminUser(adminUser);
    
    if (!result.success && result.error?.includes('admin')) {
      console.log('🔄 Primary method failed, trying fallback...');
      result = await adminManager.createAdminUserFallback(adminUser);
    }

    if (result.success) {
      console.log('✅ Admin user created successfully!');
      console.log('📧 Email:', adminUser.email);
      console.log('🔑 Password:', adminUser.password);
      console.log('👤 User ID:', result.userId);
      
      if (result.error) {
        console.log('⚠️ Note:', result.error);
      }
      
      return true;
    } else {
      console.error('❌ Failed to create admin user:', result.error);
      return false;
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return false;
  }
}

// Auto-run if this is being executed directly
if (typeof window !== 'undefined') {
  // Browser environment - make function available globally
  (window as any).createAdminUser = createAdminUser;
  console.log('🛠️ Admin user creation utility loaded');
  console.log('💡 Run createAdminUser() to create the admin user');
}
