'use client';

import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense, memo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBagIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  TruckIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useDarkMode } from '../hooks/useDarkMode';
import MetricsCard from './components/MetricsCard';
import DashboardFilters from './components/DashboardFilters';

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

export default function DashboardPage() {
  const { isDarkMode, mounted } = useDarkMode();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({
    startDate: '',
    endDate: '',
    orderType: 'all',
    financialYear: 'all'
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view the dashboard');
        return;
      }

      // Super fast dashboard - only fetch essential stats
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500); // Reduced to 1.5 second timeout

      // Fetch only dashboard stats API (much faster than fetching all orders)
      const statsResponse = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'max-age=30' // Add caching
        },
        signal: controller.signal,
        cache: 'default'
      });

      clearTimeout(timeoutId);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        const dashboardStats = statsData.data || {};
        
        // Set the stats directly from API response
        setStats(dashboardStats);
        
        // Dashboard stats loaded successfully
      } else {
        if (statsResponse.status === 401) {
          setError('Authentication failed. Please log in again.');
          return;
        }
        const errorData = await statsResponse.json();
        setError(errorData.message || 'Failed to load dashboard stats');
        }

    } catch (error) {
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (mounted) {
      // Start loading immediately
      fetchDashboardData();
    }
  }, [mounted, fetchDashboardData]);

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
            <div className="flex items-center">
              <ExclamationTriangleIcon className={`w-5 h-5 mr-2 transition-colors duration-300 ${
                isDarkMode ? 'text-red-400' : 'text-red-600'
              }`} />
              <p className={`transition-colors duration-300 ${
                isDarkMode ? 'text-red-300' : 'text-red-800'
              }`}>{error}</p>
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
              value={stats.totalOrders}
              icon={ShoppingBagIcon}
              color="blue"
              subtitle="All time orders"
            />
            <MetricsCard
              title="Pending Orders"
              value={stats.statusStats.pending + stats.statusStats.not_set}
              icon={ClockIcon}
              color="yellow"
              subtitle="Awaiting processing"
            />
            <MetricsCard
              title="Completed Orders"
              value={stats.statusStats.completed + stats.statusStats.delivered}
              icon={CheckCircleIcon}
              color="green"
              subtitle="Successfully completed"
            />
          </div>
        )}

        {/* Simple Status Overview */}
        {stats && (
          <div className="mb-6 sm:mb-8">
            <div className={`rounded-lg border p-6 ${
              isDarkMode 
                ? 'bg-white/5 border-white/10' 
                : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Order Status Overview
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                  }`}>
                    {stats.statusStats.pending + stats.statusStats.not_set}
                  </div>
                  <div className={`text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Pending
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    {stats.statusStats.in_progress}
                  </div>
                  <div className={`text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    In Progress
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`}>
                    {stats.statusStats.completed}
                  </div>
                  <div className={`text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Completed
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`}>
                    {stats.statusStats.delivered}
                  </div>
                  <div className={`text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Delivered
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`}>
                    {stats.statusStats.cancelled}
                  </div>
                  <div className={`text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Cancelled
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {stats.statusStats.not_set}
                  </div>
                  <div className={`text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Not Set
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}