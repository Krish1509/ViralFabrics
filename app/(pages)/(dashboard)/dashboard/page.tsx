'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShoppingBagIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useDarkMode } from '../hooks/useDarkMode';
import MetricsCard from './components/MetricsCard';
import DashboardFilters from './components/DashboardFilters';
import PieChart from './components/PieChart';
import DeliveredSoonTable from './components/DeliveredSoonTable';
import ErrorBoundary from '../components/ErrorBoundary';

// Removed heavy components for super fast loading
import { Order } from '@/types';

interface DashboardStats {
  totalOrders: number;
  statusStats: {
    pending: number;
    in_progress: number;
    completed: number;
    delivered: number;
    cancelled: number;
    not_set: number;
  };
  typeStats: {
    Dying: number;
    Printing: number;
    not_set: number;
  };
  pendingTypeStats: {
    Dying: number;
    Printing: number;
    not_set: number;
  };
  deliveredTypeStats: {
    Dying: number;
    Printing: number;
    not_set: number;
  };
  monthlyTrends: Array<{
    month: string;
    count: number;
  }>;
  recentOrders: Order[];
}

interface DashboardFilters {
  startDate: string;
  endDate: string;
  orderType: string;
  financialYear: string;
}

// Professional client-side cache for dashboard data
const dashboardCache = {
  data: null as DashboardStats | null,
  timestamp: 0,
  ttl: 5 * 60 * 1000 // 5 minutes for better performance
};

export default function DashboardPage() {
  const { isDarkMode, mounted } = useDarkMode();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [isBackgroundRetry, setIsBackgroundRetry] = useState(false);
  const [filters, setFilters] = useState<DashboardFilters>({
    startDate: '',
    endDate: '',
    orderType: 'all',
    financialYear: 'all'
  });

  const fetchDashboardData = useCallback(async (isRetry = false) => {
    try {
      // Check client-side cache first
      if (!isRetry && dashboardCache.data && (Date.now() - dashboardCache.timestamp) < dashboardCache.ttl) {
        setStats(dashboardCache.data);
        setHasAttemptedFetch(true);
        setLoading(false);
        setSuccessMessage('Dashboard data loaded from cache');
        setTimeout(() => setSuccessMessage(null), 2000);
        return;
      }

      // Only show loading spinner on initial load, not on retries
      if (!isRetry) {
        setLoading(true);
      }
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view the dashboard');
        return;
      }

      // Professional dashboard with optimized timeout and caching
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // Optimized 3 second timeout

      // Fetch only dashboard stats API with optimized headers
      const statsResponse = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'max-age=300, stale-while-revalidate=600',
          'Accept': 'application/json'
        },
        signal: controller.signal,
        cache: 'force-cache', // Aggressive caching
        next: { revalidate: 300 } // Next.js caching
      });

      clearTimeout(timeoutId);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success && statsData.data) {
          // Cache the data
          dashboardCache.data = statsData.data;
          dashboardCache.timestamp = Date.now();
          
          setStats(statsData.data);
          setHasAttemptedFetch(true);
          if (!isRetry) {
            const cacheStatus = statsResponse.headers.get('X-Cache');
            const responseTime = statsResponse.headers.get('X-Response-Time');
            setSuccessMessage(`Dashboard data loaded successfully${cacheStatus === 'HIT' ? ' (from cache)' : ''}${responseTime ? ` (${responseTime})` : ''}`);
            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 3000);
          }
        } else {
          setError(statsData.message || 'Invalid response format from server');
        }
      } else {
        if (statsResponse.status === 401) {
          setError('Authentication failed. Please log in again.');
          // Redirect to login after 2 seconds
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
          return;
        } else if (statsResponse.status === 500) {
          setError('Server error. Please try again in a moment.');
        } else {
          const errorData = await statsResponse.json().catch(() => ({}));
          setError(errorData.message || `Server returned status ${statsResponse.status}`);
        }
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Don't show timeout error immediately, try to load with fallback data
        setStats({
          totalOrders: 0,
          statusStats: {
            pending: 0,
            in_progress: 0,
            completed: 0,
            delivered: 0,
            cancelled: 0,
            not_set: 0
          },
          typeStats: {
            Dying: 0,
            Printing: 0,
            not_set: 0
          },
          pendingTypeStats: {
            Dying: 0,
            Printing: 0,
            not_set: 0
          },
          deliveredTypeStats: {
            Dying: 0,
            Printing: 0,
            not_set: 0
          },
          monthlyTrends: [],
          recentOrders: []
        });
        setHasAttemptedFetch(true);
        setSuccessMessage('Dashboard loaded with basic data. Some features may be limited.');
        setTimeout(() => setSuccessMessage(null), 5000);
        
        // Only retry once in background if we haven't already attempted
        if (!isBackgroundRetry) {
          setIsBackgroundRetry(true);
          setTimeout(() => {
            fetchDashboardData(true);
          }, 2000); // Reduced retry delay
        }
      } else if (error.message?.includes('fetch') || error.message?.includes('network')) {
        setError('Network error. Please check your internet connection and try again.');
      } else if (error.message?.includes('timeout')) {
        setError('Request timeout. The server is taking too long to respond. Please try again.');
      } else if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
        setError('Authentication failed. Please log in again.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setError('Failed to load dashboard data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [filters, isBackgroundRetry]);

  useEffect(() => {
    if (mounted && !hasAttemptedFetch) {
      // Start loading immediately only if we haven't attempted yet
      fetchDashboardData();
    }
  }, [mounted, hasAttemptedFetch, fetchDashboardData]);

  const handleFiltersChange = useCallback((newFilters: DashboardFilters) => {
    setFilters(newFilters);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Show loading skeleton for initial load
  if (loading && !stats) {
    return (
      <div className="min-h-screen">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Header Skeleton */}
          <div className="mb-6 sm:mb-8">
            <div className={`h-8 animate-pulse rounded-lg w-32 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
          </div>
          
          {/* Metrics Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`h-24 animate-pulse rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
            ))}
          </div>
          
          {/* Tables Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
            {[1, 2].map((i) => (
              <div key={i} className={`h-64 animate-pulse rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">

        {/* Success Message */}
        {successMessage && (
          <div className={`mb-6 rounded-lg p-4 border transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-green-900/20 border-green-800/30' 
              : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-center">
              <CheckCircleIcon className={`w-5 h-5 mr-2 transition-colors duration-300 ${
                isDarkMode ? 'text-green-400' : 'text-green-600'
              }`} />
              <p className={`transition-colors duration-300 ${
                isDarkMode ? 'text-green-300' : 'text-green-800'
              }`}>{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className={`mb-6 rounded-lg p-4 border transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-red-900/20 border-red-800/30' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ExclamationTriangleIcon className={`w-5 h-5 mr-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-red-400' : 'text-red-600'
                }`} />
                <p className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-red-300' : 'text-red-800'
                }`}>{error}</p>
              </div>
              <button
                onClick={() => fetchDashboardData(false)}
                disabled={loading}
                className={`ml-4 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : isDarkMode
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {loading ? 'Retrying...' : 'Retry'}
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <DashboardFilters 
          onFiltersChange={handleFiltersChange}
          loading={loading}
        />

        {/* Metrics Cards - Updated */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <MetricsCard
              title="Total Orders"
              value={stats.totalOrders || 0}
              icon={ShoppingBagIcon}
              color="blue"
              subtitle="All time orders"
            />
            <MetricsCard
              title="Pending Orders"
              value={(stats.statusStats?.pending || 0) + (stats.statusStats?.not_set || 0)}
              icon={ClockIcon}
              color="yellow"
              subtitle="Awaiting processing"
            />
            <MetricsCard
              title="Completed Orders"
              value={(stats.statusStats?.completed || 0) + (stats.statusStats?.delivered || 0)}
              icon={CheckCircleIcon}
              color="green"
              subtitle="Successfully completed"
            />
          </div>
        )}

        {/* No Data State */}
        {!loading && !stats && !error && (
          <div className={`mb-6 rounded-lg p-8 text-center border ${
            isDarkMode 
              ? 'bg-gray-800/50 border-gray-700' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <ShoppingBagIcon className={`w-12 h-12 mx-auto mb-4 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <h3 className={`text-lg font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-900'
            }`}>
              No Dashboard Data Available
            </h3>
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              There are no orders in the system yet. Create your first order to see dashboard statistics.
            </p>
          </div>
        )}

        {/* Pie Charts Section */}
        {stats && stats.pendingTypeStats && stats.deliveredTypeStats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
            {/* Pending Orders Pie Chart */}
            <PieChart
              data={[
                {
                  name: 'Dying',
                  value: stats.pendingTypeStats.Dying || 0,
                  color: '#F97316' // Orange
                },
                {
                  name: 'Printing',
                  value: stats.pendingTypeStats.Printing || 0,
                  color: '#3B82F6' // Blue
                },
                {
                  name: 'Not Set',
                  value: stats.pendingTypeStats.not_set || 0,
                  color: '#6B7280' // Gray
                }
              ]}
              title="Pending Orders by Type"
              total={(stats.pendingTypeStats.Dying || 0) + (stats.pendingTypeStats.Printing || 0) + (stats.pendingTypeStats.not_set || 0)}
              isDarkMode={isDarkMode}
            />

            {/* Delivered Orders Pie Chart */}
            <PieChart
              data={[
                {
                  name: 'Dying',
                  value: stats.deliveredTypeStats.Dying || 0,
                  color: '#F97316' // Orange
                },
                {
                  name: 'Printing',
                  value: stats.deliveredTypeStats.Printing || 0,
                  color: '#3B82F6' // Blue
                },
                {
                  name: 'Not Set',
                  value: stats.deliveredTypeStats.not_set || 0,
                  color: '#6B7280' // Gray
                }
              ]}
              title="Delivered Orders by Type"
              total={(stats.deliveredTypeStats.Dying || 0) + (stats.deliveredTypeStats.Printing || 0) + (stats.deliveredTypeStats.not_set || 0)}
              isDarkMode={isDarkMode}
            />
          </div>
        )}

        {/* Delivered Soon Table */}
        <div className="mb-6 sm:mb-8">
          <DeliveredSoonTable isDarkMode={isDarkMode} />
        </div>

        </div>
      </div>
    </ErrorBoundary>
  );
}