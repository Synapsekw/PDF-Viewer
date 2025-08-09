/**
 * Comprehensive Admin Dashboard
 */

import React, { useState, useEffect } from 'react';
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage users and monitor application activity
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={loadUsers}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setShowCreateUser(true)}
            className="flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Create User
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalUsers}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {userActivities.filter(u => u.status === 'active').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <Shield className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Admins</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {users.filter(u => (u.settings as any)?.role === 'admin').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <UserX className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Blocked Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {userActivities.filter(u => u.status === 'blocked').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search users by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Users</option>
              <option value="admin">Admins</option>
              <option value="user">Regular Users</option>
              <option value="blocked">Blocked Users</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500 dark:text-gray-400">Loading users...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500 dark:text-gray-400">No users found</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const activity = getUserActivity(user.id);
                  const status = getUserStatus(user);
                  
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {user.display_name || user.email?.split('@')[0] || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          status === 'admin' 
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                            : status === 'blocked'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {status === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                          {status === 'blocked' && <Ban className="w-3 h-3 mr-1" />}
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {activity ? (
                          <div>
                            <div>{activity.totalSessions} sessions</div>
                            <div>{activity.totalDocuments} documents</div>
                          </div>
                        ) : (
                          'No activity'
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                      </td>
                      <td className="px-6 py-4">
                        {status === 'blocked' ? (
                          <span className="inline-flex items-center text-red-600 dark:text-red-400">
                            <XCircle className="w-4 h-4 mr-1" />
                            Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-green-600 dark:text-green-400">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingUser(user);
                              setEditForm({
                                displayName: user.display_name || '',
                                email: user.email || '',
                                role: (user.settings as any)?.role || 'user'
                              });
                            }}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setChangingPasswordUser(user);
                              setPasswordForm({ newPassword: '', confirmPassword: '' });
                            }}
                          >
                            <Key className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleBlock(user)}
                            className={status === 'blocked' ? 'text-green-600' : 'text-yellow-600'}
                          >
                            {status === 'blocked' ? <UserCheck className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteUser(user)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
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
          <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {currentPage * 50 + 1} to {Math.min((currentPage + 1) * 50, totalUsers)} of {totalUsers} users
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={!hasMore}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Result Message */}
      {result && (
        <div className={`p-4 rounded-lg border ${
          result.success 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {result.success ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span>{result.message}</span>
            <button
              onClick={() => setResult(null)}
              className="ml-auto text-current hover:opacity-70"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
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
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.createConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'user' }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="user">Regular User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
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
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="user">Regular User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
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
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Change Password
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
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
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
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
