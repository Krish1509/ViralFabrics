'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/app/(pages)/(dashboard)/hooks/useSession';
import { useRouter } from 'next/navigation';
import { useDarkMode } from '@/app/(pages)/(dashboard)/hooks/useDarkMode';
import { Calendar, Search, Download, RefreshCw, Clock, User, Activity, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface Log {
  _id: string;
  userId: string;
  username: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  duration?: number;
  success: boolean;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

interface LogsResponse {
  logs: Log[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
    total: number;
    limit: number;
  };
}

export default function LogsPage() {
  const { user, isLoading, isSuperAdmin, isUser } = useSession();
  const router = useRouter();
  const { isDarkMode, mounted } = useDarkMode();
  
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    hasMore: false,
    nextCursor: null as string | null,
    total: 0,
    limit: 100
  });
  
  // Simplified filters - only username and date
  const [filters, setFilters] = useState({
    username: '',
    dateFilter: 'all' // 'all', 'today', 'yesterday', 'specific'
  });
  const [specificDate, setSpecificDate] = useState('');

  useEffect(() => {
    if (isLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!isSuperAdmin && !isUser) {
      router.push('/dashboard/access-denied');
      return;
    }
    
    fetchLogs();
  }, [user, isLoading, isSuperAdmin, router, filters]);

  const fetchLogs = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No authentication token found. Please log in again.');
        router.push('/login');
        return;
      }
      
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([key, value]) => value !== '')
        )
      });
      
      // Add date filtering
      if (filters.dateFilter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        params.append('startDate', today);
        params.append('endDate', today);
      } else if (filters.dateFilter === 'yesterday') {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        params.append('startDate', yesterday);
        params.append('endDate', yesterday);
      } else if (filters.dateFilter === 'specific' && specificDate) {
        params.append('startDate', specificDate);
        params.append('endDate', specificDate);
      }
      
      // Reset cursor for refresh
      if (isRefresh) {
        setPagination(prev => ({ ...prev, nextCursor: null }));
      }
      
      const response = await fetch(`/api/logs?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch logs: ${response.status}`);
      }
      
      const responseData = await response.json();
      const data = responseData.success ? responseData.data : responseData;
      
      if (!data || !data.logs || !data.pagination) {
        console.error('Unexpected API response structure:', data);
        throw new Error('Invalid response format from server');
      }
      
      setLogs(data.logs);
      setPagination(prev => ({
        ...prev,
        hasMore: data.pagination.hasMore,
        nextCursor: data.pagination.nextCursor,
        total: data.pagination.total
      }));
    } catch (error) {
      console.error('Error fetching logs:', error);
      alert(`Error fetching logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, nextCursor: null }));
  };

  const clearFilters = () => {
    setFilters({
      username: '',
      dateFilter: 'all'
    });
    setSpecificDate('');
    setPagination(prev => ({ ...prev, nextCursor: null }));
  };

  const loadMore = async () => {
    if (!pagination.hasMore || loadingMore) return;
    
    try {
      setLoadingMore(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No authentication token found. Please log in again.');
        router.push('/login');
        return;
      }
      
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        cursor: pagination.nextCursor || '',
        ...Object.fromEntries(
          Object.entries(filters).filter(([key, value]) => value !== '')
        )
      });
      
      // Add date filtering
      if (filters.dateFilter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        params.append('startDate', today);
        params.append('endDate', today);
      } else if (filters.dateFilter === 'yesterday') {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        params.append('startDate', yesterday);
        params.append('endDate', yesterday);
      } else if (filters.dateFilter === 'specific' && specificDate) {
        params.append('startDate', specificDate);
        params.append('endDate', specificDate);
      }
      
      const response = await fetch(`/api/logs?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch logs: ${response.status}`);
      }
      
      const responseData = await response.json();
      const data = responseData.success ? responseData.data : responseData;
      
      if (!data || !data.logs || !data.pagination) {
        console.error('Unexpected API response structure:', data);
        throw new Error('Invalid response format from server');
      }
      
      setLogs(prev => [...prev, ...data.logs]);
      setPagination(prev => ({
        ...prev,
        hasMore: data.pagination.hasMore,
        nextCursor: data.pagination.nextCursor
      }));
    } catch (error) {
      console.error('Error loading more logs:', error);
      alert(`Error loading more logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingMore(false);
    }
  };

  const exportLogs = async () => {
    try {
      const params = new URLSearchParams({
        limit: '1000',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      });
      
      // Add date filtering for export
      if (filters.dateFilter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        params.append('startDate', today);
        params.append('endDate', today);
      } else if (filters.dateFilter === 'yesterday') {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        params.append('startDate', yesterday);
        params.append('endDate', yesterday);
      } else if (filters.dateFilter === 'specific' && specificDate) {
        params.append('startDate', specificDate);
        params.append('endDate', specificDate);
      }
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/logs?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to export logs: ${response.status}`);
      }
      
      const responseData = await response.json();
      const data = responseData.success ? responseData.data : responseData;
      
      if (!data || !data.logs) {
        throw new Error('Invalid response format from server');
      }
      
      // Convert to CSV
      const csvContent = [
        ['Timestamp', 'Username', 'Action', 'Resource', 'Resource ID', 'Success', 'Severity', 'IP Address', 'Duration (ms)'],
        ...data.logs.map((log: Log) => [
          new Date(log.timestamp).toLocaleString(),
          log.username,
          log.action,
          log.resource,
          log.resourceId || '',
          log.success ? 'Yes' : 'No',
          log.severity,
          log.ipAddress || '',
          log.duration || ''
        ])
      ].map(row => row.join(',')).join('\n');
      
      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Error exporting logs. Please try again.');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-300 text-red-900 border-red-500 dark:bg-red-900 dark:text-red-200 dark:border-red-700 hover:bg-red-400 dark:hover:bg-red-800';
      case 'error': return 'bg-orange-300 text-orange-900 border-orange-500 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700 hover:bg-orange-400 dark:hover:bg-orange-800';
      case 'warning': return 'bg-yellow-300 text-yellow-900 border-yellow-500 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700 hover:bg-yellow-400 dark:hover:bg-yellow-800';
      default: return 'bg-green-300 text-green-900 border-green-500 dark:bg-green-900 dark:text-green-200 dark:border-green-700 hover:bg-green-400 dark:hover:bg-green-800';
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('delete')) return 'bg-red-300 text-red-900 border-red-500 dark:bg-red-900 dark:text-red-200 dark:border-red-700 hover:bg-red-400 dark:hover:bg-red-800';
    if (action.includes('create')) return 'bg-green-300 text-green-900 border-green-500 dark:bg-green-900 dark:text-green-200 dark:border-green-700 hover:bg-green-400 dark:hover:bg-green-800';
    if (action.includes('update')) return 'bg-blue-300 text-blue-900 border-blue-500 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700 hover:bg-blue-400 dark:hover:bg-blue-800';
    if (action.includes('login')) return 'bg-purple-300 text-purple-900 border-purple-500 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700 hover:bg-purple-400 dark:hover:bg-purple-800';
    return 'bg-gray-300 text-gray-900 border-gray-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 hover:bg-gray-400 dark:hover:bg-gray-600';
  };

  const formatActionName = (action: string) => {
    const actionMap: { [key: string]: string } = {
      'login': '🔐 Login',
      'logout': '🚪 Logout',
      'login_failed': '❌ Login Failed',
      'order_create': '➕ Create Order',
      'order_update': '✏️ Update Order',
      'order_delete': '🗑️ Delete Order',
      'lab_create': '➕ Create Lab',
      'lab_update': '✏️ Update Lab',
      'lab_delete': '🗑️ Delete Lab',
      'user_create': '➕ Create User',
      'user_update': '✏️ Update User',
      'user_delete': '🗑️ Delete User',
      'view': '👁️ View',
      'export': '📤 Export',
      'import': '📥 Import',
      'search': '🔍 Search',
      'filter': '🔧 Filter'
    };
    return actionMap[action] || action.replace('_', ' ');
  };

  const getActionIcon = (action: string) => {
    if (action.includes('login')) return <User className="w-4 h-4" />;
    if (action.includes('create')) return <CheckCircle className="w-4 h-4" />;
    if (action.includes('update')) return <Activity className="w-4 h-4" />;
    if (action.includes('delete')) return <XCircle className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  if (isLoading || !mounted) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="flex items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user || (!isSuperAdmin && !isUser)) {
    return null;
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className={`text-2xl lg:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>System Logs</h1>
            <p className={`mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Monitor user activities and system events</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={exportLogs} 
              className={`px-4 py-2 border rounded-lg transition-all duration-200 flex items-center gap-2 font-medium shadow-sm hover:shadow-md ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 hover:border-gray-500' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700'
              }`}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button 
              onClick={() => fetchLogs(true)} 
              className={`px-4 py-2 border rounded-lg transition-all duration-200 flex items-center gap-2 font-medium shadow-sm hover:shadow-md ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 hover:border-gray-500' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-green-50 hover:border-green-400 hover:text-green-700'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Simplified Filters */}
        <div className={`border rounded-lg p-6 shadow-sm ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            <Search className="w-5 h-5" />
            Filters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Username Filter */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Username</label>
              <div className="relative">
                <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-400'
                }`} />
                <input
                  type="text"
                  placeholder="Search username..."
                  value={filters.username}
                  onChange={(e) => handleFilterChange('username', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'border-gray-300'
                  }`}
                />
              </div>
            </div>
            
            {/* Date Filter */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Date Filter</label>
              <select 
                value={filters.dateFilter} 
                onChange={(e) => handleFilterChange('dateFilter', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'border-gray-300'
                }`}
              >
                <option value="all">All dates</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="specific">Specific date</option>
              </select>
            </div>
            
            {/* Specific Date Input */}
            {filters.dateFilter === 'specific' && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Select Date</label>
                <div className="relative">
                  <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-400'
                  }`} />
                  <input
                    type="date"
                    value={specificDate}
                    onChange={(e) => setSpecificDate(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'border-gray-300'
                    }`}
                  />
                </div>
              </div>
            )}
            
            {/* Clear Filters Button */}
            <div className="flex items-end">
              <button 
                onClick={clearFilters} 
                className={`px-4 py-2 border rounded-lg transition-all duration-200 font-medium hover:shadow-md ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 hover:border-gray-500' 
                    : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 hover:border-gray-400 hover:text-gray-900'
                }`}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Log Statistics */}
        {logs.length > 0 && (
          <div className={`border rounded-lg p-6 shadow-sm ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h4 className={`text-lg font-semibold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>📊 Log Statistics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                isDarkMode 
                  ? 'bg-blue-900/50 border-blue-700 hover:bg-blue-900/70' 
                  : 'bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300'
              }`}>
                <div className={`text-sm font-medium ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-700'
                }`}>Total Logs</div>
                <div className={`text-2xl font-bold ${
                  isDarkMode ? 'text-blue-100' : 'text-blue-900'
                }`}>{logs.length}</div>
              </div>
              <div className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                isDarkMode 
                  ? 'bg-green-900/50 border-green-700 hover:bg-green-900/70' 
                  : 'bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300'
              }`}>
                <div className={`text-sm font-medium ${
                  isDarkMode ? 'text-green-300' : 'text-green-700'
                }`}>Successful</div>
                <div className={`text-2xl font-bold ${
                  isDarkMode ? 'text-green-100' : 'text-green-900'
                }`}>
                  {logs.filter(log => log.success).length}
                </div>
              </div>
              <div className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                isDarkMode 
                  ? 'bg-orange-900/50 border-orange-700 hover:bg-orange-900/70' 
                  : 'bg-orange-50 border-orange-200 hover:bg-orange-100 hover:border-orange-300'
              }`}>
                <div className={`text-sm font-medium ${
                  isDarkMode ? 'text-orange-300' : 'text-orange-700'
                }`}>Failed</div>
                <div className={`text-2xl font-bold ${
                  isDarkMode ? 'text-orange-100' : 'text-orange-900'
                }`}>
                  {logs.filter(log => !log.success).length}
                </div>
              </div>
              <div className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                isDarkMode 
                  ? 'bg-purple-900/50 border-purple-700 hover:bg-purple-900/70' 
                  : 'bg-purple-50 border-purple-200 hover:bg-purple-100 hover:border-purple-300'
              }`}>
                <div className={`text-sm font-medium ${
                  isDarkMode ? 'text-purple-300' : 'text-purple-700'
                }`}>Unique Users</div>
                <div className={`text-2xl font-bold ${
                  isDarkMode ? 'text-purple-100' : 'text-purple-900'
                }`}>
                  {new Set(logs.map(log => log.username)).size}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Logs Table */}
        <div className={`border rounded-lg shadow-sm overflow-hidden ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className={`px-6 py-4 border-b ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Activity Logs</h3>
            <p className={`mt-1 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              📊 Showing {logs.length} logs {pagination.total > 0 && `(Total: ${pagination.total})`}
              {pagination.hasMore && ' - Scroll down to load more'}
            </p>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              <span className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Activity className={`w-12 h-12 mb-4 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <p className={`text-lg ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>No logs found</p>
              <p className={`text-sm mt-1 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-500'
              }`}>Try adjusting your filters or refresh the page</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className={`${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>Timestamp</th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>User</th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>Action</th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>Resource</th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>Status</th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>Severity</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 ${
                    isDarkMode ? 'bg-gray-800' : 'bg-white'
                  }`}>
                    {logs.map((log) => (
                      <tr key={log._id} className={`transition-all duration-200 cursor-pointer ${
                        isDarkMode ? 'hover:bg-gray-700 hover:shadow-lg' : 'hover:bg-blue-50 hover:shadow-md'
                      }`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Clock className={`w-4 h-4 ${
                              isDarkMode ? 'text-gray-400' : 'text-blue-500'
                            }`} />
                            <span className={`text-sm font-mono ${
                              isDarkMode ? 'text-gray-200' : 'text-gray-900'
                            }`}>
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                              isDarkMode ? 'bg-blue-900' : 'bg-blue-100 hover:bg-blue-200'
                            }`}>
                              <User className={`w-4 h-4 ${
                                isDarkMode ? 'text-blue-300' : 'text-blue-600'
                              }`} />
                            </div>
                            <div>
                              <div className={`font-medium ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {log.username === 'unknown' ? 'System' : log.username}
                              </div>
                              <div className={`text-sm capitalize ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>{log.userRole}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg transition-all duration-200 ${getActionColor(log.action)}`}>
                              {getActionIcon(log.action)}
                            </div>
                            <span className={`text-sm font-medium ${
                              isDarkMode ? 'text-gray-200' : 'text-gray-900'
                            }`}>
                              {formatActionName(log.action)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className={`font-medium capitalize ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>{log.resource}</div>
                            {log.resourceId && (
                              <div className={`text-sm font-mono ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {log.resourceId.substring(0, 8)}...
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-full border transition-all duration-200 ${
                            log.success 
                              ? 'bg-green-300 text-green-900 border-green-500 dark:bg-green-900 dark:text-green-200 dark:border-green-700 hover:bg-green-400 dark:hover:bg-green-800' 
                              : 'bg-red-300 text-red-900 border-red-500 dark:bg-red-900 dark:text-red-200 dark:border-red-700 hover:bg-red-400 dark:hover:bg-red-800'
                          }`}>
                            {log.success ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Success
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                Failed
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-full border transition-all duration-200 ${getSeverityColor(log.severity)}`}>
                            {log.severity === 'critical' && <AlertTriangle className="w-3 h-3" />}
                            {log.severity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Load More Button */}
              {pagination.hasMore && (
                <div className={`flex items-center justify-center p-6 border-t ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 font-medium"
                  >
                    {loadingMore ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
