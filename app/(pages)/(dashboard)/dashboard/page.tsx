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

// Lazy load heavy components for better performance with aggressive optimization
const OrderTrendsChart = lazy(() => import('./components/OrderTrendsChart'));
const OrderTypeChart = lazy(() => import('./components/OrderTypeChart'));
const StatusChart = lazy(() => import('./components/StatusChart'));
const RecentActivity = lazy(() => import('./components/RecentActivity'));

// Lazy load even more components to reduce initial bundle size
const OrdersTable = lazy(() => import('./components/OrdersTable'));
const UpcomingDeliveriesTable = lazy(() => import('./components/UpcomingDeliveriesTable'));
const EnhancedProfessionalPieChart = lazy(() => import('./components/EnhancedProfessionalPieChart'));
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
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [deliveredOrders, setDeliveredOrders] = useState<Order[]>([]);
  const [upcomingDeliveryOrders, setUpcomingDeliveryOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefreshing, setAutoRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loadedSections, setLoadedSections] = useState({
    tables: false,
    charts: false,
    activity: false
  });
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

      // Fetch all orders with aggressive optimization
      const allOrdersParams = new URLSearchParams();
      allOrdersParams.append('limit', '100'); // Much smaller limit for faster loading
      if (filters.orderType !== 'all') allOrdersParams.append('orderType', filters.orderType);

      // Add timeout for faster response
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const allOrdersResponse = await fetch(`/api/orders?${allOrdersParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (allOrdersResponse.ok) {
        const allOrdersData = await allOrdersResponse.json();
        let allOrders = allOrdersData.data || [];
        
        // Apply date filtering on client side
        if (filters.startDate || filters.endDate) {
          allOrders = allOrders.filter((order: Order) => {
            const orderDate = new Date(order.createdAt);
            const startDate = filters.startDate ? new Date(filters.startDate) : null;
            const endDate = filters.endDate ? new Date(filters.endDate) : null;
            
            if (startDate && orderDate < startDate) return false;
            if (endDate && orderDate > endDate) return false;
            return true;
          });
        }
        
        // Calculate statistics from all orders
        const totalOrders = allOrders.length;
        
        const statusStats = {
          pending: allOrders.filter((order: Order) => order.status === 'pending').length,
          in_progress: allOrders.filter((order: Order) => order.status === 'in_progress').length,
          completed: allOrders.filter((order: Order) => order.status === 'completed').length,
          delivered: allOrders.filter((order: Order) => order.status === 'delivered').length,
          cancelled: allOrders.filter((order: Order) => order.status === 'cancelled').length,
          not_set: allOrders.filter((order: Order) => !order.status || order.status === 'Not set' || order.status === 'Not selected').length
        };

        const typeStats = {
          Dying: allOrders.filter((order: Order) => order.orderType === 'Dying').length,
          Printing: allOrders.filter((order: Order) => order.orderType === 'Printing').length,
          not_set: allOrders.filter((order: Order) => !order.orderType).length
        };

        // Calculate type breakdown for pending orders
        const pendingOrdersForStats = allOrders.filter((order: Order) => 
          order.status === 'pending' || !order.status || order.status === 'Not set' || order.status === 'Not selected'
        );
        const pendingTypeStats = {
          Dying: pendingOrdersForStats.filter((order: Order) => order.orderType === 'Dying').length,
          Printing: pendingOrdersForStats.filter((order: Order) => order.orderType === 'Printing').length,
          not_set: pendingOrdersForStats.filter((order: Order) => !order.orderType).length
        };

        // Calculate type breakdown for delivered orders
        const deliveredOrdersForStats = allOrders.filter((order: Order) => 
          order.status === 'delivered' || order.status === 'completed'
        );
        const deliveredTypeStats = {
          Dying: deliveredOrdersForStats.filter((order: Order) => order.orderType === 'Dying').length,
          Printing: deliveredOrdersForStats.filter((order: Order) => order.orderType === 'Printing').length,
          not_set: deliveredOrdersForStats.filter((order: Order) => !order.orderType).length
        };

        // Calculate monthly trends (last 12 months)
        const monthlyTrends = [];
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const count = allOrders.filter((order: Order) => {
            const orderDate = new Date(order.createdAt);
            return orderDate.getFullYear() === date.getFullYear() && 
                   orderDate.getMonth() === date.getMonth();
          }).length;
          monthlyTrends.push({ month: monthStr, count });
        }

        setStats({
          totalOrders,
          statusStats,
          typeStats,
          pendingTypeStats,
          deliveredTypeStats,
          monthlyTrends,
          recentOrders: allOrders.slice(0, 5)
        });

        // Filter orders for tables with better logic
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Pending orders: orders that are pending, in progress, or not set
        const pendingOrders = allOrders.filter((order: Order) => {
          const status = order.status;
          const isPendingStatus = status === 'pending' || 
                                 status === 'in_progress' || 
                                 !status || 
                                 status === 'Not set' || 
                                 status === 'Not selected';
          
          // Apply order type filter if specified
          if (filters.orderType !== 'all' && order.orderType !== filters.orderType) {
            return false;
          }
          
          return isPendingStatus;
        }).map((order: Order) => ({
          ...order,
          // Normalize status display for pending orders
          status: (!order.status || order.status === 'Not set' || order.status === 'Not selected') 
            ? 'pending' 
            : order.status
        })).sort((a: Order, b: Order) => {
          // Sort by creation date (newest first)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }).slice(0, 5);
        
        // Remove unassigned orders - they're now included in pending

        // Delivered orders: orders that are completed or delivered
        const deliveredOrders = allOrders.filter((order: Order) => {
          const status = order.status;
          const isDeliveredStatus = status === 'delivered' || status === 'completed';
          
          // Apply order type filter if specified
          if (filters.orderType !== 'all' && order.orderType !== filters.orderType) {
            return false;
          }
          
          return isDeliveredStatus;
        }).sort((a: Order, b: Order) => {
          // Sort by delivery date (most recent first), then by creation date
          if (a.deliveryDate && b.deliveryDate) {
            return new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime();
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }).slice(0, 5);

        // Filter orders for upcoming deliveries (all future deliveries)

        const upcomingDeliveryOrders = allOrders.filter((order: Order) => {
          if (!order.deliveryDate) return false;
          
          const deliveryDate = new Date(order.deliveryDate);
          deliveryDate.setHours(0, 0, 0, 0);
          
          // Include orders with future delivery dates that are not yet delivered
          const status = order.status;
          const isNotDelivered = status !== 'delivered' && status !== 'completed';
          const isFutureDelivery = deliveryDate >= today;
          
          // Apply order type filter if specified
          if (filters.orderType !== 'all' && order.orderType !== filters.orderType) {
            return false;
          }
          
          return isNotDelivered && isFutureDelivery;
        }).sort((a: Order, b: Order) => {
          // Sort by delivery date (earliest first)
          if (a.deliveryDate && b.deliveryDate) {
            return new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime();
          }
          return 0;
        });

        setPendingOrders(pendingOrders);
        setDeliveredOrders(deliveredOrders);
        setUpcomingDeliveryOrders(upcomingDeliveryOrders);
      } else {
        if (allOrdersResponse.status === 401) {
          setError('Authentication failed. Please log in again.');
          return;
        }
        const errorData = await allOrdersResponse.json();
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
      
      // Progressive loading - load sections in stages
      const loadSections = () => {
        // Load tables first (most important)
        setTimeout(() => setLoadedSections(prev => ({ ...prev, tables: true })), 500);
        
        // Load charts second
        setTimeout(() => setLoadedSections(prev => ({ ...prev, charts: true })), 1000);
        
        // Load activity last
        setTimeout(() => setLoadedSections(prev => ({ ...prev, activity: true })), 1500);
      };
      
      loadSections();
    }
  }, [mounted, fetchDashboardData]);

  // Lazy load sections on scroll for better performance
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const section = entry.target.getAttribute('data-section');
            if (section) {
              setLoadedSections(prev => ({ ...prev, [section]: true }));
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    // Observe sections
    const tablesSection = document.querySelector('[data-section="tables"]');
    const chartsSection = document.querySelector('[data-section="charts"]');
    const activitySection = document.querySelector('[data-section="activity"]');

    if (tablesSection) observer.observe(tablesSection);
    if (chartsSection) observer.observe(chartsSection);
    if (activitySection) observer.observe(activitySection);

    return () => observer.disconnect();
  }, [mounted]);

  // Listen for order updates from other pages
  useEffect(() => {
    const handleOrderUpdate = (event: CustomEvent) => {
      // Show auto-refresh indicator
      setAutoRefreshing(true);
      setError(null); // Clear any previous errors
      // Refresh dashboard data when orders are updated
      fetchDashboardData().then(() => {
        setSuccessMessage('Dashboard updated successfully');
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      }).catch((error) => {
        setError('Failed to refresh dashboard data');
      }).finally(() => {
        setAutoRefreshing(false);
      });
    };

    // Add event listener for order updates
    window.addEventListener('orderUpdated', handleOrderUpdate as EventListener);

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener('orderUpdated', handleOrderUpdate as EventListener);
    };
  }, [mounted, fetchDashboardData]); // Include fetchDashboardData in dependencies

  const handleFiltersChange = useCallback((newFilters: DashboardFilters) => {
    setFilters(newFilters);
  }, []);

  const handleViewOrder = useCallback((order: Order) => {
    router.push(`/dashboard/orders/orderdetails?id=${order._id}`);
  }, [router]);

  const handleEditOrder = useCallback((order: Order) => {
    router.push(`/dashboard/orders?edit=${order._id}`);
  }, [router]);

  const handleManualRefresh = async () => {
    await fetchDashboardData();
  };

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

        {/* Professional Pie Charts Row */}
        {loadedSections.charts && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8" data-section="charts">
            {/* Pending Orders Pie Chart */}
            {stats && (
              <Suspense fallback={<div className={`h-64 animate-pulse rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}></div>}>
                <EnhancedProfessionalPieChart 
                  title="Pending Orders"
                  data={{
                    pending: stats.statusStats.pending + stats.statusStats.not_set,
                    in_progress: 0,
                    completed: 0,
                    delivered: 0,
                    cancelled: 0,
                    not_set: 0
                  }}
                  typeBreakdown={stats.pendingTypeStats}
                  loading={loading}
                  variant="pending"
                />
              </Suspense>
            )}

            {/* Delivered Orders Pie Chart */}
            {stats && (
              <Suspense fallback={<div className={`h-64 animate-pulse rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}></div>}>
                <EnhancedProfessionalPieChart 
                  title="Delivered Orders"
                  data={{
                    pending: 0,
                    in_progress: 0,
                    completed: 0,
                    delivered: stats.statusStats.delivered + stats.statusStats.completed,
                    cancelled: 0,
                    not_set: 0
                  }}
                  typeBreakdown={stats.deliveredTypeStats}
                  loading={loading}
                  variant="delivered"
                />
              </Suspense>
            )}
          </div>
        )}

        {/* Upcoming Deliveries Table */}
        {loadedSections.tables && (
          <div className="mb-6 sm:mb-8">
            <Suspense fallback={<div className={`h-64 animate-pulse rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}></div>}>
              <UpcomingDeliveriesTable
                orders={upcomingDeliveryOrders}
                title="Upcoming Deliveries"
                loading={loading}
              />
            </Suspense>
          </div>
        )}

        {/* Status Overview and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8" data-section="activity">
          {/* Status Chart */}
          {stats && loadedSections.activity && (
            <Suspense fallback={<div className={`h-64 animate-pulse rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}></div>}>
              <StatusChart 
                data={stats.statusStats}
                title="Order Status Overview"
              />
            </Suspense>
          )}

          {/* Recent Activity */}
          {loadedSections.activity && (
            <Suspense fallback={<div className={`h-64 animate-pulse rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}></div>}>
              <RecentActivity userRole="superadmin" />
            </Suspense>
          )}
        </div>

      </div>
    </div>
  );
}