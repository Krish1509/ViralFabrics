'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { 
  ShoppingBagIcon, 
  UsersIcon, 
  BuildingOfficeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { Order, Party } from '@/types';
import { useDarkMode } from '../hooks/useDarkMode';
import { BRAND_NAME, BRAND_SHORT_NAME } from '@/lib/config';


// Cache for dashboard data
const dashboardCache = {
  data: null as any,
  timestamp: 0,
  ttl: 120000 // 2 minutes cache for better performance
};

export default function DashboardPage() {
  const { isDarkMode, mounted } = useDarkMode();
  const [orders, setOrders] = useState<Order[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Optimized data fetching with caching and preloading
  const fetchData = useCallback(async (isRetry = false) => {
    try {
      if (isRetry) {
        setIsRetrying(true);
        setError(null);
      }

      // Check cache first (skip cache on retry)
      if (!isRetry) {
        const now = Date.now();
        if (dashboardCache.data && (now - dashboardCache.timestamp) < dashboardCache.ttl) {
          setOrders(dashboardCache.data.orders || []);
          setParties(dashboardCache.data.parties || []);
          setLoading(false);
          return;
        }
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found');
        setLoading(false);
        return;
      }

      // Use AbortController for timeout with increased timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased to 10s timeout

      // Optimized parallel requests with minimal limits for instant loading
      const [ordersResponse, partiesResponse] = await Promise.all([
        fetch('/api/orders?limit=10', { // Minimal limit for instant loading
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'max-age=120' // 2 minutes cache for better performance
          },
          signal: controller.signal
        }),
        fetch('/api/parties?limit=5', { // Minimal limit for instant loading
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'max-age=120' // 2 minutes cache for better performance
          },
          signal: controller.signal
        })
      ]);

      clearTimeout(timeoutId);

      const ordersData = await ordersResponse.json();
      const partiesData = await partiesResponse.json();

      if (ordersData.success) {
        setOrders(ordersData.data || []);
      }
      if (partiesData.success) {
        setParties(partiesData.data || []);
      }

      // Cache the data
      dashboardCache.data = {
        orders: ordersData.data || [],
        parties: partiesData.data || []
      };
      dashboardCache.timestamp = Date.now();

    } catch (error: any) {
      if (error.name === 'AbortError') {
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);
        
        if (newRetryCount < 3) {
          // Auto-retry on timeout
          // Dashboard: Auto-retrying due to timeout
          setTimeout(() => fetchData(true), 1000);
          return;
        } else {
          setError('Request timeout after multiple attempts. Please try again.');
        }
      } else {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  }, [retryCount]);

  // Fetch data on component mount with optimized loading
  useEffect(() => {
    // Check if we have cached data first
    const now = Date.now();
    if (dashboardCache.data && (now - dashboardCache.timestamp) < dashboardCache.ttl) {
      setOrders(dashboardCache.data.orders || []);
      setParties(dashboardCache.data.parties || []);
      setLoading(false);
    } else {
      fetchData();
    }
    
    // Fallback timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError('Loading timeout. Please refresh the page.');
      }
    }, 15000); // 15 second fallback timeout
    
    return () => clearTimeout(timeoutId);
  }, [fetchData, loading]);

  // Memoized calculations for better performance
  const orderStats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(order => {
      const now = new Date();
      return now <= new Date(order.arrivalDate || '');
    }).length;
    const arrived = orders.filter(order => {
      const now = new Date();
      return now > new Date(order.arrivalDate || '') && 
             (!order.deliveryDate || now <= new Date(order.deliveryDate));
    }).length;
    const delivered = orders.filter(order => {
      const now = new Date();
      return order.deliveryDate && now > new Date(order.deliveryDate || '');
    }).length;

    return { total, pending, arrived, delivered };
  }, [orders]);

  const monthlyStats = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const monthlyData = months.map((month, index) => {
      const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.arrivalDate || '');
        return orderDate.getFullYear() === currentYear && orderDate.getMonth() === index;
      });
      return {
        month,
        orders: monthOrders.length,
        dying: monthOrders.filter(o => o.orderType === 'Dying').length,
        printing: monthOrders.filter(o => o.orderType === 'Printing').length
      };
    });
    return monthlyData;
  }, [orders]);

  const orderTypeStats = useMemo(() => {
    const dying = orders.filter(order => order.orderType === 'Dying').length;
    const printing = orders.filter(order => order.orderType === 'Printing').length;
    return { dying, printing };
  }, [orders]);

  const recentActivity = useMemo(() => {
    const now = new Date();
    const last7Days = orders.filter(order => {
      const orderDate = new Date(order.arrivalDate || '');
      const diffTime = Math.abs(now.getTime() - orderDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }).length;

    const last30Days = orders.filter(order => {
      const orderDate = new Date(order.arrivalDate || '');
      const diffTime = Math.abs(now.getTime() - orderDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    }).length;

    return { last7Days, last30Days };
  }, [orders]);

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-6">
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`p-6 rounded-2xl border animate-pulse ${
            isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className={`h-4 w-20 rounded ${
                  isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                }`}></div>
                <div className={`h-8 w-16 rounded ${
                  isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                }`}></div>
              </div>
              <div className={`h-12 w-12 rounded-xl ${
                isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
              }`}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className={`p-6 rounded-2xl border animate-pulse ${
        isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className={`h-6 w-32 rounded mb-6 ${
          isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
        }`}></div>
        <div className="h-64 rounded ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
        }"></div>
      </div>
    </div>
  );

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Dashboard
            </h1>
            <p className={`mt-2 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Welcome to {BRAND_NAME} Admin Panel
            </p>
          </div>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Dashboard
            </h1>
            <p className={`mt-2 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Welcome to {BRAND_NAME} Admin Panel
            </p>
          </div>
        </div>
        
        <div className={`p-6 rounded-2xl border ${
          isDarkMode ? 'bg-red-900/20 border-red-500/30' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center">
            <ExclamationTriangleIcon className={`h-6 w-6 mr-3 ${
              isDarkMode ? 'text-red-400' : 'text-red-600'
            }`} />
            <div>
              <h3 className={`font-semibold ${
                isDarkMode ? 'text-red-400' : 'text-red-800'
              }`}>
                Error Loading Dashboard
              </h3>
              <p className={`mt-1 ${
                isDarkMode ? 'text-red-300' : 'text-red-700'
              }`}>
                {error}
              </p>
              <button
                onClick={() => fetchData(true)}
                disabled={isRetrying}
                className={`mt-3 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                } ${isRetrying ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isRetrying ? 'Retrying...' : 'Retry'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#1D293D]' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} shadow-sm border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className={`text-3xl font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Dashboard</h1>
                          <p className={`mt-1 text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                Welcome to your {BRAND_NAME} Dashboard
              </p>
          </div>
        </div>
      </div>

              {/* Stats Cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Orders */}
            <div className={`transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'} rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300`}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                    <ShoppingBagIcon className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className={`text-sm font-medium transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Total Orders</p>
                  <p className={`text-2xl font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{orderStats.total}</p>
                </div>
              </div>
            </div>

          {/* Pending Orders */}
          <div className={`transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'} rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-yellow-500/20' : 'bg-yellow-100'}`}>
                  <ClockIcon className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Pending</p>
                <p className={`text-2xl font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{orderStats.pending}</p>
              </div>
            </div>
          </div>

          {/* Arrived Orders */}
          <div className={`transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'} rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                  <ExclamationTriangleIcon className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Arrived</p>
                <p className={`text-2xl font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{orderStats.arrived}</p>
              </div>
            </div>
          </div>

          {/* Delivered Orders */}
          <div className={`transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'} rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-green-500/20' : 'bg-green-100'}`}>
                  <CheckCircleIcon className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Delivered</p>
                <p className={`text-2xl font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{orderStats.delivered}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Orders Chart */}
          <div className={`transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'} rounded-xl shadow-lg p-6`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Monthly Orders Trend
              </h3>
              <CalendarIcon className={`h-6 w-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <div className="space-y-4">
              {monthlyStats.map((data, index) => (
                <div key={data.month} className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {data.month}
                  </span>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {data.orders}
                      </span>
                    </div>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max((data.orders / Math.max(...monthlyStats.map(m => m.orders))) * 100, 5)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Type Distribution */}
          <div className={`transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'} rounded-xl shadow-lg p-6`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Order Type Distribution
              </h3>
              <ChartBarIcon className={`h-6 w-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <div className="space-y-6">
              {/* Dying Orders */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Dying</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {orderTypeStats.dying}
                  </span>
                  <div className="w-32 bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-red-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${orderStats.total > 0 ? (orderTypeStats.dying / orderStats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {orderStats.total > 0 ? Math.round((orderTypeStats.dying / orderStats.total) * 100) : 0}%
                  </span>
                </div>
              </div>

              {/* Printing Orders */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Printing</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {orderTypeStats.printing}
                  </span>
                  <div className="w-32 bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${orderStats.total > 0 ? (orderTypeStats.printing / orderStats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {orderStats.total > 0 ? Math.round((orderTypeStats.printing / orderStats.total) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className={`transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'} rounded-xl shadow-lg p-6`}>
            <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Recent Activity
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Last 7 days</span>
                <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {recentActivity.last7Days} orders
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Last 30 days</span>
                <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {recentActivity.last30Days} orders
                </span>
              </div>
            </div>
          </div>

          <div className={`transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'} rounded-xl shadow-lg p-6`}>
            <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              System Overview
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total Parties</span>
                <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {parties.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Completion Rate</span>
                <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {orderStats.total > 0 ? Math.round((orderStats.delivered / orderStats.total) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Orders Management */}
          <Link href="/orders" className="group">
            <div className={`transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border border-slate-700 hover:bg-slate-700' : 'bg-white border border-gray-200 hover:bg-gray-50'} rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 cursor-pointer`}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-blue-500/20 group-hover:bg-blue-500/30' : 'bg-blue-100 group-hover:bg-blue-200'}`}>
                    <ShoppingBagIcon className="h-8 w-8 text-blue-600 group-hover:text-blue-700" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className={`text-lg font-medium transition-colors duration-300 ${isDarkMode ? 'text-white group-hover:text-blue-400' : 'text-gray-900 group-hover:text-blue-600'}`}>
                    Manage Orders
                  </h3>
                  <p className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Create, edit, and track orders
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {/* Parties Management */}
          <Link href="/parties" className="group">
            <div className={`transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border border-slate-700 hover:bg-slate-700' : 'bg-white border border-gray-200 hover:bg-gray-50'} rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 cursor-pointer`}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-green-500/20 group-hover:bg-green-500/30' : 'bg-green-100 group-hover:bg-green-200'}`}>
                    <BuildingOfficeIcon className="h-8 w-8 text-green-600 group-hover:text-green-700" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className={`text-lg font-medium transition-colors duration-300 ${isDarkMode ? 'text-white group-hover:text-green-400' : 'text-gray-900 group-hover:text-green-600'}`}>
                    Manage Parties
                  </h3>
                  <p className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    {parties.length} parties in system
                      </p>
                </div>
              </div>
            </div>
          </Link>

          {/* Users Management */}
          <Link href="/users" className="group">
            <div className={`transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border border-slate-700 hover:bg-slate-700' : 'bg-white border border-gray-200 hover:bg-gray-50'} rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 cursor-pointer`}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-purple-500/20 group-hover:bg-purple-500/30' : 'bg-purple-100 group-hover:bg-purple-200'}`}>
                    <UsersIcon className="h-8 w-8 text-purple-600 group-hover:text-purple-700" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className={`text-lg font-medium transition-colors duration-300 ${isDarkMode ? 'text-white group-hover:text-purple-400' : 'text-gray-900 group-hover:text-purple-600'}`}>
                    User Management
                  </h3>
                  <p className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Manage system users
                  </p>
                </div>
              </div>
            </div>
          </Link>


        </div>

        {/* Recent Orders */}
        {orders.length > 0 && (
          <div className="mt-8">
            <div className={`transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'} rounded-xl shadow-lg`}>
              <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Recent Orders</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className={`${isDarkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        Order ID
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        Type
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        Arrival Date
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`${isDarkMode ? 'bg-slate-800 divide-slate-700' : 'bg-white divide-gray-200'}`}>
                    {orders.slice(0, 5).map((order) => {
                      const status = (() => {
                        const now = new Date();
                        if (order.deliveryDate && now > new Date(order.deliveryDate)) return 'Delivered';
                        if (order.arrivalDate && now > new Date(order.arrivalDate)) return 'Arrived';
                        return 'Pending';
                      })();

                      const statusColor = (() => {
                        switch (status) {
                          case 'Delivered': return isDarkMode ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-800';
                          case 'Arrived': return isDarkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-800';
                          case 'Pending': return isDarkMode ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-800';
                          default: return isDarkMode ? 'bg-gray-900/50 text-gray-400' : 'bg-gray-100 text-gray-800';
                        }
                      })();

                      return (
                        <tr key={order._id} className={`transition-colors duration-300 ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-50'}`}>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {order.orderId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              order.orderType === 'Dying'
                                ? isDarkMode ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-800'
                                : isDarkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {order.orderType}
                            </span>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                            {new Date(order.arrivalDate || '').toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {orders.length > 5 && (
                <div className={`px-6 py-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                  <Link 
                    href="/orders"
                    className={`text-sm font-medium transition-colors duration-300 ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
                  >
                    View all orders →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
