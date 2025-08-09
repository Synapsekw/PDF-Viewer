/**
 * Admin User Management Panel
 */

import React, { useState } from 'react';
import { 
  UserPlus, 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader,
  Eye,
  EyeOff
} from 'lucide-react';
import { SupabaseClientManager } from '../../lib/supabase/client';
import { AdminUserManager } from '../../lib/admin/AdminUserManager';
import { Button, Card, Input } from '../ui';

interface AdminUserPanelProps {
  className?: string;
}

export const AdminUserPanel: React.FC<AdminUserPanelProps> = ({ className = "" }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; userId?: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleCreateDefaultAdmin = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const supabase = SupabaseClientManager.getClient();
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const adminManager = new AdminUserManager(supabase);
      
      // Create the specific admin user
      const adminUser = {
        email: 'info@synapse-solutions.ai',
        password: 'Orbit2024$',
        role: 'admin' as const,
        metadata: {
          displayName: 'Synapse Solutions Admin',
          company: 'Synapse Solutions',
          createdBy: 'admin_panel'
        }
      };

      // Check if user already exists
      const exists = await adminManager.userExists(adminUser.email);
      if (exists) {
        const existingUser = await adminManager.getUserByEmail(adminUser.email);
        if (existingUser) {
          const promoteResult = await adminManager.promoteToAdmin(existingUser.id);
          if (promoteResult.success) {
            setResult({
              success: true,
              message: 'User already exists and has been promoted to admin',
              userId: promoteResult.userId
            });
          } else {
            setResult({
              success: false,
              message: `Failed to promote existing user: ${promoteResult.error}`
            });
          }
          return;
        }
      }

      // Try to create new admin user
      let createResult = await adminManager.createAdminUser(adminUser);
      
      // If primary method fails, try fallback
      if (!createResult.success && createResult.error?.includes('admin')) {
        createResult = await adminManager.createAdminUserFallback(adminUser);
      }

      if (createResult.success) {
        setResult({
          success: true,
          message: 'Admin user created successfully! ' + (createResult.error || ''),
          userId: createResult.userId
        });
      } else {
        setResult({
          success: false,
          message: `Failed to create admin user: ${createResult.error}`
        });
      }

    } catch (error) {
      setResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getResultIcon = () => {
    if (!result) return null;
    return result.success ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Admin User Management
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Create and manage admin users for the application
        </p>
      </div>

      {/* Default Admin Creation */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-6 h-6 text-blue-500" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Create Default Admin User
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Add the Synapse Solutions admin account
            </p>
          </div>
        </div>

        {/* Admin Details Display */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
            Admin Account Details:
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Email:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                info@synapse-solutions.ai
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Password:</span>
              <div className="flex items-center gap-2">
                <span className="font-medium font-mono text-gray-900 dark:text-gray-100">
                  {showPassword ? 'Orbit2024$' : '••••••••••'}
                </span>
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Role:</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">Admin</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleCreateDefaultAdmin}
          disabled={isLoading}
          className="flex items-center gap-2 w-full justify-center"
        >
          {isLoading ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <UserPlus className="w-4 h-4" />
          )}
          {isLoading ? 'Creating Admin User...' : 'Create Admin User'}
        </Button>

        {/* Result Display */}
        {result && (
          <div className={`mt-4 p-4 rounded-lg border ${
            result.success 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {getResultIcon()}
              <h4 className={`font-medium ${
                result.success 
                  ? 'text-green-800 dark:text-green-200' 
                  : 'text-red-800 dark:text-red-200'
              }`}>
                {result.success ? 'Success!' : 'Error'}
              </h4>
            </div>
            <p className={`text-sm ${
              result.success 
                ? 'text-green-700 dark:text-green-300' 
                : 'text-red-700 dark:text-red-300'
            }`}>
              {result.message}
            </p>
            {result.userId && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                User ID: {result.userId}
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
              Important Notes:
            </p>
            <ul className="text-blue-600 dark:text-blue-300 space-y-1">
              <li>• Admin users have full access to all features</li>
              <li>• The password should be changed after first login</li>
              <li>• Email confirmation may be required depending on Supabase settings</li>
              <li>• Admin privileges include user management and system configuration</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
