'use client';

import React, { useState, useEffect } from 'react';
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
import OrderTrendsChart from './components/OrderTrendsChart';
import OrderTypeChart from './components/OrderTypeChart';
import StatusChart from './components/StatusChart';
import OrdersTable from './components/OrdersTable';
import UpcomingDeliveriesTable from './components/UpcomingDeliveriesTable';
import DashboardFilters from './components/DashboardFilters';
import RecentActivity from './components/RecentActivity';
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
  const [filters, setFilters] = useState<DashboardFilters>({
    startDate: '',
    endDate: '',
    orderType: 'all',
    financialYear: 'all'
  });

  useEffect(() => {
    if (mounted) {
      fetchDashboardData();
    }
  }, [mounted, filters]);

  // Listen for order updates from other pages
  useEffect(() => {
    const handleOrderUpdate = (event: CustomEvent) => {
      console.log('Dashboard: Order update detected, refreshing data...', event.detail);
      // Show auto-refresh indicator
      setAutoRefreshing(true);
      setError(null); // Clear any previous errors
      // Refresh dashboard data when orders are updated
      fetchDashboardData().then(() => {
        setSuccessMessage('Dashboard updated successfully');
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      }).catch((error) => {
        console.error('Dashboard: Failed to refresh after order update:', error);
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
  }, [mounted, filters]); // Include filters in dependencies to ensure fresh data

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view the dashboard');
        return;
      }

      // Fetch all orders first to calculate statistics
      const allOrdersParams = new URLSearchParams();
      allOrdersParams.append('limit', '1000'); // Get more orders for better statistics
      if (filters.orderType !== 'all') allOrdersParams.append('orderType', filters.orderType);

      const allOrdersResponse = await fetch(`/api/orders?${allOrdersParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

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
          monthlyTrends,
          recentOrders: allOrders.slice(0, 10)
        });

        // Filter orders for tables with better logic
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Pending orders: orders that are not yet completed/delivered
        const pendingOrders = allOrders.filter((order: Order) => {
          const status = order.status;
          return status === 'pending' || 
                 status === 'in_progress' || 
                 !status || 
                 status === 'Not set' || 
                 status === 'Not selected';
        }).sort((a: Order, b: Order) => {
          // Sort by creation date (newest first)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }).slice(0, 10);
        
        // Delivered orders: orders that are completed or delivered
        const deliveredOrders = allOrders.filter((order: Order) => {
          const status = order.status;
          return status === 'delivered' || status === 'completed';
        }).sort((a: Order, b: Order) => {
          // Sort by delivery date (most recent first), then by creation date
          if (a.deliveryDate && b.deliveryDate) {
            return new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime();
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }).slice(0, 10);

        // Filter orders for upcoming deliveries (all future deliveries)

        const upcomingDeliveryOrders = allOrders.filter((order: Order) => {
          if (!order.deliveryDate) return false;
          
          const deliveryDate = new Date(order.deliveryDate);
          deliveryDate.setHours(0, 0, 0, 0);
          
          // Include orders with future delivery dates that are not yet delivered
          const status = order.status;
          const isNotDelivered = status !== 'delivered' && status !== 'completed';
          const isFutureDelivery = deliveryDate >= today;
          
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
        console.error('Dashboard: Failed to fetch orders, status:', allOrdersResponse.status);
        if (allOrdersResponse.status === 401) {
          setError('Authentication failed. Please log in again.');
          return;
        }
        const errorData = await allOrdersResponse.json();
        console.error('Dashboard: Error data:', errorData);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters: DashboardFilters) => {
    setFilters(newFilters);
  };

  const handleViewOrder = (order: Order) => {
    router.push(`/dashboard/orders/orderdetails?id=${order._id}`);
  };

  const handleEditOrder = (order: Order) => {
    router.push(`/dashboard/orders?edit=${order._id}`);
  };

  const handleManualRefresh = async () => {
    console.log('Dashboard: Manual refresh triggered');
    await fetchDashboardData();
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${isDarkMode ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold transition-all duration-500 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Dashboard
              </h1>
              <p className={`mt-1 sm:mt-2 text-sm sm:text-base transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Overview of your orders and business metrics
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center gap-3">
              <button
                onClick={handleManualRefresh}
                disabled={loading}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                  loading 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:scale-105 active:scale-95'
                } ${
                  isDarkMode 
                    ? 'bg-slate-700 hover:bg-slate-600 border border-slate-600' 
                    : 'bg-white hover:bg-gray-50 border border-gray-300'
                }`}
                title="Refresh Dashboard Data"
              >
                <ArrowPathIcon className={`w-4 h-4 transition-colors duration-300 ${
                  loading ? 'animate-spin' : ''
                } ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                <span className={`text-xs sm:text-sm font-medium transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {loading ? 'Refreshing...' : 'Refresh'}
                </span>
              </button>
              <div className={`px-4 py-2 rounded-lg transition-all duration-300 ${isDarkMode ? 'bg-slate-800/50 border border-slate-700' : 'bg-white/50 border border-gray-200'}`}>
                <div className="flex items-center gap-2">
                  {autoRefreshing && (
                    <ArrowPathIcon className={`w-3 h-3 animate-spin transition-colors duration-300 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                  )}
                  <p className={`text-xs sm:text-sm font-medium transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {autoRefreshing ? 'Auto-refreshing...' : `Last updated: ${new Date().toLocaleTimeString()}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

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

        {/* Orders Tables - Moved to Top */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Pending Orders Table */}
          <OrdersTable
            orders={pendingOrders}
            title="Pending Orders"
            loading={loading}
            onViewOrder={handleViewOrder}
            onEditOrder={handleEditOrder}
          />

          {/* Delivered Orders Table */}
          <OrdersTable
            orders={deliveredOrders}
            title="Delivered Orders"
            loading={loading}
            onViewOrder={handleViewOrder}
            onEditOrder={handleEditOrder}
          />
        </div>

        {/* Upcoming Deliveries Table - Separate Row */}
        <div className="mb-6 sm:mb-8">
          <UpcomingDeliveriesTable
            orders={upcomingDeliveryOrders}
            title="Upcoming Deliveries"
            loading={loading}
            onViewOrder={handleViewOrder}
            onEditOrder={handleEditOrder}
          />
        </div>

        {/* Metrics Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <MetricsCard
              title="Total Orders"
              value={stats.totalOrders}
              icon={ShoppingBagIcon}
              color="blue"
              subtitle="All time orders"
            />
            <MetricsCard
              title="Pending Orders"
              value={stats.statusStats.pending}
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
            <MetricsCard
              title="In Progress"
              value={stats.statusStats.in_progress}
              icon={ExclamationTriangleIcon}
              color="indigo"
              subtitle="Currently processing"
            />
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Order Trends Chart */}
          {stats && (
            <OrderTrendsChart 
              data={stats.monthlyTrends}
              title="Order Trends (Last 12 Months)"
            />
          )}

          {/* Order Type Distribution */}
          {stats && (
            <OrderTypeChart 
              data={stats.typeStats}
              title="Order Types Distribution"
            />
          )}
        </div>

        {/* Status Overview and Recent Activity */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Status Chart */}
          {stats && (
            <StatusChart 
              data={stats.statusStats}
              title="Order Status Overview"
            />
          )}

          {/* Recent Activity */}
          <RecentActivity userRole="superadmin" />
        </div>


        {/* Quick Actions */}
        <div className={`mt-6 sm:mt-8 rounded-xl border shadow-lg p-4 sm:p-6 transition-all duration-500 ${
          isDarkMode 
            ? 'bg-slate-800/80 border-slate-700 shadow-slate-900/30 backdrop-blur-sm' 
            : 'bg-white/80 border-gray-200 shadow-gray-200/50 backdrop-blur-sm'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/dashboard/orders')}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ShoppingBagIcon className="w-5 h-5" />
              View All Orders
            </button>
            <button
              onClick={() => router.push('/dashboard/orders?create=true')}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <ShoppingBagIcon className="w-5 h-5" />
              Create New Order
            </button>
            <button
              onClick={() => router.push('/dashboard/fabrics')}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <ShoppingBagIcon className="w-5 h-5" />
              Manage Fabrics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}