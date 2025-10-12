'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBagIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useDarkMode } from '../hooks/useDarkMode';
import MetricsCard from './components/MetricsCard';
import MetricsCardSkeleton from './components/MetricsCardSkeleton';
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
  financialYear: string;
}

// Ultra-fast client-side cache for dashboard data
const dashboardCache = {
  data: null as DashboardStats | null,
  timestamp: 0,
  ttl: 5 * 60 * 1000 // 5 minutes for ultra-fast loading
};

export default function DashboardPage() {
  const { isDarkMode, mounted } = useDarkMode();
  const router = useRouter();
  
  // Load cached data immediately for instant display
  const [stats, setStats] = useState<DashboardStats | null>(() => {
    try {
      const cached = localStorage.getItem('dashboard-stats-cache');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 300000) { // 5 minutes
          return data;
        }
      }
    } catch (e) {
      // Ignore localStorage errors
    }
    
    // Return default data structure to prevent "No data found" messages
    return {
      totalOrders: 0,
      statusStats: { pending: 0, in_progress: 0, completed: 0, delivered: 0, cancelled: 0, not_set: 0 },
      typeStats: { Dying: 0, Printing: 0, not_set: 0 },
      pendingTypeStats: { Dying: 0, Printing: 0, not_set: 0 },
      deliveredTypeStats: { Dying: 0, Printing: 0, not_set: 0 },
      monthlyTrends: [],
      recentOrders: []
    };
  });
  
  const [loading, setLoading] = useState(false); // Never show loading since we always have default data
  const [error, setError] = useState<string | null>(null);
  // Success message state removed - no validation messages shown
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [isInitialDataFetch, setIsInitialDataFetch] = useState(() => {
    // If we have cached data, don't show skeleton
    try {
      const cached = localStorage.getItem('dashboard-stats-cache');
      if (cached) {
        const { timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 300000) { // 5 minutes
          return false; // We have valid cached data, no skeleton needed
        }
      }
    } catch (e) {
      // Ignore localStorage errors
    }
    return true; // No cached data, show skeleton
  }); // Track initial data fetch for pie chart skeletons
  const [isBackgroundRetry, setIsBackgroundRetry] = useState(false);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [filterProcessingDelay, setFilterProcessingDelay] = useState(false);
  const [filters, setFilters] = useState<DashboardFilters>({
    startDate: '',
    endDate: '',
    financialYear: 'all'
  });

  // Navigation functions for metrics cards
  const navigateToOrders = useCallback((statusFilter: string) => {
    console.log('🔧 Dashboard navigation - statusFilter:', statusFilter);
    console.log('🔧 Dashboard navigation - statusFilter type:', typeof statusFilter);
    
    // Build the URL with proper status parameter
    let url = '/orders';
    
    // Always add status parameter except for 'all'
    if (statusFilter && statusFilter !== 'all') {
      url = `/orders`;
      console.log('🔧 Dashboard navigation - Added status parameter:', statusFilter);
    } else {
      console.log('🔧 Dashboard navigation - All orders (no status filter)');
    }
    
    console.log('🔧 Dashboard navigation - final URL:', url);
    console.log('🔧 Dashboard navigation - About to navigate to:', url);
    
    // Use window.location for more reliable navigation
    window.location.href = url;
  }, []);

  const handleTotalOrdersClick = useCallback(() => {
    console.log('🔧 Total Orders card clicked!');
    window.location.href = '/orders';
  }, []);

  const handlePendingOrdersClick = useCallback(() => {
    console.log('🔧 Pending Orders card clicked!');
    window.location.href = '/orders';
  }, []);

  const handleDeliveredOrdersClick = useCallback(() => {
    console.log('🔧 Delivered Orders card clicked!');
    window.location.href = '/orders';
  }, []);

  const fetchDashboardData = useCallback(async (isRetry = false, currentFilters = filters) => {
    try {
      // Ultra-fast cache check - load from cache immediately if available
      if (!isRetry && dashboardCache.data && (Date.now() - dashboardCache.timestamp) < dashboardCache.ttl) {
        setStats(dashboardCache.data);
        setHasAttemptedFetch(true);
        setIsInitialDataFetch(false); // Data loaded from cache, no skeleton needed
        setLoading(false);
        return; // Instant load from cache
      }

      // Never show loading since we always have default data
      // if (!isRetry) {
      //   setLoading(true);
      // }
      setError(null);
      
      // No authentication needed for instant API

      // Fast timeout for quick loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout for fast loading

      // Build query parameters for filters
      const queryParams = new URLSearchParams();
      if (currentFilters.startDate) queryParams.append('startDate', currentFilters.startDate);
      if (currentFilters.endDate) queryParams.append('endDate', currentFilters.endDate);
      if (currentFilters.financialYear && currentFilters.financialYear !== 'all') {
        queryParams.append('financialYear', currentFilters.financialYear);
      }

      // Use instant API endpoint for immediate loading
      const apiUrl = `/api/dashboard/stats-instant${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const statsResponse = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json'
        },
        signal: controller.signal,
        cache: 'default' // Use browser cache for speed
      });

      clearTimeout(timeoutId);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success && statsData.data) {
          // Cache the data for instant future loads
          dashboardCache.data = statsData.data;
          dashboardCache.timestamp = Date.now();
          
          // Also save to localStorage for instant loading on page refresh
          try {
            localStorage.setItem('dashboard-stats-cache', JSON.stringify({
              data: statsData.data,
              timestamp: Date.now()
            }));
          } catch (e) {
            // Ignore localStorage errors
          }
          
          setStats(statsData.data);
          setHasAttemptedFetch(true);
          setIsInitialDataFetch(false); // Data has been fetched, no more skeleton needed
        } else {
          // Show cached data if available, no error messages
          if (dashboardCache.data) {
            setStats(dashboardCache.data);
          }
          setHasAttemptedFetch(true);
        }
      } else {
        if (statsResponse.status === 401) {
          // Silent redirect to login
          setTimeout(() => window.location.href = '/login', 1000);
          return;
        } else {
          // Show cached data if available, no error messages
          if (dashboardCache.data) {
            setStats(dashboardCache.data);
          }
          setHasAttemptedFetch(true);
        }
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Show cached data if available, otherwise show empty state
        if (dashboardCache.data) {
          setStats(dashboardCache.data);
        } else {
          setStats({
            totalOrders: 0,
            statusStats: { pending: 0, in_progress: 0, completed: 0, delivered: 0, cancelled: 0, not_set: 0 },
            typeStats: { Dying: 0, Printing: 0, not_set: 0 },
            pendingTypeStats: { Dying: 0, Printing: 0, not_set: 0 },
            deliveredTypeStats: { Dying: 0, Printing: 0, not_set: 0 },
            monthlyTrends: [],
            recentOrders: []
          });
        }
        setHasAttemptedFetch(true);
        
        // Silent background retry - no error messages
        if (!isBackgroundRetry) {
          setIsBackgroundRetry(true);
          setTimeout(() => fetchDashboardData(true), 2000);
        }
      } else {
        // Show cached data if available, no error messages
        if (dashboardCache.data) {
          setStats(dashboardCache.data);
        }
        setHasAttemptedFetch(true);
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (mounted && !hasAttemptedFetch) {
      // Start loading immediately only if we haven't attempted yet
      fetchDashboardData();
    }
  }, [mounted, hasAttemptedFetch, fetchDashboardData]);

  // Focus event listener removed for ultra-fast loading

  const handleFiltersChange = useCallback(async (newFilters: DashboardFilters) => {
    setFilters(newFilters);
    setIsFilterLoading(true);
    setFilterProcessingDelay(true);
    
    // Clear cache and fetch new data with filters
    dashboardCache.data = null;
    dashboardCache.timestamp = 0;
    
    try {
      // Add a minimum delay to show loading state
      const [dataResult] = await Promise.all([
        fetchDashboardData(false, newFilters),
        new Promise(resolve => setTimeout(resolve, 2000)) // Minimum 2 second delay
      ]);
    } finally {
      setIsFilterLoading(false);
      // Keep the processing delay for a bit longer to show loading in pie charts
      setTimeout(() => {
        setFilterProcessingDelay(false);
      }, 3000); // Additional 3 seconds for pie charts
    }
  }, [fetchDashboardData]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // No main loading skeleton - components handle their own loading states

  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">

        {/* Success Message removed - no validation messages shown */}

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
          loading={isFilterLoading}
        />

        {/* Metrics Cards - Updated */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {isInitialDataFetch ? (
            // Show skeleton loaders during initial data fetch
            <>
              <MetricsCardSkeleton />
              <MetricsCardSkeleton />
              <MetricsCardSkeleton />
            </>
          ) : (
            // Show actual data once loaded
            <>
              <div className="animate-fade-in">
                <MetricsCard
                  title="Total Orders"
                  value={stats?.totalOrders || 0}
                  icon={ShoppingBagIcon}
                  color="blue"
                  subtitle="All time orders"
                  onClick={handleTotalOrdersClick}
                />
              </div>
              <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <MetricsCard
                  title="Pending Orders"
                  value={(stats?.statusStats?.pending || 0) + (stats?.statusStats?.not_set || 0)}
                  icon={ClockIcon}
                  color="yellow"
                  subtitle="Awaiting processing"
                  onClick={handlePendingOrdersClick}
                />
              </div>
              <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <MetricsCard
                  title="Delivered Orders"
                  value={(stats?.statusStats?.completed || 0) + (stats?.statusStats?.delivered || 0)}
                  icon={CheckCircleIcon}
                  color="green"
                  subtitle="Successfully delivered"
                  onClick={handleDeliveredOrdersClick}
                />
              </div>
            </>
          )}
        </div>


        {/* Enhanced Pie Charts Section */}
        <div className="mb-12">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
            {/* Pending Orders Pie Chart */}
            <div className="transform hover:scale-105 transition-transform duration-300 animate-fade-in">
              <PieChart
                data={[
                  {
                    name: 'Dying',
                    value: stats?.pendingTypeStats?.Dying || 0,
                    color: '#F97316' // Orange
                  },
                  {
                    name: 'Printing',
                    value: stats?.pendingTypeStats?.Printing || 0,
                    color: '#3B82F6' // Blue
                  },
                  {
                    name: 'Not Set',
                    value: stats?.pendingTypeStats?.not_set || 0,
                    color: '#6B7280' // Gray
                  }
                ]}
                title="Pending Orders by Type"
                icon={ClockIcon}
                total={(stats?.pendingTypeStats?.Dying || 0) + (stats?.pendingTypeStats?.Printing || 0) + (stats?.pendingTypeStats?.not_set || 0)}
                isDarkMode={isDarkMode}
                isLoading={isInitialDataFetch || isFilterLoading || filterProcessingDelay}
                showEmptyStateDelay={500} // 0.5 second delay for faster UX
              />
            </div>

            {/* Delivered Orders Pie Chart */}
            <div className="transform hover:scale-105 transition-transform duration-300 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <PieChart
                data={[
                  {
                    name: 'Dying',
                    value: stats?.deliveredTypeStats?.Dying || 0,
                    color: '#F97316' // Orange
                  },
                  {
                    name: 'Printing',
                    value: stats?.deliveredTypeStats?.Printing || 0,
                    color: '#3B82F6' // Blue
                  },
                  {
                    name: 'Not Set',
                    value: stats?.deliveredTypeStats?.not_set || 0,
                    color: '#6B7280' // Gray
                  }
                ]}
                title="Delivered Orders by Type"
                icon={CheckCircleIcon}
                total={(stats?.deliveredTypeStats?.Dying || 0) + (stats?.deliveredTypeStats?.Printing || 0) + (stats?.deliveredTypeStats?.not_set || 0)}
                isDarkMode={isDarkMode}
                isLoading={isInitialDataFetch || isFilterLoading || filterProcessingDelay}
                showEmptyStateDelay={500} // 0.5 second delay for faster UX
              />
            </div>
          </div>
        </div>

        {/* Delivered Soon Table */}
        <div className="mb-6 sm:mb-8">
          <DeliveredSoonTable isDarkMode={isDarkMode} />
        </div>

        </div>
      </div>
    </ErrorBoundary>
  );
}