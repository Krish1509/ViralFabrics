'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  PhotoIcon,
  DocumentTextIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import OrderForm from './components/OrderForm';

import PartyModal from './components/PartyModal';
import QualityModal from './components/QualityModal';
import LabAddModal from './components/LabDataModal';
import OrderLogsModal from './components/OrderLogsModal';
import LabDataModal from './components/LabDataModal';
import MillInputForm from './components/MillInputForm';
import MillOutputForm from './components/MillOutputForm';
import DispatchForm from './components/DispatchForm';
import { Order, Party, Quality, Mill, MillOutput } from '@/types';
import { useDarkMode } from '../hooks/useDarkMode';
import { useRouter, useSearchParams } from 'next/navigation';

// Enhanced message interface
interface ValidationMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  text: string;
  timestamp: number;
  autoDismiss?: boolean;
  dismissTime?: number;
}

export default function OrdersPage() {
  const { isDarkMode, mounted } = useDarkMode();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [qualities, setQualities] = useState<Quality[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderMillInputs, setOrderMillInputs] = useState<{[key: string]: any[]}>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [showLabAddModal, setShowLabAddModal] = useState(false);
  const [selectedOrderForLab, setSelectedOrderForLab] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [messages, setMessages] = useState<ValidationMessage[]>([]);
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
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedOrderForLogs, setSelectedOrderForLogs] = useState<Order | null>(null);
  const [showLabDataModal, setShowLabDataModal] = useState(false);
  const [selectedOrderForLabData, setSelectedOrderForLabData] = useState<Order | null>(null);


  const [showMillInputForm, setShowMillInputForm] = useState(false);
  const [selectedOrderForMillInputForm, setSelectedOrderForMillInputForm] = useState<Order | null>(null);
  const [existingMillInputs, setExistingMillInputs] = useState<any[]>([]);
  const [isEditingMillInput, setIsEditingMillInput] = useState(false);
  const [showMillOutputForm, setShowMillOutputForm] = useState(false);
  const [selectedOrderForMillOutput, setSelectedOrderForMillOutput] = useState<Order | null>(null);
  const [showDispatchForm, setShowDispatchForm] = useState(false);
  const [selectedOrderForDispatch, setSelectedOrderForDispatch] = useState<Order | null>(null);
  const [mills, setMills] = useState<Mill[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [isValidating, setIsValidating] = useState(false);

  const ordersPerPage = 50; // Show 50 orders per page

  // Filters
  const [filters, setFilters] = useState({
    orderFilter: 'latest_first', // latest_first, oldest_first - default to latest first (by creation date)
    typeFilter: 'all' // all, Dying, Printing
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

  // Enhanced message system with better UX
  const showMessage = useCallback((type: 'success' | 'error' | 'warning' | 'info', text: string, options?: { autoDismiss?: boolean; dismissTime?: number }) => {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newMessage: ValidationMessage = {
      id: messageId,
      type,
      text,
      timestamp: Date.now(),
      autoDismiss: options?.autoDismiss ?? true,
      dismissTime: options?.dismissTime ?? 5000
    };

    setMessages(prev => [...prev, newMessage]);

    // Auto dismiss if enabled
    if (newMessage.autoDismiss) {
      setTimeout(() => {
        dismissMessage(messageId);
      }, newMessage.dismissTime);
    }
  }, []);

  // Dismiss specific message
  const dismissMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  // Dismiss all messages
  const dismissAllMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Validation helper functions
  const validateSearchTerm = useCallback((term: string) => {
    if (term.length > 0 && term.length < 2) {
      return 'Search term must be at least 2 characters';
    }
    if (term.length > 50) {
      return 'Search term is too long (max 50 characters)';
    }
    return null;
  }, []);

  const validateFilters = useCallback((currentFilters: any) => {
    const errors: {[key: string]: string} = {};
    
    if (!currentFilters.orderFilter || !['latest_first', 'oldest_first'].includes(currentFilters.orderFilter)) {
      errors.orderFilter = 'Invalid order filter';
    }
    
    if (!currentFilters.typeFilter || !['all', 'Dying', 'Printing'].includes(currentFilters.typeFilter)) {
      errors.typeFilter = 'Invalid type filter';
    }
    
    return errors;
  }, []);

  // Real-time validation
  useEffect(() => {
    const errors: {[key: string]: string} = {};
    
    // Validate search term
    const searchError = validateSearchTerm(searchTerm);
    if (searchError) {
      errors.searchTerm = searchError;
    }
    
    // Validate filters
    const filterErrors = validateFilters(filters);
    Object.assign(errors, filterErrors);
    
    setValidationErrors(errors);
  }, [searchTerm, filters, validateSearchTerm, validateFilters]);

  // Optimized fetch functions with retry logic
  const fetchOrders = useCallback(async (retryCount = 0) => {
    const maxRetries = 3;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased to 15s timeout
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/orders?limit=50', { // Reduced limit for faster loading
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'max-age=30, must-revalidate', // Better caching
          'Pragma': 'no-cache'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // OrdersPage: Fetched orders successfully
        setOrders(data.data || []);
        setLastRefreshTime(new Date());
      } else {
        throw new Error(data.message || 'Failed to fetch orders');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        if (retryCount < maxRetries) {
          // OrdersPage: Retry attempt for orders fetch
          showMessage('warning', `Loading timeout. Retrying... (${retryCount + 1}/${maxRetries + 1})`, { autoDismiss: true, dismissTime: 3000 });
          await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced wait time
          return fetchOrders(retryCount + 1);
        } else {
          showMessage('error', 'Loading timeout. Please refresh the page.', { autoDismiss: false });
          setLoading(false); // Stop loading state
        }
      } else {
        console.error('Error fetching orders:', error);
        showMessage('error', 'Failed to fetch orders. Please try again.', { autoDismiss: false });
        setLoading(false); // Stop loading state
      }
      throw error; // Re-throw to be caught by the useEffect
    }
  }, [showMessage]);

  // Function to fetch existing mill inputs for an order
  const fetchExistingMillInputs = useCallback(async (orderId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/mill-inputs?orderId=${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setExistingMillInputs(data.millInputs);
        return data.millInputs;
      } else {
        console.error('Failed to fetch mill inputs:', data.message);
        return [];
      }
    } catch (error) {
      console.error('Error fetching mill inputs:', error);
      return [];
    }
  }, []);

  // Handle search params for edit mill input
  useEffect(() => {
    const editMillInput = searchParams.get('editMillInput');
    const addMillInput = searchParams.get('addMillInput');
    
    if (editMillInput) {
      // Find the order by ID
      const order = orders.find(o => o._id === editMillInput);
      if (order) {
        setSelectedOrderForMillInputForm(order);
        setIsEditingMillInput(true);
        setShowMillInputForm(true);
        // Clear the URL parameter
        router.replace('/orders', { scroll: false });
      }
    } else if (addMillInput) {
      // Find the order by ID
      const order = orders.find(o => o._id === addMillInput);
      if (order) {
        setSelectedOrderForMillInputForm(order);
        setIsEditingMillInput(false);
        setShowMillInputForm(true);
        // Clear the URL parameter
        router.replace('/orders', { scroll: false });
      }
    }
  }, [searchParams, orders, router]);

  // Function to fetch mill inputs for all orders
  const fetchAllOrderMillInputs = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/mill-inputs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success && data.millInputs) {
        // Group mill inputs by order ID
        const groupedInputs: {[key: string]: any[]} = {};
        data.millInputs.forEach((input: any) => {
          if (!groupedInputs[input.orderId]) {
            groupedInputs[input.orderId] = [];
          }
          groupedInputs[input.orderId].push(input);
        });
        setOrderMillInputs(groupedInputs);
      }
    } catch (error) {
      console.error('Error fetching all mill inputs:', error);
    }
  }, []);

  const fetchParties = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased to 10s timeout
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/parties?limit=10', { // Slightly increased limit
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'max-age=60, must-revalidate', // Better caching
          'Pragma': 'no-cache'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setParties(data.data || []);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn('Parties fetch timeout - continuing without parties');
      } else {
        console.error('Error fetching parties:', error);
      }
    }
  }, []);

  const fetchQualities = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased to 10s timeout
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/qualities?limit=20', { // Slightly increased limit
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'max-age=60, must-revalidate', // Better caching
          'Pragma': 'no-cache'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setQualities(data.data || []);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn('Qualities fetch timeout - continuing without qualities');
      } else {
        console.error('Error fetching qualities:', error);
      }
    }
  }, []);

  // Fetch mills
  const fetchMills = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/mills?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'max-age=60, must-revalidate',
          'Pragma': 'no-cache'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setMills(data.data.mills || []);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn('Mills fetch timeout - continuing without mills');
      } else {
        console.error('Error fetching mills:', error);
      }
    }
  }, []);

  // Fetch orders, parties, and qualities with better error handling
  useEffect(() => {
    // Prevent multiple initializations
    if (isInitialized) return;
    
    const initializeData = async () => {
      setLoading(true);
      let ordersLoaded = false;
      
      try {
        // Fetch orders first (most important)
        await fetchOrders();
        ordersLoaded = true;
        
        // Fetch parties, qualities, mills, and mill inputs in parallel (non-critical)
        Promise.allSettled([
          fetchParties(),
          fetchQualities(),
          fetchMills(),
          fetchAllOrderMillInputs()
        ]).then((results) => {
          const [partiesResult, qualitiesResult, millsResult] = results;
          if (partiesResult.status === 'rejected') {
            console.warn('Failed to load parties:', partiesResult.reason);
          }
          if (qualitiesResult.status === 'rejected') {
            console.warn('Failed to load qualities:', qualitiesResult.reason);
          }
          if (millsResult.status === 'rejected') {
            console.warn('Failed to load mills:', millsResult.reason);
          }
        });
        
      } catch (error) {
        console.error('Error initializing data:', error);
        if (!ordersLoaded) {
          showMessage('error', 'Failed to load orders. Please refresh the page.', { autoDismiss: false });
        }
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };
    
    initializeData();
    
    // Fallback timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setIsInitialized(true);
      showMessage('error', 'Loading timeout. Please refresh the page.', { autoDismiss: false });
    }, 8000); // Reduced to 8 second timeout
    
    return () => clearTimeout(timeoutId);
  }, [fetchOrders, fetchParties, fetchQualities, fetchMills, fetchAllOrderMillInputs, showMessage, isInitialized]); // Added isInitialized to dependencies

  // Keyboard navigation for image preview
  useEffect(() => {
    if (showImagePreview) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showImagePreview, currentImageIndex]);

  // Listen for real-time order updates
  useEffect(() => {
    const handleOrderUpdate = (event: CustomEvent) => {
      // OrdersPage: Received orderUpdated event
      
      // Refresh orders for any order-related action
      if (event.detail?.action === 'order_create' || 
          event.detail?.action === 'order_update' || 
          event.detail?.action === 'order_delete' ||
          event.detail?.action === 'order_delete_all' ||
          event.detail?.action === 'order_status_change' ||
          event.detail?.action === 'lab_add') {
        // OrdersPage: Refreshing orders due to action
        
        // Immediate refresh without loading state for better UX
        Promise.all([fetchOrders(), fetchAllOrderMillInputs()]).then(() => {
          // OrdersPage: Successfully refreshed orders and mill inputs
          // Show success message for automatic refresh
          if (event.detail?.action === 'order_create') {
            showMessage('success', 'New order added to table automatically!', { autoDismiss: true, dismissTime: 3000 });
          } else if (event.detail?.action === 'lab_add') {
            showMessage('success', 'Lab data updated in table automatically!', { autoDismiss: true, dismissTime: 3000 });
          }
        }).catch(error => {
          console.error('Error refreshing orders after', event.detail.action, ':', error);
          showMessage('error', 'Failed to refresh orders automatically', { autoDismiss: true, dismissTime: 3000 });
        });
      }
    };

    // Add event listener
    window.addEventListener('orderUpdated', handleOrderUpdate as EventListener);
    
    // Cleanup event listener
    return () => {
      window.removeEventListener('orderUpdated', handleOrderUpdate as EventListener);
    };
  }, [fetchOrders, showMessage]);

  // Optimized refresh function with retry
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    let retryCount = 0;
    const maxRetries = 2;
    
    const attemptRefresh = async () => {
      try {
        await fetchOrders();
        showMessage('success', 'Orders refreshed successfully', { autoDismiss: true, dismissTime: 3000 });
        return true;
      } catch (error: any) {
        retryCount++;
        if (retryCount < maxRetries) {
          // Retry attempt for orders refresh
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          return await attemptRefresh();
        } else {
          showMessage('error', 'Failed to refresh orders after multiple attempts', { autoDismiss: false });
          return false;
        }
      }
    };
    
    await attemptRefresh();
    setRefreshing(false);
  }, [fetchOrders, showMessage]);

  // Reset order counter function
  const handleResetCounter = useCallback(async () => {
    if (orders.length > 0) {
      showMessage('error', 'Cannot reset counter when orders exist. Delete all orders first.', { autoDismiss: true, dismissTime: 4000 });
      return;
    }

    setResettingCounter(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/orders/reset-counter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
      });

      const data = await response.json();
      
      if (data.success) {
        showMessage('success', 'Order counter reset successfully. Next order will start with 001', { autoDismiss: true, dismissTime: 4000 });
        setShowQuickActions(false);
      } else {
        showMessage('error', data.message || 'Failed to reset order counter', { autoDismiss: true, dismissTime: 4000 });
      }
    } catch (error) {
      console.error('Error resetting counter:', error);
      showMessage('error', 'Failed to reset order counter', { autoDismiss: true, dismissTime: 4000 });
    } finally {
      setResettingCounter(false);
    }
  }, [orders.length, showMessage]);

  // Delete all orders function
  const handleDeleteAllOrders = useCallback(async () => {
    setDeletingAll(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/orders/delete-all', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
      });

      const data = await response.json();
      
      if (data.success) {
        showMessage('success', data.message, { autoDismiss: true, dismissTime: 4000 });
        setShowDeleteAllModal(false);
        
        // Trigger real-time update for Order Activity Log
        const event = new CustomEvent('orderUpdated', { 
          detail: { 
            action: 'order_delete_all',
            timestamp: new Date().toISOString()
          } 
        });
        window.dispatchEvent(event);
        
        await fetchOrders(); // Refresh the orders list
      } else {
        showMessage('error', data.message, { autoDismiss: true, dismissTime: 4000 });
      }
    } catch (error: any) {
      showMessage('error', 'Failed to delete all orders', { autoDismiss: true, dismissTime: 4000 });
    } finally {
      setDeletingAll(false);
    }
  }, [fetchOrders, showMessage]);

  // Handle status change
  const handleStatusChange = useCallback(async (orderId: string, newStatus: "pending" | "delivered") => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Update the order in the local state
        setOrders(prev => prev.map(order => 
          order._id === orderId ? { ...order, status: newStatus } : order
        ));
        showMessage('success', 'Order status updated successfully', { autoDismiss: true, dismissTime: 3000 });
        
        // Trigger real-time update for Order Activity Log
        const event = new CustomEvent('orderUpdated', { 
          detail: { 
            orderId: orderId,
            action: 'order_status_change',
            timestamp: new Date().toISOString()
          } 
        });
        window.dispatchEvent(event);
      } else {
        showMessage('error', data.message || 'Failed to update order status', { autoDismiss: true, dismissTime: 4000 });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      showMessage('error', 'Failed to update order status', { autoDismiss: true, dismissTime: 4000 });
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
    // Filtering orders
    let filtered = orders
      .filter(order => {
        const matchesSearch = 
          order.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.poNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.styleNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (order.party as any)?.name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = filters.typeFilter === 'all' || order.orderType === filters.typeFilter;

        return matchesSearch && matchesType;
      });

    // Apply order filter
    if (filters.orderFilter === 'latest_first') {
      // Sort by newest first (latest orders at top) - use createdAt as primary, arrivalDate as fallback
      filtered = filtered.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.arrivalDate || '').getTime();
        const dateB = new Date(b.createdAt || b.arrivalDate || '').getTime();
        return dateB - dateA; // Latest first
      });
    } else if (filters.orderFilter === 'oldest_first') {
      // Sort by order ID ascending (001, 002, 003, etc.)
      filtered = filtered.sort((a, b) => {
        const orderIdA = parseInt(a.orderId || '0');
        const orderIdB = parseInt(b.orderId || '0');
        return orderIdA - orderIdB;
      });
    }

    // Debug logging removed for production

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
        
        // Trigger real-time update for Order Activity Log
        const event = new CustomEvent('orderUpdated', { 
          detail: { 
            orderId: orderToDelete._id,
            action: 'order_delete',
            timestamp: new Date().toISOString()
          } 
        });
        window.dispatchEvent(event);
        
        setShowDeleteModal(false);
        setOrderToDelete(null);
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.message || `Failed to delete order (${response.status})`;
        showMessage('error', errorMessage);
        console.error('Delete order error:', errorData);
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
    router.push(`/orders/orderdetails?id=${order._id}`);
  };

  const handleAddLab = (order: Order) => {
    setSelectedOrderForLab(order);
    setShowLabAddModal(true);
  };

  const handleViewLogs = (order: Order) => {
    setSelectedOrderForLogs(order);
    setShowLogsModal(true);
  };

  const handleLabData = (order: Order) => {
    setSelectedOrderForLabData(order);
    setShowLabDataModal(true);
  };

  const handleMillInput = (order: Order) => {
    // Clear cache before opening form
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('millInputFormCache');
      window.localStorage.removeItem('millInputFormData');
      window.localStorage.removeItem('millInputFormState');
      window.localStorage.setItem('millInputFormVersion', '2.0');
      window.localStorage.setItem('millInputFormForceNew', 'true');
    }
    setSelectedOrderForMillInputForm(order);
    setShowMillInputForm(true);
  };

  const handleImagePreview = (url: string, alt: string, allImages?: string[], startIndex?: number) => {
    if (allImages && allImages.length > 0) {
      setPreviewImages(allImages);
      setCurrentImageIndex(startIndex || 0);
      setPreviewImage({ url: allImages[startIndex || 0], alt });
    } else {
      setPreviewImages([url]);
      setCurrentImageIndex(0);
      setPreviewImage({ url, alt });
    }
    setShowImagePreview(true);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (previewImages.length <= 1) return;
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = currentImageIndex === 0 ? previewImages.length - 1 : currentImageIndex - 1;
    } else {
      newIndex = currentImageIndex === previewImages.length - 1 ? 0 : currentImageIndex + 1;
    }
    
    setCurrentImageIndex(newIndex);
    setPreviewImage({ url: previewImages[newIndex], alt: `Image ${newIndex + 1}` });
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!showImagePreview) return;
    
    if (e.key === 'ArrowLeft') {
      navigateImage('prev');
    } else if (e.key === 'ArrowRight') {
      navigateImage('next');
    } else if (e.key === 'Escape') {
      setShowImagePreview(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart(touch.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touch = e.touches[0];
    const diff = touchStart - touch.clientX;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        navigateImage('next');
      } else {
        navigateImage('prev');
      }
      setTouchStart(null);
    }
  };

  const [touchStart, setTouchStart] = useState<number | null>(null);

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  
  // Pagination debug info removed for production

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters.orderFilter, filters.typeFilter]);

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
    return order.items.reduce((total: number, item: any) => total + (item.quantity || 0), 0);
  };

  // Loading skeleton component - Table Layout
  const LoadingSkeleton = () => (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className={`h-8 w-48 rounded ${
            isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
          }`}></div>
          <div className={`h-4 w-32 rounded ${
            isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
          }`}></div>
        </div>
        <div className={`h-10 w-32 rounded-lg ${
          isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
        }`}></div>
      </div>

      {/* Search and Filters Skeleton */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className={`flex-1 h-12 rounded-lg ${
          isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
        }`}></div>
        <div className={`w-32 h-12 rounded-lg ${
          isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
        }`}></div>
      </div>

      {/* Orders Table Skeleton */}
      <div className={`rounded-lg border overflow-hidden ${
        isDarkMode
          ? 'bg-white/5 border-white/10'
          : 'bg-white border-gray-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Table Header Skeleton */}
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
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
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
            
            {/* Table Body Skeleton */}
            <tbody className={`divide-y ${
              isDarkMode ? 'divide-white/10' : 'divide-gray-200'
            }`}>
              {[...Array(8)].map((_, i) => (
                <tr key={i} className={`animate-pulse ${
                  isDarkMode ? 'bg-white/5' : 'bg-white'
                }`}>
                  {/* Order Info Column Skeleton */}
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className={`h-12 w-12 rounded-full ${
                        isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                      }`}></div>
                      <div className="ml-4 flex-1 space-y-2">
                        <div className={`h-4 w-16 rounded-full ${
                          isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                        }`}></div>
                        <div className={`h-3 w-20 rounded ${
                          isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                        }`}></div>
                        <div className={`h-3 w-24 rounded ${
                          isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                        }`}></div>
                      </div>
                    </div>
                  </td>

                  {/* Party Details Column Skeleton */}
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <div className={`h-4 w-24 rounded ${
                        isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                      }`}></div>
                      <div className={`h-3 w-20 rounded ${
                        isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                      }`}></div>
                      <div className={`h-3 w-16 rounded ${
                        isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                      }`}></div>
                    </div>
                  </td>

                  {/* Dates Column Skeleton */}
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <div className={`h-4 w-20 rounded ${
                        isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                      }`}></div>
                      <div className={`h-3 w-16 rounded ${
                        isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                      }`}></div>
                      <div className={`h-3 w-18 rounded ${
                        isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                      }`}></div>
                    </div>
                  </td>

                  {/* Items Column Skeleton */}
                  <td className="px-4 py-4">
                    <div className="space-y-2">
                      <div className={`h-4 w-12 rounded ${
                        isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                      }`}></div>
                      <div className="flex flex-wrap gap-1">
                        {[...Array(2)].map((_, itemIndex) => (
                          <div key={itemIndex} className={`h-6 w-16 rounded-full ${
                            isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                          }`}></div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`h-4 w-4 rounded ${
                          isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                        }`}></div>
                        <div className={`h-3 w-8 rounded ${
                          isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                        }`}></div>
                      </div>
                    </div>
                  </td>

                  {/* Status Column Skeleton */}
                  <td className="px-6 py-4">
                    <div className={`h-6 w-16 rounded-full ${
                      isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                    }`}></div>
                  </td>

                  {/* Actions Column Skeleton */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded ${
                        isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                      }`}></div>
                      <div className={`h-8 w-8 rounded ${
                        isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                      }`}></div>
                      <div className={`h-8 w-8 rounded ${
                        isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                      }`}></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );


  
  if (!mounted) return null;

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton />
        {/* Simple loading message for better UX */}
        <div className={`text-center py-8 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="text-xl font-semibold">Loading Orders...</span>
          </div>
          <p className="text-sm text-gray-500 mb-2">This may take a few moments depending on your connection</p>
          <p className="text-xs text-gray-400">If loading takes too long, please check your internet connection</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Enhanced Message System Styles */}
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes glowPulse {
          0%, 100% {
            box-shadow: 0 0 5px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
          }
        }
        
        @keyframes errorGlow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(239, 68, 68, 0.3);
          }
          50% {
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.6);
          }
        }
        
        @keyframes successGlow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(34, 197, 94, 0.3);
          }
          50% {
            box-shadow: 0 0 20px rgba(34, 197, 94, 0.6);
          }
        }
        
        .message-enter {
          animation: slideInRight 0.3s ease-out forwards;
        }
        
        .message-exit {
          animation: slideOutRight 0.3s ease-in forwards;
        }
        
        .validation-error {
          animation: fadeInUp 0.3s ease-out forwards;
        }
        
        .glow-pulse {
          animation: glowPulse 2s ease-in-out infinite;
        }
        
        .error-glow {
          animation: errorGlow 2s ease-in-out infinite;
        }
        
        .success-glow {
          animation: successGlow 2s ease-in-out infinite;
        }
        
        /* Dark mode specific enhancements */
        .dark .message-container {
          backdrop-filter: blur(10px);
          background: rgba(31, 41, 55, 0.95);
        }
        
        .dark .validation-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        
        .dark .input-error {
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
        }
      `}</style>
      
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
              
              {/* Add Mill Input */}
              <button
                onClick={() => {
                  setShowQuickActions(false);
                  // Show a message to select a specific order
                  showMessage('info', 'Please select a specific order to add mill input', { autoDismiss: true, dismissTime: 3000 });
                }}
                className={`group p-3 rounded-lg border transition-all duration-200 hover:scale-105 ${
                  isDarkMode
                    ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/40'
                    : 'bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100 hover:border-cyan-300'
                }`}
              > gi
                <BuildingOfficeIcon className="h-5 w-5 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-medium">Add Mill Input</div>
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

      {/* Enhanced Message System */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`transform transition-all duration-300 ease-out ${
              isDarkMode ? 'bg-gray-800/95 border-gray-600 backdrop-blur-sm' : 'bg-white border-gray-200'
            } rounded-lg border shadow-lg p-4 max-w-sm ${
              message.type === 'success'
                ? isDarkMode
                  ? 'border-green-500/40 bg-green-900/30 shadow-green-500/20'
                  : 'border-green-200 bg-green-50'
                : message.type === 'warning'
                ? isDarkMode
                  ? 'border-yellow-500/40 bg-yellow-900/30 shadow-yellow-500/20'
                  : 'border-yellow-200 bg-yellow-50'
                : message.type === 'info'
                ? isDarkMode
                  ? 'border-blue-500/40 bg-blue-900/30 shadow-blue-500/20'
                  : 'border-blue-200 bg-blue-50'
                : isDarkMode
                  ? 'border-red-500/40 bg-red-900/30 shadow-red-500/20'
                  : 'border-red-200 bg-red-50'
            } ${isDarkMode ? 'backdrop-blur-md' : ''}`}
            style={{
              transform: `translateX(${index * 10}px)`,
              animation: 'slideInRight 0.3s ease-out',
              boxShadow: isDarkMode ? 
                message.type === 'success' ? '0 4px 20px rgba(34, 197, 94, 0.3)' :
                message.type === 'warning' ? '0 4px 20px rgba(234, 179, 8, 0.3)' :
                message.type === 'info' ? '0 4px 20px rgba(59, 130, 246, 0.3)' :
                '0 4px 20px rgba(239, 68, 68, 0.3)' : undefined
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 ${
                  message.type === 'success'
                    ? isDarkMode ? 'text-green-400' : 'text-green-500'
                    : message.type === 'warning'
                    ? isDarkMode ? 'text-yellow-400' : 'text-yellow-500'
                    : message.type === 'info'
                    ? isDarkMode ? 'text-blue-400' : 'text-blue-500'
                    : isDarkMode ? 'text-red-400' : 'text-red-500'
                }`}>
                  {message.type === 'success' ? (
                    <CheckIcon className="h-5 w-5" />
                  ) : message.type === 'warning' ? (
                    <WarningIcon className="h-5 w-5" />
                  ) : message.type === 'info' ? (
                    <ChartBarIcon className="h-5 w-5" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    message.type === 'success'
                      ? isDarkMode ? 'text-green-300' : 'text-green-800'
                      : message.type === 'warning'
                      ? isDarkMode ? 'text-yellow-300' : 'text-yellow-800'
                      : message.type === 'info'
                      ? isDarkMode ? 'text-blue-300' : 'text-blue-800'
                      : isDarkMode ? 'text-red-300' : 'text-red-800'
                  }`}>
                    {message.text}
                  </p>
                </div>
              </div>
              <button
                onClick={() => dismissMessage(message.id)}
                className={`flex-shrink-0 ml-3 p-1.5 rounded-full transition-all duration-200 hover:scale-110 ${
                  message.type === 'success'
                    ? isDarkMode ? 'hover:bg-green-500/20 text-green-400 hover:text-green-300' : 'hover:bg-green-100 text-green-500'
                    : message.type === 'warning'
                    ? isDarkMode ? 'hover:bg-yellow-500/20 text-yellow-400 hover:text-yellow-300' : 'hover:bg-yellow-100 text-yellow-500'
                    : message.type === 'info'
                    ? isDarkMode ? 'hover:bg-blue-500/20 text-blue-400 hover:text-blue-300' : 'hover:bg-blue-100 text-blue-500'
                    : isDarkMode ? 'hover:bg-red-500/20 text-red-400 hover:text-red-300' : 'hover:bg-red-100 text-red-500'
                }`}
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Validation Errors Summary */}
      {Object.keys(validationErrors).length > 0 && (
        <div className={`p-4 rounded-lg border mb-4 transition-all duration-300 ${
          isDarkMode 
            ? 'bg-red-900/30 border-red-500/40 shadow-red-500/20 backdrop-blur-sm' 
            : 'bg-red-50 border-red-200'
        }`}
        style={{
          boxShadow: isDarkMode ? '0 4px 20px rgba(239, 68, 68, 0.2)' : undefined
        }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className={`p-1.5 rounded-full ${
                isDarkMode ? 'bg-red-500/20' : 'bg-red-100'
              }`}>
                <ExclamationTriangleIcon className={`h-5 w-5 ${
                  isDarkMode ? 'text-red-400' : 'text-red-600'
                }`} />
              </div>
              <span className={`font-semibold ${
                isDarkMode ? 'text-red-300' : 'text-red-700'
              }`}>
                Validation Issues Found
              </span>
            </div>
            <button
              onClick={() => setValidationErrors({})}
              className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${
                isDarkMode ? 'hover:bg-red-500/20 text-red-400 hover:text-red-300' : 'hover:bg-red-100 text-red-600'
              }`}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
          <ul className={`text-sm space-y-2 ${
            isDarkMode ? 'text-red-200' : 'text-red-600'
          }`}>
            {Object.entries(validationErrors).map(([field, error]) => (
              <li key={field} className="flex items-center p-2 rounded-lg transition-all duration-200 hover:bg-red-500/10">
                <span className={`w-2 h-2 rounded-full mr-3 ${
                  isDarkMode ? 'bg-red-400' : 'bg-red-500'
                }`}></span>
                <span className="flex-1">{error}</span>
              </li>
            ))}
          </ul>
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
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-all duration-300 ${
                    isDarkMode
                      ? 'bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  } ${validationErrors.searchTerm ? 
                    isDarkMode 
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20 shadow-red-500/20' 
                      : 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                    : ''}`}
                  style={{
                    boxShadow: validationErrors.searchTerm && isDarkMode ? '0 0 0 3px rgba(248, 113, 113, 0.1)' : undefined
                  }}
                />
                {validationErrors.searchTerm && (
                  <div className={`absolute -bottom-6 left-0 text-xs flex items-center p-1.5 rounded-md transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-red-900/50 text-red-300 border border-red-500/30' 
                      : 'bg-red-50 text-red-600 border border-red-200'
                  }`}>
                    <ExclamationTriangleIcon className="h-3 w-3 mr-1.5 flex-shrink-0" />
                    <span className="font-medium">{validationErrors.searchTerm}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Refresh Button */}
            <div className="sm:w-auto">
              <button
                onClick={() => {
                  // Manual refresh clicked
                  handleRefresh();
                }}
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
            {/* Order Filter Dropdown */}
            <div className="sm:w-48">
              <select
                value={filters.orderFilter}
                onChange={(e) => setFilters({ ...filters, orderFilter: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border transition-all duration-300 appearance-none cursor-pointer ${
                  isDarkMode
                    ? 'bg-white/10 border-white/20 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-white/30'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                } ${validationErrors.orderFilter ? 
                  isDarkMode 
                    ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20 shadow-red-500/20' 
                    : 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                  : ''}`}
                style={{
                  boxShadow: validationErrors.orderFilter && isDarkMode ? '0 0 0 3px rgba(248, 113, 113, 0.1)' : undefined,
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='${isDarkMode ? 'rgb(156 163 175)' : 'rgb(107 114 128)'}' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="oldest_first" className={isDarkMode ? 'bg-[#1D293D] text-white' : 'bg-white text-gray-900'}>Oldest First</option>
                <option value="latest_first" className={isDarkMode ? 'bg-[#1D293D] text-white' : 'bg-white text-gray-900'}>Latest First</option>
              </select>
            </div>

            {/* Order Type Filter Dropdown */}
            <div className="sm:w-48">
              <select
                value={filters.typeFilter}
                onChange={(e) => setFilters({ ...filters, typeFilter: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border transition-all duration-300 appearance-none cursor-pointer ${
                  isDarkMode
                    ? 'bg-white/10 border-white/20 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-white/30'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                } ${validationErrors.typeFilter ? 
                  isDarkMode 
                    ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20 shadow-red-500/20' 
                    : 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                  : ''}`}
                style={{
                  boxShadow: validationErrors.typeFilter && isDarkMode ? '0 0 0 3px rgba(248, 113, 113, 0.1)' : undefined,
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='${isDarkMode ? 'rgb(156 163 175)' : 'rgb(107 114 128)'}' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="all" className={isDarkMode ? 'bg-[#1D293D] text-white' : 'bg-white text-gray-900'}>All Types</option>
                <option value="Dying" className={isDarkMode ? 'bg-[#1D293D] text-white' : 'bg-white text-gray-900'}>Dying</option>
                <option value="Printing" className={isDarkMode ? 'bg-[#1D293D] text-white' : 'bg-white text-gray-900'}>Printing</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className={`rounded-xl border overflow-hidden shadow-lg ${
        isDarkMode
          ? 'bg-white/5 border-white/10 shadow-2xl'
          : 'bg-white border-gray-200 shadow-xl'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
                                                   <thead className={`${
                isDarkMode
                  ? 'bg-gradient-to-r from-gray-800/50 to-gray-700/50 border-b border-white/10'
                  : 'bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200'
              }`}>
                <tr>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Order Info
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Party Details
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Dates
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Items
                  </th>
                  

                  
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Status
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Actions
                  </th>
                </tr>
              </thead>
            <tbody className={`divide-y ${
              isDarkMode ? 'divide-white/10' : 'divide-gray-200'
            }`}>
              {/* Rendering table with orders */}
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
                               {order.orderType || 'Not selected'}
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
                         {(order.party as any)?.name || 'Not selected'}
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
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Arrival: {order.arrivalDate ? formatDate(order.arrivalDate) : 'Not selected'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            PO: {order.poDate ? formatDate(order.poDate) : 'Not selected'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Delivery: {order.deliveryDate ? formatDate(order.deliveryDate) : 'Not selected'}
                          </span>
                        </div>
                      </div>
                    </td>

                                       {/* Items Column */}
                    <td className="px-4 py-3">
                      <div className="space-y-1.5">
                        <div className={`text-xs font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {order.items.length} items
                        </div>
                        {order.items.map((item, index) => (
                          <div key={index} className={`p-2.5 rounded-lg border transition-all duration-200 hover:shadow-sm ${
                            isDarkMode 
                              ? 'bg-gray-800/50 border-gray-600 hover:bg-gray-800/70' 
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}>
                            {/* Item Header */}
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {(item.quality as any)?.name || 'Not selected'}
                              </span>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                isDarkMode 
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                                  : 'bg-blue-100 text-blue-700 border border-blue-200'
                              }`}>
                                Qty: {item.quantity || 0}
                              </span>
                            </div>
                            
                            {/* Description */}
                            {item.description && (
                              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1.5 italic`}>
                                "{item.description}"
                              </div>
                            )}
                            
                            {/* Weaver / Supplier Name */}
                            {item.weaverSupplierName && (
                              <div className={`text-xs ${isDarkMode ? 'text-orange-300' : 'text-orange-600'} mb-1`}>
                                Weaver: {item.weaverSupplierName}
                              </div>
                            )}
                            
                            {/* Purchase Rate */}
                            {item.purchaseRate && (
                              <div className={`text-xs ${isDarkMode ? 'text-green-300' : 'text-green-600'} mb-1`}>
                                Rate: ₹{Number(item.purchaseRate).toFixed(2)}
                              </div>
                            )}
                            

                            
                            {/* Item Images Display - Improved */}
                            {item.imageUrls && item.imageUrls.length > 0 && (
                              <div className="mt-2">
                                <div className="flex items-center gap-1 mb-2">
                                  <PhotoIcon className="h-3 w-3" />
                                  <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Images ({item.imageUrls.length})
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {/* Show first image */}
                                  <div className="relative group">
                                    <img 
                                      src={item.imageUrls[0]} 
                                      alt={`Item ${index + 1} image 1`}
                                      className="w-8 h-8 object-cover rounded border cursor-pointer hover:scale-110 transition-transform duration-200"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                      onClick={() => handleImagePreview(item.imageUrls![0], `Item ${index + 1} - Image 1`, item.imageUrls, 0)}
                                    />
                                  </div>
                                  
                                  {/* Show +N indicator if more images */}
                                  {item.imageUrls.length > 1 && (
                                    <div className="relative group">
                                      <div className="w-8 h-8 rounded border flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-200 bg-gray-100 dark:bg-gray-700">
                                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                                          +{item.imageUrls.length - 1}
                                        </span>
                                      </div>
                                      <button
                                        onClick={() => handleImagePreview(item.imageUrls![1], `Item ${index + 1} - Image 2`, item.imageUrls, 1)}
                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded flex items-center justify-center"
                                      >
                                        <PhotoIcon className="h-2.5 w-2.5 text-white" />
                                      </button>
                                    </div>
                                  )}
                                  
                                  {/* Show third image if exists */}
                                  {item.imageUrls.length > 2 && (
                                    <div className="relative group">
                                      <img 
                                        src={item.imageUrls[2]} 
                                        alt={`Item ${index + 1} image 3`}
                                        className="w-8 h-8 object-cover rounded border cursor-pointer hover:scale-110 transition-transform duration-200"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                        }}
                                        onClick={() => handleImagePreview(item.imageUrls![2], `Item ${index + 1} - Image 3`, item.imageUrls, 2)}
                                      />
                                    </div>
                                  )}
                                  
                                  {/* Show +N indicator if more than 3 images */}
                                  {item.imageUrls.length > 3 && (
                                    <div className="relative group">
                                      <div className="w-8 h-8 rounded border flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-200 bg-gray-100 dark:bg-gray-700">
                                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                                          +{item.imageUrls.length - 3}
                                        </span>
                                      </div>
                                      <button
                                        onClick={() => handleImagePreview(item.imageUrls![3], `Item ${index + 1} - Image 4`, item.imageUrls, 3)}
                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded flex items-center justify-center"
                                      >
                                        <PhotoIcon className="h-2.5 w-2.5 text-white" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {/* Show +N indicator if more than 2 items */}
                        {order.items.length > 2 && (
                          <div className={`p-2 rounded-lg border-2 border-dashed text-center cursor-pointer transition-all duration-200 hover:scale-105 ${
                            isDarkMode 
                              ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300 hover:bg-gray-800/30' 
                              : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600 hover:bg-gray-50'
                          }`}>
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-xs font-medium">
                                +{order.items.length - 2} more item{order.items.length - 2 !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        )}
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
                      <div className="grid grid-cols-4 gap-2 w-full max-w-sm">
                        {/* First Row - Primary Actions */}
                        {/* View Button */}
                        <button
                          onClick={() => handleView(order)}
                          className={`group inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 shadow-sm ${
                            isDarkMode
                              ? 'bg-blue-600/25 text-blue-200 border border-blue-500/50 hover:bg-blue-600/35 hover:border-blue-400/60 hover:shadow-blue-500/25'
                              : 'bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200 hover:border-blue-400 hover:shadow-blue-200'
                          }`}
                          title="View order details"
                        >
                          <EyeIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          <span className="hidden sm:inline font-medium">View</span>
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleEdit(order)}
                          className={`group inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 shadow-sm ${
                            isDarkMode
                              ? 'bg-emerald-600/25 text-emerald-200 border border-emerald-500/50 hover:bg-emerald-600/35 hover:border-emerald-400/60 hover:shadow-emerald-500/25'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200 hover:border-emerald-400 hover:shadow-emerald-200'
                          }`}
                          title="Edit order"
                        >
                          <PencilIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          <span className="hidden sm:inline font-medium">Edit</span>
                        </button>

                        {/* Logs Button */}
                        <button
                          onClick={() => handleViewLogs(order)}
                          className={`group inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 shadow-sm ${
                            isDarkMode
                              ? 'bg-violet-600/25 text-violet-200 border border-violet-500/50 hover:bg-violet-600/35 hover:border-violet-400/60 hover:shadow-violet-500/25'
                              : 'bg-violet-100 text-violet-800 border border-violet-300 hover:bg-violet-200 hover:border-violet-400 hover:shadow-violet-200'
                          }`}
                          title="View order logs"
                        >
                          <ChartBarIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          <span className="hidden sm:inline font-medium">Logs</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteClick(order)}
                          className={`group inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 shadow-sm ${
                            isDarkMode
                              ? 'bg-red-600/25 text-red-200 border border-red-500/50 hover:bg-red-600/35 hover:border-red-400/60 hover:shadow-red-500/25'
                              : 'bg-red-100 text-red-800 border border-red-300 hover:bg-red-200 hover:border-red-400 hover:shadow-red-200'
                          }`}
                          title="Delete order"
                        >
                          <TrashIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          <span className="hidden sm:inline font-medium">Delete</span>
                        </button>

                        {/* Second Row - Secondary Actions */}
                        {/* Lab Data Button */}
                        <button
                          onClick={() => handleLabData(order)}
                          className={`group inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 shadow-sm ${
                            order.items.some(item => item.labData?.sampleNumber)
                              ? isDarkMode
                                ? 'bg-emerald-600/25 text-emerald-200 border border-emerald-500/50 hover:bg-emerald-600/35 hover:border-emerald-400/60 hover:shadow-emerald-500/25'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200 hover:border-emerald-400 hover:shadow-emerald-200'
                              : isDarkMode
                                ? 'bg-amber-600/25 text-amber-200 border border-amber-500/50 hover:bg-amber-600/35 hover:border-amber-400/60 hover:shadow-amber-500/25'
                                : 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 hover:border-amber-400 hover:shadow-amber-200'
                          }`}
                          title="Manage lab data"
                        >
                          <BeakerIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          <span className="hidden sm:inline font-medium">Lab</span>
                        </button>

                        {/* Mill Input Button */}
                        <button
                          onClick={async () => {
                            // Check if there are existing mill inputs for this order using the already loaded state
                            const existingInputs = orderMillInputs[order.orderId] || [];
                            
                            console.log('=== Mill Input Button Click Debug ===');
                            console.log('Order ID:', order.orderId);
                            console.log('orderMillInputs state:', orderMillInputs);
                            console.log('Mill inputs for this order from state:', existingInputs);
                            
                            if (existingInputs.length > 0) {
                              // Edit existing mill inputs
                              console.log('Setting EDIT mode with existing inputs:', existingInputs);
                              setIsEditingMillInput(true);
                              setExistingMillInputs(existingInputs);
                            } else {
                              // Add new mill inputs
                              console.log('Setting ADD mode - no existing inputs');
                              setIsEditingMillInput(false);
                              setExistingMillInputs([]);
                            }
                            
                            // Clear cache before opening form
                            if (typeof window !== 'undefined') {
                              window.localStorage.removeItem('millInputFormCache');
                              window.localStorage.removeItem('millInputFormData');
                              window.localStorage.removeItem('millInputFormState');
                              window.localStorage.setItem('millInputFormVersion', '2.0');
                              window.localStorage.setItem('millInputFormForceNew', 'true');
                            }
                            setSelectedOrderForMillInputForm(order);
                            setShowMillInputForm(true);
                          }}
                          className={`group inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 shadow-sm ${
                            orderMillInputs[order.orderId] && orderMillInputs[order.orderId].length > 0
                              ? isDarkMode
                                ? 'bg-emerald-600/25 text-emerald-200 border border-emerald-500/50 hover:bg-emerald-600/35 hover:border-emerald-400/60 hover:shadow-emerald-500/25'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200 hover:border-emerald-400 hover:shadow-emerald-200'
                              : isDarkMode
                                ? 'bg-cyan-600/25 text-cyan-200 border border-cyan-500/50 hover:bg-cyan-600/35 hover:border-cyan-400/60 hover:shadow-cyan-500/25'
                                : 'bg-cyan-100 text-cyan-800 border border-cyan-300 hover:bg-cyan-200 hover:border-cyan-400 hover:shadow-cyan-200'
                          }`}
                          title={orderMillInputs[order.orderId] && orderMillInputs[order.orderId].length > 0 ? "Edit mill input" : "Add mill input"}
                        >
                          <BuildingOfficeIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          <span className="hidden sm:inline font-medium">
                            {orderMillInputs[order.orderId] && orderMillInputs[order.orderId].length > 0 ? 'Edit Mill' : 'Mill In'}
                          </span>
                        </button>

                        {/* Mill Output Button */}
                        <button
                          onClick={() => {
                            setSelectedOrderForMillOutput(order);
                            setShowMillOutputForm(true);
                          }}
                          className={`group inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 shadow-sm ${
                            isDarkMode
                              ? 'bg-teal-600/25 text-teal-200 border border-teal-500/50 hover:bg-teal-600/35 hover:border-teal-400/60 hover:shadow-teal-500/25'
                              : 'bg-teal-100 text-teal-800 border border-teal-300 hover:bg-teal-200 hover:border-teal-400 hover:shadow-teal-200'
                          }`}
                          title="Add mill output"
                        >
                          <DocumentTextIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          <span className="hidden sm:inline font-medium">Mill Out</span>
                        </button>

                        {/* Dispatch Button */}
                        <button
                          onClick={() => {
                            setSelectedOrderForDispatch(order);
                            setShowDispatchForm(true);
                          }}
                          className={`group inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 shadow-sm ${
                            isDarkMode
                              ? 'bg-orange-600/25 text-orange-200 border border-orange-500/50 hover:bg-orange-600/35 hover:border-orange-400/60 hover:shadow-orange-500/25'
                              : 'bg-orange-100 text-orange-800 border border-orange-300 hover:bg-orange-200 hover:border-orange-400 hover:shadow-orange-200'
                          }`}
                          title="Add dispatch"
                        >
                          <TruckIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          <span className="hidden sm:inline font-medium">Dispatch</span>
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
            {loading ? (
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p>Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="space-y-4">
                <div className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <svg className={`h-8 w-8 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-400'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <div>
                  <h3 className={`text-lg font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-900'
                  }`}>
                    No orders yet
                  </h3>
                  <p className="mt-2">Get started by creating your first order</p>
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm transition-colors ${
                    isDarkMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Order
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <svg className={`h-8 w-8 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-400'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className={`text-lg font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-900'
                  }`}>
                    No orders match your search
                  </h3>
                  <p className="mt-2">Try adjusting your search criteria or filters</p>
                </div>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilters({ orderFilter: 'oldest_first', typeFilter: 'all' });
                  }}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm transition-colors ${
                    isDarkMode
                      ? 'bg-gray-600 hover:bg-gray-700 text-white'
                      : 'bg-gray-600 hover:bg-gray-700 text-white'
                  }`}
                >
                  Clear Filters
                </button>
              </div>
            )}
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

             {showLabAddModal && selectedOrderForLab && (
         <LabAddModal
           isOpen={showLabAddModal}
           order={selectedOrderForLab}
           onClose={() => {
             setShowLabAddModal(false);
             setSelectedOrderForLab(null);
           }}
           onLabDataUpdate={() => {
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
          <div 
            className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setShowImagePreview(false);
                setPreviewImages([]);
                setCurrentImageIndex(0);
                setPreviewImage(null);
              }}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors duration-200"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            
            {/* Navigation Buttons - Only show if multiple images */}
            {previewImages.length > 1 && (
              <>
                {/* Previous Button */}
                <button
                  onClick={() => navigateImage('prev')}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors duration-200"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                {/* Next Button */}
                <button
                  onClick={() => navigateImage('next')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors duration-200"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
            
            {/* Image */}
            <img
              src={previewImage.url}
              alt={previewImage.alt}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            
            {/* Image Info with Navigation */}
            <div className="absolute bottom-4 left-4 right-4 bg-black/50 text-white p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{previewImage.alt}</p>
                {previewImages.length > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-300">
                      {currentImageIndex + 1} of {previewImages.length}
                    </span>
                    {/* Image Dots Indicator */}
                    <div className="flex gap-1">
                      {previewImages.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full transition-all duration-200 ${
                            index === currentImageIndex 
                              ? 'bg-white' 
                              : 'bg-white/40'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Keyboard/Touch Instructions */}
            <div className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded-lg text-xs">
              <div className="flex items-center gap-2">
                <span>← → Arrow keys or swipe</span>
                <span>ESC to close</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Logs Modal */}
      {showLogsModal && selectedOrderForLogs && (
        <OrderLogsModal
          orderId={selectedOrderForLogs._id}
          orderNumber={selectedOrderForLogs.orderId}
          onClose={() => {
            setShowLogsModal(false);
            setSelectedOrderForLogs(null);
          }}
        />
      )}

      {/* Lab Data Modal */}
      {showLabDataModal && selectedOrderForLabData && (
        <LabDataModal
          isOpen={showLabDataModal}
          onClose={() => {
            setShowLabDataModal(false);
            setSelectedOrderForLabData(null);
          }}
          order={selectedOrderForLabData} //@ts-ignore  
          onLabDataUpdate={() => {
            fetchOrders();
            showMessage('success', 'Lab data updated successfully!');
          }}
        />
      )}



      {/* Mill Input Form */}
      {showMillInputForm && selectedOrderForMillInputForm && (
        <MillInputForm
          key={`mill-input-form-${selectedOrderForMillInputForm.orderId}`}
          order={selectedOrderForMillInputForm}
          mills={mills}
          onClose={() => {
            setShowMillInputForm(false);
            setSelectedOrderForMillInputForm(null);
            setIsEditingMillInput(false);
            setExistingMillInputs([]);
            // Clear cache when closing
            if (typeof window !== 'undefined') {
              window.localStorage.removeItem('millInputFormCache');
              window.localStorage.removeItem('millInputFormData');
            }
          }}
                      onSuccess={() => {
              // Refresh orders and mill inputs to show any updates
              fetchOrders();
              fetchAllOrderMillInputs();
              
              // Debug: Check if data is updated
              setTimeout(() => {
                console.log('After onSuccess - orderMillInputs state:', orderMillInputs);
                console.log('Current order ID:', selectedOrderForMillInputForm?.orderId);
                console.log('Mill inputs for current order:', orderMillInputs[selectedOrderForMillInputForm?.orderId || ''] || []);
              }, 100);
              
              const message = isEditingMillInput ? 'Mill input updated successfully!' : 'Mill input added successfully!';
              showMessage('success', message);
            }}
          onAddMill={() => {
            // This will be handled within the form
          }}
          onRefreshMills={fetchMills}
          isEditing={isEditingMillInput}
          existingMillInputs={existingMillInputs}
        />
      )}

      {/* Mill Output Form */}
      {showMillOutputForm && selectedOrderForMillOutput && (
        <MillOutputForm
          order={selectedOrderForMillOutput}
          onClose={() => {
            setShowMillOutputForm(false);
            setSelectedOrderForMillOutput(null);
          }}
          onSuccess={() => {
            // Refresh orders to show any updates
            fetchOrders();
            showMessage('success', 'Mill output added successfully!');
          }}
        />
      )}

      {/* Dispatch Form */}
      {showDispatchForm && selectedOrderForDispatch && (
        <DispatchForm
          orderId={selectedOrderForDispatch.orderId}
          onClose={() => {
            setShowDispatchForm(false);
            setSelectedOrderForDispatch(null);
          }}
          onSuccess={() => {
            // Refresh orders to show any updates
            fetchOrders();
            showMessage('success', 'Dispatch record added successfully!');
          }}
        />
      )}
    </div>
    </>
  );
}