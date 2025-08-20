'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/app/(pages)/(dashboard)/hooks/useSession';
import { useRouter } from 'next/navigation';
import { useDarkMode } from '@/app/(pages)/(dashboard)/hooks/useDarkMode';
import { Calendar, Search, Filter, Download, Trash2, RefreshCw } from 'lucide-react';

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
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [pagination, setPagination] = useState({
    hasMore: false,
    nextCursor: null as string | null,
    total: 0,
    limit: 1000 // Increased to load more logs at once
  });
  
  // Filters
  const [filters, setFilters] = useState({
    username: '',
    action: '',
    resource: '',
    success: '',
    severity: '',
    startDate: '',
    endDate: '',
    excludeView: true // Filter out view actions by default
  });



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
   }, [user, isLoading, isSuperAdmin, router, pagination.limit, filters]);

   // Auto-refresh effect
   useEffect(() => {
     if (!autoRefresh) return;
     
     const interval = setInterval(() => {
       fetchLogs(true);
     }, 10000); // Refresh every 10 seconds
     
     return () => clearInterval(interval);
   }, [autoRefresh]);

     const fetchLogs = async (isRefresh = false) => {
     try {
       if (isRefresh) {
         setRefreshing(true);
       } else {
         setLoading(true);
       }
       
              // Debug: Check if token exists
       const token = localStorage.getItem('token');
       if (!token) {
         alert('No authentication token found. Please log in again.');
         router.push('/login');
         return;
       }
       
       const params = new URLSearchParams({
         limit: '1000', // Load more logs by default
         ...Object.fromEntries(
           Object.entries(filters).filter(([key, value]) => {
             if (key === 'excludeView') return false; // Handle separately
             return value !== '';
           })
         )
       });
       
       // Reset cursor for refresh
       if (isRefresh) {
         setPagination(prev => ({ ...prev, nextCursor: null }));
       }
       
       // Add excludeView filter
       if (filters.excludeView) {
         params.append('excludeAction', 'view');
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
       
       // Debug: Log the response structure
       console.log('API Response:', responseData);
       
       // Handle the wrapped response structure from the API
       const data = responseData.success ? responseData.data : responseData;
       
       // Handle case where response might not have expected structure
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
    setPagination(prev => ({ ...prev, nextCursor: null })); // Reset cursor
  };

     const clearFilters = () => {
     setFilters({
       username: '',
       action: '',
       resource: '',
       success: '',
       severity: '',
       startDate: '',
       endDate: '',
       excludeView: true
     });
     setPagination(prev => ({ ...prev, nextCursor: null }));
   };

   const testSession = async () => {
     try {
       const token = localStorage.getItem('token');
       if (!token) {
         alert('No authentication token found. Please log in again.');
         router.push('/login');
         return;
       }
       
       const response = await fetch('/api/test-session', {
         headers: {
           'Authorization': `Bearer ${token}`,
         },
       });
       
       if (!response.ok) {
         const errorData = await response.json().catch(() => ({}));
         throw new Error(errorData.message || `Failed to test session: ${response.status}`);
       }
       
       const data = await response.json();
       if (data.success) {
         alert(`✅ Session Test Results:\n\nUser ID: ${data.session.id}\nUsername: ${data.session.username}\nName: ${data.session.name}\nRole: ${data.session.role}`);
       } else {
         alert(`❌ Session Test Failed:\n\n${data.message}`);
       }
     } catch (error) {
       console.error('Error testing session:', error);
       alert(`Error testing session: ${error instanceof Error ? error.message : 'Unknown error'}`);
     }
   };

   const decodeToken = async () => {
     try {
       const token = localStorage.getItem('token');
       if (!token) {
         alert('No authentication token found. Please log in again.');
         router.push('/login');
         return;
       }
       
       const response = await fetch('/api/decode-token', {
         headers: {
           'Authorization': `Bearer ${token}`,
         },
       });
       
       if (!response.ok) {
         const errorData = await response.json().catch(() => ({}));
         throw new Error(errorData.message || `Failed to decode token: ${response.status}`);
       }
       
       const data = await response.json();
       if (data.success) {
         const payload = data.payload;
         alert(`🔐 Token Decode Results:\n\nRaw Payload:\n${JSON.stringify(payload, null, 2)}\n\nExtracted Fields:\nID: ${payload.id}\nUsername: ${payload.username}\nName: ${payload.name}\nRole: ${payload.role}`);
       } else {
         alert(`❌ Token Decode Failed:\n\n${data.message}`);
       }
     } catch (error) {
       console.error('Error decoding token:', error);
       alert(`Error decoding token: ${error instanceof Error ? error.message : 'Unknown error'}`);
     }
   };

   const testUserData = async () => {
     try {
       const token = localStorage.getItem('token');
       if (!token) {
         alert('No authentication token found. Please log in again.');
         router.push('/login');
         return;
       }
       
       const response = await fetch('/api/test-user-data', {
         headers: {
           'Authorization': `Bearer ${token}`,
         },
       });
       
       if (!response.ok) {
         const errorData = await response.json().catch(() => ({}));
         throw new Error(errorData.message || `Failed to test user data: ${response.status}`);
       }
       
       const data = await response.json();
       if (data.success) {
         const user = data.user;
         const session = data.session;
         alert(`👤 User Data Test Results:\n\nDatabase User:\nID: ${user._id}\nUsername: ${user.username}\nName: ${user.name}\nRole: ${user.role}\n\nSession Data:\nID: ${session.id}\nUsername: ${session.username}\nName: ${session.name}\nRole: ${session.role}`);
       } else {
         alert(`❌ User Data Test Failed:\n\n${data.message}`);
       }
     } catch (error) {
       console.error('Error testing user data:', error);
       alert(`Error testing user data: ${error instanceof Error ? error.message : 'Unknown error'}`);
     }
   };

   const testLogCreation = async () => {
     try {
       const token = localStorage.getItem('token');
       if (!token) {
         alert('No authentication token found. Please log in again.');
         router.push('/login');
         return;
       }
       
       const response = await fetch('/api/test-log-creation', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`,
         },
       });
       
       if (!response.ok) {
         const errorData = await response.json().catch(() => ({}));
         throw new Error(errorData.message || `Failed to test log creation: ${response.status}`);
       }
       
       const data = await response.json();
       alert(`🧪 Log Creation Test Results:\n\n${data.results.join('\n')}`);
       
       // Refresh logs to show new actions
       fetchLogs(true);
     } catch (error) {
       console.error('Error testing log creation:', error);
       alert(`Error testing log creation: ${error instanceof Error ? error.message : 'Unknown error'}`);
     }
   };

   const createSimpleLogs = async () => {
     try {
       const token = localStorage.getItem('token');
       if (!token) {
         alert('No authentication token found. Please log in again.');
         router.push('/login');
         return;
       }
       
       // Create simple logs directly using the logger
       const response = await fetch('/api/test-actions', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`,
         },
       });
       
       if (!response.ok) {
         const errorData = await response.json().catch(() => ({}));
         throw new Error(errorData.message || `Failed to create simple logs: ${response.status}`);
       }
       
       const data = await response.json();
       alert(`✅ Created ${data.actions.length} simple logs: ${data.actions.join(', ')}`);
       
       // Refresh logs to show new actions
       fetchLogs(true);
     } catch (error) {
       console.error('Error creating simple logs:', error);
       alert(`Error creating simple logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
     }
   };

   const generateTestActions = async () => {
     try {
       const token = localStorage.getItem('token');
       if (!token) {
         alert('No authentication token found. Please log in again.');
         router.push('/login');
         return;
       }
       
       const response = await fetch('/api/test-actions', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`,
         },
       });
       
       if (!response.ok) {
         const errorData = await response.json().catch(() => ({}));
         throw new Error(errorData.message || `Failed to generate test actions: ${response.status}`);
       }
       
       const data = await response.json();
       alert(`✅ Generated test actions: ${data.actions.join(', ')}`);
       
       // Refresh logs to show new actions
       fetchLogs(true);
     } catch (error) {
       console.error('Error generating test actions:', error);
       alert(`Error generating test actions: ${error instanceof Error ? error.message : 'Unknown error'}`);
     }
   };

   const checkDatabase = async () => {
     try {
       const token = localStorage.getItem('token');
       if (!token) {
         alert('No authentication token found. Please log in again.');
         router.push('/login');
         return;
       }
       
       // Use the new count API
       const response = await fetch('/api/logs/count', {
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`,
         },
       });
       
       if (!response.ok) {
         const errorData = await response.json().catch(() => ({}));
         throw new Error(errorData.error || `Failed to check database: ${response.status}`);
       }
       
       const data = await response.json();
       
       let message = `📊 Database contains ${data.totalCount} total logs\n\n`;
       
       if (data.actionCounts && data.actionCounts.length > 0) {
         message += '📈 Action Breakdown:\n';
         data.actionCounts.forEach((item: any) => {
           message += `  ${item._id}: ${item.count}\n`;
         });
       }
       
       if (data.resourceCounts && data.resourceCounts.length > 0) {
         message += '\n📊 Resource Breakdown:\n';
         data.resourceCounts.forEach((item: any) => {
           message += `  ${item._id}: ${item.count}\n`;
         });
       }
       
       if (data.recentLogs && data.recentLogs.length > 0) {
         message += '\n🕒 Recent Logs:\n';
         data.recentLogs.forEach((log: any) => {
           message += `  ${log.action} ${log.resource} by ${log.username}\n`;
         });
       }
       
       alert(message);
     } catch (error) {
       console.error('Error checking database:', error);
       alert(`Error checking database: ${error instanceof Error ? error.message : 'Unknown error'}`);
     }
   };

   const showAllLogs = async () => {
     try {
       setLoading(true);
       
       const token = localStorage.getItem('token');
       if (!token) {
         alert('No authentication token found. Please log in again.');
         router.push('/login');
         return;
       }
       
       // Create a simple request without any pagination
       const params = new URLSearchParams({
         limit: '99999', // Very large number to get all logs
         ...Object.fromEntries(
           Object.entries(filters).filter(([key, value]) => {
             if (key === 'excludeView') return false;
             return value !== '';
           })
         )
       });
       
       if (filters.excludeView) {
         params.append('excludeAction', 'view');
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
       
       if (!data || !data.logs) {
         throw new Error('Invalid response format from server');
       }
       
       setLogs(data.logs);
       setPagination(prev => ({
         ...prev,
         hasMore: false,
         nextCursor: null,
         total: data.logs.length
       }));
       
       alert(`✅ Loaded ${data.logs.length} logs successfully!`);
     } catch (error) {
       console.error('Error showing all logs:', error);
       alert(`Error showing all logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
     } finally {
       setLoading(false);
     }
   };

   const loadAllLogs = async () => {
     try {
       setLoading(true);
       
       const token = localStorage.getItem('token');
       if (!token) {
         alert('No authentication token found. Please log in again.');
         router.push('/login');
         return;
       }
       
       const params = new URLSearchParams({
         limit: '5000', // Load maximum logs
         ...Object.fromEntries(
           Object.entries(filters).filter(([key, value]) => {
             if (key === 'excludeView') return false;
             return value !== '';
           })
         )
       });
       
       if (filters.excludeView) {
         params.append('excludeAction', 'view');
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
       
       if (!data || !data.logs) {
         throw new Error('Invalid response format from server');
       }
       
       setLogs(data.logs);
       setPagination(prev => ({
         ...prev,
         hasMore: false, // No more pagination needed
         nextCursor: null,
         total: data.logs.length
       }));
     } catch (error) {
       console.error('Error loading all logs:', error);
       alert(`Error loading all logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
     } finally {
       setLoading(false);
     }
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
           Object.entries(filters).filter(([key, value]) => {
             if (key === 'excludeView') return false;
             return value !== '';
           })
         )
       });
       
       if (filters.excludeView) {
         params.append('excludeAction', 'view');
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
       
       // Append new logs to existing ones
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
        limit: '1000', // Export more logs
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      });
      
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
       
       // Handle the wrapped response structure from the API
       const data = responseData.success ? responseData.data : responseData;
       
       // Handle case where response might not have expected structure
       if (!data || !data.logs || !data.pagination) {
         console.error('Unexpected API response structure:', data);
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
    }
  };

  

   const cleanupLogs = async () => {
     if (!confirm('Are you sure you want to cleanup old logs? This action cannot be undone.')) {
       return;
     }
     
     try {
       const token = localStorage.getItem('token');
       const response = await fetch('/api/logs?daysToKeep=30', { 
         method: 'DELETE',
         headers: {
           'Content-Type': 'application/json',
           ...(token && { 'Authorization': `Bearer ${token}` }),
         },
       });
       if (!response.ok) {
         const errorData = await response.json().catch(() => ({}));
         throw new Error(errorData.message || `Failed to cleanup logs: ${response.status}`);
       }
       
       const data = await response.json();
       alert(`Cleaned up ${data.deletedCount} old logs`);
       fetchLogs(); // Refresh the list
     } catch (error) {
       console.error('Error cleaning up logs:', error);
     }
   };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'error': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('delete')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (action.includes('create')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (action.includes('update')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (action.includes('login')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
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



  if (isLoading || !mounted) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white'}`} style={{ backgroundColor: isDarkMode ? '#111827' : '#ffffff' }}>
        Loading...
      </div>
    );
  }

  if (!user || (!isSuperAdmin && !isUser)) {
    return null;
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`} style={{ backgroundColor: isDarkMode ? '#111827' : '#f9fafb' }}>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
                     <div>
             <h1 className="text-3xl font-bold">System Logs</h1>
             <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Monitor user activities and system events</p>
           </div>
                     <div className="flex gap-2">
             <button 
               onClick={exportLogs} 
               className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
             >
               <Download className="w-4 h-4" />
               Export
             </button>
                         <button 
               onClick={cleanupLogs} 
               className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
             >
              <Trash2 className="w-4 h-4" />
              Cleanup
            </button>
                                      <button 
               onClick={() => fetchLogs(true)} 
               className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
             >
               <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
               {refreshing ? 'Refreshing...' : 'Refresh'}
             </button>
             
             <button 
               onClick={() => setAutoRefresh(!autoRefresh)} 
               className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 ${autoRefresh ? 'bg-green-100 border-green-500 dark:bg-green-900 dark:border-green-400' : ''} ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
             >
               <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
               {autoRefresh ? 'Auto Refresh ON' : 'Auto Refresh OFF'}
             </button>
             
             <button 
               onClick={() => loadAllLogs()} 
               className={`px-4 py-2 border border-blue-300 dark:border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-700 flex items-center gap-2 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
             >
               📊 Load All Logs
             </button>
             
             <button 
               onClick={() => showAllLogs()} 
               className={`px-4 py-2 border border-green-300 dark:border-green-600 rounded-md hover:bg-green-50 dark:hover:bg-green-700 flex items-center gap-2 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
             >
               🌟 Show All Logs (No Limit)
             </button>
             
             <button 
               onClick={() => checkDatabase()} 
               className={`px-4 py-2 border border-purple-300 dark:border-purple-600 rounded-md hover:bg-purple-50 dark:hover:bg-purple-700 flex items-center gap-2 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
             >
               🔍 Check Database Count
             </button>
             
             <button 
               onClick={() => generateTestActions()} 
               className={`px-4 py-2 border border-orange-300 dark:border-orange-600 rounded-md hover:bg-orange-50 dark:hover:bg-orange-700 flex items-center gap-2 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
             >
               🧪 Generate Test Actions
             </button>
             
             <button 
               onClick={() => createSimpleLogs()} 
               className={`px-4 py-2 border border-red-300 dark:border-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-700 flex items-center gap-2 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
             >
               🔥 Create Simple Logs
             </button>
             
             <button 
               onClick={() => testLogCreation()} 
               className={`px-4 py-2 border border-yellow-300 dark:border-yellow-600 rounded-md hover:bg-yellow-50 dark:hover:bg-yellow-700 flex items-center gap-2 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
             >
               🧪 Test Log Creation
             </button>
             
             <button 
               onClick={() => testSession()} 
               className={`px-4 py-2 border border-indigo-300 dark:border-indigo-600 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-700 flex items-center gap-2 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
             >
               🔍 Test Session
             </button>
             
             <button 
               onClick={() => decodeToken()} 
               className={`px-4 py-2 border border-purple-300 dark:border-purple-600 rounded-md hover:bg-purple-50 dark:hover:bg-purple-700 flex items-center gap-2 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
             >
               🔐 Decode Token
             </button>
             
             <button 
               onClick={() => testUserData()} 
               className={`px-4 py-2 border border-green-300 dark:border-green-600 rounded-md hover:bg-green-50 dark:hover:bg-green-700 flex items-center gap-2 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
             >
               👤 Test User Data
             </button>
             
          </div>
        </div>

                 {/* Filters */}
         <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                type="text"
                placeholder="Search username..."
                value={filters.username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('username', e.target.value)}
                                 className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
               />
             </div>
             
                          <div>
               <label className="block text-sm font-medium mb-1">Action</label>
               <select 
                 value={filters.action} 
                 onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange('action', e.target.value)}
                 className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
               >
                 <option value="">All actions</option>
                 <option value="login">Login</option>
                 <option value="logout">Logout</option>
                 <option value="login_failed">Login Failed</option>
                 <option value="order_create">Create Order</option>
                 <option value="order_update">Update Order</option>
                 <option value="order_delete">Delete Order</option>
                 <option value="lab_create">Create Lab</option>
                 <option value="lab_update">Update Lab</option>
                 <option value="lab_delete">Delete Lab</option>
                 <option value="user_create">Create User</option>
                 <option value="user_update">Update User</option>
                 <option value="user_delete">Delete User</option>
                 <option value="party_create">Create Party</option>
                 <option value="party_update">Update Party</option>
                 <option value="party_delete">Delete Party</option>
                 <option value="quality_create">Create Quality</option>
                 <option value="quality_update">Update Quality</option>
                 <option value="quality_delete">Delete Quality</option>
                 <option value="view">View</option>
               </select>
             </div>
             
             <div>
               <label className="flex items-center gap-2">
                 <input
                   type="checkbox"
                   checked={filters.excludeView}
                   onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('excludeView', e.target.checked.toString())}
                   className="rounded border-gray-300"
                 />
                 <span className="text-sm font-medium">Exclude View Actions</span>
               </label>
             </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Resource</label>
              <select 
                value={filters.resource} 
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange('resource', e.target.value)}
                                 className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
               >
                 <option value="">All resources</option>
                 <option value="auth">Authentication</option>
                 <option value="order">Order</option>
                 <option value="lab">Lab</option>
                 <option value="user">User</option>
                 <option value="party">Party</option>
                 <option value="quality">Quality</option>
               </select>
             </div>
             
             <div>
               <label className="block text-sm font-medium mb-1">Status</label>
               <select 
                 value={filters.success} 
                 onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange('success', e.target.value)}
                 className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
              >
                <option value="">All status</option>
                <option value="true">Success</option>
                <option value="false">Failed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Severity</label>
              <select 
                value={filters.severity} 
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange('severity', e.target.value)}
                                 className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
               >
                 <option value="">All severity</option>
                 <option value="info">Info</option>
                 <option value="warning">Warning</option>
                 <option value="error">Error</option>
                 <option value="critical">Critical</option>
               </select>
             </div>
             
             <div>
               <label className="block text-sm font-medium mb-1">Start Date</label>
               <input
                 type="date"
                 value={filters.startDate}
                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('startDate', e.target.value)}
                 className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('endDate', e.target.value)}
                                 className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
               />
             </div>
             
             <div className="flex items-end">
               <button 
                 onClick={clearFilters} 
                 className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

                 {/* Log Statistics */}
         {logs.length > 0 && (
           <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4 mb-6`}>
             <h4 className="text-md font-semibold mb-3">📈 Log Statistics</h4>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
               <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} p-3 rounded`}>
                 <div className="font-medium">Total Logs</div>
                 <div className="text-2xl font-bold text-blue-600">{logs.length}</div>
               </div>
               <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} p-3 rounded`}>
                 <div className="font-medium">Login Actions</div>
                 <div className="text-2xl font-bold text-green-600">
                   {logs.filter(log => log.action === 'login').length}
                 </div>
               </div>
               <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} p-3 rounded`}>
                 <div className="font-medium">Order Actions</div>
                 <div className="text-2xl font-bold text-purple-600">
                   {logs.filter(log => log.resource === 'order').length}
                 </div>
               </div>
               <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} p-3 rounded`}>
                 <div className="font-medium">User Actions</div>
                 <div className="text-2xl font-bold text-orange-600">
                   {logs.filter(log => log.resource === 'user').length}
                 </div>
               </div>
             </div>
           </div>
         )}

         {/* Logs Table */}
         <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
           <h3 className="text-lg font-semibold mb-2">Activity Logs</h3>
                        <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
               📊 Showing {logs.length} logs {pagination.total > 0 && `(Total: ${pagination.total})`}
               {pagination.hasMore && ' - Scroll down to load more'}
             </p>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading logs...</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                     <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Timestamp</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Action</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Resource</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Severity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">IP Address</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Duration</th>
                    </tr>
                  </thead>
                                     <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    {logs.map((log) => (
                      <tr key={log._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                                                 <td className="px-6 py-4 whitespace-nowrap">
                           <div>
                             <div className="font-medium">{log.username === 'unknown' ? 'System' : log.username}</div>
                             <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{log.userRole}</div>
                           </div>
                         </td>
                                                 <td className="px-6 py-4 whitespace-nowrap">
                           <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                             {formatActionName(log.action)}
                           </span>
                         </td>
                                                 <td className="px-6 py-4 whitespace-nowrap">
                           <div>
                             <div className="font-medium capitalize">{log.resource}</div>
                             {log.resourceId && (
                               <div className={`text-sm font-mono ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                 {log.resourceId.substring(0, 8)}...
                               </div>
                             )}
                             {log.details && (
                               <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                 {log.details.orderId && `Order: ${log.details.orderId}`}
                                 {log.details.poNumber && `PO: ${log.details.poNumber}`}
                                 {log.details.username && `User: ${log.details.username}`}
                                 {log.details.pathname && `Page: ${log.details.pathname}`}
                                 {log.details.labName && `Lab: ${log.details.labName}`}
                                 {log.details.partyName && `Party: ${log.details.partyName}`}
                                 {log.details.qualityName && `Quality: ${log.details.qualityName}`}
                                 {log.details.reason && `Reason: ${log.details.reason}`}
                               </div>
                             )}
                           </div>
                         </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${log.success ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                            {log.success ? 'Success' : 'Failed'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(log.severity)}`}>
                            {log.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                          {log.ipAddress || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {log.duration ? `${log.duration}ms` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

                             {/* Infinite Scroll Load More */}
               {pagination.hasMore && (
                 <div className="flex items-center justify-center mt-4">
                   <button
                     onClick={loadMore}
                     disabled={loadingMore}
                     className={`px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
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
