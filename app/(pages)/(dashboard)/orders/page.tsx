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
  TruckIcon,
  CubeIcon,
  Squares2X2Icon,
  ListBulletIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import OrderForm from './components/OrderForm';

import PartyModal from './components/PartyModal';
import QualityModal from './components/QualityModal';
import LabAddModal from './components/LabDataModal';
import { generateOrderPDF } from '@/lib/pdfGenerator';
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
  
  // Item deletion confirmation state
  const [showItemDeleteModal, setShowItemDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{orderId: string, itemId: string | number, itemName: string} | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);
  
  // Status change confirmation state
  const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);
  const [statusChangeData, setStatusChangeData] = useState<{orderId: string, newStatus: "pending" | "delivered", orderIdDisplay: string} | null>(null);
  const [changingStatus, setChangingStatus] = useState(false);
  const [screenSize, setScreenSize] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'All'>(10);
  const itemsPerPageOptions = [10, 25, 50, 100, 'All'] as const;
  const [paginationInfo, setPaginationInfo] = useState({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [isChangingPage, setIsChangingPage] = useState(false);
  
  // Handle view mode changes
  const handleViewModeChange = (newMode: 'table' | 'cards') => {
    setViewMode(newMode);
    localStorage.setItem('ordersViewMode', newMode);
  };
  
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const [resettingCounter, setResettingCounter] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; alt: string } | null>(null);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
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
  const [existingMillOutputs, setExistingMillOutputs] = useState<any[]>([]);
  const [isEditingMillOutput, setIsEditingMillOutput] = useState(false);
  const [orderMillOutputs, setOrderMillOutputs] = useState<{[key: string]: any[]}>({});
  const [showDispatchForm, setShowDispatchForm] = useState(false);
  const [selectedOrderForDispatch, setSelectedOrderForDispatch] = useState<Order | null>(null);
  const [existingDispatches, setExistingDispatches] = useState<any[]>([]);
  const [isEditingDispatch, setIsEditingDispatch] = useState(false);
  const [orderDispatches, setOrderDispatches] = useState<{[key: string]: any[]}>({});
  const [mills, setMills] = useState<Mill[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [isValidating, setIsValidating] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(() => {
    if (typeof window !== 'undefined') {
      const savedViewMode = localStorage.getItem('ordersViewMode');
      return savedViewMode === 'cards' ? 'cards' : 'table';
    }
    return 'table';
  });

  // Filters
  const [filters, setFilters] = useState({
    orderFilter: 'latest_first', // latest_first, oldest_first - default to latest first (by creation date)
    typeFilter: 'all', // all, Dying, Printing
    statusFilter: 'all' // all, pending, delivered
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

  // Simple search without validation messages
  const handleSearchChange = useCallback((value: string) => {
    const trimmedValue = value.trim();
    setSearchTerm(trimmedValue);
  }, []);

  // Optimized fetch functions with retry logic and better timeout handling
  const fetchOrders = useCallback(async (retryCount = 0, page = currentPage, limit = itemsPerPage) => {
    const maxRetries = 1; // Single retry for faster failure
    const baseTimeout = 5000; // 5 seconds base timeout
    const timeoutIncrement = 1000; // Add 1 second per retry
    
    try {
      const controller = new AbortController();
      const timeout = baseTimeout + (retryCount * timeoutIncrement);
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const token = localStorage.getItem('token');
      if (!token) {
        showMessage('error', 'Please login to view orders', { autoDismiss: true, dismissTime: 3000 });
        return;
      }
      
      // Build URL with pagination and filter parameters
      const url = new URL('/api/orders', window.location.origin);
      const limitValue = limit === 'All' ? 1000 : Math.max(limit, 100); // Ensure minimum 100 orders for search
      url.searchParams.append('limit', limitValue.toString());
      url.searchParams.append('page', page.toString());
      
      // Search is handled client-side for better performance
      if (filters.typeFilter && filters.typeFilter !== 'all') {
        url.searchParams.append('type', filters.typeFilter);
      }
      if (filters.statusFilter && filters.statusFilter !== 'all') {
        url.searchParams.append('status', filters.statusFilter);
      }
      if (filters.orderFilter && filters.orderFilter !== 'latest_first') {
        url.searchParams.append('sort', filters.orderFilter);
      }
      
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Handle authentication error
          showMessage('error', 'Session expired. Please login again.', { autoDismiss: false });
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const ordersData = data.data || [];
        setOrders(ordersData);
        setLastRefreshTime(new Date());
        
        // Update pagination info if available, otherwise use fallback
        if (data.pagination) {
          setPaginationInfo({
            totalCount: data.pagination.total || 0,
            totalPages: data.pagination.pages || 1,
            currentPage: data.pagination.page || 1,
            hasNextPage: (data.pagination.page || 1) < (data.pagination.pages || 1),
            hasPrevPage: (data.pagination.page || 1) > 1
          });
        } else {
          // Fallback pagination info based on orders length
          const ordersLength = ordersData.length;
          const calculatedPages = Math.ceil(ordersLength / (limitValue as number));
          
          // If we have orders but no pagination data, use orders length
          // If we have no orders, check if there's a totalCount in the response
          const totalCount = ordersLength > 0 ? ordersLength : (data.totalCount || 0);
          
          setPaginationInfo({
            totalCount: totalCount,
            totalPages: Math.max(1, Math.ceil(totalCount / (limitValue as number))),
            currentPage: page,
            hasNextPage: page < Math.ceil(totalCount / (limitValue as number)),
            hasPrevPage: page > 1
          });
        }
      } else {
        throw new Error(data.message || 'Failed to fetch orders');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        if (retryCount < maxRetries) {
          // Silent retry without showing message
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          return fetchOrders(retryCount + 1, page, limit);
        } else {
          setLoading(false);
        }
      } else if (error.message?.includes('Failed to fetch')) {
        setLoading(false);
      } else {
        setLoading(false);
      }
      throw error;
    }
  }, [showMessage, currentPage, itemsPerPage, filters]);

  // Pagination handlers
  const handlePageChange = async (newPage: number) => {
    if (newPage === currentPage) return;
    
    // Validate page number
    if (newPage < 1 || newPage > totalPages) {
      return;
    }
    
    setIsChangingPage(true);
    setCurrentPage(newPage);
    // No need to fetch from server - client-side pagination handles this
    setIsChangingPage(false);
  };

  const handleItemsPerPageChange = async (newItemsPerPage: number | 'All') => {
    if (newItemsPerPage === itemsPerPage) return;
    
    setIsChangingPage(true);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
    
    // For better UX, fetch all orders and use client-side pagination
    await fetchOrders(0, 1, 'All');
    setIsChangingPage(false);
  };

  // Calculate total pages based on filtered orders (client-side pagination)
  const totalPages = useMemo(() => {
    // Get total filtered orders count
    const filteredCount = orders.filter(order => {
      const matchesSearch = searchTerm === '' || (
        (order.orderId && order.orderId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.poNumber && order.poNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.styleNo && order.styleNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.party && typeof order.party === 'object' && order.party.name && order.party.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      const matchesType = filters.typeFilter === 'all' || order.orderType === filters.typeFilter;
      
      // Enhanced status logic - if no status set or status is not 'delivered', default to pending
      const orderStatus = order.status;
      let normalizedStatus = 'pending'; // Default to pending
      
      if (orderStatus === 'delivered') {
        normalizedStatus = 'delivered';
      } else {
        // Any other status (including null, undefined, 'pending', etc.) is treated as pending
        normalizedStatus = 'pending';
      }
      
      const matchesStatus = filters.statusFilter === 'all' || normalizedStatus === filters.statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    }).length;
    
    // If "All" selected, show all on one page
    if (itemsPerPage === 'All') return 1;
    
    const itemsPerPageValue = itemsPerPage as number;
    const calculatedPages = Math.ceil(filteredCount / itemsPerPageValue);
    return Math.max(1, calculatedPages);
  }, [orders, searchTerm, filters, itemsPerPage]);

  // Calculate pagination display info for client-side pagination
  const paginationDisplayInfo = useMemo(() => {
    const filteredCount = orders.filter(order => {
      const matchesSearch = searchTerm === '' || (
        (order.orderId && order.orderId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.poNumber && order.poNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.styleNo && order.styleNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.party && typeof order.party === 'object' && order.party.name && order.party.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      const matchesType = filters.typeFilter === 'all' || order.orderType === filters.typeFilter;
      
      // Enhanced status logic - if no status set or status is not 'delivered', default to pending
      const orderStatus = order.status;
      let normalizedStatus = 'pending'; // Default to pending
      
      if (orderStatus === 'delivered') {
        normalizedStatus = 'delivered';
      } else {
        // Any other status (including null, undefined, 'pending', etc.) is treated as pending
        normalizedStatus = 'pending';
      }
      
      const matchesStatus = filters.statusFilter === 'all' || normalizedStatus === filters.statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    }).length;

    // If "All" selected, show all on one page
    if (itemsPerPage === 'All') {
      return {
        showing: filteredCount,
        total: filteredCount,
        start: filteredCount > 0 ? 1 : 0,
        end: filteredCount
      };
    } else {
      const start = filteredCount > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
      const end = Math.min(currentPage * itemsPerPage, filteredCount);
      return {
        showing: end - start + 1,
        total: filteredCount,
        start: start,
        end: end
      };
    }
  }, [orders, searchTerm, filters, itemsPerPage, currentPage]);

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
        return [];
      }
    } catch (error) {
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

  // Optimized function to fetch all order-related data in parallel
  const fetchAllOrderData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch all three endpoints in parallel for better performance
      const [millInputsResponse, millOutputsResponse, dispatchesResponse] = await Promise.all([
        fetch('/api/mill-inputs', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/mill-outputs', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/dispatch', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      // Process mill inputs
      const millInputsData = await millInputsResponse.json();
      if (millInputsData.success && millInputsData.data?.millInputs) {
        const groupedInputs: {[key: string]: any[]} = {};
        millInputsData.data.millInputs.forEach((input: any) => {
          if (!groupedInputs[input.orderId]) {
            groupedInputs[input.orderId] = [];
          }
          groupedInputs[input.orderId].push(input);
        });
        setOrderMillInputs(groupedInputs);
      } else {
        setOrderMillInputs({});
      }

      // Process mill outputs
      const millOutputsData = await millOutputsResponse.json();
      if (millOutputsData.success && millOutputsData.data && Array.isArray(millOutputsData.data)) {
        const groupedOutputs: {[key: string]: any[]} = {};
        millOutputsData.data.forEach((output: any) => {
          if (!groupedOutputs[output.orderId]) {
            groupedOutputs[output.orderId] = [];
          }
          groupedOutputs[output.orderId].push(output);
        });
        setOrderMillOutputs(groupedOutputs);
      } else {
        setOrderMillOutputs({});
      }

      // Process dispatches
      const dispatchesData = await dispatchesResponse.json();
      if (dispatchesData.success && dispatchesData.data && Array.isArray(dispatchesData.data)) {
        const groupedDispatches: {[key: string]: any[]} = {};
        dispatchesData.data.forEach((dispatch: any) => {
          if (!groupedDispatches[dispatch.orderId]) {
            groupedDispatches[dispatch.orderId] = [];
          }
          groupedDispatches[dispatch.orderId].push(dispatch);
        });
        setOrderDispatches(groupedDispatches);
      } else {
        setOrderDispatches({});
      }
    } catch (error) {
      // Set empty objects on error
      setOrderMillInputs({});
      setOrderMillOutputs({});
      setOrderDispatches({});
    }
  }, []);

  // Legacy functions for backward compatibility (now just call the optimized version)
  const fetchAllOrderMillInputs = useCallback(() => fetchAllOrderData(), [fetchAllOrderData]);
  const fetchAllOrderMillOutputs = useCallback(() => fetchAllOrderData(), [fetchAllOrderData]);
  const fetchAllOrderDispatches = useCallback(() => fetchAllOrderData(), [fetchAllOrderData]);

  // Function to fetch mill inputs for a specific order
  const fetchMillInputsForOrder = useCallback(async (orderId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/mill-inputs?orderId=${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success && data.data && data.data.millInputs) {
        // Update the specific order's mill inputs
        setOrderMillInputs(prev => ({
          ...prev,
          [orderId]: data.data.millInputs || []
        }));
        } else if (data.success && data.data && Array.isArray(data.data)) {
        // Handle case where data.data is directly the array
        setOrderMillInputs(prev => ({
          ...prev,
          [orderId]: data.data || []
        }));
        }
    } catch (error) {
      }
  }, []);

  const fetchParties = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second timeout
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/parties?limit=50', { // Increased limit for better UX
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'max-age=300, must-revalidate', // 5 minute cache
          'Pragma': 'no-cache',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 401) return; // Skip on auth error
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setParties(data.data || []);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        } else if (!error.message?.includes('401')) {
        }
    }
  }, []);

  const fetchQualities = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second timeout
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/qualities?limit=100', { // Increased limit for better UX
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'max-age=300, must-revalidate', // 5 minute cache
          'Pragma': 'no-cache',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 401) return; // Skip on auth error
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setQualities(data.data || []);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        } else if (!error.message?.includes('401')) {
        }
    }
  }, []);

  // Fetch mills with optimized timeout
  const fetchMills = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/mills?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'max-age=300, must-revalidate', // 5 minute cache
          'Pragma': 'no-cache',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 401) return; // Skip on auth error
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success && data.data && data.data.mills) {
        const millsData = data.data.mills;
        setMills(millsData);
      } else {
        setMills([]);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        } else if (!error.message?.includes('401')) {
        }
    }
  }, []);

  // Optimized data initialization with better timeout handling
  useEffect(() => {
    // Prevent multiple initializations
    if (isInitialized) return;
    
    const initializeData = async () => {
      setLoading(true);
      let ordersLoaded = false;
      let criticalDataLoaded = false;
      
      try {
        // Fetch orders first (most critical)
        await fetchOrders();
        ordersLoaded = true;
        criticalDataLoaded = true;
        // Show success message for orders
        showMessage('success', 'Orders loaded successfully', { 
          autoDismiss: true, 
          dismissTime: 2000 
        });
        
        // Fetch additional data in background (non-blocking)
        const backgroundPromises = [
          fetchParties(),
          fetchQualities(),
          fetchMills(),
          fetchAllOrderMillInputs(),
          fetchAllOrderMillOutputs(),
          fetchAllOrderDispatches()
        ];
        
        // Process background data as it loads
        backgroundPromises.forEach((promise, index) => {
          promise.then(() => {
            const dataTypes = ['parties', 'qualities', 'mills', 'mill inputs', 'mill outputs', 'dispatches'];
            }).catch((error) => {
            const dataTypes = ['parties', 'qualities', 'mills', 'mill inputs', 'mill outputs', 'dispatches'];
            });
        });
        
      } catch (error) {
        if (!ordersLoaded) {
          // Silent error handling for better UX
        }
      } finally {
        setLoading(false);
        setIsInitialized(true);
        }
    };
    
    initializeData();
    
    // Fallback timeout to prevent infinite loading (increased to 12 seconds)
    const timeoutId = setTimeout(() => {
      if (!isInitialized) {
        setLoading(false);
        setIsInitialized(true);
        // Silent handling for better UX
      }
    }, 12000); // 12 second timeout
    
    return () => clearTimeout(timeoutId);
  }, [fetchOrders, fetchParties, fetchQualities, fetchMills, fetchAllOrderData, showMessage, isInitialized]);

  // Refresh mill inputs, outputs, and dispatches when orders change
  useEffect(() => {
    if (orders.length > 0) {
      fetchAllOrderData(); // Use optimized single function instead of three separate calls
    }
  }, [orders, fetchAllOrderData]);


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
        Promise.all([fetchOrders(), fetchAllOrderData()]).then(() => {
          // OrdersPage: Successfully refreshed orders and mill inputs
          // Show success message for automatic refresh
          if (event.detail?.action === 'order_create') {
            showMessage('success', 'New order added to table automatically!', { autoDismiss: true, dismissTime: 3000 });
          } else if (event.detail?.action === 'lab_add') {
            showMessage('success', 'Lab data updated in table automatically!', { autoDismiss: true, dismissTime: 3000 });
          }
        }).catch(error => {
          // Silent error handling for better UX
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

  // Optimized refresh function with better error handling
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    
    try {
      // Refresh orders with current settings
      await fetchOrders();
      
      // Refresh additional data in background
      Promise.allSettled([
        fetchParties(),
        fetchQualities(),
        fetchMills(),
        fetchAllOrderMillInputs(),
        fetchAllOrderMillOutputs(),
        fetchAllOrderDispatches()
      ]).then((results) => {
        const successCount = results.filter(result => result.status === 'fulfilled').length;
        const totalCount = results.length;
        
        if (successCount === totalCount) {
          showMessage('success', 'All data refreshed successfully', { 
            autoDismiss: true, 
            dismissTime: 3000 
          });
        } else if (successCount > 0) {
          showMessage('warning', `Orders refreshed, but ${totalCount - successCount} data sources failed`, { 
            autoDismiss: true, 
            dismissTime: 4000 
          });
        }
      });
      
    } catch (error: any) {
      // Silent error handling for better UX
    } finally {
      setRefreshing(false);
    }
  }, [fetchOrders, fetchParties, fetchQualities, fetchMills, fetchAllOrderMillInputs, fetchAllOrderMillOutputs, fetchAllOrderDispatches, showMessage]);

  // PDF Download function for individual items
  const handleDownloadItemPDF = useCallback((order: any, item: any, itemIndex: number) => {
    try {
      // Create a modified order object with only the specific item
      const itemOrder = {
        ...order,
        items: [item], // Only include the specific item
        // Add item-specific information to the order
        itemIndex: itemIndex + 1,
        qualityName: item.quality && typeof item.quality === 'object' ? item.quality.name || 'Not selected' : 'Not selected'
      };
      
      generateOrderPDF(itemOrder);
      showMessage('success', `PDF downloaded for ${item.quality && typeof item.quality === 'object' ? item.quality.name || 'Item' : 'Item'}`, { 
        autoDismiss: true, 
        dismissTime: 3000 
      });
    } catch (error) {
      showMessage('error', 'Failed to generate PDF', { 
        autoDismiss: true,
        dismissTime: 4000
      });
    }
  }, [showMessage]);

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

  // Handle status change with confirmation
  const handleStatusChangeClick = useCallback((orderId: string, newStatus: "pending" | "delivered", orderIdDisplay: string) => {
    setStatusChangeData({ orderId, newStatus, orderIdDisplay });
    setShowStatusConfirmModal(true);
  }, []);

  // Handle confirmed status change with optimistic updates
  const handleStatusChange = useCallback(async () => {
    if (!statusChangeData) return;
    
    setChangingStatus(true);
    
    // Optimistic update - immediately update the UI
    setOrders(prev => prev.map(order => 
      order._id === statusChangeData.orderId ? { ...order, status: statusChangeData.newStatus } : order
    ));
    
    // Close modal immediately for better UX
    setShowStatusConfirmModal(false);
    setStatusChangeData(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/orders/${statusChangeData.orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ status: statusChangeData.newStatus }),
      });

      const data = await response.json();
      
      if (data.success) {
        showMessage('success', `Order ${statusChangeData.orderIdDisplay} status updated to ${statusChangeData.newStatus}`, { autoDismiss: true, dismissTime: 2000 });
        
        // Trigger real-time update for Order Activity Log
        const event = new CustomEvent('orderUpdated', { 
          detail: { 
            orderId: statusChangeData.orderId,
            action: 'order_status_change',
            timestamp: new Date().toISOString()
          } 
        });
        window.dispatchEvent(event);
      } else {
        // Revert optimistic update on error
        setOrders(prev => prev.map(order => 
          order._id === statusChangeData.orderId ? { ...order, status: statusChangeData.newStatus === 'pending' ? 'delivered' : 'pending' } : order
        ));
        showMessage('error', data.message || 'Failed to update order status', { autoDismiss: true, dismissTime: 4000 });
      }
    } catch (error) {
      // Revert optimistic update on error
      setOrders(prev => prev.map(order => 
        order._id === statusChangeData.orderId ? { ...order, status: statusChangeData.newStatus === 'pending' ? 'delivered' : 'pending' } : order
      ));
      showMessage('error', 'Failed to update order status', { autoDismiss: true, dismissTime: 4000 });
    } finally {
      setChangingStatus(false);
    }
  }, [statusChangeData, showMessage]);

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
    if (orders.length > 0) {
      }
    
    // Filtering orders
    let filtered = orders
      .filter(order => {
        const matchesSearch = searchTerm === '' || (
          (order.orderId && order.orderId.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (order.poNumber && order.poNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (order.styleNo && order.styleNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (order.party && typeof order.party === 'object' && order.party.name && order.party.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        const matchesType = filters.typeFilter === 'all' || order.orderType === filters.typeFilter;
        
        // Enhanced status logic - if no status set or status is not 'delivered', default to pending
        const orderStatus = order.status;
        let normalizedStatus = 'pending'; // Default to pending
        
        if (orderStatus === 'delivered') {
          normalizedStatus = 'delivered';
        } else {
          // Any other status (including null, undefined, 'pending', etc.) is treated as pending
          normalizedStatus = 'pending';
        }
        
        // Debug logging for status filter
        if (filters.statusFilter === 'pending' && normalizedStatus !== 'pending') {
          }
        
        const matchesStatus = filters.statusFilter === 'all' || normalizedStatus === filters.statusFilter;

        return matchesSearch && matchesType && matchesStatus;
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

    if (searchTerm && filtered.length === 0) {
      }

    // Apply client-side pagination
    if (itemsPerPage === 'All') {
      return filtered; // Show all orders only when "All" is selected
    } else {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return filtered.slice(startIndex, endIndex);
    }
  }, [orders, searchTerm, filters, itemsPerPage, currentPage]);

  const handleDeleteClick = useCallback((order: Order) => {
    setOrderToDelete(order);
    setShowDeleteModal(true);
  }, []);

  // Item deletion confirmation handlers
  const handleDeleteItemClick = useCallback((orderId: string, itemId: string | number, itemName: string) => {
    setItemToDelete({ orderId, itemId, itemName });
    setShowItemDeleteModal(true);
  }, []);

  const handleItemDeleteConfirm = useCallback(async () => {
    if (!itemToDelete) return;
    
    setDeletingItem(true);
    try {
      const response = await fetch(`/api/orders/${itemToDelete.orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'deleteItem',
          itemIndex: itemToDelete.itemId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update the order in the local state
          setOrders(prev => prev.map(order => 
            order._id === itemToDelete.orderId 
              ? { ...order, items: order.items.filter((_, index) => index !== itemToDelete.itemId) }
              : order
          ));
          
          showMessage('success', 'Item deleted successfully', { autoDismiss: true, dismissTime: 3000 });
          
          // Trigger real-time update for Order Activity Log
          const event = new CustomEvent('orderUpdated', {
            detail: { orderId: itemToDelete.orderId, action: 'itemDeleted' }
          });
          window.dispatchEvent(event);
      } else {
          showMessage('error', data.message || 'Failed to delete item');
        }
      } else {
          const errorData = await response.json();
          showMessage('error', errorData.message || 'Failed to delete item');
      }
    } catch (error) {
      showMessage('error', 'An error occurred while deleting the item');
    } finally {
      setDeletingItem(false);
      setShowItemDeleteModal(false);
      setItemToDelete(null);
    }
  }, [itemToDelete, showMessage]);

  const handleItemDeleteCancel = useCallback(() => {
    setShowItemDeleteModal(false);
    setItemToDelete(null);
    setDeletingItem(false);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!orderToDelete) return;

    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
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
        }
    } catch (error) {
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

  const handleMillInput = async (order: Order) => {
    // Clear cache before opening form
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('millInputFormCache');
      window.localStorage.removeItem('millInputFormData');
      window.localStorage.removeItem('millInputFormState');
      window.localStorage.setItem('millInputFormVersion', '2.0');
      window.localStorage.setItem('millInputFormForceNew', 'true');
    }
    // Check if there's existing mill input data for this order
    const existingData = orderMillInputs[order.orderId] || [];
    const hasExistingData = existingData.length > 0;
    
    // Set editing state and existing data
    setIsEditingMillInput(hasExistingData);
    setExistingMillInputs(existingData);
    setSelectedOrderForMillInputForm(order);
    
    // Ensure mills are loaded before opening the form
    if (mills.length === 0) {
      await fetchMills();
    }
    
    setShowMillInputForm(true);
  };

  const handleMillOutput = async (order: Order) => {
    // Check if there's existing mill output data for this order
    const existingData = orderMillOutputs[order.orderId] || [];
    const hasExistingData = existingData.length > 0;
    
    // Set editing state and existing data
    setIsEditingMillOutput(hasExistingData);
    setExistingMillOutputs(existingData);
    setSelectedOrderForMillOutput(order);
    
    setShowMillOutputForm(true);
  };

  const handleDispatch = async (order: Order) => {
    // Check if there's existing dispatch data for this order
    const existingData = orderDispatches[order.orderId] || [];
    const hasExistingData = existingData.length > 0;
    
    // Set editing state and existing data
    setIsEditingDispatch(hasExistingData);
    setExistingDispatches(existingData);
    setSelectedOrderForDispatch(order);
    
    setShowDispatchForm(true);
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

  // Use filtered and paginated data for both table and card views
  const currentOrders = filteredOrders;
  
  // Pagination debug info removed for production

  // Reset to page 1 and fetch new data when filters change
    useEffect(() => {
      setCurrentPage(1);
      fetchOrders(0, 1, itemsPerPage);
    }, [filters, itemsPerPage]);

  // Auto-correct current page if it exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
      fetchOrders(0, totalPages, itemsPerPage);
    }
  }, [totalPages, currentPage, itemsPerPage]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format date and time on separate lines
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return (
      <div className="flex flex-col">
        <span>{dateStr}</span>
        <span className="text-xs opacity-75">{timeStr}</span>
      </div>
    );
  };

  // Get total quantity for an order
  const getTotalQuantity = (order: Order) => {
    return order.items.reduce((total: number, item: any) => total + (item.quantity || 0), 0);
  };

  // Optimized loading skeleton - Fast and minimal
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {/* Compact Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className={`h-6 w-32 rounded ${
          isDarkMode ? 'bg-slate-700' : 'bg-gray-200'
          }`}></div>
        <div className={`h-8 w-24 rounded ${
          isDarkMode ? 'bg-slate-700' : 'bg-gray-200'
        }`}></div>
      </div>

      {/* Compact Search Skeleton */}
      <div className={`h-10 rounded-lg ${
        isDarkMode ? 'bg-slate-700' : 'bg-gray-200'
        }`}></div>

      {/* Optimized Table Skeleton */}
      <div className={`rounded-lg border overflow-hidden ${
        isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${
              isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'
            }`}>
              <tr>
                <th className={`px-4 py-3 text-left text-sm font-medium ${
                  isDarkMode ? 'text-slate-300' : 'text-gray-700'
                }`}>Order Information</th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${
                  isDarkMode ? 'text-slate-300' : 'text-gray-700'
                }`}>Items</th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${
                  isDarkMode ? 'text-slate-300' : 'text-gray-700'
                }`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              isDarkMode ? 'divide-slate-700' : 'divide-gray-200'
            }`}>
              {[...Array(4)].map((_, i) => (
                <tr key={i} className={`${
                  isDarkMode ? 'bg-slate-800/30' : 'bg-white'
                }`}>
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-3">
                      <div className={`h-8 w-8 rounded-full ${
                        isDarkMode ? 'bg-slate-600' : 'bg-gray-300'
                      }`}></div>
                      <div className="space-y-1">
                        <div className={`h-3 w-20 rounded ${
                          isDarkMode ? 'bg-slate-600' : 'bg-gray-300'
                        }`}></div>
                        <div className={`h-2 w-16 rounded ${
                          isDarkMode ? 'bg-slate-600' : 'bg-gray-300'
                        }`}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <div className={`h-3 w-12 rounded ${
                        isDarkMode ? 'bg-slate-600' : 'bg-gray-300'
                      }`}></div>
                      <div className="flex space-x-1">
                        <div className={`h-4 w-12 rounded ${
                          isDarkMode ? 'bg-slate-600' : 'bg-gray-300'
                      }`}></div>
                      <div className={`h-4 w-12 rounded ${
                          isDarkMode ? 'bg-slate-600' : 'bg-gray-300'
                      }`}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex space-x-2">
                      <div className={`h-6 w-6 rounded ${
                        isDarkMode ? 'bg-slate-600' : 'bg-gray-300'
                    }`}></div>
                      <div className={`h-6 w-6 rounded ${
                        isDarkMode ? 'bg-slate-600' : 'bg-gray-300'
                      }`}></div>
                      <div className={`h-6 w-6 rounded ${
                        isDarkMode ? 'bg-slate-600' : 'bg-gray-300'
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
    return <LoadingSkeleton />;
  }

  return (
    <div>
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
          {/* Main Header - Removed */}
          {/* Action buttons moved to search bar row */}
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
            
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-1.5">
              {/* Add Party */}
              <button
                onClick={() => {
                  setShowPartyModal(true);
                  setShowQuickActions(false);
                }}
                className={`group p-2 rounded-md border transition-all duration-200 hover:scale-105 ${
                  isDarkMode
                    ? 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20 hover:border-green-500/40'
                    : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300'
                }`}
              >
                <BuildingOfficeIcon className="h-4 w-4 mx-auto mb-0.5 group-hover:scale-110 transition-transform" />
                <div className="text-[10px] font-medium">Add Party</div>
              </button>
              
              {/* Add Quality */}
              <button
                onClick={() => {
                  setShowQualityModal(true);
                  setShowQuickActions(false);
                }}
                className={`group p-2 rounded-md border transition-all duration-200 hover:scale-105 ${
                  isDarkMode
                    ? 'bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20 hover:border-purple-500/40'
                    : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:border-purple-300'
                }`}
              >
                <ChartBarIcon className="h-4 w-4 mx-auto mb-0.5 group-hover:scale-110 transition-transform" />
                <div className="text-[10px] font-medium">Add Quality</div>
              </button>
              
              {/* Add Mill Input */}
              <button
                onClick={() => {
                  setShowQuickActions(false);
                  // Show a message to select a specific order
                  showMessage('info', 'Please select a specific order to add mill input', { autoDismiss: true, dismissTime: 3000 });
                }}
                className={`group p-2 rounded-md border transition-all duration-200 hover:scale-105 ${
                  isDarkMode
                    ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/40'
                    : 'bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100 hover:border-cyan-300'
                }`}
              >
                <BuildingOfficeIcon className="h-4 w-4 mx-auto mb-0.5 group-hover:scale-110 transition-transform" />
                <div className="text-[10px] font-medium">Mill Input</div>
              </button>

              {/* Delete All Orders - Only show when orders exist */}
              {orders.length > 0 && (
                <button
                  onClick={() => setShowDeleteAllModal(true)}
                  className={`group p-2 rounded-md border transition-all duration-200 hover:scale-105 ${
                    isDarkMode
                      ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/40'
                      : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300'
                  }`}
                >
                  <TrashIcon className="h-4 w-4 mx-auto mb-0.5 group-hover:scale-110 transition-transform" />
                  <div className="text-[10px] font-medium">Delete All</div>
                </button>
              )}
              
              {/* Reset Counter - Only show when no orders exist */}
              {orders.length === 0 && (
                <button
                  onClick={handleResetCounter}
                  disabled={resettingCounter}
                  className={`group p-2 rounded-md border transition-all duration-200 hover:scale-105 ${
                    resettingCounter
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  } ${
                    isDarkMode
                      ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/40'
                      : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300'
                  }`}
                >
                  <ArrowPathIcon className={`h-4 w-4 mx-auto mb-0.5 ${resettingCounter ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
                  <div className="text-[10px] font-medium">Reset Counter</div>
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

      {/* Filters */}
      <div className={`p-4 rounded-lg border ${
        isDarkMode
          ? 'bg-white/5 border-white/10'
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex flex-col gap-3">
          {/* Top Row - Create Order, Search, Quick Actions */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            {/* Left Side - Create Order Button */}
            <div className="flex items-center order-1 md:order-1">
              <button
                onClick={() => setShowForm(true)}
                className={`inline-flex items-center px-3 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg'
                }`}
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Create Order</span>
              </button>
            </div>

            {/* Center - Search */}
            <div className="flex-1 order-2 md:order-2 min-w-0">
              <div className="relative">
                <MagnifyingGlassIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="text"
                  placeholder="Search orders by ID, PO number, style, or party..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 rounded-lg border transition-all duration-300 font-medium text-sm ${
                    isDarkMode
                      ? 'bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }`}
                />
              </div>
            </div>

            {/* Right Side - Quick Actions Button */}
            <div className="flex items-center order-3 md:order-3">
              <button
                onClick={() => setShowQuickActions(!showQuickActions)}
                className={`inline-flex items-center px-3 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 ${
                  showQuickActions
                    ? isDarkMode
                      ? 'bg-white/20 border border-white/30 text-white'
                      : 'bg-gray-200 border border-gray-400 text-gray-800'
                    : isDarkMode
                      ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                      : 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <BoltIcon className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium hidden sm:inline">Quick Actions</span>
                <span className="text-sm font-medium sm:hidden">Actions</span>
              </button>
            </div>
          </div>

          {/* Second Row - Filters and Controls */}
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
            {/* Left Side - Filters */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 order-2 lg:order-1 w-full lg:w-auto">

            {/* Sort Filter - Segmented Button Style */}
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Sort:
              </span>
              <div className={`flex rounded-lg border ${
                isDarkMode ? 'border-gray-600' : 'border-gray-300'
              } overflow-hidden`}>
                <button
                  onClick={() => setFilters({ ...filters, orderFilter: 'latest_first' })}
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-200 ${
                    filters.orderFilter === 'latest_first'
                      ? isDarkMode
                        ? 'bg-green-600 text-white border-green-500'
                        : 'bg-green-500 text-white border-green-500'
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Latest
                </button>
                <button
                  onClick={() => setFilters({ ...filters, orderFilter: 'oldest_first' })}
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-200 ${
                    filters.orderFilter === 'oldest_first'
                      ? isDarkMode
                        ? 'bg-green-600 text-white border-green-500'
                        : 'bg-green-500 text-white border-green-500'
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Oldest
              </button>
            </div>
          </div>

            {/* Status Filter - Dropdown Select */}
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Status:
              </span>
              <select
                value={filters.statusFilter}
                onChange={(e) => setFilters({ ...filters, statusFilter: e.target.value })}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg border transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="delivered">Delivered</option>
              </select>
          </div>

            {/* Type Filter - Dropdown */}
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Type:
              </span>
              <select
                value={filters.typeFilter}
                onChange={(e) => setFilters({ ...filters, typeFilter: e.target.value })}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg border transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <option value="all" className={isDarkMode ? 'bg-[#1D293D] text-white' : 'bg-white text-gray-900'}>All Types</option>
               
                <option value="Dying" className={isDarkMode ? 'bg-[#1D293D] text-white' : 'bg-white text-gray-900'}>Dying</option>
                <option value="Printing" className={isDarkMode ? 'bg-[#1D293D] text-white' : 'bg-white text-gray-900'}>Printing</option>
              </select>
            </div>

            </div>

            {/* Right Side - View Toggle and Refresh */}
            <div className="flex items-center gap-2 order-1 lg:order-2">
              <span className={`text-xs font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>View:</span>
              <div className={`flex rounded-lg border overflow-hidden ${
                isDarkMode ? 'border-gray-600' : 'border-gray-300'
              }`}>
                <button
                  onClick={() => handleViewModeChange('table')}
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                    viewMode === 'table'
                      ? isDarkMode
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-500 text-white'
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title="Table View"
                >
                  <ListBulletIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Table</span>
                </button>
                <button
                  onClick={() => handleViewModeChange('cards')}
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                    viewMode === 'cards'
                      ? isDarkMode
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-500 text-white'
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title="Card View"
                >
                  <Squares2X2Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Cards</span>
                </button>
              </div>

              {/* Refresh Button - Icon only on small screens */}
              <button
                onClick={() => handleRefresh()}
                disabled={refreshing}
                className={`inline-flex items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 ${
                  refreshing
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                } ${
                  isDarkMode
                    ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:border-white/30'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }`}
                title="Refresh"
              >
                <ArrowPathIcon className={`h-3 w-3 sm:h-4 sm:w-4 ${refreshing ? 'animate-spin' : ''} sm:mr-1`} />
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>
  
            {/* Pagination Info Bar */}
            <div className={`px-3 sm:px-4 py-2 sm:py-3 border-b flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between ${
              isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:items-center sm:space-x-3 lg:space-x-4">
                <span className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <span className="hidden sm:inline">Showing {paginationDisplayInfo.start} to {paginationDisplayInfo.end} of {paginationDisplayInfo.total} orders</span>
                  <span className="sm:hidden">{paginationDisplayInfo.start}-{paginationDisplayInfo.end} of {paginationDisplayInfo.total}</span>
                </span>
                
                {/* Items per page dropdown */}
                <div className="flex items-center space-x-2">
                  <span className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Show:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      const value = e.target.value === 'All' ? 'All' : parseInt(e.target.value);
                      handleItemsPerPageChange(value);
                    }}
                    disabled={isChangingPage || loading}
                    className={`px-2 sm:px-3 py-1 rounded-lg border text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } ${(isChangingPage || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {itemsPerPageOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Navigation - Show when there are multiple pages */}
              {(totalPages > 1 || orders.length > 0) && (
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1 || isChangingPage || loading}
                    className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm transition-colors ${
                      currentPage === 1 || isChangingPage || loading
                        ? isDarkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </button>
                  
                  {/* Page numbers */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          disabled={isChangingPage || loading}
                          className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm transition-colors ${
                            currentPage === pageNum
                              ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                              : isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          } ${(isChangingPage || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages || isChangingPage || loading}
                    className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm transition-colors ${
                      currentPage === totalPages || isChangingPage || loading
                        ? isDarkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
      {/* Orders Display */}
      {viewMode === 'table' ? (
      <div className={`rounded-xl border overflow-hidden shadow-lg ${
        isDarkMode
          ? 'bg-white/5 border-white/10 shadow-2xl'
          : 'bg-white border-gray-200 shadow-xl'
      }`}>
          <div className="overflow-x-auto min-w-full">
            <table className="w-full min-w-max">
                                                   <thead className={`${
                isDarkMode ? 'bg-gradient-to-r from-slate-800/80 to-slate-700/80 border-b border-slate-600' : 'bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-300'
              }`}>
                <tr>
                  <th className={`px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold uppercase tracking-wide border-b-2 min-w-[300px] ${
                    isDarkMode ? 'text-white border-slate-500 bg-slate-700/50' : 'text-black border-black/50 bg-blue-50'
                  }`}>
                    Order Information
                  </th>
                  <th className={`px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold uppercase tracking-wide border-b-2 min-w-[350px] ${
                    isDarkMode ? 'text-white border-slate-500 bg-slate-700/50' : 'text-black border-black bg-blue-50'
                  }`}>
                    Items
                  </th>
                  <th className={`px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold uppercase tracking-wide border-b-2 min-w-[200px] ${
                    isDarkMode ? 'text-white border-slate-500 bg-slate-700/50' : 'text-black border-black bg-blue-50'
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
                   {/* Order Information Column */}
                   <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5">
                      <div className="space-y-3">
                        {/* Row 1: Order ID and Type */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-base font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                              Order ID:
                            </span>
                            <span className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                         {order.orderId}
                            </span>
                       </div>
                           <div className="flex items-center gap-2">
                            <span className={`text-base font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                              Order Type:
                            </span>
                            <span className={`text-base font-bold ${
                               order.orderType === 'Dying'
                                 ? isDarkMode
                                  ? 'text-orange-400'
                                  : 'text-orange-600'
                                 : isDarkMode
                                  ? 'text-blue-400'
                                  : 'text-blue-600'
                             }`}>
                               {order.orderType || 'Not selected'}
                             </span>
                           </div>
                             </div>

                        {/* Responsive Layout: Single column on small screens, 2 columns on larger screens */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* Left: PO and Style */}
                          <div className={`p-3 rounded-lg border ${
                            isDarkMode 
                              ? 'bg-blue-500/10 border-blue-500/20' 
                              : 'bg-blue-50 border-blue-200'
                          }`}>
                            <h4 className={`text-sm font-bold mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                              Order Details
                            </h4>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                  PO:
                                </span>
                                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {order.poNumber || 'Not selected'}
                                </span>
                             </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                  Style:
                                </span>
                                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {order.styleNo || 'Not selected'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Party Information */}
                          <div className={`p-3 rounded-lg border ${
                            isDarkMode 
                              ? 'bg-orange-500/10 border-orange-500/20' 
                              : 'bg-orange-50 border-orange-200'
                          }`}>
                            <h4 className={`text-sm font-bold mb-2 ${isDarkMode ? 'text-orange-300' : 'text-orange-700'}`}>
                              Party Information
                            </h4>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                                  Name:
                                </span>
                                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {order.party && typeof order.party === 'object' ? order.party.name || 'Not selected' : 'Not selected'}
                                </span>
                             </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                                  Contact:
                                </span>
                                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {order.contactName || 'Not selected'}
                                </span>
                             </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                                  Phone:
                                </span>
                                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {order.contactPhone || 'Not selected'}
                                </span>
                           </div>
                         </div>
                       </div>
                     </div>

                        {/* Responsive Layout: Single column on small screens, 2 columns on larger screens */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* Left: All Dates */}
                          <div className={`p-3 rounded-lg border ${
                            isDarkMode 
                              ? 'bg-green-500/10 border-green-500/20' 
                              : 'bg-green-50 border-green-200'
                          }`}>
                            <h4 className={`text-sm font-bold mb-2 ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                              Important Dates
                            </h4>
                     <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                                  Arrival:
                                </span>
                                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {order.arrivalDate ? formatDate(order.arrivalDate) : 'Not selected'}
                                </span>
                       </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                                  PO Date:
                                </span>
                                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {order.poDate ? formatDate(order.poDate) : 'Not selected'}
                                </span>
                         </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                                  Delivery:
                                </span>
                                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {order.deliveryDate ? formatDate(order.deliveryDate) : 'Not selected'}
                                </span>
                         </div>
                     </div>
                          </div>

                          {/* Right: Timestamps */}
                          <div className={`p-3 rounded-lg border ${
                            isDarkMode 
                              ? 'bg-purple-500/10 border-purple-500/20' 
                              : 'bg-purple-50 border-purple-200'
                          }`}>
                            <h4 className={`text-sm font-bold mb-2 ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                              System Timestamps
                            </h4>
                      <div className="space-y-1">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <CalendarIcon className="h-4 w-4 text-gray-500" />
                                  <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Created: {formatDate(order.createdAt)}
                          </span>
                        </div>
                                <div className="flex items-center gap-2 ml-6">
                                  <ClockIcon className="h-3 w-3 text-gray-400" />
                                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {new Date(order.createdAt).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: true
                                    })}
                          </span>
                        </div>
                              </div>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <CalendarIcon className="h-4 w-4 text-gray-500" />
                                  <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Updated: {formatDate(order.updatedAt)}
                          </span>
                                </div>
                                <div className="flex items-center gap-2 ml-6">
                                  <ClockIcon className="h-3 w-3 text-gray-400" />
                                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {new Date(order.updatedAt).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: true
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>

                                       {/* Items Column */}
                   <td className="py-3 sm:py-4 lg:py-5">
                     <div className="space-y-2">
                       <div className={`text-xs font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                          {order.items.length} items
                        </div>
                       
                       {/* Items Table */}
                       <div className={`rounded-lg border overflow-hidden ${
                         isDarkMode ? 'bg-gray-800/50 border-gray-600' : 'bg-white border-gray-200'
                       }`}>
                         <div className="overflow-x-auto">
                           <table className="w-full min-w-max">
                             <thead className={`${
                            isDarkMode 
                                 ? 'bg-gray-700 border-b border-gray-600' 
                                 : 'bg-gray-50 border-b border-gray-200'
                             }`}>
                               <tr>
                                 <th className={`px-2 py-1 text-left text-xs font-bold uppercase tracking-wider ${
                                   isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                 }`}>
                                   Quality
                                 </th>
                                 <th className={`px-2 py-1 text-left text-xs font-bold uppercase tracking-wider ${
                                   isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                 }`}>
                                   Qty
                                 </th>
                                 <th className={`px-2 py-1 text-left text-xs font-bold uppercase tracking-wider ${
                                   isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                 }`}>
                                   Description
                                 </th>
                                 <th className={`px-2 py-1 text-left text-xs font-bold uppercase tracking-wider ${
                                   isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                 }`}>
                                   Weaver
                                 </th>
                                 <th className={`px-2 py-1 text-left text-xs font-bold uppercase tracking-wider ${
                                   isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                 }`}>
                                   Rate
                                 </th>
                                 <th className={`px-2 py-1 text-left text-xs font-bold uppercase tracking-wider ${
                                   isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                 }`}>
                                   Images
                                 </th>
                                 <th className={`px-2 py-1 text-center text-xs font-bold uppercase tracking-wider ${
                                   isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                 }`}>
                                   Actions
                                 </th>
                               </tr>
                             </thead>
                             <tbody className={`divide-y ${
                               isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
                             }`}>
                               {order.items.map((item, index) => (
                                 <tr key={index} className={`hover:${
                                   isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                                 } transition-colors duration-200`}>
                                   {/* Quality */}
                                   <td className="px-2 py-2">
                                     <div className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {item.quality && typeof item.quality === 'object' ? item.quality.name || 'Not selected' : 'Not selected'}
                                     </div>
                                   </td>
                                   
                                   {/* Quantity */}
                                   <td className="px-2 py-2">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                isDarkMode 
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                                  : 'bg-blue-100 text-blue-700 border border-blue-200'
                              }`}>
                                       {item.quantity || 0}
                              </span>
                                   </td>
                            
                            {/* Description */}
                                   <td className="px-2 py-2">
                                     <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} max-w-[120px] truncate`}>
                                       {item.description || '-'}
                              </div>
                                   </td>
                                   
                                   {/* Weaver/Supplier */}
                                   <td className="px-2 py-2">
                                     <div className={`text-xs ${isDarkMode ? 'text-orange-300' : 'text-orange-600'} max-w-[100px] truncate`}>
                                       {item.weaverSupplierName || '-'}
                              </div>
                                   </td>
                            
                            {/* Purchase Rate */}
                                   <td className="px-2 py-2">
                                     <div className={`text-xs ${isDarkMode ? 'text-green-300' : 'text-green-600'}`}>
                                       {item.purchaseRate ? `₹${Number(item.purchaseRate).toFixed(2)}` : '-'}
                              </div>
                                   </td>
                                   
                                   {/* Images */}
                                   <td className="px-2 py-2">
                                     {item.imageUrls && item.imageUrls.length > 0 ? (
                                       <div className="flex items-center gap-2">
                                  {/* Show first image */}
                                    <img 
                                      src={item.imageUrls[0]} 
                                           alt={`Item ${index + 1}`}
                                           className="h-8 w-8 object-cover rounded border"
                                      onError={(e) => {
                                             (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                         {/* View button for more images */}
                                  {item.imageUrls.length > 1 && (
                                      <button
                                             onClick={() => handleImagePreview(item.imageUrls![0], `Item ${index + 1}`, item.imageUrls, 0)}
                                             className="text-blue-500 hover:text-blue-700 text-xs underline"
                                      >
                                             View ({item.imageUrls.length})
                                      </button>
                                         )}
                                    </div>
                                     ) : (
                                       <div className="flex items-center gap-1">
                                         <PhotoIcon className="h-3 w-3 text-gray-400" />
                                         <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>No images</span>
                                    </div>
                                  )}
                                   </td>
                                   
                                   {/* Actions */}
                                   <td className="px-2 py-2 text-center">
                                     <div className="flex flex-col gap-1">
                                       {/* PDF Download Button */}
                                       <button
                                         onClick={() => handleDownloadItemPDF(order, item, index)}
                                         className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                                           isDarkMode
                                             ? 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 border border-indigo-600/30'
                                             : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200 border border-indigo-200'
                                         }`}
                                         title={`Download PDF for ${item.quality && typeof item.quality === 'object' ? item.quality.name || 'Item' : 'Item'}`}
                                       >
                                         <DocumentArrowDownIcon className="h-3 w-3 inline mr-1" />
                                         PDF
                                       </button>
                                       
                                       {/* Delete Button */}
                                       <button
                                         onClick={() => handleDeleteItemClick(order._id, index, item.quality && typeof item.quality === 'object' ? item.quality.name || 'Item' : 'Item')}
                                         className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                                           isDarkMode
                                             ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30'
                                             : 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200'
                                         }`}
                                         title="Delete item"
                                       >
                                         <TrashIcon className="h-3 w-3 inline mr-1" />
                                         Delete
                                       </button>
                                     </div>
                                   </td>
                                 </tr>
                               ))}
                             </tbody>
                           </table>
                                    </div>
                                </div>
                              </div>
                    </td>

                   {/* Actions Column */}
                   <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5">
                     <div className="flex flex-col gap-2">
                        {/* Row 0: Status Label and Buttons */}
                        <div className={`flex items-center justify-center gap-3 px-3 py-2 rounded-lg border transition-colors ${
                            isDarkMode 
                            ? 'bg-gray-700/50 border-gray-600'
                            : 'bg-gray-100 border-gray-300'
                        }`}>
                          <label className={`text-base font-bold whitespace-nowrap ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            Status:
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleStatusChangeClick(order._id, 'pending', order.orderId)}
                              className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center justify-center ${
                                (order.status || 'pending') === 'pending'
                                  ? isDarkMode
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-blue-600 text-white'
                                  : isDarkMode
                                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              Pending
                            </button>
                            <button
                              onClick={() => handleStatusChangeClick(order._id, 'delivered', order.orderId)}
                              className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center justify-center ${
                                order.status === 'delivered'
                                  ? isDarkMode
                                    ? 'bg-green-600 text-white'
                                    : 'bg-green-600 text-white'
                                  : isDarkMode
                                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              Delivered
                            </button>
                            </div>
                          </div>

                       {/* Table Actions - 2 Columns Layout (Same as Card View) */}
                       <div className="grid grid-cols-2 gap-4">
                         {/* Column 1: Lab, Input, Output, Dispatch */}
                         <div className="space-y-2">
                           <button
                             onClick={() => handleLabData(order)}
                             className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2 ${
                               isDarkMode
                                 ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30 hover:bg-amber-600/30'
                                 : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                             }`}
                             title={order.items.some(item => item.labData?.sampleNumber) ? "Edit Lab Data" : "Add Lab Data"}
                           >
                             <BeakerIcon className="h-4 w-4" />
                             <span>{order.items.some(item => item.labData?.sampleNumber) ? "Edit Lab" : "Add Lab"}</span>
                           </button>

                           <button
                             onClick={async () => {
                               const existingInputs = orderMillInputs[order.orderId] || [];
                               if (existingInputs.length > 0) {
                                 setIsEditingMillInput(true);
                                 setExistingMillInputs(existingInputs);
                               } else {
                                 setIsEditingMillInput(false);
                                 setExistingMillInputs([]);
                               }
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
                             className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2 ${
                               isDarkMode
                                 ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30'
                                 : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                             }`}
                             title={orderMillInputs[order.orderId] && orderMillInputs[order.orderId].length > 0 ? "Edit Mill Input" : "Add Mill Input"}
                           >
                             <CubeIcon className="h-4 w-4" />
                             <span>Add Mill Input</span>
                           </button>

                           <button
                             onClick={() => handleMillOutput(order)}
                             className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2 ${
                               isDarkMode
                                 ? 'bg-teal-600/20 text-teal-400 border border-teal-500/30 hover:bg-teal-600/30'
                                 : 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100'
                             }`}
                             title="Add Mill Output"
                           >
                             <DocumentTextIcon className="h-4 w-4" />
                             <span>Add Mill Output</span>
                           </button>

                           <button
                             onClick={() => handleDispatch(order)}
                             className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2 ${
                               isDarkMode
                                 ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30 hover:bg-orange-600/30'
                                 : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
                             }`}
                             title="Add Dispatch"
                           >
                             <TruckIcon className="h-4 w-4" />
                             <span>Add Dispatch</span>
                           </button>
                         </div>

                         {/* Column 2: View, Edit, Delete, Logs */}
                         <div className="space-y-2">
                           <button
                             onClick={() => handleView(order)}
                             className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2 ${
                               isDarkMode
                                 ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30'
                                 : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                             }`}
                             title="View Order Details"
                           >
                             <EyeIcon className="h-4 w-4" />
                             <span>View Details</span>
                           </button>

                           <button
                             onClick={() => handleEdit(order)}
                             className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2 ${
                               isDarkMode
                                 ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30'
                                 : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                             }`}
                             title="Edit Order"
                           >
                             <PencilIcon className="h-4 w-4" />
                             <span>Edit Order</span>
                           </button>

                           <button
                             onClick={() => handleDeleteClick(order)}
                             className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2 ${
                               isDarkMode
                                 ? 'bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30'
                                 : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                             }`}
                             title="Delete Order"
                           >
                             <TrashIcon className="h-4 w-4" />
                             <span>Delete ({order.orderId})</span>
                           </button>

                           <button
                             onClick={() => handleViewLogs(order)}
                             className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2 ${
                               isDarkMode
                                 ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30 hover:bg-violet-600/30'
                                 : 'bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100'
                             }`}
                             title="View Logs"
                           >
                             <ChartBarIcon className="h-4 w-4" />
                             <span>View Logs</span>
                           </button>
                         </div>
                       </div>

                     </div>
                   </td>

                  </tr>
                ))}
            </tbody>
          </table>
        </div>

          {/* Bottom Pagination Controls */}
          {(totalPages > 1 || orders.length > 0) && (
            <div className={`px-3 sm:px-4 py-2 sm:py-3 border-t flex justify-center items-center ${
              isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
            }`}>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  currentPage === 1
                      ? isDarkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </button>
              
                {/* Page numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-colors ${
                        currentPage === pageNum
                            ? isDarkMode ? 'bg-blue-600 text-white shadow-md' : 'bg-blue-500 text-white shadow-md'
                            : isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => {
                  const nextPage = Math.min(totalPages, currentPage + 1);
                  handlePageChange(nextPage);
                }}
                disabled={currentPage === totalPages}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  currentPage === totalPages
                      ? isDarkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {currentOrders.length === 0 && (
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
                    setFilters({ orderFilter: 'oldest_first', typeFilter: 'all', statusFilter: 'all' });
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
      ) : (
        /* Enhanced Card Layout - Complete Order Information */
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {currentOrders.map((order) => (
            <div key={order._id} className={`rounded-xl border shadow-lg ${
              isDarkMode ? 'bg-gray-800/50 border-gray-600' : 'bg-white border-gray-200'
            }`}>
              
              {/* Header - Order ID and Type */}
              <div className={`p-3 border-b ${
                isDarkMode ? 'border-gray-600 bg-gray-700/30' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-base font-bold ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                      Order #{order.orderId || 'N/A'}
                    </h3>
                    <div className={`text-sm ${
                      order.orderType === 'Dying'
                        ? isDarkMode ? 'text-orange-400' : 'text-orange-600'
                        : isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                      {order.orderType || 'Not selected'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Status Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStatusChangeClick(order._id, 'pending', order.orderId)}
                        className={`px-2 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap flex items-center justify-center ${
                          (order.status || 'pending') === 'pending'
                            ? isDarkMode
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-600 text-white'
                            : isDarkMode
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Pending
                      </button>
                      <button
                        onClick={() => handleStatusChangeClick(order._id, 'delivered', order.orderId)}
                        className={`px-2 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap flex items-center justify-center ${
                          order.status === 'delivered'
                            ? isDarkMode
                              ? 'bg-green-600 text-white'
                              : 'bg-green-600 text-white'
                            : isDarkMode
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Delivered
                      </button>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {order.items?.length || 0} items
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Details Section */}
              <div className="p-3 space-y-3">
                {/* Complete Order Information - Like Table View */}
                <div className={`p-3 rounded-lg border ${
                  isDarkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <h4 className={`text-sm font-semibold mb-3 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Order Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {/* Row 1 */}
                    <div className={`p-2 rounded ${
                      isDarkMode ? 'bg-gray-800/50' : 'bg-white'
                    }`}>
                      <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>PO Number:</span>
                      <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {order.poNumber || 'Not selected'}
                      </div>
                    </div>
                    <div className={`p-2 rounded ${
                      isDarkMode ? 'bg-gray-800/50' : 'bg-white'
                    }`}>
                      <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Style No:</span>
                      <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {order.styleNo || 'Not selected'}
                      </div>
                    </div>
                    
                    {/* Row 2 */}
                    <div className={`p-2 rounded ${
                      isDarkMode ? 'bg-gray-800/50' : 'bg-white'
                    }`}>
                      <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Party:</span>
                      <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {order.party && typeof order.party === 'object' ? order.party.name || 'Not selected' : order.party || 'Not selected'}
                      </div>
                    </div>
                    <div className={`p-2 rounded ${
                      isDarkMode ? 'bg-gray-800/50' : 'bg-white'
                    }`}>
                      <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Contact:</span>
                      <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {order.contactName || 'Not selected'}
                      </div>
                    </div>
                    
                    {/* Row 3 */}
                    <div className={`p-2 rounded ${
                      isDarkMode ? 'bg-gray-800/50' : 'bg-white'
                    }`}>
                      <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Arrival Date:</span>
                      <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {order.arrivalDate ? formatDate(order.arrivalDate) : 'Not selected'}
                      </div>
                    </div>
                    <div className={`p-2 rounded ${
                      isDarkMode ? 'bg-gray-800/50' : 'bg-white'
                    }`}>
                      <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>PO Date:</span>
                      <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {order.poDate ? formatDate(order.poDate) : 'Not selected'}
                      </div>
                    </div>
                    
                    {/* Row 4 */}
                    <div className={`p-2 rounded ${
                      isDarkMode ? 'bg-gray-800/50' : 'bg-white'
                    }`}>
                      <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Delivery Date:</span>
                      <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {order.deliveryDate ? formatDate(order.deliveryDate) : 'Not selected'}
                      </div>
                    </div>
                    <div className={`p-2 rounded ${
                      isDarkMode ? 'bg-gray-800/50' : 'bg-white'
                    }`}>
                      <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Created:</span>
                      <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {formatDate(order.createdAt)}
                      </div>
                    </div>
                    
                  </div>
                </div>

                {/* Items Section - Horizontal Slider with All Items */}
                {order.items && order.items.length > 0 && (
                  <div className={`p-3 rounded-lg border ${
                    isDarkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className={`text-sm font-semibold ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Items ({order.items.length})
                      </h4>
                      {order.items.length > 1 && (
                        <button
                          onClick={() => {
                            // Show all items in a modal or expand view
                            const allImages = order.items.flatMap(item => item.imageUrls || []);
                            if (allImages.length > 0) {
                              setPreviewImages(allImages);
                              setCurrentImageIndex(0);
                              setShowImagePreview(true);
                            }
                          }}
                          className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                            isDarkMode 
                              ? 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-500' 
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
                          }`}
                        >
                          View All Items
                        </button>
                      )}
                    </div>

                    {/* Horizontal Items Slider */}
                    <div className="relative">
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {order.items.map((item, itemIndex) => (
                          <div key={itemIndex} className={`flex-shrink-0 w-48 p-3 rounded-lg border ${
                            isDarkMode ? 'bg-gray-800/50 border-gray-600' : 'bg-white border-gray-200'
                          }`}>
                            <div className="space-y-2">
                              {/* Item Image with Navigation */}
                              <div className="relative group">
                                {item.imageUrls && item.imageUrls.length > 0 ? (
                                  <>
                                    <img
                                      src={item.imageUrls[0]}
                                      alt={`Item ${itemIndex + 1}`}
                                      className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() => {
                                        setPreviewImages(item.imageUrls || []);
                                        setCurrentImageIndex(0);
                                        setShowImagePreview(true);
                                      }}
                                    />
                                    {item.imageUrls.length > 1 && (
                                      <>
                                        <div className="absolute top-1 right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                          {item.imageUrls.length}
                                        </div>
                                        {/* Navigation Arrows */}
                                        <button
                                          className="absolute left-1 top-1/2 transform -translate-y-1/2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            // Previous image logic
                                          }}
                                        >
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                          </svg>
                                        </button>
                                        <button
                                          className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            // Next image logic
                                          }}
                                        >
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                          </svg>
                                        </button>
                                      </>
                                    )}
                                  </>
                                ) : (
                                  <div className={`w-full h-24 rounded border flex items-center justify-center ${
                                    isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'
                                  }`}>
                                    <PhotoIcon className={`h-8 w-8 ${
                                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                                    }`} />
                                  </div>
                                )}
                              </div>

                              {/* Item Details */}
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Quality:</span>
                                  <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {item.quality && typeof item.quality === 'object' ? item.quality.name || 'Not selected' : 'Not selected'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Quantity:</span>
                                  <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {item.quantity || 0}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Weaver:</span>
                                  <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {item.weaverSupplierName || '-'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Rate:</span>
                                  <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {item.purchaseRate ? `₹${Number(item.purchaseRate).toFixed(2)}` : '-'}
                                  </span>
                                </div>
                                {item.description && (
                                  <div className="pt-1 border-t border-gray-300 dark:border-gray-600">
                                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {item.description}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2 pt-2">
                                <button
                                  onClick={() => {
                                    // Generate PDF for this specific item
                                    }}
                                  className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                                    isDarkMode
                                      ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-600/30'
                                      : 'bg-blue-100 text-blue-600 hover:bg-blue-200 border border-blue-200'
                                  }`}
                                  title="Generate PDF"
                                >
                                  <DocumentArrowDownIcon className="h-3 w-3 inline mr-1" />
                                  PDF
                                </button>
                                
                                <button
                                  onClick={() => handleDeleteItemClick(order._id, itemIndex, item.quality && typeof item.quality === 'object' ? item.quality.name || 'Item' : 'Item')}
                                  className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                                    isDarkMode
                                      ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30'
                                      : 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200'
                                  }`}
                                  title="Delete item"
                                >
                                  <TrashIcon className="h-3 w-3 inline mr-1" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons - 2 Columns Layout */}
              <div className={`p-3 border-t ${
                isDarkMode ? 'border-gray-600 bg-gray-700/30' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="grid grid-cols-2 gap-4">
                  {/* Column 1: Add Lab, Add Mill Input, Mill Output, Dispatch */}
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setSelectedOrderForLabData(order);
                        setShowLabDataModal(true);
                      }}
                      className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2 ${
                        isDarkMode
                          ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30 hover:bg-amber-600/30'
                          : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                      }`}
                      title={order.labData && order.labData.length > 0 ? "Edit Lab Data" : "Add Lab Data"}
                    >
                      <BeakerIcon className="h-4 w-4" />
                      <span>{order.labData && order.labData.length > 0 ? "Add Lab" : "Add Lab"}</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedOrderForMillInputForm(order);
                        setShowMillInputForm(true);
                      }}
                      className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2 ${
                        isDarkMode
                          ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30'
                          : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                      }`}
                      title={orderMillInputs[order.orderId] && orderMillInputs[order.orderId].length > 0 ? "Edit Mill Input" : "Add Mill Input"}
                    >
                      <CubeIcon className="h-4 w-4" />
                      <span>Add Mill Input</span>
                    </button>

                    <button
                      onClick={() => handleMillOutput(order)}
                      className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2 ${
                        isDarkMode
                          ? 'bg-teal-600/20 text-teal-400 border border-teal-500/30 hover:bg-teal-600/30'
                          : 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100'
                      }`}
                      title="Add Mill Output"
                    >
                      <DocumentTextIcon className="h-4 w-4" />
                      <span>Add Mill Output</span>
                    </button>

                    <button
                      onClick={() => handleDispatch(order)}
                      className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2 ${
                        isDarkMode
                          ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30 hover:bg-orange-600/30'
                          : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
                      }`}
                      title="Add Dispatch"
                    >
                      <TruckIcon className="h-4 w-4" />
                      <span>Add Dispatch</span>
                    </button>
                  </div>

                  {/* Column 2: View Details, Edit, Delete, View Logs */}
                  <div className="space-y-2">
                    <button
                      onClick={() => handleView(order)}
                      className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2 ${
                        isDarkMode
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30'
                          : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                      }`}
                      title="View Order Details"
                    >
                      <EyeIcon className="h-4 w-4" />
                      <span>View Details</span>
                    </button>
            
                    <button
                      onClick={() => handleEdit(order)}
                      className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2 ${
                        isDarkMode
                          ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      }`}
                      title="Edit Order"
                    >
                      <PencilIcon className="h-4 w-4" />
                      <span>Edit Order</span>
                    </button>

                    <button
                      onClick={() => handleDeleteClick(order)}
                      className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2 ${
                        isDarkMode
                          ? 'bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30'
                          : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                      }`}
                      title="Delete Order"
                    >
                      <TrashIcon className="h-4 w-4" />
                      <span>Delete ({order.orderId})</span>
                    </button>

                    <button
                      onClick={() => handleViewLogs(order)}
                      className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2 ${
                        isDarkMode
                          ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30 hover:bg-violet-600/30'
                          : 'bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100'
                      }`}
                      title="View Logs"
                    >
                      <ChartBarIcon className="h-4 w-4" />
                      <span>View Logs</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ))}
          
          {/* Card Layout Pagination */}
          {(totalPages > 1 || orders.length > 0) && (
          <div className={`mt-8 px-3 sm:px-4 py-2 sm:py-3 border-t flex justify-center items-center ${
            isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || isChangingPage || loading}
                className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm transition-colors ${
                  currentPage === 1 || isChangingPage || loading
                    ? isDarkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </button>
              
              {/* Page numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={isChangingPage || loading}
                      className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm transition-colors ${
                        currentPage === pageNum
                          ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                          : isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      } ${(isChangingPage || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || isChangingPage || loading}
                className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm transition-colors ${
                  currentPage === totalPages || isChangingPage || loading
                    ? isDarkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                Next
              </button>
            </div>
          </div>
          )}
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

      {/* Status Change Confirmation Modal */}
      {showStatusConfirmModal && statusChangeData && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/60 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`relative w-full max-w-md mx-auto ${isDarkMode ? 'bg-[#1D293D]' : 'bg-white'} rounded-lg shadow-xl`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  statusChangeData.newStatus === 'delivered' 
                    ? isDarkMode ? 'bg-green-500/20' : 'bg-green-100'
                    : isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                }`}>
                  <CheckIcon className={`h-6 w-6 ${
                    statusChangeData.newStatus === 'delivered' 
                      ? isDarkMode ? 'text-green-400' : 'text-green-600'
                      : isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                </div>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Change Order Status
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowStatusConfirmModal(false);
                  setStatusChangeData(null);
                }}
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
                Are you sure you want to change the status of this order?
              </p>
              
              <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Order ID:
                  </span>
                  <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {statusChangeData.orderIdDisplay}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    New Status:
                  </span>
                  <span className={`text-sm font-semibold px-2 py-1 rounded ${
                    statusChangeData.newStatus === 'delivered'
                      ? isDarkMode ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'
                      : isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {statusChangeData.newStatus.charAt(0).toUpperCase() + statusChangeData.newStatus.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={`flex items-center justify-end space-x-3 p-6 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
              <button
                onClick={() => {
                  setShowStatusConfirmModal(false);
                  setStatusChangeData(null);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                  isDarkMode
                    ? 'text-gray-300 bg-white/10 hover:bg-white/20'
                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleStatusChange}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 flex items-center space-x-2 ${
                  statusChangeData.newStatus === 'delivered'
                    ? isDarkMode
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                    : isDarkMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <CheckIcon className="h-4 w-4" />
                <span>Update Status</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Delete Confirmation Modal */}
      {showItemDeleteModal && itemToDelete && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/60 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`relative w-full max-w-md mx-auto ${isDarkMode ? 'bg-[#1D293D]' : 'bg-white'} rounded-lg shadow-xl`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${isDarkMode ? 'bg-red-500/20' : 'bg-red-100'}`}>
                  <ExclamationTriangleIcon className={`h-6 w-6 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                </div>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Delete Item
                </h3>
              </div>
              <button
                onClick={handleItemDeleteCancel}
                disabled={deletingItem}
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
              <div className="space-y-4">
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Are you sure you want to delete this item? This action cannot be undone.
                </p>
                
                <div className={`p-4 rounded-lg border ${
                  isDarkMode ? 'bg-gray-800/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Item:
                    </span>
                    <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {itemToDelete.itemName}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={`flex items-center justify-end space-x-3 p-6 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
              <button
                onClick={handleItemDeleteCancel}
                disabled={deletingItem}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                  isDarkMode
                    ? 'text-gray-300 bg-white/10 hover:bg-white/20 disabled:opacity-50'
                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleItemDeleteConfirm}
                disabled={deletingItem}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 flex items-center space-x-2 ${
                  isDarkMode
                    ? 'text-white bg-red-600 hover:bg-red-700 disabled:opacity-50'
                    : 'text-white bg-red-600 hover:bg-red-700 disabled:opacity-50'
                }`}
              >
                {deletingItem ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <TrashIcon className="h-4 w-4" />
                    <span>Delete Item</span>
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
      {showMillInputForm && selectedOrderForMillInputForm && (() => {
        return (
          <MillInputForm
          key={`mill-input-form-${selectedOrderForMillInputForm.orderId}`}
          order={selectedOrderForMillInputForm}
          mills={mills}
          qualities={qualities}
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
                      onSuccess={async () => {
              const orderId = selectedOrderForMillInputForm?.orderId;
              // Immediately mark that this order now has mill input data
              if (orderId) {
                setOrderMillInputs(prev => {
                  const updated = { ...prev };
                  // If no data exists, create an empty array to indicate data exists
                  if (!updated[orderId]) {
                    updated[orderId] = [];
                  }
                  return updated;
                });
              }
              
              // Refresh orders and mill inputs to show any updates
              await fetchOrders();
              await fetchAllOrderMillInputs();
              
              // Also refresh mill inputs for the specific order
              if (orderId) {
                await fetchMillInputsForOrder(orderId);
                
                // Debug: Log the updated state after refresh
                setTimeout(() => {
                  }, 100);
              }
              
              // Force a small delay to ensure state is updated
              setTimeout(() => {
                // Force re-render by updating a dummy state if needed
                setOrderMillInputs(prev => ({ ...prev }));
              }, 200);
              
              const message = isEditingMillInput ? 'Mill input updated successfully!' : 'Mill input added successfully!';
              showMessage('success', message);
            }}
          onAddMill={() => {
            // Refresh mills when a new mill is added
            fetchMills();
          }}
          onRefreshMills={fetchMills}
          isEditing={isEditingMillInput}
          existingMillInputs={existingMillInputs}
        />
        );
      })()}

      {/* Mill Output Form */}
      {showMillOutputForm && selectedOrderForMillOutput && (
        <MillOutputForm
          order={selectedOrderForMillOutput}
          qualities={qualities}
          isEditing={isEditingMillOutput}
          existingMillOutputs={existingMillOutputs}
          onClose={() => {
            setShowMillOutputForm(false);
            setSelectedOrderForMillOutput(null);
            setIsEditingMillOutput(false);
            setExistingMillOutputs([]);
          }}
          onSuccess={async () => {
            // Refresh orders and mill outputs to show any updates
            await fetchOrders();
            // Add a small delay to ensure database is updated
            setTimeout(async () => {
              await fetchAllOrderMillOutputs();
            }, 500);
            showMessage('success', isEditingMillOutput ? 'Mill output updated successfully!' : 'Mill output added successfully!');
          }}
        />
      )}

      {/* Dispatch Form */}
      {showDispatchForm && selectedOrderForDispatch && (
        <DispatchForm
          order={selectedOrderForDispatch}
          qualities={qualities}
          isEditing={isEditingDispatch}
          existingDispatches={existingDispatches}
          onClose={() => {
            setShowDispatchForm(false);
            setSelectedOrderForDispatch(null);
            setIsEditingDispatch(false);
            setExistingDispatches([]);
          }}
          onSuccess={async () => {
            // Refresh orders and dispatches to show any updates
            await fetchOrders();
            // Add a small delay to ensure database is updated
            setTimeout(async () => {
              await fetchAllOrderDispatches();
            }, 500);
            showMessage('success', isEditingDispatch ? 'Dispatch updated successfully!' : 'Dispatch added successfully!');
          }}
        />
      )}
    </div>
  );
}