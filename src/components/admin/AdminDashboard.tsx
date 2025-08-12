/**
 * Comprehensive Admin Dashboard
 */

import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Activity, 
  BarChart3,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Key,
  UserCheck,
  UserX,
  Loader,
  RefreshCw
} from 'lucide-react';
import { SupabaseClientManager } from '../../lib/supabase/client';
import { AdminUserManager, UserActivitySummary, UserManagementResult } from '../../lib/admin/AdminUserManager';
import { Button, Card, Input } from '../ui';
import { Profile } from '../../lib/supabase/database.types';
import theme from '../../theme';

interface CreateUserForm {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  role: 'admin' | 'user';
}

interface EditUserForm {
  displayName: string;
  email: string;
  role: 'admin' | 'user';
}

interface PasswordChangeForm {
  newPassword: string;
  confirmPassword: string;
}

// Styled Components - removed unused components as we're now using Tailwind classes

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [userActivities, setUserActivities] = useState<UserActivitySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user' | 'blocked'>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  // Modals
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [changingPasswordUser, setChangingPasswordUser] = useState<Profile | null>(null);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  
  // Forms
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    role: 'user'
  });
  const [editForm, setEditForm] = useState<EditUserForm>({
    displayName: '',
    email: '',
    role: 'user'
  });
  const [passwordForm, setPasswordForm] = useState<PasswordChangeForm>({
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const adminManager = new AdminUserManager(SupabaseClientManager.getClient()!);

  useEffect(() => {
    loadUsers();
    loadUserActivities();
  }, [currentPage]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { users: loadedUsers, total, hasMore: more } = await adminManager.getAllUsers(currentPage);
      setUsers(loadedUsers);
      setTotalUsers(total);
      setHasMore(more);
    } catch (error) {
      console.error('Failed to load users:', error);
      setResult({ success: false, message: 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  };

  const loadUserActivities = async () => {
    try {
      const activities = await adminManager.getUserActivitySummary();
      setUserActivities(activities);
    } catch (error) {
      console.error('Failed to load user activities:', error);
    }
  };

  const handleCreateUser = async () => {
    if (createForm.password !== createForm.confirmPassword) {
      setResult({ success: false, message: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    try {
      const result = await adminManager.createUser({
        email: createForm.email,
        password: createForm.password,
        displayName: createForm.displayName,
        role: createForm.role
      });

      setResult(result);
      if (result.success) {
        setShowCreateUser(false);
        setCreateForm({
          email: '',
          password: '',
          confirmPassword: '',
          displayName: '',
          role: 'user'
        });
        loadUsers();
        loadUserActivities();
      }
    } catch (error) {
      setResult({ success: false, message: 'Failed to create user' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;

    setLoading(true);
    try {
      const result = await adminManager.updateUserProfile(editingUser.id, {
        displayName: editForm.displayName,
        email: editForm.email,
        role: editForm.role
      });

      setResult(result);
      if (result.success) {
        setEditingUser(null);
        loadUsers();
        loadUserActivities();
      }
    } catch (error) {
      setResult({ success: false, message: 'Failed to update user' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!changingPasswordUser) return;
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setResult({ success: false, message: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    try {
      const result = await adminManager.updateUserPassword(
        changingPasswordUser.id, 
        passwordForm.newPassword
      );

      setResult(result);
      if (result.success) {
        setChangingPasswordUser(null);
        setPasswordForm({ newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      setResult({ success: false, message: 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async (user: Profile) => {
    const settings = user.settings as any || {};
    const isBlocked = settings.status === 'blocked';
    
    setLoading(true);
    try {
      const result = await adminManager.toggleUserBlock(user.id, !isBlocked);
      setResult(result);
      if (result.success) {
        loadUsers();
        loadUserActivities();
      }
    } catch (error) {
      setResult({ success: false, message: `Failed to ${isBlocked ? 'unblock' : 'block'} user` });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user: Profile) => {
    if (!confirm(`Are you sure you want to delete user ${user.email}? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const result = await adminManager.deleteUser(user.id);
      setResult(result);
      if (result.success) {
        loadUsers();
        loadUserActivities();
      }
    } catch (error) {
      setResult({ success: false, message: 'Failed to delete user' });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.display_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const settings = user.settings as any || {};
    const userRole = settings.role || 'user';
    const isBlocked = settings.status === 'blocked';
    
    const matchesFilter = filterRole === 'all' || 
                         (filterRole === 'blocked' && isBlocked) ||
                         (filterRole !== 'blocked' && userRole === filterRole && !isBlocked);
    
    return matchesSearch && matchesFilter;
  });

  const getUserStatus = (user: Profile) => {
    const settings = user.settings as any || {};
    if (settings.status === 'blocked') return 'blocked';
    return settings.role || 'user';
  };

  const getUserActivity = (userId: string) => {
    return userActivities.find(activity => activity.userId === userId);
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="bg-slate-800/50 backdrop-blur-md rounded-lg p-6 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
                <Shield className="w-6 h-6" />
                Admin Dashboard
              </h1>
              <p className="text-slate-400 mt-1">Manage users and monitor application activity</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={loadUsers}
                disabled={loading}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <RefreshCw className={loading ? 'animate-spin w-4 h-4' : 'w-4 h-4'} />
                Refresh
              </Button>
              <Button
                onClick={() => setShowCreateUser(true)}
                variant="primary"
                className="flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Create User
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="bg-slate-800/50 backdrop-blur-md rounded-lg p-6 border border-slate-700/50">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Overview
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-700/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total Users</p>
                  <p className="text-2xl font-semibold text-white">{totalUsers}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-slate-700/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <UserCheck className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Active Users</p>
                  <p className="text-2xl font-semibold text-white">
                    {userActivities.filter(u => u.status === 'active').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-slate-700/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Shield className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Admins</p>
                  <p className="text-2xl font-semibold text-white">
                    {users.filter(u => (u.settings as any)?.role === 'admin').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-slate-700/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <UserX className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Blocked Users</p>
                  <p className="text-2xl font-semibold text-white">
                    {userActivities.filter(u => u.status === 'blocked').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-slate-800/50 backdrop-blur-md rounded-lg p-6 border border-slate-700/50">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search users by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="text-slate-400 w-4 h-4" />
              <select
                className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as any)}
              >
                <option value="all">All Users</option>
                <option value="admin">Admins</option>
                <option value="user">Regular Users</option>
                <option value="blocked">Blocked Users</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-slate-800/50 backdrop-blur-md rounded-lg border border-slate-700/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/50">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Management
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Activity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Loader className="w-6 h-6 text-slate-400 animate-spin mb-2" />
                        <p className="text-slate-400">Loading users...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Users className="w-12 h-12 text-slate-400 mb-2" />
                        <p className="text-slate-400">No users found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const activity = getUserActivity(user.id);
                    const status = getUserStatus(user);
                    
                    return (
                      <tr key={user.id} className="hover:bg-slate-700/20 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-white">
                              {user.display_name || user.email?.split('@')[0] || 'Unknown'}
                            </div>
                            <div className="text-sm text-slate-400">
                              {user.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            status === 'admin' 
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                              : status === 'blocked'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                          }`}>
                            {status === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                            {status === 'blocked' && <Ban className="w-3 h-3 mr-1" />}
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-400">
                            {activity ? (
                              <>
                                <div>{activity.totalSessions} sessions</div>
                                <div>{activity.totalDocuments} documents</div>
                              </>
                            ) : (
                              'No activity'
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-1 text-sm ${
                            status === 'blocked' ? 'text-red-400' : 'text-green-400'
                          }`}>
                            {status === 'blocked' ? (
                              <>
                                <XCircle className="w-4 h-4" />
                                Blocked
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                Active
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="p-1 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                              onClick={() => {
                                setEditingUser(user);
                                setEditForm({
                                  displayName: user.display_name || '',
                                  email: user.email || '',
                                  role: (user.settings as any)?.role || 'user'
                                });
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              className="p-1 text-slate-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded transition-colors"
                              onClick={() => {
                                setChangingPasswordUser(user);
                                setPasswordForm({ newPassword: '', confirmPassword: '' });
                              }}
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button
                              className={`p-1 transition-colors rounded ${
                                status === 'blocked' 
                                  ? 'text-slate-400 hover:text-green-400 hover:bg-green-500/10'
                                  : 'text-slate-400 hover:text-orange-400 hover:bg-orange-500/10'
                              }`}
                              onClick={() => handleToggleBlock(user)}
                            >
                              {status === 'blocked' ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                            </button>
                            <button
                              className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                              onClick={() => handleDeleteUser(user)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {(hasMore || currentPage > 0) && (
            <div className="px-6 py-4 border-t border-slate-700/50 flex items-center justify-between">
              <div className="text-sm text-slate-400">
                Showing {currentPage * 50 + 1} to {Math.min((currentPage + 1) * 50, totalUsers)} of {totalUsers} users
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="text-sm"
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={!hasMore}
                  className="text-sm"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Result Message */}
        {result && (
          <div className={`p-4 rounded-lg border flex items-center justify-between ${
            result.success 
              ? 'bg-green-500/10 border-green-500/20 text-green-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <span>{result.message}</span>
            </div>
            <button 
              onClick={() => setResult(null)}
              className="text-slate-400 hover:text-slate-300 transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-slate-800/90 backdrop-blur-md rounded-lg p-6 w-full max-w-md border border-slate-700/50 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-4">
              Create New User
            </h2>
            <div className="space-y-4">
              <Input
                placeholder="Email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
              />
              <Input
                placeholder="Display Name"
                value={createForm.displayName}
                onChange={(e) => setCreateForm(prev => ({ ...prev, displayName: e.target.value }))}
              />
              <div className="relative">
                <Input
                  placeholder="Password"
                  type={showPasswords.create ? "text" : "password"}
                  value={createForm.password}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('create')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showPasswords.create ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="relative">
                <Input
                  placeholder="Confirm Password"
                  type={showPasswords.createConfirm ? "text" : "password"}
                  value={createForm.confirmPassword}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('createConfirm')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showPasswords.createConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'user' }))}
                className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-700/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="user">Regular User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowCreateUser(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateUser}
                disabled={loading || !createForm.email || !createForm.password}
              >
                {loading && <Loader className="w-4 h-4 animate-spin mr-2" />}
                Create User
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800/90 backdrop-blur-md rounded-lg p-6 w-full max-w-md border border-slate-700/50 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-4">
              Edit User
            </h2>
            <div className="space-y-4">
              <Input
                placeholder="Display Name"
                value={editForm.displayName}
                onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
              />
              <Input
                placeholder="Email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
              />
              <select
                value={editForm.role}
                onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'user' }))}
                className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-700/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="user">Regular User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setEditingUser(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditUser}
                disabled={loading}
              >
                {loading && <Loader className="w-4 h-4 animate-spin mr-2" />}
                Update User
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {changingPasswordUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800/90 backdrop-blur-md rounded-lg p-6 w-full max-w-md border border-slate-700/50 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-4">
              Change Password
            </h2>
            <p className="text-sm text-slate-400 mb-4">
              Changing password for: {changingPasswordUser.email}
            </p>
            <div className="space-y-4">
              <div className="relative">
                <Input
                  placeholder="New Password"
                  type={showPasswords.newPassword ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('newPassword')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showPasswords.newPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="relative">
                <Input
                  placeholder="Confirm New Password"
                  type={showPasswords.confirmNewPassword ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirmNewPassword')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showPasswords.confirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setChangingPasswordUser(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={loading || !passwordForm.newPassword}
              >
                {loading && <Loader className="w-4 h-4 animate-spin mr-2" />}
                Change Password
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
