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
  ClockIcon,
  BoltIcon,
  ExclamationTriangleIcon as WarningIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  BeakerIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import OrderForm from './components/OrderForm';
import OrderDetails from './components/OrderDetails';
import PartyModal from './components/PartyModal';
import QualityModal from './components/QualityModal';
import LabAddModal from './components/LabAddModal';
import { Order, Party, Quality } from '@/types';
import { useDarkMode } from '../hooks/useDarkMode';

export default function OrdersPage() {
  const { isDarkMode, mounted } = useDarkMode();
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [screenSize, setScreenSize] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const [resettingCounter, setResettingCounter] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; alt: string } | null>(null);
  const ordersPerPage = 12; // Increased for better UX

  // Filters
  const [filters, setFilters] = useState({
    orderFilter: 'all' // all, latest_first, oldest_first
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
        setOrders(data.data || []);
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

  // Reset order counter function
  const handleResetCounter = useCallback(async () => {
    if (orders.length > 0) {
      showMessage('error', 'Cannot reset counter when orders exist. Delete all orders first.');
      return;
    }

    setResettingCounter(true);
    try {
      const response = await fetch('/api/orders/reset-counter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        showMessage('success', 'Order counter reset successfully. Next order will start with 001');
        setShowQuickActions(false);
      } else {
        showMessage('error', data.message || 'Failed to reset order counter');
      }
    } catch (error) {
      console.error('Error resetting counter:', error);
      showMessage('error', 'Failed to reset order counter');
    } finally {
      setResettingCounter(false);
    }
  }, [orders.length, showMessage]);

  // Delete all orders function
  const handleDeleteAllOrders = useCallback(async () => {
    setDeletingAll(true);
    try {
      const response = await fetch('/api/orders/delete-all', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        showMessage('success', data.message);
        setShowDeleteAllModal(false);
        await fetchOrders(); // Refresh the orders list
      } else {
        showMessage('error', data.message);
      }
    } catch (error: any) {
      showMessage('error', 'Failed to delete all orders');
    } finally {
      setDeletingAll(false);
    }
  }, [fetchOrders, showMessage]);

  // Handle status change
  const handleStatusChange = useCallback(async (orderId: string, newStatus: "pending" | "delivered") => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Update the order in the local state
        setOrders(prev => prev.map(order => 
          order._id === orderId ? { ...order, status: newStatus } : order
        ));
        showMessage('success', 'Order status updated successfully');
      } else {
        showMessage('error', data.message || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      showMessage('error', 'Failed to update order status');
    }
  }, [showMessage]);

  // Memoized order statistics
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
      return order.deliveryDate && now > new Date(order.deliveryDate);
    }).length;

    return { total, pending, arrived, delivered };
  }, [orders]);

  // Memoized filtered and sorted orders
  const filteredOrders = useMemo(() => {
    let filtered = orders
      .filter(order => {
        const matchesSearch = 
          order.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.poNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.styleNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (order.party as any)?.name?.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesSearch;
      });

    // Apply order filter
    if (filters.orderFilter === 'latest_first') {
      // Sort by newest first (latest orders at top)
      filtered = filtered.sort((a, b) => new Date(b.arrivalDate || '').getTime() - new Date(a.arrivalDate || '').getTime());
    } else if (filters.orderFilter === 'oldest_first') {
      // Sort by order ID ascending (001, 002, 003, etc.)
      filtered = filtered.sort((a, b) => {
        const orderIdA = parseInt(a.orderId || '0');
        const orderIdB = parseInt(b.orderId || '0');
        return orderIdA - orderIdB;
      });
    } else {
      // Default: sort by newest first
      filtered = filtered.sort((a, b) => new Date(b.arrivalDate || '').getTime() - new Date(a.arrivalDate || '').getTime());
    }

    // Debug logging
    console.log('Filter Debug:', {
      totalOrders: orders.length,
      searchTerm,
      orderFilter: filters.orderFilter,
      filteredCount: filtered.length,
      filteredOrders: filtered.map(o => ({ id: o.orderId, party: (o.party as any)?.name, type: o.orderType }))
    });

    return filtered;
  }, [orders, searchTerm, filters]);

  const handleDeleteClick = useCallback((order: Order) => {
    setOrderToDelete(order);
    setShowDeleteModal(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!orderToDelete) return;

    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Authentication token not found');
        return;
      }

      const response = await fetch(`/api/orders/${orderToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        setOrders(prev => prev.filter(order => order._id !== orderToDelete._id));
        showMessage('success', 'Order deleted successfully');
        setShowDeleteModal(false);
        setOrderToDelete(null);
      } else {
        showMessage('error', 'Failed to delete order');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      showMessage('error', 'Failed to delete order');
    } finally {
      setDeleting(false);
    }
  }, [orderToDelete, showMessage]);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteModal(false);
    setOrderToDelete(null);
    setDeleting(false);
  }, []);

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

  const handleImagePreview = (url: string, alt: string) => {
    setPreviewImage({ url, alt });
    setShowImagePreview(true);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters.orderFilter]);

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

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className={`inline-flex items-center px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                showQuickActions
                  ? isDarkMode
                    ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                    : 'bg-blue-100 border border-blue-300 text-blue-700'
                  : isDarkMode
                    ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                    : 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BoltIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Quick Actions</span>
              <span className="sm:hidden">Actions</span>
            </button>
            <button
              onClick={() => setShowForm(true)}
              className={`inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 ${
                isDarkMode
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg'
              }`}
            >
              <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Create New Order</span>
              <span className="sm:hidden">New Order</span>
            </button>
          </div>
        </div>

        {/* Quick Actions Panel */}
        {showQuickActions && (
          <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
            isDarkMode 
              ? 'bg-white/5 border-white/10 shadow-xl' 
              : 'bg-white border-gray-200 shadow-xl'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                ⚡ Quick Actions
              </h3>
              <button
                onClick={() => setShowQuickActions(false)}
                className={`p-1 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-white hover:bg-white/10' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {/* New Order */}
              <button
                onClick={() => {
                  setShowForm(true);
                  setShowQuickActions(false);
                }}
                className={`group p-3 rounded-lg border transition-all duration-200 hover:scale-105 ${
                  isDarkMode
                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/40'
                    : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300'
                }`}
              >
                <PlusIcon className="h-5 w-5 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-medium">New Order</div>
              </button>
              
              {/* Add Party */}
              <button
                onClick={() => {
                  setShowPartyModal(true);
                  setShowQuickActions(false);
                }}
                className={`group p-3 rounded-lg border transition-all duration-200 hover:scale-105 ${
                  isDarkMode
                    ? 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20 hover:border-green-500/40'
                    : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300'
                }`}
              >
                <BuildingOfficeIcon className="h-5 w-5 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-medium">Add Party</div>
              </button>
              
              {/* Add Quality */}
              <button
                onClick={() => {
                  setShowQualityModal(true);
                  setShowQuickActions(false);
                }}
                className={`group p-3 rounded-lg border transition-all duration-200 hover:scale-105 ${
                  isDarkMode
                    ? 'bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20 hover:border-purple-500/40'
                    : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:border-purple-300'
                }`}
              >
                <ChartBarIcon className="h-5 w-5 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-medium">Add Quality</div>
              </button>
              
              {/* Refresh */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`group p-3 rounded-lg border transition-all duration-200 hover:scale-105 ${
                  refreshing
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                } ${
                  isDarkMode
                    ? 'bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20 hover:border-orange-500/40'
                    : 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 hover:border-orange-300'
                }`}
              >
                <ArrowPathIcon className={`h-5 w-5 mx-auto mb-1 ${refreshing ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
                <div className="text-xs font-medium">Refresh</div>
              </button>
              
              {/* Delete All Orders - Only show when orders exist */}
              {orders.length > 0 && (
                <button
                  onClick={() => setShowDeleteAllModal(true)}
                  className={`group p-3 rounded-lg border transition-all duration-200 hover:scale-105 ${
                    isDarkMode
                      ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/40'
                      : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300'
                  }`}
                >
                  <TrashIcon className="h-5 w-5 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-medium">Delete All</div>
                </button>
              )}
              
              {/* Reset Counter - Only show when no orders exist */}
              {orders.length === 0 && (
                <button
                  onClick={handleResetCounter}
                  disabled={resettingCounter}
                  className={`group p-3 rounded-lg border transition-all duration-200 hover:scale-105 ${
                    resettingCounter
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  } ${
                    isDarkMode
                      ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/40'
                      : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300'
                  }`}
                >
                  <ArrowPathIcon className={`h-5 w-5 mx-auto mb-1 ${resettingCounter ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
                  <div className="text-xs font-medium">Reset Counter</div>
                </button>
              )}
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

          {/* Bottom Row - Latest Order Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Order Filter Dropdown */}
            <div className="sm:w-48">
              <select
                value={filters.orderFilter}
                onChange={(e) => setFilters({ orderFilter: e.target.value })}
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
                                 <option value="all" className={isDarkMode ? 'bg-[#1D293D] text-white' : 'bg-white text-gray-900'}>All Orders</option>
                 <option value="latest_first" className={isDarkMode ? 'bg-[#1D293D] text-white' : 'bg-white text-gray-900'}>Latest First</option>
                 <option value="oldest_first" className={isDarkMode ? 'bg-[#1D293D] text-white' : 'bg-white text-gray-900'}>Oldest First</option>
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
                   Order Info
                 </th>
                 <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                   isDarkMode ? 'text-gray-300' : 'text-gray-500'
                 }`}>
                   Party Details
                 </th>
                 <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                   isDarkMode ? 'text-gray-300' : 'text-gray-500'
                 }`}>
                   Dates
                 </th>
                 <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                   isDarkMode ? 'text-gray-300' : 'text-gray-500'
                 }`}>
                   Items
                 </th>
                 
                 <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                   isDarkMode ? 'text-gray-300' : 'text-gray-500'
                 }`}>
                   Status
                 </th>
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
                   {/* Order Info Column */}
                   <td className="px-6 py-4">
                     <div className="flex items-center">
                       <div className={`h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold ${
                         isDarkMode
                           ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                           : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white'
                       }`}>
                         {order.orderId}
                       </div>
                       <div className="ml-4 flex-1">
                         <div className="space-y-1">
                           <div className="flex items-center gap-2">
                             <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                               order.orderType === 'Dying'
                                 ? isDarkMode
                                   ? 'bg-red-900/20 text-red-400'
                                   : 'bg-red-100 text-red-800'
                                 : isDarkMode
                                   ? 'bg-blue-900/20 text-blue-400'
                                   : 'bg-blue-100 text-blue-800'
                             }`}>
                               {order.orderType || 'N/A'}
                             </span>
                           </div>
                           {order.poNumber && (
                             <div className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                               PO: {order.poNumber}
                             </div>
                           )}
                           {order.styleNo && (
                             <div className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                               Style: {order.styleNo}
                             </div>
                           )}
                           {/* Created and Updated dates */}
                           <div className={`text-xs mt-2 space-y-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                             <div className="flex items-center gap-1">
                               <CalendarIcon className="h-3 w-3" />
                               <span>Created: {formatDate(order.createdAt)}</span>
                             </div>
                             <div className="flex items-center gap-1">
                               <ClockIcon className="h-3 w-3" />
                               <span>Updated: {formatDate(order.updatedAt)}</span>
                             </div>
                           </div>
                         </div>
                       </div>
                     </div>
                   </td>

                   {/* Party Details Column */}
                   <td className="px-6 py-4">
                     <div className="space-y-1">
                       <div className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                         {(order.party as any)?.name || 'N/A'}
                       </div>
                       {order.contactName && (
                         <div className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                           👤 {order.contactName}
                         </div>
                       )}
                       {order.contactPhone && (
                         <div className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                           📞 {order.contactPhone}
                         </div>
                       )}
                     </div>
                   </td>

                                       {/* Dates Column */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {order.arrivalDate && (
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              Arrival: {formatDate(order.arrivalDate)}
                            </span>
                          </div>
                        )}
                        {order.poDate && (
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              PO Date: {formatDate(order.poDate)}
                            </span>
                          </div>
                        )}
                        {order.deliveryDate && (
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              Delivery: {formatDate(order.deliveryDate)}
                            </span>
                          </div>
                        )}
                        
                      </div>
                    </td>

                                       {/* Items Column */}
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {order.items.length} items
                        </div>
                        {order.items.map((item, index) => (
                          <div key={index} className={`p-2 rounded border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {(item.quality as any)?.name || 'N/A'}
                              </span>
                              <span className={`text-xs font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                Qty: {item.quantity || 0}
                              </span>
                            </div>
                            {item.description && (
                              <div className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>
                                {item.description}
                              </div>
                            )}
                                                           {/* Lab Data Display */}
                              {item.labData && (
                                <div className={`text-xs ${isDarkMode ? 'text-purple-300' : 'text-purple-600'} mb-1 p-1 rounded bg-purple-50 border border-purple-200`}>
                                  <div className="font-medium mb-1">Lab Data:</div>
                                  <div className="space-y-1">
                                    {item.labData.color && (
                                      <div>Color: {item.labData.color}</div>
                                    )}
                                    {item.labData.shade && (
                                      <div>Shade: {item.labData.shade}</div>
                                    )}
                                    {item.labData.notes && (
                                      <div>Notes: {item.labData.notes}</div>
                                    )}
                                    {item.labData.labSendDate && (
                                      <div>Send Date: {new Date(item.labData.labSendDate).toLocaleDateString()}</div>
                                    )}
                                    {item.labData.approvalDate && (
                                      <div>Approval Date: {new Date(item.labData.approvalDate).toLocaleDateString()}</div>
                                    )}
                                    {item.labData.sampleNumber && (
                                      <div>Sample: {item.labData.sampleNumber}</div>
                                    )}
                                    {/* Lab Data Image */}
                                    {item.labData.imageUrl && (
                                      <div className="mt-2">
                                        <div className="text-xs font-medium mb-1">Lab Image:</div>
                                        <div className="relative group">
                                          <img 
                                            src={item.labData.imageUrl} 
                                            alt="Lab Data"
                                            className="w-8 h-8 object-cover rounded border"
                                            onError={(e) => {
                                              e.currentTarget.style.display = 'none';
                                            }}
                                          />
                                          <button
                                            onClick={() => handleImagePreview(item.labData?.imageUrl || '', 'Lab Data')}
                                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded flex items-center justify-center"
                                          >
                                            <PhotoIcon className="h-4 w-4 text-white" />
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                             {/* Multiple Images Display */}
                            {item.imageUrls && item.imageUrls.length > 0 && (
                               <div className="mt-2">
                                 <div className="text-xs font-medium mb-1">Item Images:</div>
                                 <div className="flex flex-wrap gap-1">
                                   {item.imageUrls.map((imageUrl, imageIndex) => (
                                     <div key={imageIndex} className="relative group">
                                       <img 
                                         src={imageUrl} 
                                         alt={`Item ${index + 1} image ${imageIndex + 1}`}
                                         className="w-8 h-8 object-cover rounded border"
                                         onError={(e) => {
                                           e.currentTarget.style.display = 'none';
                                         }}
                                       />
                                       <button
                                         onClick={() => handleImagePreview(imageUrl, `Item ${index + 1} - Image ${imageIndex + 1}`)}
                                         className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded flex items-center justify-center"
                                       >
                                         <PhotoIcon className="h-3 w-3 text-white" />
                                       </button>
                                     </div>
                                   ))}
                                 </div>
                               </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>

                                                                               

                                                                               {/* Status Column */}
                     <td className="px-6 py-4">
                       <select
                         value={order.status || 'pending'}
                          onChange={(e) => handleStatusChange(order._id, e.target.value as "pending" | "delivered")}
                         className={`text-xs px-3 py-2 rounded-lg border transition-colors appearance-none cursor-pointer ${
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
                         <option value="pending" className={isDarkMode ? 'bg-[#1D293D] text-white' : 'bg-white text-gray-900'}>Pending</option>
                          <option value="delivered" className={isDarkMode ? 'bg-[#1D293D] text-white' : 'bg-white text-gray-900'}>Delivered</option>
                       </select>
                     </td>

                                       {/* Actions Column */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleView(order)}
                          className={`p-1.5 rounded transition-all duration-300 ${
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
                          className={`p-1.5 rounded transition-all duration-300 ${
                            isDarkMode
                              ? 'text-green-400 hover:bg-green-500/20'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title="Edit order"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        {/* Lab Data Button */}
                        <button
                          onClick={() => handleAddLab(order)}
                          className={`p-1.5 rounded transition-all duration-300 ${
                            order.labData
                              ? isDarkMode
                                ? 'text-purple-400 hover:bg-purple-500/20'
                                : 'text-purple-600 hover:bg-purple-50'
                              : isDarkMode
                                ? 'text-orange-400 hover:bg-orange-500/20'
                                : 'text-orange-600 hover:bg-orange-50'
                          }`}
                          title={order.labData ? "Edit lab data" : "Add lab data"}
                        >
                          <BeakerIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(order)}
                          className={`p-1.5 rounded transition-all duration-300 ${
                            isDarkMode
                              ? 'text-red-400 hover:bg-red-500/20'
                              : 'text-red-600 hover:bg-red-50'
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
             fetchOrders(); // Refresh orders to show new lab data
             showMessage('success', 'Lab data added successfully');
           }}
         />
       )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && orderToDelete && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/60 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`relative w-full max-w-md mx-auto ${isDarkMode ? 'bg-[#1D293D]' : 'bg-white'} rounded-lg shadow-xl`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${isDarkMode ? 'bg-red-500/20' : 'bg-red-100'}`}>
                  <ExclamationTriangleIcon className={`h-6 w-6 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                </div>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Delete Order
                </h3>
              </div>
              <button
                onClick={handleDeleteCancel}
                disabled={deleting}
                className={`p-1 rounded-full transition-colors ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-white hover:bg-white/10' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                Are you sure you want to delete this order? This action cannot be undone.
              </p>
              
              <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Order ID:
                  </span>
                  <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {orderToDelete.orderId}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Type:
                  </span>
                  <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {orderToDelete.orderType}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Items:
                  </span>
                  <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {orderToDelete.items.length} item(s)
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={`flex items-center justify-end space-x-3 p-6 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
              <button
                onClick={handleDeleteCancel}
                disabled={deleting}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                  isDarkMode
                    ? 'text-gray-300 bg-white/10 hover:bg-white/20 disabled:opacity-50'
                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 flex items-center space-x-2 ${
                  deleting
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {deleting ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <TrashIcon className="h-4 w-4" />
                    <span>Delete Order</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Orders Confirmation Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl ${
            isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
          } overflow-hidden`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${isDarkMode ? 'bg-red-500/20' : 'bg-red-100'}`}>
                  <ExclamationTriangleIcon className={`h-6 w-6 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                </div>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Delete All Orders
                </h3>
              </div>
              <button
                onClick={() => setShowDeleteAllModal(false)}
                disabled={deletingAll}
                className={`p-1 rounded-full transition-colors ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-white hover:bg-white/10' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                Are you sure you want to delete <strong>ALL {orders.length} orders</strong>? This action cannot be undone and will permanently remove all order data.
              </p>
              
              <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center space-x-2">
                  <ExclamationTriangleIcon className={`h-5 w-5 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>
                    Warning: This will delete all orders and reset the counter to 0
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={`flex items-center justify-end space-x-3 p-6 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
              <button
                onClick={() => setShowDeleteAllModal(false)}
                disabled={deletingAll}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                  isDarkMode
                    ? 'text-gray-300 bg-white/10 hover:bg-white/20 disabled:opacity-50'
                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllOrders}
                disabled={deletingAll}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 flex items-center space-x-2 ${
                  deletingAll
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {deletingAll ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    <span>Deleting All...</span>
                  </>
                ) : (
                  <>
                    <TrashIcon className="h-4 w-4" />
                    <span>Delete All Orders</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {showImagePreview && previewImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={() => setShowImagePreview(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors duration-200"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            
            {/* Image */}
            <img
              src={previewImage.url}
              alt={previewImage.alt}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            
            {/* Image Info */}
            <div className="absolute bottom-4 left-4 right-4 bg-black/50 text-white p-3 rounded-lg">
              <p className="text-sm font-medium">{previewImage.alt}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
