import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Mail, Building2, Calendar, User, Eye, Trash2, AlertCircle } from 'lucide-react';
import { API_BASE_URL, ADMIN_API_BASE_URL } from '../config';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approvingIds, setApprovingIds] = useState([]);
  const [rejectingIds, setRejectingIds] = useState([]);
  const [viewUser, setViewUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch(`${ADMIN_API_BASE_URL}/api/admin/users`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setUsers(data.data.users);
      } else {
        setError(data.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${ADMIN_API_BASE_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `Delete failed (${response.status})`);
      }

      const data = await response.json();

      if (data.success) {
        // Remove user from state
        setUsers(users.filter(user => user._id !== userId));
      } else {
        alert(data.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Network error. Please try again.');
    }
  };

  const approveUser = async (userId) => {
    try {
      setApprovingIds(prev => [...prev, userId]);
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${ADMIN_API_BASE_URL}/api/admin/approve-user/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `Approve failed (${response.status})`);
      }
      const data = await response.json();
      if (data.success) {
        // Optimistic update + full refresh to ensure consistency
        setUsers(prev => prev.map(u => (u._id === userId || u.id === userId)
          ? { ...u, isApproved: true, status: 'active' }
          : u
        ));
        await fetchUsers();
      } else {
        alert(data.message || 'Failed to approve user');
      }
    } catch (e) {
      console.error('Approve user error:', e);
      alert(e.message || 'Network error. Please try again.');
    } finally {
      setApprovingIds(prev => prev.filter(id => id !== userId));
    }
  };

  const rejectUser = async (userId) => {
    try {
      setRejectingIds(prev => [...prev, userId]);
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${ADMIN_API_BASE_URL}/api/admin/reject-user/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setUsers(prev => prev.filter(u => (u._id || u.id) !== userId));
      } else {
        alert(data.message || 'Failed to reject user');
      }
    } catch (e) {
      console.error('Reject user error:', e);
      alert('Network error. Please try again.');
    } finally {
      setRejectingIds(prev => prev.filter(id => id !== userId));
    }
  };

  const approveAll = async () => {
    const pending = users.filter(u => !u.isApproved).map(u => u._id || u.id);
    if (pending.length === 0) return;
    try {
      for (const uid of pending) {
        // Sequential to avoid rate limits
        // Reuse single approve
        // eslint-disable-next-line no-await-in-loop
        await approveUser(uid);
      }
      await fetchUsers();
    } catch (e) {
      console.error('Approve all error:', e);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-lg"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchUsers}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-large mx-auto mb-6">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
          <div className="flex items-center justify-center space-x-3">
            <p className="text-gray-600">View and manage all registered users</p>
            <button
              onClick={approveAll}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              title="Approve All"
            >
              Approve All
            </button>
            <button
              onClick={fetchUsers}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="Refresh"
            >
              Refresh
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Verified Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(user => user.isVerified).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unique Companies</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(users.map(user => user.company)).size}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(user => {
                    const userDate = new Date(user.createdAt);
                    const now = new Date();
                    return userDate.getMonth() === now.getMonth() && 
                           userDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Users</h2>
          </div>

          {users.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600">Users will appear here once they sign up.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.company}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isApproved 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.isApproved ? 'Active' : 'Pending'}
                        </span>
                      </td>
                                             <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                         <div className="flex items-center justify-end space-x-2">
                          {!user.isApproved && (
                            <button
                              onClick={() => approveUser(user._id || user.id)}
                              disabled={approvingIds.includes(user._id || user.id)}
                              className="text-green-600 hover:text-green-900 transition-colors p-1 rounded hover:bg-green-50 disabled:opacity-50"
                              title="Approve user"
                            >
                              Approve
                            </button>
                          )}
                          {!user.isApproved && (
                            <button
                              onClick={() => rejectUser(user._id || user.id)}
                              disabled={rejectingIds.includes(user._id || user.id)}
                              className="text-red-600 hover:text-red-900 transition-colors p-1 rounded hover:bg-red-50 disabled:opacity-50"
                              title="Reject user"
                            >
                              Reject
                            </button>
                          )}
                          <button
                            onClick={() => setViewUser(user)}
                            className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded hover:bg-blue-50"
                            title="View user"
                          >
                            View
                          </button>
                          <button 
                            onClick={() => deleteUser(user._id || user.id)}
                             className="text-red-600 hover:text-red-900 transition-colors p-1 rounded hover:bg-red-50"
                             title="Delete user"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                         </div>
                       </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* View User Modal */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setViewUser(null)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">User Details</h3>
            <div className="space-y-2 text-gray-800">
              <div><strong>Name:</strong> {viewUser.firstName} {viewUser.lastName}</div>
              <div><strong>Email:</strong> {viewUser.email}</div>
              <div><strong>Company:</strong> {viewUser.company}</div>
              <div><strong>Role:</strong> {viewUser.role}</div>
              <div><strong>Status:</strong> {viewUser.isApproved ? 'Active' : 'Pending'}</div>
              <div><strong>Created:</strong> {new Date(viewUser.createdAt).toLocaleString()}</div>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setViewUser(null)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers; 
