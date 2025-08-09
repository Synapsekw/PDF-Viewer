/**
 * Admin User Manager - Create and manage admin users
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Profile } from '../supabase/database.types';

export interface AdminUser {
  email: string;
  password: string;
  role?: 'admin' | 'user';
  metadata?: Record<string, any>;
}

export interface AdminUserResult {
  success: boolean;
  userId?: string;
  error?: string;
}

export interface UserManagementResult {
  success: boolean;
  message: string;
  data?: any;
}

export interface UserActivitySummary {
  userId: string;
  email: string;
  displayName: string;
  totalSessions: number;
  totalDocuments: number;
  totalShares: number;
  lastActivity: string | null;
  joinedAt: string;
  status: 'active' | 'blocked';
}

export class AdminUserManager {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Create an admin user account
   * Note: This requires admin privileges or service role key
   */
  async createAdminUser(adminUser: AdminUser): Promise<AdminUserResult> {
    try {
      console.log('🔐 Creating admin user:', adminUser.email);

      // Create the user account
      const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
        email: adminUser.email,
        password: adminUser.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          role: adminUser.role || 'admin',
          created_by: 'admin_manager',
          created_at: new Date().toISOString(),
          ...adminUser.metadata
        }
      });

      if (authError) {
        console.error('Auth user creation failed:', authError);
        return {
          success: false,
          error: `Failed to create auth user: ${authError.message}`
        };
      }

      if (!authData.user) {
        return {
          success: false,
          error: 'User creation failed - no user data returned'
        };
      }

      console.log('✅ Auth user created:', authData.user.id);

      // Create profile record
      const { error: profileError } = await this.supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: adminUser.email,
          display_name: adminUser.metadata?.displayName || adminUser.email.split('@')[0],
          settings: {
            role: adminUser.role || 'admin',
            permissions: ['read', 'write', 'admin'],
            created_by: 'admin_manager'
          }
        });

      if (profileError) {
        console.error('Profile creation failed:', profileError);
        // Don't fail completely - auth user exists
        console.warn('⚠️ Profile creation failed but auth user exists');
      } else {
        console.log('✅ Profile created successfully');
      }

      return {
        success: true,
        userId: authData.user.id
      };

    } catch (error) {
      console.error('Admin user creation error:', error);
      return {
        success: false,
        error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Create admin user using email/password sign up (fallback method)
   */
  async createAdminUserFallback(adminUser: AdminUser): Promise<AdminUserResult> {
    try {
      console.log('🔄 Using fallback method for admin user creation');

      // Sign up the user
      const { data: signUpData, error: signUpError } = await this.supabase.auth.signUp({
        email: adminUser.email,
        password: adminUser.password
      });

      if (signUpError) {
        return {
          success: false,
          error: `Sign up failed: ${signUpError.message}`
        };
      }

      if (!signUpData.user) {
        return {
          success: false,
          error: 'Sign up failed - no user data returned'
        };
      }

      // If user needs email confirmation, provide instructions
      if (!signUpData.session) {
        console.log('📧 User created but needs email confirmation');
        return {
          success: true,
          userId: signUpData.user.id,
          error: 'User created but email confirmation required'
        };
      }

      return {
        success: true,
        userId: signUpData.user.id
      };

    } catch (error) {
      return {
        success: false,
        error: `Fallback creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Update user to admin role
   */
  async promoteToAdmin(userId: string): Promise<AdminUserResult> {
    try {
      // Update profile with admin role
      const { error: profileError } = await this.supabase
        .from('profiles')
        .update({
          settings: {
            role: 'admin',
            permissions: ['read', 'write', 'admin'],
            promoted_at: new Date().toISOString()
          }
        })
        .eq('id', userId);

      if (profileError) {
        return {
          success: false,
          error: `Failed to promote user: ${profileError.message}`
        };
      }

      return {
        success: true,
        userId
      };

    } catch (error) {
      return {
        success: false,
        error: `Promotion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Check if user exists
   */
  async userExists(email: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      return !error && !!data;
    } catch {
      return false;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        return null;
      }

      return data;
    } catch {
      return null;
    }
  }

  /**
   * Get all users with pagination
   */
  async getAllUsers(page = 0, limit = 50): Promise<{
    users: Profile[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const offset = page * limit;
      
      // Get total count
      const { count } = await this.supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get users with pagination
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return {
        users: data || [],
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      };
    } catch (error) {
      console.error('Failed to get users:', error);
      return {
        users: [],
        total: 0,
        hasMore: false
      };
    }
  }

  /**
   * Update user password (admin only)
   */
  async updateUserPassword(userId: string, newPassword: string): Promise<UserManagementResult> {
    try {
      const { error } = await this.supabase.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );

      if (error) {
        return {
          success: false,
          message: `Failed to update password: ${error.message}`
        };
      }

      return {
        success: true,
        message: 'Password updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Error updating password: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Block/unblock user
   */
  async toggleUserBlock(userId: string, block = true): Promise<UserManagementResult> {
    try {
      // Update auth user
      const updateData: any = {};
      if (block) {
        updateData.banned_until = '2099-12-31';
      } else {
        updateData.banned_until = null;
      }
      
      const { error: authError } = await this.supabase.auth.admin.updateUserById(
        userId,
        updateData
      );

      if (authError) {
        return {
          success: false,
          message: `Failed to ${block ? 'block' : 'unblock'} user: ${authError.message}`
        };
      }

      // Update profile settings
      const { error: profileError } = await this.supabase
        .from('profiles')
        .update({
          settings: {
            status: block ? 'blocked' : 'active',
            blocked_at: block ? new Date().toISOString() : null
          }
        })
        .eq('id', userId);

      if (profileError) {
        console.warn('Failed to update profile status:', profileError);
      }

      return {
        success: true,
        message: `User ${block ? 'blocked' : 'unblocked'} successfully`
      };
    } catch (error) {
      return {
        success: false,
        message: `Error ${block ? 'blocking' : 'unblocking'} user: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<UserManagementResult> {
    try {
      // Delete from auth (this will cascade to related tables)
      const { error } = await this.supabase.auth.admin.deleteUser(userId);

      if (error) {
        return {
          success: false,
          message: `Failed to delete user: ${error.message}`
        };
      }

      return {
        success: true,
        message: 'User deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Error deleting user: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get user activity summary
   */
  async getUserActivitySummary(userId?: string): Promise<UserActivitySummary[]> {
    try {
      let query = this.supabase
        .from('profiles')
        .select(`
          id,
          email,
          display_name,
          created_at,
          settings,
          documents:documents(count),
          document_shares:document_shares(count),
          analytics_sessions:analytics_sessions(count)
        `);

      if (userId) {
        query = query.eq('id', userId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // For each user, get the last activity timestamp separately
      const summaries: UserActivitySummary[] = await Promise.all((data || []).map(async user => {
        const settings = user.settings as any || {};
        
        // Get the most recent session start_time for this user
        let lastActivity: string | null = null;
        try {
          const { data: lastSessionData } = await this.supabase
            .from('analytics_sessions')
            .select('start_time')
            .eq('user_id', user.id)
            .not('start_time', 'is', null)
            .order('start_time', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          lastActivity = lastSessionData?.start_time || null;
        } catch (error) {
          // Ignore errors for last activity lookup
          lastActivity = null;
        }

        return {
          userId: user.id,
          email: user.email || 'Unknown',
          displayName: user.display_name || user.email?.split('@')[0] || 'Unknown',
          totalSessions: (user.analytics_sessions as any[])?.[0]?.count || 0,
          totalDocuments: (user.documents as any[])?.[0]?.count || 0,
          totalShares: (user.document_shares as any[])?.[0]?.count || 0,
          lastActivity,
          joinedAt: user.created_at || '',
          status: settings.status === 'blocked' ? 'blocked' : 'active'
        };
      }));

      return summaries;
    } catch (error) {
      console.error('Failed to get user activity summary:', error);
      return [];
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData: {
    email: string;
    password: string;
    displayName?: string;
    role?: 'admin' | 'user';
  }): Promise<UserManagementResult> {
    try {
      // Create auth user
      const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          role: userData.role || 'user',
          created_by: 'admin',
          display_name: userData.displayName
        }
      });

      if (authError) {
        return {
          success: false,
          message: `Failed to create user: ${authError.message}`
        };
      }

      if (!authData.user) {
        return {
          success: false,
          message: 'User creation failed - no user data returned'
        };
      }

      // Create profile
      const { error: profileError } = await this.supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: userData.email,
          display_name: userData.displayName || userData.email.split('@')[0],
          settings: {
            role: userData.role || 'user',
            permissions: userData.role === 'admin' ? ['read', 'write', 'admin'] : ['read', 'write'],
            created_by: 'admin'
          }
        });

      if (profileError) {
        console.warn('Profile creation failed:', profileError);
      }

      return {
        success: true,
        message: 'User created successfully',
        data: { userId: authData.user.id }
      };
    } catch (error) {
      return {
        success: false,
        message: `Error creating user: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: {
    displayName?: string;
    email?: string;
    role?: 'admin' | 'user';
  }): Promise<UserManagementResult> {
    try {
      // Update auth user if email is changing
      if (updates.email) {
        const { error: authError } = await this.supabase.auth.admin.updateUserById(
          userId,
          { email: updates.email }
        );

        if (authError) {
          return {
            success: false,
            message: `Failed to update email: ${authError.message}`
          };
        }
      }

      // Update profile
      const profileUpdates: any = {};
      if (updates.displayName) profileUpdates.display_name = updates.displayName;
      if (updates.email) profileUpdates.email = updates.email;
      
      if (updates.role) {
        profileUpdates.settings = {
          role: updates.role,
          permissions: updates.role === 'admin' ? ['read', 'write', 'admin'] : ['read', 'write'],
          updated_by: 'admin',
          updated_at: new Date().toISOString()
        };
      }

      const { error: profileError } = await this.supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId);

      if (profileError) {
        return {
          success: false,
          message: `Failed to update profile: ${profileError.message}`
        };
      }

      return {
        success: true,
        message: 'User updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Error updating user: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}
