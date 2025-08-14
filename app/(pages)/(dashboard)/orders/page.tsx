'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CalendarIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  BoltIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon as WarningIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  ShoppingBagIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import OrderForm from './components/OrderForm';
import OrderDetails from './components/OrderDetails';
import PartyModal from './components/PartyModal';
import QualityModal from './components/QualityModal';
import LabAddModal from './components/LabAddModal';
import { Order, Party, Quality } from '@/types';
import { useDarkMode } from '../hooks/useDarkMode';

export default function OrdersPage() {
  const { isDarkMode } = useDarkMode();
  const [orders, setOrders] = useState<Order[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [qualities, setQualities] = useState<Quality[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [showLabAddModal, setShowLabAddModal] = useState(false);
  const [selectedOrderForLab, setSelectedOrderForLab] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [screenSize, setScreenSize] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const ordersPerPage = 12; // Increased for better UX

  // Filters
  const [filters, setFilters] = useState({
    party: '',
    orderType: '',
    dateRange: 'all' // all, today, week, month
  });

  // Track screen size
  useEffect(() => {
    const handleResize = () => {
      setScreenSize(window.innerWidth);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

    const isLargeScreen = screenSize > 1200;
  const isMediumScreen = screenSize > 768;
  const isSmallScreen = screenSize > 640;

  // Show message - moved up before fetchOrders
  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }, []);

  // Optimized fetch functions with useCallback
  const fetchOrders = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch('/api/orders', {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.data.orders || []);
        setLastRefreshTime(new Date());
      } else {
        console.error('Failed to fetch orders:', data.message);
        showMessage('error', 'Failed to load orders');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        showMessage('error', 'Request timeout - please try again');
      } else {
        console.error('Error fetching orders:', error);
        showMessage('error', 'Failed to load orders');
      }
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  const fetchParties = useCallback(async () => {
    try {
      const response = await fetch('/api/parties', {
        headers: {
          'Cache-Control': 'max-age=300', // Cache for 5 minutes
        }
      });
      const data = await response.json();
      if (data.success) {
        setParties(data.data || []);
      } else {
        console.error('Failed to fetch parties:', data.message);
      }
    } catch (error) {
      console.error('Error fetching parties:', error);
    }
  }, []);

  const fetchQualities = useCallback(async () => {
    try {
      const response = await fetch('/api/qualities', {
        headers: {
          'Cache-Control': 'max-age=300', // Cache for 5 minutes
        }
      });
      const data = await response.json();
      if (data.success) {
        setQualities(data.data || []);
      } else {
        console.error('Failed to fetch qualities:', data.message);
      }
    } catch (error) {
      console.error('Error fetching qualities:', error);
    }
  }, []);

  // Fetch orders, parties, and qualities
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await Promise.all([
        fetchOrders(),
        fetchParties(),
        fetchQualities()
      ]);
    };
    
    initializeData();
  }, [fetchOrders, fetchParties, fetchQualities]);

  // Optimized refresh function
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchOrders();
      showMessage('success', 'Orders refreshed successfully');
    } catch (error: any) {
      showMessage('error', 'Failed to refresh orders');
    } finally {
      setRefreshing(false);
    }
  }, [fetchOrders, showMessage]);

  // Memoized order statistics
  const orderStats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(order => {
      const now = new Date();
      return now <= new Date(order.arrivalDate);
    }).length;
    const arrived = orders.filter(order => {
      const now = new Date();
      return now > new Date(order.arrivalDate) && 
             (!order.deliveryDate || now <= new Date(order.deliveryDate));
    }).length;
    const delivered = orders.filter(order => {
      const now = new Date();
      return order.deliveryDate && now > new Date(order.deliveryDate);
    }).length;

    return { total, pending, arrived, delivered };
  }, [orders]);

  // Memoized filtered and sorted orders
  const filteredOrders = useMemo(() => {
    const filtered = orders
      .filter(order => {
        const matchesSearch = 
          order.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.poNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.styleNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (order.party as any)?.name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesParty = !filters.party || order.party === filters.party;
        const matchesType = !filters.orderType || order.orderType === filters.orderType;
        
        // Date range filtering
        let matchesDateRange = true;
        if (filters.dateRange !== 'all') {
          const orderDate = new Date(order.arrivalDate);
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          
          switch (filters.dateRange) {
            case 'today':
              matchesDateRange = orderDate >= today;
              break;
            case 'week':
              const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
              matchesDateRange = orderDate >= weekAgo;
              break;
            case 'month':
              const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
              matchesDateRange = orderDate >= monthAgo;
              break;
          }
        }

        return matchesSearch && matchesParty && matchesType && matchesDateRange;
      })
      .sort((a, b) => new Date(b.arrivalDate).getTime() - new Date(a.arrivalDate).getTime());

    // Debug logging
    console.log('Filter Debug:', {
      totalOrders: orders.length,
      searchTerm,
      filters,
      filteredCount: filtered.length,
      filteredOrders: filtered.map(o => ({ id: o.orderId, party: (o.party as any)?.name, type: o.orderType }))
    });

    return filtered;
  }, [orders, searchTerm, filters]);

  const handleDelete = useCallback(async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Authentication token not found');
        return;
      }

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        setOrders(prev => prev.filter(order => order._id !== orderId));
        showMessage('success', 'Order deleted successfully');
      } else {
        showMessage('error', 'Failed to delete order');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      showMessage('error', 'Failed to delete order');
    }
  }, [showMessage]);

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setShowForm(true);
  };

  const handleView = (order: Order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  const handleAddLab = (order: Order) => {
    setSelectedOrderForLab(order);
    setShowLabAddModal(true);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  // Page navigation functions
  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get total quantity for an order
  const getTotalQuantity = (order: Order) => {
    return order.items.reduce((total, item) => total + (item.quantity || 0), 0);
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-[#1D293D]' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Enhanced Header with Stats */}
      <div className="space-y-6">
        {/* Main Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Manage Orders
            </h1>
            <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Create, edit, and manage your orders • Last updated: {lastRefreshTime.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className={`inline-flex items-center px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                isDarkMode
                  ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                  : 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BoltIcon className="h-5 w-5 mr-2" />
              Quick Actions
            </button>
            <button
              onClick={() => setShowForm(true)}
              className={`inline-flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 ${
                isDarkMode
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg'
              }`}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create New Order
            </button>
          </div>
        </div>

        {/* Quick Actions Panel */}
        {showQuickActions && (
          <div className={`p-6 rounded-xl border-2 transition-all duration-300 ${
            isDarkMode 
              ? 'bg-white/5 border-white/10 shadow-xl' 
              : 'bg-white border-gray-200 shadow-xl'
          }`}>
            <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              🚀 Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <button
                onClick={() => {
                  setShowForm(true);
                  setShowQuickActions(false);
                }}
                className={`p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                  isDarkMode
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20'
                    : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                }`}
              >
                <PlusIcon className="h-8 w-8 mb-2" />
                <div className="text-sm font-semibold">New Order</div>
                <div className="text-xs opacity-75">Create from scratch</div>
              </button>
              
              <button
                onClick={() => {
                  setShowPartyModal(true);
                  setShowQuickActions(false);
                }}
                className={`p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                  isDarkMode
                    ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                    : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                }`}
              >
                <BuildingOfficeIcon className="h-8 w-8 mb-2" />
                <div className="text-sm font-semibold">Add Party</div>
                <div className="text-xs opacity-75">New customer/supplier</div>
              </button>
              
              <button
                onClick={() => {
                  setShowQualityModal(true);
                  setShowQuickActions(false);
                }}
                className={`p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                  isDarkMode
                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20'
                    : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
                }`}
              >
                <ChartBarIcon className="h-8 w-8 mb-2" />
                <div className="text-sm font-semibold">Add Quality</div>
                <div className="text-xs opacity-75">New product quality</div>
              </button>
              
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                  refreshing
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                } ${
                  isDarkMode
                    ? 'bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20'
                    : 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
                }`}
              >
                <ArrowPathIcon className={`h-8 w-8 mb-2 ${refreshing ? 'animate-spin' : ''}`} />
                <div className="text-sm font-semibold">Refresh</div>
                <div className="text-xs opacity-75">Update data</div>
              </button>
              
              <button
                onClick={() => {
                  setShowLabAddModal(true);
                  setShowQuickActions(false);
                }}
                className={`p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                  isDarkMode
                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20'
                    : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
                }`}
              >
                <BeakerIcon className="h-8 w-8 mb-2" />
                <div className="text-sm font-semibold">Add Lab</div>
                <div className="text-xs opacity-75">Lab data for orders</div>
              </button>
            </div>
          </div>
        )}


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
                  placeholder="Search orders by ID, PO number, style, or party..."
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
                className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  refreshing
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:scale-105 active:scale-95'
                } ${
                  isDarkMode
                    ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:border-white/30'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }`}
                title="Refresh orders list"
              >
                <ArrowPathIcon className={`h-5 w-5 ${screenSize > 1000 ? 'mr-2' : ''} ${refreshing ? 'animate-spin' : ''}`} />
                {screenSize > 1000 && (refreshing ? 'Refreshing...' : 'Refresh')}
              </button>
            </div>
          </div>

          {/* Bottom Row - Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Party Filter */}
            <div className="sm:w-48">
              <select
                value={filters.party}
                onChange={(e) => setFilters({ ...filters, party: e.target.value })}
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
                <option value="" className={isDarkMode ? 'bg-[#1D293D] text-white' : 'bg-white text-gray-900'}>All Parties</option>
                {parties.map((party) => (
                  <option key={party._id} value={party._id} className={isDarkMode ? 'bg-[#1D293D] text-white' : 'bg-white text-gray-900'}>
                    {party.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Order Type Filter */}
            <div className="sm:w-48">
              <select
                value={filters.orderType}
                onChange={(e) => setFilters(prev => ({ ...prev, orderType: e.target.value }))}
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
                <option value="" className={isDarkMode ? 'bg-[#1D293D] text-white' : 'bg-white text-gray-900'}>All Types</option>
                <option value="Dying" className={isDarkMode ? 'bg-[#1D293D] text-white' : 'bg-white text-gray-900'}>Dying</option>
                <option value="Printing" className={isDarkMode ? 'bg-[#1D293D] text-white' : 'bg-white text-gray-900'}>Printing</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="sm:w-48">
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
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
                <option value="all" className={isDarkMode ? 'bg-[#1D293D] text-white' : 'bg-white text-gray-900'}>All Dates</option>
                <option value="today" className={isDarkMode ? 'bg-[#1D293D] text-white' : 'bg-white text-gray-900'}>Today</option>
                <option value="week" className={isDarkMode ? 'bg-[#1D293D] text-white' : 'bg-white text-gray-900'}>This Week</option>
                <option value="month" className={isDarkMode ? 'bg-[#1D293D] text-white' : 'bg-white text-gray-900'}>This Month</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
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
                  Order Details
                </th>
                {isMediumScreen && (
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Party Info
                  </th>
                )}
                {isLargeScreen && (
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Dates
                  </th>
                )}
                {isSmallScreen && (
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Quantity
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
              {currentOrders.map((order) => (
                <tr key={order._id} className={`hover:${
                  isDarkMode ? 'bg-white/5' : 'bg-gray-50'
                } transition-colors duration-200`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                        isDarkMode
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                          : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white'
                      }`}>
                        {order.orderId?.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className={`text-sm font-medium ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {order.orderId}
                        </div>
                        <div className={`text-sm ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          {order.poNumber && `PO: ${order.poNumber}`}
                          {order.styleNo && order.poNumber && ' • '}
                          {order.styleNo && `Style: ${order.styleNo}`}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.orderType === 'Dying'
                              ? isDarkMode
                                ? 'bg-red-900/20 text-red-400'
                                : 'bg-red-100 text-red-800'
                              : isDarkMode
                                ? 'bg-blue-900/20 text-blue-400'
                                : 'bg-blue-100 text-blue-800'
                          }`}>
                            {order.orderType}
                          </span>
                          {!isSmallScreen && (
                            <span className={`text-xs ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              Qty: {getTotalQuantity(order)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  {isMediumScreen && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {(order.party as any)?.name || 'N/A'}
                        </div>
                        {order.contactName && (
                          <div className="text-xs">
                            👤 {order.contactName}
                          </div>
                        )}
                        {order.contactPhone && (
                          <div className="text-xs">
                            📞 {order.contactPhone}
                          </div>
                        )}
                      </div>
                    </td>
                  )}
                  {isLargeScreen && (
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          <span>Arrival: {formatDate(order.arrivalDate)}</span>
                        </div>
                        {order.deliveryDate && (
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            <span>Delivery: {formatDate(order.deliveryDate)}</span>
                          </div>
                        )}
                      </div>
                    </td>
                  )}
                  {isSmallScreen && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {getTotalQuantity(order)}
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleView(order)}
                        className={`p-2 rounded-lg transition-all duration-300 ${
                          isDarkMode
                            ? 'text-blue-400 hover:bg-blue-500/20'
                            : 'text-blue-600 hover:bg-blue-50'
                        }`}
                        title="View order details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(order)}
                        className={`p-2 rounded-lg transition-all duration-300 ${
                          isDarkMode
                            ? 'text-green-400 hover:bg-green-500/20'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title="Edit order"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleAddLab(order)}
                        className={`p-2 rounded-lg transition-all duration-300 ${
                          isDarkMode
                            ? 'text-purple-400 hover:bg-purple-500/20'
                            : 'text-purple-600 hover:bg-purple-50'
                        }`}
                        title="Add lab data"
                      >
                        <BeakerIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(order._id)}
                        className={`p-2 rounded-lg transition-all duration-300 ${
                          isDarkMode
                            ? 'text-red-400 hover:bg-red-500/20 hover:text-red-300 active:bg-red-500/30'
                            : 'text-red-600 hover:bg-red-50 hover:text-red-700 active:bg-red-100'
                        }`}
                        title="Delete order"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className={`text-center py-12 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <p>No orders found</p>
          </div>
        )}
      </div>

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

      {/* Modals */}
      {showForm && (
        <OrderForm
          order={editingOrder}
          parties={parties}
          qualities={qualities}
          onClose={() => {
            setShowForm(false);
            setEditingOrder(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingOrder(null);
            fetchOrders();
            showMessage('success', editingOrder ? 'Order updated successfully' : 'Order created successfully');
          }}
          onAddParty={() => {
            setShowPartyModal(true);
          }}
          onRefreshParties={fetchParties}
          onAddQuality={(newQualityData?: any) => {
            if (newQualityData) {
              setQualities(prev => [...prev, newQualityData]);
            } else {
              fetchQualities();
            }
          }}
        />
      )}

      {showDetails && selectedOrder && (
        <OrderDetails
          order={selectedOrder}
          onClose={() => {
            setShowDetails(false);
            setSelectedOrder(null);
          }}
          onEdit={() => {
            setShowDetails(false);
            setSelectedOrder(null);
            handleEdit(selectedOrder);
          }}
        />
      )}

      {showPartyModal && (
        <PartyModal
          onClose={() => setShowPartyModal(false)}
          onSuccess={() => {
            setShowPartyModal(false);
            fetchParties();
          }}
        />
      )}

      {showQualityModal && (
        <QualityModal
          onClose={() => setShowQualityModal(false)}
          onSuccess={(newQualityName?: string, newQualityData?: any) => {
            setShowQualityModal(false);
            if (newQualityData) {
              setQualities(prev => [...prev, newQualityData]);
            }
            fetchQualities();
          }}
        />
      )}

      {showLabAddModal && (
        <LabAddModal
          order={selectedOrderForLab}
          onClose={() => {
            setShowLabAddModal(false);
            setSelectedOrderForLab(null);
          }}
          onSuccess={() => {
            setShowLabAddModal(false);
            setSelectedOrderForLab(null);
            showMessage('success', 'Lab data added successfully');
          }}
        />
      )}
    </div>
  );
}
