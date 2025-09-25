'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useDarkMode } from '../hooks/useDarkMode';

interface User {
  _id: string;
  name: string;
  username: string;
  phoneNumber?: string;
  address?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserFormData {
  name: string;
  username: string;
  password: string;
  phoneNumber: string;
  address: string;
  role: string;
}

export default function UsersPage() {
  const router = useRouter();
  const { isDarkMode, mounted } = useDarkMode();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [dateSort, setDateSort] = useState<'latest' | 'oldest'>('latest');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [screenSize, setScreenSize] = useState<number>(0);
  const [currentUser, setCurrentUser] = useState<{ _id: string; username: string } | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    username: '',
    password: '',
    phoneNumber: '',
    address: '',
    role: 'user'
  });
  const [formErrors, setFormErrors] = useState<Partial<UserFormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [validationAlert, setValidationAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10; // Increased for better performance
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table'); // Default to table view
  const [initialLoad, setInitialLoad] = useState(true); // Track initial load

  // Get current user from localStorage and check access
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser({ _id: user._id, username: user.username });
        
        // Check if user has superadmin access
        if (user.role !== 'superadmin') {
          router.push('/access-denied');
          return;
        }
      } catch (error) {
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  // Track screen size
  useEffect(() => {
    const handleResize = () => {
      setScreenSize(window.innerWidth);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isLargeScreen = screenSize > 1000;
  const isMediumScreen = screenSize > 600;
  const isSmallScreen = screenSize > 500;
  const isTinyScreen = screenSize <= 500;

  // Optimized fetch users with aggressive caching
  const fetchUsers = async (retryCount = 0) => {
    setLoading(true);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout for super fast response
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('/api/users?limit=50', { // Optimized limit for faster loading
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'max-age=60', // Cache for 1 minute for faster subsequent loads
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setUsers(data.data || []);
        setMessage(null); // Clear any previous error messages
        setInitialLoad(false); // Mark initial load as complete
      } else {
        throw new Error(data.message || 'Failed to fetch users');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        if (retryCount < 1) {
          // Single fast retry
          setTimeout(() => fetchUsers(retryCount + 1), 300);
          return;
        }
        setMessage({ type: 'error', text: 'Request timeout - please try again' });
      } else {
        setMessage({ type: 'error', text: 'Failed to fetch users' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Start fetching immediately with aggressive prefetching
    fetchUsers();
    
    // Aggressive prefetching for faster navigation
    const preloadData = () => {
      // Preload critical pages immediately
      router.prefetch('/dashboard');
      router.prefetch('/orders');
      router.prefetch('/fabrics');
      
      // Prefetch API endpoints for faster subsequent loads
      const token = localStorage.getItem('token');
      if (token) {
        fetch('/api/users?limit=10', { 
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => {}); // Silent fail
      }
    };
    
    // Start preloading immediately for faster subsequent loads
    const timer = setTimeout(preloadData, 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    setMessage(null); // Clear any previous messages
    try {
      await fetchUsers();
      setMessage({ type: 'success', text: 'Users refreshed successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to refresh users' });
    } finally {
      setRefreshing(false);
    }
  };

  // Retry function for failed requests
  const handleRetry = () => {
    setMessage(null);
    fetchUsers();
  };

  // Filter and sort users
  // Memoized filtering for better performance
  const filteredUsers = useMemo(() => {
    return users
      .filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             user.username.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateSort === 'latest' ? dateB - dateA : dateA - dateB;
      });
  }, [users, searchTerm, roleFilter, dateSort]);

  // Memoized pagination logic
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    
    return { totalPages, currentUsers };
  }, [filteredUsers, currentPage, usersPerPage]);

  const { totalPages, currentUsers } = paginationData;

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, dateSort]);

  // Optimized page navigation functions
  const goToPage = useCallback((pageNumber: number) => {
    setCurrentPage(pageNumber);
  }, []);

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalPages]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  // Show message
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Create user
  const handleCreateUser = async () => {
    setFormErrors({});
    const errors: Partial<UserFormData> = {};
    
    if (!formData.name.trim()) errors.name = 'Required';
    if (!formData.username.trim()) errors.username = 'Required';
    if (!formData.password.trim()) errors.password = 'Required';
    if (formData.password.length < 6) errors.password = 'Min 6 chars';
    if (!formData.role.trim()) errors.role = 'Required';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const responseText = await response.text();

      if (response.ok) {
        const data = JSON.parse(responseText);
        setUsers([...users, data.user]);
        setShowCreateModal(false);
        resetForm();
        setValidationAlert({ type: 'success', text: 'User created' });
        setTimeout(() => setValidationAlert(null), 3000);
      } else {
        const error = JSON.parse(responseText);
        setValidationAlert({ type: 'error', text: error.message || 'Create failed' });
        setTimeout(() => setValidationAlert(null), 5000);
      }
    } catch (error) {
      setValidationAlert({ type: 'error', text: 'Create failed' });
      setTimeout(() => setValidationAlert(null), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  // Update user
  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    setFormErrors({});
    const errors: Partial<UserFormData> = {};
    
    if (!formData.name.trim()) errors.name = 'Required';
    if (!formData.username.trim()) errors.username = 'Required';
    if (formData.password && formData.password.length < 6) errors.password = 'Min 6 chars';
    if (!formData.role.trim()) errors.role = 'Required';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const updateData: Partial<UserFormData> = { ...formData };
      if (!updateData.password) delete updateData.password;
      
      const response = await fetch(`/api/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(users.map(user => user._id === selectedUser._id ? data.user : user));
        setShowEditModal(false);
        resetForm();
        setValidationAlert({ type: 'success', text: 'User updated' });
        setTimeout(() => setValidationAlert(null), 3000);
      } else {
        const error = await response.json();
        setValidationAlert({ type: 'error', text: error.message || 'Update failed' });
        setTimeout(() => setValidationAlert(null), 5000);
      }
    } catch (error) {
      setValidationAlert({ type: 'error', text: 'Update failed' });
      setTimeout(() => setValidationAlert(null), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    if (!selectedUser || !selectedUser._id) {
      setValidationAlert({ type: 'error', text: 'Invalid user' });
      setTimeout(() => setValidationAlert(null), 5000);
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${selectedUser._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setUsers(users.filter(user => user._id !== selectedUser._id));
        setShowDeleteModal(false);
        setSelectedUser(null);
        setValidationAlert({ type: 'success', text: 'User deleted' });
        setTimeout(() => setValidationAlert(null), 3000);
      } else {
        const error = await response.json();
        setValidationAlert({ type: 'error', text: error.message || 'Delete failed' });
        setTimeout(() => setValidationAlert(null), 5000);
      }
    } catch (error) {
      setValidationAlert({ type: 'error', text: 'Delete failed' });
      setTimeout(() => setValidationAlert(null), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      username: '',
      password: '',
      phoneNumber: '',
      address: '',
      role: 'user'
    });
    setFormErrors({});
  };

  // Get user initials
  const getUserInitials = useCallback((name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, []);

  // Check if user can be deleted (prevent self-deletion)
  const canDeleteUser = useCallback((user: User) => {
    return currentUser && user._id !== currentUser._id;
  }, [currentUser]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Show skeleton while not mounted or loading
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (loading && initialLoad) {
    return (
      <div className="space-y-4 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {/* Header Skeleton - Match actual layout */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Add User Button Skeleton */}
          <div className="flex-shrink-0">
            <div className={`h-10 w-32 rounded-lg animate-pulse ${
              isDarkMode ? 'bg-white/10' : 'bg-gray-200'
            }`}></div>
          </div>
          {/* View Toggle Skeleton */}
          <div className="flex items-center space-x-2">
            <div className={`h-4 w-8 rounded animate-pulse ${
              isDarkMode ? 'bg-white/10' : 'bg-gray-200'
            }`}></div>
            <div className={`h-8 w-20 rounded-lg animate-pulse ${
              isDarkMode ? 'bg-white/10' : 'bg-gray-200'
            }`}></div>
          </div>
        </div>

        {/* Filters Skeleton */}
        <div className={`p-4 rounded-lg border ${
          isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
        }`}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className={`h-10 flex-1 rounded-lg animate-pulse ${
                isDarkMode ? 'bg-white/10' : 'bg-gray-200'
              }`}></div>
              <div className={`h-10 w-24 rounded-lg animate-pulse ${
                isDarkMode ? 'bg-white/10' : 'bg-gray-200'
              }`}></div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className={`h-10 w-32 rounded-lg animate-pulse ${
                isDarkMode ? 'bg-white/10' : 'bg-gray-200'
              }`}></div>
              <div className={`h-10 w-32 rounded-lg animate-pulse ${
                isDarkMode ? 'bg-white/10' : 'bg-gray-200'
              }`}></div>
            </div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className={`rounded-lg border overflow-hidden ${
          isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
        }`}>
          {/* Table Header */}
          <div className={`${
            isDarkMode ? 'bg-white/5 border-b border-white/10' : 'bg-gray-50 border-b border-gray-200'
          }`}>
            <div className="px-6 py-3">
              <div className="flex items-center justify-between">
                <div className={`h-4 w-16 rounded animate-pulse ${
                  isDarkMode ? 'bg-white/10' : 'bg-gray-200'
                }`}></div>
                <div className={`h-4 w-20 rounded animate-pulse ${
                  isDarkMode ? 'bg-white/10' : 'bg-gray-200'
                }`}></div>
                <div className={`h-4 w-24 rounded animate-pulse ${
                  isDarkMode ? 'bg-white/10' : 'bg-gray-200'
                }`}></div>
                <div className={`h-4 w-16 rounded animate-pulse ${
                  isDarkMode ? 'bg-white/10' : 'bg-gray-200'
                }`}></div>
              </div>
            </div>
          </div>

          {/* Table Rows */}
          {[...Array(7)].map((_, index) => (
            <div key={index} className={`px-6 py-4 ${
              isDarkMode ? 'border-b border-white/10' : 'border-b border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`h-10 w-10 rounded-full animate-pulse ${
                    isDarkMode ? 'bg-white/10' : 'bg-gray-200'
                  }`}></div>
                  <div>
                    <div className={`h-4 w-24 rounded animate-pulse mb-2 ${
                      isDarkMode ? 'bg-white/10' : 'bg-gray-200'
                    }`}></div>
                    <div className={`h-3 w-20 rounded animate-pulse ${
                      isDarkMode ? 'bg-white/10' : 'bg-gray-200'
                    }`}></div>
                  </div>
                </div>
                <div className={`h-6 w-16 rounded-full animate-pulse ${
                  isDarkMode ? 'bg-white/10' : 'bg-gray-200'
                }`}></div>
                <div className={`h-4 w-20 rounded animate-pulse ${
                  isDarkMode ? 'bg-white/10' : 'bg-gray-200'
                }`}></div>
                <div className="flex space-x-2">
                  <div className={`h-8 w-8 rounded animate-pulse ${
                    isDarkMode ? 'bg-white/10' : 'bg-gray-200'
                  }`}></div>
                  <div className={`h-8 w-8 rounded animate-pulse ${
                    isDarkMode ? 'bg-white/10' : 'bg-gray-200'
                  }`}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
      {/* Loading indicator for non-initial loads */}
      {loading && !initialLoad && (
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Loading users...
            </span>
          </div>
        </div>
      )}

      {/* Header with Add Button and View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Add New User Button - Left Side */}
        <div className="flex-shrink-0">
          <button
            onClick={() => {
              setShowCreateModal(true);
              setValidationAlert(null);
            }}
            className={`inline-flex items-center px-4 py-2 rounded-lg font-medium ${
              isDarkMode
                ? 'bg-blue-600 text-white border border-blue-500/30'
                : 'bg-blue-600 text-white border border-blue-500/30'
            }`}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add New User
          </button>
        </div>

        {/* View Toggle - Right Side */}
        <div className="flex items-center space-x-2">
          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            View:
          </span>
          <div className={`flex rounded-lg p-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? isDarkMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-600 text-white'
                  : isDarkMode
                    ? 'text-gray-300 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'card'
                  ? isDarkMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-600 text-white'
                  : isDarkMode
                    ? 'text-gray-300 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Cards
            </button>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success'
            ? isDarkMode
              ? 'bg-green-900/20 border-green-500/30 text-green-400'
              : 'bg-green-50 border-green-200 text-green-800'
            : isDarkMode
              ? 'bg-red-900/20 border-red-500/30 text-red-400'
              : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            {message.type === 'success' ? (
              <CheckIcon className="h-5 w-5 mr-2" />
            ) : (
              <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
            )}
            {message.text}
          </div>
        </div>
      )}

      {/* Validation Alert - Only show if not already showing message and no modals are open */}
      {validationAlert && !message && !showCreateModal && !showEditModal && !showDeleteModal && (
        <div className={`p-4 rounded-lg border ${
          validationAlert.type === 'success'
            ? isDarkMode
              ? 'bg-green-900/20 border-green-500/30 text-green-400'
              : 'bg-green-50 border-green-200 text-green-800'
            : isDarkMode
              ? 'bg-red-900/20 border-red-500/30 text-red-400'
              : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            {validationAlert.type === 'success' ? (
              <CheckIcon className="h-5 w-5 mr-2" />
            ) : (
              <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
            )}
            {validationAlert.text}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={`p-4 rounded-lg border ${
        isDarkMode
          ? 'bg-white/5 border-white/10'
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex flex-col gap-4">
          {/* Top Row - Search and Refresh */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors duration-300 ${
                    isDarkMode
                      ? 'bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-blue-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  }`}
                />
              </div>
            </div>

            {/* Refresh Button */}
            <div className="sm:w-auto">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  refreshing
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:scale-105 active:scale-95'
                } ${
                  isDarkMode
                    ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:border-white/30 shadow-lg hover:shadow-xl'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-lg hover:shadow-xl'
                }`}
                title="Refresh users list"
              >
                <ArrowPathIcon className={`h-5 w-5 ${screenSize > 1000 ? 'mr-2' : ''} ${refreshing ? 'animate-spin' : ''}`} />
                {screenSize > 1000 && (refreshing ? 'Refreshing...' : 'Refresh')}
              </button>
            </div>
          </div>

          {/* Bottom Row - Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Role Filter */}
            <div className="sm:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 appearance-none cursor-pointer ${
                  isDarkMode
                    ? 'bg-white/10 border-white/20 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-white/30'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                }`}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='${isDarkMode ? 'rgb(156 163 175)' : 'rgb(107 114 128)'}' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="all" className={isDarkMode ? 'bg-[#1D293D] text-white' : 'bg-white text-gray-900'}>All Roles</option>
                <option value="superadmin" className={isDarkMode ? 'bg-[#1D293D] text-white' : 'bg-white text-gray-900'}>Super Admin</option>
                <option value="user" className={isDarkMode ? 'bg-[#1D293D] text-white' : 'bg-white text-gray-900'}>User</option>
              </select>
            </div>

            {/* Date Sort Filter */}
            <div className="sm:w-48">
              <select
                value={dateSort}
                onChange={(e) => setDateSort(e.target.value as 'latest' | 'oldest')}
                className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 appearance-none cursor-pointer ${
                  isDarkMode
                    ? 'bg-white/10 border-white/20 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-white/30'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                }`}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='${isDarkMode ? 'rgb(156 163 175)' : 'rgb(107 114 128)'}' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="latest" className={isDarkMode ? 'bg-[#1D293D] text-white' : 'bg-white text-gray-900'}>Latest First</option>
                <option value="oldest" className={isDarkMode ? 'bg-[#1D293D] text-white' : 'bg-white text-gray-900'}>Oldest First</option>
              </select>
            </div>
          </div>
        </div>
      </div>


      {/* Users Display - Table or Card View */}
      {viewMode === 'table' ? (
        /* Table View */
      <div className={`rounded-lg border overflow-hidden ${
        isDarkMode
          ? 'bg-white/5 border-white/10'
          : 'bg-white border-gray-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${
              isDarkMode
                ? 'bg-white/5 border-b border-white/10'
                : 'bg-gray-50 border-b border-gray-200'
            }`}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  User
                </th>
                {isSmallScreen && (
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Role
                  </th>
                )}
                {isLargeScreen && (
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Contact Info
                  </th>
                )}
                {isMediumScreen && (
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Created
                  </th>
                )}
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              isDarkMode ? 'divide-white/10' : 'divide-gray-200'
            }`}>
              {currentUsers.map((user) => (
                <tr key={user._id} className={`hover:${
                  isDarkMode ? 'bg-white/5' : 'bg-gray-50'
                } transition-colors duration-200 ${
                  currentUser && user._id === currentUser._id
                    ? isDarkMode
                      ? 'bg-blue-500/5 border-l-4 border-blue-500'
                      : 'bg-blue-50 border-l-4 border-blue-500'
                    : ''
                }`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                        isDarkMode
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                          : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white'
                      }`}>
                        {getUserInitials(user.name)}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className={`text-sm font-medium ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {user.name}
                        </div>
                        <div className={`text-sm ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-500'
                        } flex items-center gap-2`}>
                          {user.username}
                          {currentUser && user._id === currentUser._id && (
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                              isDarkMode
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'bg-blue-100 text-blue-700 border border-blue-200'
                            }`}>
                              You
                            </span>
                          )}
                        </div>
                        {(!isLargeScreen || !isSmallScreen || !isMediumScreen) && (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowProfileModal(true);
                            }}
                            className={`mt-1 text-xs px-2 py-1 rounded-md transition-all duration-300 ${
                              isDarkMode
                                ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                            }`}
                          >
                            View Profile
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                  {isSmallScreen && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'superadmin'
                          ? isDarkMode
                            ? 'bg-purple-900/20 text-purple-400'
                            : 'bg-purple-100 text-purple-800'
                          : isDarkMode
                            ? 'bg-blue-900/20 text-blue-400'
                            : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'superadmin' ? 'Super Admin' : 'User'}
                      </span>
                    </td>
                  )}
                  {isLargeScreen && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        {user.phoneNumber && (
                          <div className="mb-1">
                            📞 {user.phoneNumber}
                          </div>
                        )}
                        {user.address && (
                          <div className="text-xs">
                            📍 {user.address.length > 30 ? `${user.address.substring(0, 30)}...` : user.address}
                          </div>
                        )}
                        {!user.phoneNumber && !user.address && (
                          <span className="text-gray-400">No contact info</span>
                        )}
                      </div>
                    </td>
                  )}
                  {isMediumScreen && (
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      {formatDate(user.createdAt)}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setFormData({
                            name: user.name,
                            username: user.username,
                            password: '',
                            phoneNumber: user.phoneNumber || '',
                            address: user.address || '',
                            role: user.role
                          });
                          setShowEditModal(true);
                          setValidationAlert(null);
                        }}
                        className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 ${
                          isDarkMode
                            ? 'text-blue-400 hover:bg-blue-500/20 hover:text-blue-300'
                            : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
                        }`}
                        title="Edit user"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (canDeleteUser(user) && user._id) {
                            setSelectedUser(user);
                            setShowDeleteModal(true);
                            setValidationAlert(null);
                          } else if (!user._id) {
                                    setValidationAlert({ type: 'error', text: 'Invalid user data' });
        setTimeout(() => setValidationAlert(null), 5000);
                          }
                        }}
                        disabled={!canDeleteUser(user) || !user._id}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          canDeleteUser(user) && user._id
                            ? 'hover:scale-110 active:scale-95 ' + (isDarkMode
                              ? 'text-red-400 hover:bg-red-500/20 hover:text-red-300 active:bg-red-500/30'
                              : 'text-red-600 hover:bg-red-50 hover:text-red-700 active:bg-red-100')
                            : isDarkMode
                              ? 'text-gray-500 cursor-not-allowed opacity-50 hover:bg-gray-500/10 hover:text-gray-400'
                              : 'text-gray-400 cursor-not-allowed opacity-50 hover:bg-gray-100 hover:text-gray-500'
                        }`}
                        title={canDeleteUser(user) && user._id ? "Delete user" : "Cannot delete yourself - This would lock you out of the system"}
                      >
                        <TrashIcon className={`h-4 w-4 transition-all duration-300 ${
                          !canDeleteUser(user) 
                            ? 'opacity-60 scale-95' 
                            : 'hover:scale-110'
                        }`} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

          {filteredUsers.length === 0 && (
            <div className={`text-center py-12 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <p>No users found</p>
            </div>
          )}
        </div>
      ) : (
        /* Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentUsers.map((user) => (
            <div
              key={user._id}
              className={`rounded-lg border p-6 transition-all duration-200 hover:shadow-lg ${
                isDarkMode
                  ? 'bg-white/5 border-white/10 hover:bg-white/10'
                  : 'bg-white border-gray-200 hover:shadow-md'
              } ${
                currentUser && user._id === currentUser._id
                  ? isDarkMode
                    ? 'ring-2 ring-blue-500 bg-blue-500/5'
                    : 'ring-2 ring-blue-500 bg-blue-50'
                  : ''
              }`}
            >
              {/* User Avatar and Name */}
              <div className="flex items-center space-x-3 mb-4">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center text-lg font-semibold ${
                  isDarkMode
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                    : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white'
                }`}>
                  {getUserInitials(user.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-lg font-semibold truncate ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {user.name}
                  </h3>
                  <p className={`text-sm truncate ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    @{user.username}
                  </p>
                </div>
              </div>

              {/* Role Badge */}
              <div className="mb-4">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  user.role === 'superadmin'
                    ? isDarkMode
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'bg-purple-100 text-purple-800'
                    : isDarkMode
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-blue-100 text-blue-800'
                }`}>
                  {user.role === 'superadmin' ? 'Super Admin' : 'User'}
                </span>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                <div className={`text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  <span className="font-medium">Phone:</span> {user.phoneNumber || 'N/A'}
                </div>
                <div className={`text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  <span className="font-medium">Address:</span> {user.address || 'No address'}
                </div>
                <div className={`text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  <span className="font-medium">Created:</span> {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-white/10">
                <button
                  onClick={() => {
                    setFormData({
                      name: user.name,
                      username: user.username,
                      password: '',
                      phoneNumber: user.phoneNumber || '',
                      address: user.address || '',
                      role: user.role
                    });
                    setShowEditModal(true);
                    setValidationAlert(null);
                  }}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    isDarkMode
                      ? 'text-blue-400 hover:bg-blue-500/20 hover:text-blue-300'
                      : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    if (canDeleteUser(user) && user._id) {
                      setSelectedUser(user);
                      setShowDeleteModal(true);
                      setValidationAlert(null);
                    } else if (!user._id) {
                      setValidationAlert({ type: 'error', text: 'Invalid user data' });
                      setTimeout(() => setValidationAlert(null), 5000);
                    }
                  }}
                  disabled={!canDeleteUser(user) || !user._id}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    isDarkMode
                      ? 'text-red-400 hover:bg-red-500/20 hover:text-red-300'
                      : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                  } ${!canDeleteUser(user) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <TrashIcon className={`h-4 w-4 transition-transform duration-200 ${
                    !canDeleteUser(user) 
                      ? 'opacity-60 scale-95' 
                      : 'hover:scale-110'
                  }`} />
                </button>
              </div>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <div className={`col-span-full text-center py-12 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <p>No users found</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={`flex items-center justify-between px-4 py-3 border-t ${
          isDarkMode 
            ? 'bg-white/5 border-white/10' 
            : 'bg-white border-gray-200'
        } sm:px-6`}>
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md transition-all duration-300 ${
                isDarkMode
                  ? 'border-white/20 text-gray-300 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              Previous
            </button>
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md transition-all duration-300 ${
                isDarkMode
                  ? 'border-white/20 text-gray-300 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div className={`flex-1 text-sm text-center ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
            </div>
            <div className="flex items-center">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium transition-all duration-300 ${
                  isDarkMode
                    ? 'border-white/20 text-gray-300 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed'
                    : 'border-gray-300 text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-all duration-300 ${
                      currentPage === page
                        ? isDarkMode
                          ? 'z-10 bg-blue-600 border-blue-500 text-white'
                          : 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : isDarkMode
                          ? 'border-white/20 text-gray-300 bg-white/10 hover:bg-white/20'
                          : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </nav>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium transition-all duration-300 ${
                  isDarkMode
                    ? 'border-white/20 text-gray-300 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed'
                    : 'border-gray-300 text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl rounded-lg shadow-xl ${
            isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
          }`}>
            <div className={`flex items-center justify-between p-6 border-b ${
              isDarkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Create New User
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                  setValidationAlert(null);
                }}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  isDarkMode
                    ? 'text-gray-400 hover:bg-white/10'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Validation Alert - Inside Modal */}
              {validationAlert && (
                <div className={`mb-4 p-3 rounded-md border text-sm ${
                  validationAlert.type === 'success'
                    ? isDarkMode
                      ? 'bg-green-900/20 border-green-500/30 text-green-400'
                      : 'bg-green-50 border-green-200 text-green-800'
                    : isDarkMode
                      ? 'bg-red-900/20 border-red-500/30 text-red-400'
                      : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {validationAlert.type === 'success' ? (
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                      ) : (
                        <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                      )}
                      <span>{validationAlert.text}</span>
                    </div>
                    <button
                      onClick={() => setValidationAlert(null)}
                      className={`p-1 rounded transition-all duration-300 ${
                        isDarkMode
                          ? 'text-gray-400 hover:bg-white/10'
                          : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Required Fields Note */}
              <div className={`mb-6 p-3 rounded-lg border ${
                isDarkMode
                  ? 'bg-blue-900/20 border-blue-500/30'
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <p className={`text-sm ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-800'
                }`}>
                  <span className="text-red-500 font-semibold">*</span> Required fields
                </p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                        formErrors.name
                          ? 'border-red-500'
                          : isDarkMode
                            ? 'bg-white/10 border-white/20 text-white focus:border-blue-500'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                      }`}
                      placeholder="Enter full name"
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>
                    )}
                  </div>

                  {/* Username */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                        formErrors.username
                          ? 'border-red-500'
                          : isDarkMode
                            ? 'bg-white/10 border-white/20 text-white focus:border-blue-500'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                      }`}
                      placeholder="Enter username"
                    />
                    {formErrors.username && (
                      <p className="mt-1 text-xs text-red-500">{formErrors.username}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                        formErrors.password
                          ? 'border-red-500'
                          : isDarkMode
                            ? 'bg-white/10 border-white/20 text-white focus:border-blue-500'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                      }`}
                      placeholder="Enter password"
                    />
                    {formErrors.password && (
                      <p className="mt-1 text-xs text-red-500">{formErrors.password}</p>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Phone Number */}
                  <div>
                                            <label className={`block text-sm font-medium mb-2 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Phone Number
                        </label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                        formErrors.phoneNumber
                          ? 'border-red-500'
                          : isDarkMode
                            ? 'bg-white/10 border-white/20 text-white focus:border-blue-500'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                      }`}
                      placeholder="Enter phone number"
                    />
                    {formErrors.phoneNumber && (
                      <p className="mt-1 text-xs text-red-500">{formErrors.phoneNumber}</p>
                    )}
                  </div>

                  {/* Address */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Address
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                        formErrors.address
                          ? 'border-red-500'
                          : isDarkMode
                            ? 'bg-white/10 border-white/20 text-white focus:border-blue-500'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                      } resize-none`}
                      placeholder="Enter address"
                    />
                    {formErrors.address && (
                      <p className="mt-1 text-xs text-red-500">{formErrors.address}</p>
                    )}
                  </div>

                  {/* Role */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                        formErrors.role
                          ? 'border-red-500'
                          : isDarkMode
                            ? 'bg-white/10 border-white/20 text-white focus:border-blue-500'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                      }`}
                    >
                      <option value="user" className={isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'}>User</option>
                      <option value="superadmin" className={isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'}>Super Admin</option>
                    </select>
                    {formErrors.role && (
                      <p className="mt-1 text-xs text-red-500">{formErrors.role}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className={`flex justify-end space-x-3 p-6 border-t ${
              isDarkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                  setValidationAlert(null);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  isDarkMode
                    ? 'text-gray-300 hover:bg-white/10'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-300 disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl rounded-lg shadow-xl ${
            isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
          }`}>
            <div className={`flex items-center justify-between p-6 border-b ${
              isDarkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Edit User
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                  setValidationAlert(null);
                }}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  isDarkMode
                    ? 'text-gray-400 hover:bg-white/10'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Validation Alert */}
              {validationAlert && (
                <div className={`mb-6 p-4 rounded-lg border ${
                  validationAlert.type === 'success'
                    ? isDarkMode
                      ? 'bg-green-900/20 border-green-500/30 text-green-400'
                      : 'bg-green-50 border-green-200 text-green-800'
                    : isDarkMode
                      ? 'bg-red-900/20 border-red-500/30 text-red-400'
                      : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <div className="flex items-center">
                    {validationAlert.type === 'success' ? (
                      <CheckIcon className="h-5 w-5 mr-2" />
                    ) : (
                      <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                    )}
                    {validationAlert.text}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                        formErrors.name
                          ? 'border-red-500'
                          : isDarkMode
                            ? 'bg-white/10 border-white/20 text-white focus:border-blue-500'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                      }`}
                      placeholder="Enter full name"
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
                    )}
                  </div>

                  {/* Username */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Username
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                        formErrors.username
                          ? 'border-red-500'
                          : isDarkMode
                            ? 'bg-white/10 border-white/20 text-white focus:border-blue-500'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                      }`}
                      placeholder="Enter username"
                    />
                    {formErrors.username && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.username}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Password
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                        formErrors.password
                          ? 'border-red-500'
                          : isDarkMode
                            ? 'bg-white/10 border-white/20 text-white focus:border-blue-500'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                      }`}
                      placeholder="Enter password (leave blank to keep current)"
                    />
                    {formErrors.password && (
                      <p className="mt-1 text-xs text-red-500">{formErrors.password}</p>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Phone Number */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                        formErrors.phoneNumber
                          ? 'border-red-500'
                          : isDarkMode
                            ? 'bg-white/10 border-white/20 text-white focus:border-blue-500'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                      }`}
                      placeholder="Enter phone number"
                    />
                    {formErrors.phoneNumber && (
                      <p className="mt-1 text-xs text-red-500">{formErrors.phoneNumber}</p>
                    )}
                  </div>

                  {/* Address */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Address
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                        formErrors.address
                          ? 'border-red-500'
                          : isDarkMode
                            ? 'bg-white/10 border-white/20 text-white focus:border-blue-500'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                      } resize-none`}
                      placeholder="Enter address"
                    />
                    {formErrors.address && (
                      <p className="mt-1 text-xs text-red-500">{formErrors.address}</p>
                    )}
                  </div>

                  {/* Role */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                        isDarkMode
                          ? 'bg-white/10 border-white/20 text-white focus:border-blue-500'
                          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                      }`}
                    >
                      <option value="user" className={isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'}>User</option>
                      <option value="superadmin" className={isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'}>Super Admin</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className={`flex justify-end space-x-3 p-6 border-t ${
              isDarkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                  setValidationAlert(null);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  isDarkMode
                    ? 'text-gray-300 hover:bg-white/10'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-300 disabled:opacity-50"
              >
                {submitting ? 'Updating...' : 'Update User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-lg shadow-xl ${
            isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
          }`}>
            <div className={`flex items-center justify-between p-6 border-b ${
              isDarkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Delete User
              </h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                  setValidationAlert(null);
                }}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  isDarkMode
                    ? 'text-gray-400 hover:bg-white/10'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center text-lg font-semibold ${
                  isDarkMode
                    ? 'bg-gradient-to-br from-red-500 to-red-600 text-white'
                    : 'bg-gradient-to-br from-red-600 to-red-700 text-white'
                }`}>
                  {getUserInitials(selectedUser.name)}
                </div>
                <div className="ml-4">
                  <p className={`text-lg font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {selectedUser.name}
                  </p>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    {selectedUser.username}
                  </p>
                </div>
              </div>
              
              {!canDeleteUser(selectedUser) ? (
                <div className={`p-4 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  <p className="text-sm font-medium mb-1">⚠️ Cannot Delete Yourself</p>
                  <p className="text-sm">
                    You cannot delete your own account as it would lock you out of the system. 
                    Please ask another superadmin to delete your account if needed.
                  </p>
                </div>
              ) : (
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Are you sure you want to delete this user? This action cannot be undone.
                </p>
              )}
            </div>

            <div className={`flex justify-end space-x-3 p-6 border-t ${
              isDarkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                  setValidationAlert(null);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  isDarkMode
                    ? 'text-gray-300 hover:bg-white/10'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={submitting || !canDeleteUser(selectedUser)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  canDeleteUser(selectedUser)
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                } disabled:opacity-50`}
              >
                {submitting ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-lg shadow-xl ${
            isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
          }`}>
            <div className={`flex items-center justify-between p-6 border-b ${
              isDarkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                User Profile
              </h3>
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  setSelectedUser(null);
                }}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  isDarkMode
                    ? 'text-gray-400 hover:bg-white/10'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center mb-6">
                <div className={`h-16 w-16 rounded-full flex items-center justify-center text-xl font-semibold ${
                  isDarkMode
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                    : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white'
                }`}>
                  {getUserInitials(selectedUser.name)}
                </div>
                <div className="ml-4">
                  <h4 className={`text-xl font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {selectedUser.name}
                  </h4>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    {selectedUser.username}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {selectedUser.phoneNumber && (
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Phone Number
                    </label>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      📞 {selectedUser.phoneNumber}
                    </p>
                  </div>
                )}

                {selectedUser.address && (
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Address
                    </label>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      📍 {selectedUser.address}
                    </p>
                  </div>
                )}

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Role
                  </label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedUser.role === 'superadmin'
                      ? isDarkMode
                        ? 'bg-purple-900/20 text-purple-400'
                        : 'bg-purple-100 text-purple-800'
                      : isDarkMode
                        ? 'bg-blue-900/20 text-blue-400'
                        : 'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedUser.role === 'superadmin' ? 'Super Admin' : 'User'}
                  </span>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Created
                  </label>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {formatDate(selectedUser.createdAt)}
                  </p>
                </div>

                {!selectedUser.phoneNumber && !selectedUser.address && (
                  <div className={`text-center py-4 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    No contact information available
                  </div>
                )}
              </div>
            </div>

            <div className={`flex justify-end p-6 border-t ${
              isDarkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  setSelectedUser(null);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  isDarkMode
                    ? 'text-gray-300 hover:bg-white/10'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}