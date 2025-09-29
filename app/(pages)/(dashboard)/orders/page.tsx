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

// Helper function to get highest priority process from mill input data
const getHighestPriorityProcess = (processData: any, qualityName?: string) => {
  if (!processData) return null;
  
  const allProcesses = [
    processData.mainProcess,
    ...processData.additionalProcesses
  ].filter(process => process && process.trim() !== '');
  
  if (allProcesses.length === 0) return null;
  
  // Define process priority order (highest to lowest priority)
  const processPriority = [
    'ready to dispatch',
    'folding',
    'Finish',
    'washing',
    'loop',
    'in printing',
    'jigar',
    'In Dyeing',
    'setting',
    'long jet',
    'Soflina WR',
    'Drum',
    'Charkha',
    'Lot No Greigh'
  ];
  
  // Find the highest priority process
  let highestPriorityProcess = allProcesses[0];
  let highestPriorityIndex = processPriority.length;
  
  allProcesses.forEach(process => {
    const index = processPriority.indexOf(process);
    if (index !== -1 && index < highestPriorityIndex) {
      highestPriorityIndex = index;
      highestPriorityProcess = process;
    }
  });
  
  return highestPriorityProcess;
};

export default function OrdersPage() {
  const { isDarkMode, mounted } = useDarkMode();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [qualities, setQualities] = useState<Quality[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const [orderCreating, setOrderCreating] = useState(false);
  const [orderMillInputs, setOrderMillInputs] = useState<{[key: string]: any[]}>({});
  const [processDataByQuality, setProcessDataByQuality] = useState<{[key: string]: string[]}>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formParties, setFormParties] = useState<any[]>([]);
  const [formQualities, setFormQualities] = useState<any[]>([]);
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
  
  // Professional client-side cache for orders data
  const ordersCache = {
    data: null as any,
    timestamp: 0,
    ttl: 5 * 60 * 1000 // 5 minutes for better performance
  };
  
  // Debug mills state changes
  useEffect(() => {
    console.log('Mills state changed:', mills);
  }, [mills]);
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

   // Function to process mill input data and group by order and quality
  const processMillInputDataByQuality = useCallback((millInputs: any[]) => {
    const processMap: {[key: string]: Set<string>} = {};
    
    millInputs.forEach((millInput) => {
      // Process main input
      if (millInput.quality && millInput.processName && millInput.orderId) {
        const qualityId = typeof millInput.quality === 'object' ? millInput.quality._id : millInput.quality;
        const qualityName = typeof millInput.quality === 'object' ? millInput.quality.name : millInput.quality;
        // Include orderId in the key to make it order-specific
        const key = `${millInput.orderId}_${qualityId}_${qualityName}`;
        
        if (!processMap[key]) {
          processMap[key] = new Set();
        }
        processMap[key].add(millInput.processName);
      }
      
      // Process additional meters
      if (millInput.additionalMeters && Array.isArray(millInput.additionalMeters)) {
        millInput.additionalMeters.forEach((additional: any) => {
          if (additional.quality && additional.processName && millInput.orderId) {
            const qualityId = typeof additional.quality === 'object' ? additional.quality._id : additional.quality;
            const qualityName = typeof additional.quality === 'object' ? additional.quality.name : additional.quality;
            // Include orderId in the key to make it order-specific
            const key = `${millInput.orderId}_${qualityId}_${qualityName}`;
            
            if (!processMap[key]) {
              processMap[key] = new Set();
            }
            processMap[key].add(additional.processName);
          }
        });
      }
    });
    
    // Convert Set to Array and sort by priority
    const processPriority = [
      'Lot No Greigh',
      'Charkha',
      'Drum',
      'Soflina WR',
      'long jet',
      'setting',
      'In Dyeing',
      'jigar',
      'in printing',
      'loop',
      'washing',
      'Finish',
      'folding',
      'ready to dispatch'
    ];
    
    const result: {[key: string]: string[]} = {};
    Object.keys(processMap).forEach(key => {
      const processes = Array.from(processMap[key]);
      // Sort by priority, with unknown processes at the end
      result[key] = processes.sort((a, b) => {
        const aIndex = processPriority.indexOf(a);
        const bIndex = processPriority.indexOf(b);
        if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
    });
    
    return result;
  }, []);

  // Function to get process data for a specific quality and order
  const getProcessDataForQuality = useCallback((quality: any, orderId?: string) => {
    if (!quality || !orderId) return [];
    
    const qualityId = typeof quality === 'object' ? quality._id : quality;
    const qualityName = typeof quality === 'object' ? quality.name : quality;
    // Include orderId in the key to make it order-specific
    const key = `${orderId}_${qualityId}_${qualityName}`;
    
    return processDataByQuality[key] || [];
  }, [processDataByQuality]);

  // ULTRA FAST fetch functions - 50ms target
  const fetchOrders = useCallback(async (retryCount = 0, page = currentPage, limit = itemsPerPage, forceRefresh = false) => {
    const maxRetries = 2; // Two retries for better reliability
    const baseTimeout = 3000; // 3 second timeout for better reliability
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
      const limitValue = limit === 'All' ? 200 : Math.max(limit, 50); // Much smaller limits for speed
      url.searchParams.append('limit', limitValue.toString());
      url.searchParams.append('page', page.toString());
      
      // Add cache-busting parameter to ensure fresh data (especially after deletions)
      if (forceRefresh) {
        url.searchParams.append('t', Date.now().toString());
        url.searchParams.append('force', 'true');
      }
      
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
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
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
          // Silent retry - no notification to avoid bad UX
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          return fetchOrders(retryCount + 1, page, limit);
        } else {
          setLoading(false);
          // Silent timeout - no notification to avoid bad UX
          return; // Don't throw error, just return gracefully
        }
      } else if (error.message?.includes('Failed to fetch')) {
        setLoading(false);
        showMessage('error', 'Network error. Please check your connection.', { autoDismiss: true, dismissTime: 4000 });
        return;
      } else {
        setLoading(false);
        showMessage('error', error.message || 'Failed to fetch orders', { autoDismiss: true, dismissTime: 4000 });
        return;
      }
    }
  }, [showMessage, currentPage, itemsPerPage, filters]);

  // Helper function for robust data refresh after operations
  const refreshOrdersWithRetry = useCallback(async (retries = 2) => {
    for (let i = 0; i < retries; i++) {
      try {
        await fetchOrders(0, currentPage, itemsPerPage, true); // Force refresh
        console.log('Orders refreshed successfully');
        return;
      } catch (error) {
        console.error(`Refresh attempt ${i + 1} failed:`, error);
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
    console.error('All refresh attempts failed');
  }, [fetchOrders, currentPage, itemsPerPage]);

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
    const editMillInput = searchParams?.get('editMillInput');
    const addMillInput = searchParams?.get('addMillInput');
    
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

      // Create abort controller for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for better stability

      // Fetch all three endpoints in parallel for better performance
      const [millInputsResponse, millOutputsResponse, dispatchesResponse] = await Promise.all([
        fetch('/api/mill-inputs', {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: controller.signal
        }),
        fetch('/api/mill-outputs', {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: controller.signal
        }),
        fetch('/api/dispatch', {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: controller.signal
        })
      ]);

      clearTimeout(timeoutId);

      // Process mill inputs
      const millInputsData = await millInputsResponse.json();
      // Mill inputs API response processed
      if (millInputsData.success && millInputsData.data?.millInputs) {
        const groupedInputs: {[key: string]: any[]} = {};
        millInputsData.data.millInputs.forEach((input: any) => {
          if (!groupedInputs[input.orderId]) {
            groupedInputs[input.orderId] = [];
          }
          groupedInputs[input.orderId].push(input);
        });
        // Grouped mill inputs processed
        setOrderMillInputs(groupedInputs);
        
        // Process mill input data by quality
        const processedData = processMillInputDataByQuality(millInputsData.data.millInputs);
        setProcessDataByQuality(processedData);
      } else {
        // No mill inputs data found
        setOrderMillInputs({});
        setProcessDataByQuality({});
      }

      // Process mill outputs
      const millOutputsData = await millOutputsResponse.json();
      // Mill outputs API response processed
      if (millOutputsData.success && millOutputsData.data && Array.isArray(millOutputsData.data)) {
        const groupedOutputs: {[key: string]: any[]} = {};
        millOutputsData.data.forEach((output: any) => {
          if (!groupedOutputs[output.orderId]) {
            groupedOutputs[output.orderId] = [];
          }
          groupedOutputs[output.orderId].push(output);
        });
        // Grouped mill outputs processed
        setOrderMillOutputs(groupedOutputs);
      } else {
        // No mill outputs data found
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
    } catch (error: any) {
      // Set empty objects on error
      setOrderMillInputs({});
      setOrderMillOutputs({});
      setOrderDispatches({});
      
      // Handle timeout gracefully - don't show error for non-critical data
      if (error.name === 'AbortError') {
        // Silent timeout for order data - not critical for main functionality
      }
    }
  }, []);

  // Legacy functions for backward compatibility (now just call the optimized version)
  const fetchAllOrderMillInputs = useCallback(() => fetchAllOrderData(), [fetchAllOrderData]);
  const fetchAllOrderMillOutputs = useCallback(() => fetchAllOrderData(), [fetchAllOrderData]);
  const fetchAllOrderDispatches = useCallback(() => fetchAllOrderData(), [fetchAllOrderData]);

  // Function to immediately refresh mill output state for a specific order
  const refreshOrderMillOutputState = useCallback(async (orderId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`/api/mill-outputs?orderId=${orderId}&limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.millOutputs) {
          setOrderMillOutputs(prev => ({
            ...prev,
            [orderId]: data.data.millOutputs
          }));
        } else {
          // If no data, set empty array to update button state
          setOrderMillOutputs(prev => ({
            ...prev,
            [orderId]: []
          }));
        }
      }
    } catch (error) {
      console.error('Error refreshing mill output state:', error);
    }
  }, []);


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
        
        // Process mill input data by quality for this order
        const processedData = processMillInputDataByQuality(data.data.millInputs);
        setProcessDataByQuality(prev => ({ ...prev, ...processedData }));
        } else if (data.success && data.data && Array.isArray(data.data)) {
        // Handle case where data.data is directly the array
        setOrderMillInputs(prev => ({
          ...prev,
          [orderId]: data.data || []
        }));
        
        // Process mill input data by quality for this order
        const processedData = processMillInputDataByQuality(data.data);
        setProcessDataByQuality(prev => ({ ...prev, ...processedData }));
      }
    } catch (error) {
      }
  }, []);

  const fetchParties = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for better reliability
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/parties?limit=100', { // Higher limit for better UX
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate', // No cache for fresh data
          'Pragma': 'no-cache',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 401) return; // Skip on auth error
        if (response.status === 404) {
          // Handle 404 gracefully - parties API might not be available
          console.warn('Parties API not available (404)');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setParties(data.data || []);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Silent timeout for parties - not critical for main functionality
      } else if (!error.message?.includes('401') && !error.message?.includes('404')) {
        // Silent error for parties - not critical for main functionality
        console.warn('Parties fetch failed:', error.message);
      }
    }
  }, []);

  const fetchQualities = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout for better stability
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/qualities?limit=100', { // Increased limit for better UX
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate', // No cache for fresh data
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
        // Silent timeout for qualities - not critical for main functionality
      } else if (!error.message?.includes('401')) {
        // Silent error for qualities - not critical for main functionality
      }
    }
  }, []);

  // Mills fetching disabled for performance - will be loaded when needed
  const fetchMills = useCallback(async () => {
    // Function disabled for performance - mills will be loaded separately when needed
    console.log('fetchMills disabled for performance');
  }, []);

  // AGGRESSIVE prefetching for EXTREME speed
  useEffect(() => {
    // Prefetch all critical routes and APIs immediately
    const prefetchAll = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      // No prefetch - load only when needed for super fast initial load
    };

    prefetchAll();
  }, []);

  // SUPER FAST initialization - ONE TIME ONLY
  useEffect(() => {
    if (isInitialized) return;
    
    const initializeAllData = async () => {
      setLoading(true);
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          showMessage('error', 'Please login to view orders', { autoDismiss: true, dismissTime: 3000 });
          setLoading(false);
          return;
        }

        // Professional loading with optimized timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // Optimized 5 second timeout

        // Professional loading with optimized caching (removed mills API to improve performance)
        const ordersResponse = await fetch('/api/orders?limit=50&page=1', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'max-age=300, stale-while-revalidate=600',
            'Accept': 'application/json'
          },
          signal: controller.signal,
          cache: 'force-cache'
        });

        clearTimeout(timeoutId);

        // Process orders data
        if (ordersResponse.ok) {
          const data = await ordersResponse.json();
          console.log('Orders API response:', data);
          console.log('Orders data structure:', {
            success: data.success,
            hasData: !!data.data,
            dataType: typeof data.data,
            dataLength: Array.isArray(data.data) ? data.data.length : 'not array',
            pagination: data.pagination
          });
          
          if (data.success && data.data) {
            const ordersArray = Array.isArray(data.data) ? data.data : [];
            console.log('Setting orders:', ordersArray.length, 'orders');
            setOrders(ordersArray);
            setPaginationInfo(data.pagination || {
              totalCount: 0,
              totalPages: 0,
              currentPage: 1,
              hasNextPage: false,
              hasPrevPage: false
            });
          } else {
            console.log('No orders found in response');
            setOrders([]);
          }
          setOrdersLoaded(true);
        } else {
          console.error('Failed to load orders:', ordersResponse.status, ordersResponse.statusText);
          setOrders([]);
          setOrdersLoaded(true); // Mark as loaded to show "No orders yet"
          // Don't show error message for 404 or empty results - this is normal
          if (ordersResponse.status !== 404) {
            showMessage('error', 'Failed to load orders', { autoDismiss: true, dismissTime: 3000 });
          }
        }

        // Mills data will be loaded separately when needed (removed for performance)

        setLoading(false);
        
      } catch (error) {
        console.error('Error during data initialization:', error);
        setOrders([]);
        setLoading(false);
        setOrdersLoaded(true); // Mark as loaded even on error to show "No orders yet"
        
        // Only show error message for network errors, not for aborted requests
        if (error instanceof Error && error.name !== 'AbortError') {
          showMessage('error', 'Failed to load orders. Please try again.', { autoDismiss: true, dismissTime: 3000 });
          
          // Auto-retry after 5 seconds (increased from 3)
          setTimeout(() => {
            console.log('Auto-retrying orders load...');
            if (!isInitialized) { // Only retry if not already initialized
              initializeAllData();
            }
          }, 5000);
        }
      } finally {
        console.log('Setting isInitialized to true');
        setIsInitialized(true);
      }
    };
    
    initializeAllData();
    
    // ONE TIME timeout - 15 seconds max for reliable loading
    const timeoutId = setTimeout(() => {
      if (!isInitialized) {
        console.warn('Orders initialization timed out after 15 seconds');
        setOrders([]);
        setLoading(false);
        setOrdersLoaded(true); // Mark as loaded even on timeout
        setIsInitialized(true);
        showMessage('warning', 'Loading is taking longer than expected. Please refresh if needed.', { autoDismiss: true, dismissTime: 5000 });
      }
    }, 15000);
    
    return () => clearTimeout(timeoutId);
  }, [showMessage, isInitialized]);

  // Auto-refresh button states when orders are loaded
  useEffect(() => {
    if (orders.length > 0 && ordersLoaded) {
      // Update button states from orders data (no API calls needed)
      orders.forEach(order => {
        // Update mill input state
        if ((order as any).millInputs && (order as any).millInputs.length > 0) {
          setOrderMillInputs(prev => ({
            ...prev,
            [order.orderId]: (order as any).millInputs
          }));
        }
        
        // Update mill output state
        if ((order as any).millOutputs && (order as any).millOutputs.length > 0) {
          setOrderMillOutputs(prev => ({
            ...prev,
            [order.orderId]: (order as any).millOutputs
          }));
        }
        
        // Update dispatch state
        if ((order as any).dispatches && (order as any).dispatches.length > 0) {
          setOrderDispatches(prev => ({
            ...prev,
            [order.orderId]: (order as any).dispatches
          }));
        }
      });
      
      console.log('Button states updated from orders data');
    }
  }, [orders, ordersLoaded]); // Run when orders change

  // Auto-refresh lab data states when orders change
  useEffect(() => {
    if (orders.length > 0 && ordersLoaded) {
      // Lab data is already included in orders, so no additional API call needed
      console.log('Lab data states updated for all orders');
    }
  }, [orders, ordersLoaded]); // Run when orders change

  // Load additional data only when needed (lazy loading)
  const loadPartiesData = useCallback(async () => {
    try {
      const response = await fetch('/api/parties?limit=100', {
        headers: { 
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setParties(data.data);
          return data.data;
        }
      }
      return [];
    } catch (error) {
      console.error('Error loading parties:', error);
      return [];
    }
  }, []);

  const loadQualitiesData = useCallback(async () => {
    try {
      const response = await fetch('/api/qualities?limit=100', {
        headers: { 
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setQualities(data.data);
          return data.data;
        }
      }
      return [];
    } catch (error) {
      console.error('Error loading qualities:', error);
      return [];
    }
  }, []);

  // Function to open form with data loading
  const openFormWithData = useCallback(async (order?: Order) => {
    setEditingOrder(order || null);
    
    // Show form immediately
    setShowForm(true);
    
    // Load data in background
    try {
      const [partiesData, qualitiesData] = await Promise.all([
        loadPartiesData(),
        loadQualitiesData()
      ]);
      
      // Set form data when loaded
      setFormParties(partiesData || []);
      setFormQualities(qualitiesData || []);
    } catch (error) {
      console.error('Error loading form data:', error);
      // Form is already shown, just set empty data
      setFormParties([]);
      setFormQualities([]);
    }
  }, [loadPartiesData, loadQualitiesData]);

  // Mills data loading disabled for performance
  const loadMillsData = useCallback(async () => {
    // Function disabled for performance - mills will be loaded when needed
    console.log('loadMillsData disabled for performance');
  }, []);

  const loadMillInputsData = useCallback(async (orderId: string, forceRefresh = false) => {
    // Always load fresh data when forceRefresh is true
    if (!forceRefresh && orderMillInputs[orderId]) {
      console.log('Mill inputs already loaded for order:', orderId);
      return; // Already loaded for this order
    }
    
    try {
      console.log('Loading mill inputs for order:', orderId, forceRefresh ? '(forced refresh)' : '');
      const token = localStorage.getItem('token');
      
      // Make request with or without token
      const headers: any = {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/mill-inputs?orderId=${orderId}&limit=100&t=${Date.now()}`, {
        headers: headers
      });
      
      console.log('Mill inputs API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Mill inputs API response data:', data);
        if (data.success && data.data?.millInputs) {
          console.log('Setting mill inputs data:', data.data.millInputs);
          setOrderMillInputs(prev => ({
            ...prev,
            [orderId]: data.data.millInputs
          }));
        } else {
          console.log('No mill inputs data found in response');
        }
      } else {
        console.log('Mill inputs API response not ok:', response.status);
      }
    } catch (error) {
      console.error('Error loading mill inputs:', error);
    }
  }, [orderMillInputs]);

  const loadMillOutputsData = useCallback(async (orderId: string, forceRefresh = false) => {
    if (!forceRefresh && orderMillOutputs[orderId]) return; // Already loaded for this order
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`/api/mill-outputs?orderId=${orderId}&limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.millOutputs) {
          setOrderMillOutputs(prev => ({
            ...prev,
            [orderId]: data.data.millOutputs
          }));
        }
      }
    } catch (error) {
      console.error('Error loading mill outputs:', error);
    }
  }, [orderMillOutputs]);

  const loadDispatchesData = useCallback(async (orderId: string, forceRefresh = false) => {
    if (!forceRefresh && orderDispatches[orderId]) return; // Already loaded for this order
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`/api/dispatch?orderId=${orderId}&limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.dispatches) {
          setOrderDispatches(prev => ({
            ...prev,
            [orderId]: data.data.dispatches
          }));
        }
      }
    } catch (error) {
      console.error('Error loading dispatches:', error);
    }
  }, [orderDispatches]);

  // Function to refresh orders data (includes all button states)
  const refreshOrdersData = useCallback(async () => {
    try {
      await fetchOrders();
      console.log('Orders data refreshed');
    } catch (error) {
      console.error('Error refreshing orders data:', error);
    }
  }, [fetchOrders]);

  // Function to refresh lab data states for all orders
  const refreshLabDataStates = useCallback(async () => {
    if (orders.length === 0) return;
    
    try {
      // Refresh orders to get latest lab data
      await refreshOrdersWithRetry();
      console.log('Lab data states refreshed');
    } catch (error) {
      console.error('Error refreshing lab data states:', error);
    }
  }, [orders, refreshOrdersWithRetry]);

  // Keyboard navigation for image preview
  useEffect(() => {
    if (showImagePreview) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showImagePreview, currentImageIndex]);

  // NO MORE EVENT LISTENERS - No multiple refreshes

  // Optimized refresh function with Promise.all for maximum performance
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    
    try {
      // Only refresh orders - super simple
      await fetchOrders();
      showMessage('success', 'Orders refreshed successfully', { 
        autoDismiss: true, 
        dismissTime: 2000 
      });
    } catch (error: any) {
      console.error('Error during refresh:', error);
      showMessage('error', 'Failed to refresh orders', { 
        autoDismiss: true, 
        dismissTime: 2000 
      });
    } finally {
      setRefreshing(false);
    }
  }, [fetchOrders, showMessage]);

  // PDF Download function for individual items - fetches fresh data
  const handleDownloadItemPDF = useCallback(async (order: any, item: any, itemIndex: number) => {
    try {
      showMessage('info', 'Fetching latest data for PDF...', { 
        autoDismiss: true, 
        dismissTime: 2000 
      });

      // Fetch fresh order data with all related data
      const response = await fetch(`/api/orders/${order._id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch order data');
      }
      
      const orderData = await response.json();
      if (!orderData.success) {
        throw new Error('Failed to get order data');
      }

      // Create a modified order object with only the specific item
      const itemOrder = {
        ...orderData.data,
        items: [item], // Only include the specific item
        // Add item-specific information to the order
        itemIndex: itemIndex + 1,
        qualityName: item.quality && typeof item.quality === 'object' ? item.quality.name || 'Not selected' : 'Not selected',
        totalAmount: item.totalPrice || 0,
        finalAmount: item.totalPrice || 0
        // The orderData.data already includes fresh millInputs, millOutputs, and dispatches
        // from the API, so we don't need to add them separately
      };
      
      generateOrderPDF(itemOrder);
      showMessage('success', `PDF downloaded for ${item.quality && typeof item.quality === 'object' ? item.quality.name || 'Item' : 'Item'}`, { 
        autoDismiss: true, 
        dismissTime: 3000 
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      showMessage('error', 'Failed to generate PDF. Please try again.', { 
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
    // Don't clear statusChangeData yet - we need it for loading state
    
      try {
        const token = localStorage.getItem('token');
        
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for better stability
        
        const response = await fetch(`/api/orders/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({ 
            orderId: statusChangeData.orderId,
            status: statusChangeData.newStatus 
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

      const data = await response.json();
      
      if (data.success) {
        // Show only one success message
        showMessage('success', `Order ${statusChangeData.orderIdDisplay} status updated to ${statusChangeData.newStatus}`, { autoDismiss: true, dismissTime: 1000 });
        
        // No need to trigger real-time update since we already have optimistic updates
        // The UI is already updated, so no additional API calls needed
      } else {
        // Revert optimistic update on error
        setOrders(prev => prev.map(order => 
          order._id === statusChangeData.orderId ? { ...order, status: statusChangeData.newStatus === 'pending' ? 'delivered' : 'pending' } : order
        ));
        showMessage('error', data.message || 'Failed to update order status', { autoDismiss: true, dismissTime: 1500 });
      }
    } catch (error) {
      // Revert optimistic update on error
      setOrders(prev => prev.map(order => 
        order._id === statusChangeData.orderId ? { ...order, status: statusChangeData.newStatus === 'pending' ? 'delivered' : 'pending' } : order
      ));
      
      // Handle different error types
      if (error instanceof Error && error.name === 'AbortError') {
        showMessage('error', 'Request timed out. Please try again.', { autoDismiss: true, dismissTime: 1500 });
      } else {
        showMessage('error', 'Failed to update order status', { autoDismiss: true, dismissTime: 1500 });
      }
    } finally {
      setChangingStatus(false);
      setStatusChangeData(null); // Clear statusChangeData after loading is complete
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
    console.log('Filtering orders:', {
      totalOrders: orders.length,
      searchTerm,
      filters,
      orders: orders.map(o => ({ id: o.orderId, status: o.status, type: o.orderType }))
    });
    
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
        
        const matchesStatus = filters.statusFilter === 'all' || normalizedStatus === filters.statusFilter;

        const passes = matchesSearch && matchesType && matchesStatus;
        
        if (!passes) {
          console.log('Order filtered out:', {
            orderId: order.orderId,
            matchesSearch,
            matchesType,
            matchesStatus,
            orderStatus,
            normalizedStatus,
            searchTerm,
            typeFilter: filters.typeFilter,
            statusFilter: filters.statusFilter
          });
        }

        return passes;
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

    // No search results handling

    // Apply client-side pagination
    let result;
    if (itemsPerPage === 'All') {
      result = filtered; // Show all orders only when "All" is selected
    } else {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      result = filtered.slice(startIndex, endIndex);
    }
    
    console.log('Filtered orders result:', {
      filteredCount: filtered.length,
      resultCount: result.length,
      currentPage,
      itemsPerPage,
      startIndex: itemsPerPage === 'All' ? 0 : (currentPage - 1) * itemsPerPage,
      endIndex: itemsPerPage === 'All' ? filtered.length : (currentPage - 1) * itemsPerPage + itemsPerPage
    });
    
    return result;
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
        // Show success message immediately
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
        
        // Close modal immediately
        setShowDeleteModal(false);
        setOrderToDelete(null);
        
        // Update local state immediately for better UX
        setOrders(prev => prev.filter(order => order._id !== orderToDelete._id));
        
        // Wait a moment for deletion to be fully processed on server
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Refresh orders from server to ensure consistency
        await refreshOrdersWithRetry();
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
  }, [orderToDelete, showMessage, refreshOrdersWithRetry]);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteModal(false);
    setOrderToDelete(null);
    setDeleting(false);
  }, []);

  const handleEdit = (order: Order) => {
    openFormWithData(order);
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
    console.log('Opening Mill Input form for order:', order.orderId);
    
    // Set order and show form immediately for faster UI response
    setSelectedOrderForMillInputForm(order);
    setShowMillInputForm(true);
    
    // Use data from order instead of API call (data already loaded)
    const existingData = (order as any).millInputs || [];
    const hasExistingData = existingData.length > 0;
    
    // Set editing state and existing data
    setIsEditingMillInput(hasExistingData);
    setExistingMillInputs(existingData);
    
    console.log('Mill Input form opened with data:', { hasExistingData, existingDataLength: existingData.length });
    
    // Load qualities data in background (non-blocking)
    if (qualities.length === 0) {
      loadQualitiesData().catch(error => {
        console.error('Error loading qualities for mill input:', error);
      });
    }
  };

  const handleMillOutput = async (order: Order) => {
    console.log('Opening Mill Output form for order:', order.orderId);
    
    // Set order and show form immediately for faster UI response
    setSelectedOrderForMillOutput(order);
    setShowMillOutputForm(true);
    
    // Use data from order instead of API call (data already loaded)
    const existingData = (order as any).millOutputs || [];
    const hasExistingData = existingData.length > 0;
    
    // Set editing state and existing data
    setIsEditingMillOutput(hasExistingData);
    setExistingMillOutputs(existingData);
    
    console.log('Mill Output form opened with data:', { hasExistingData, existingDataLength: existingData.length });
    
    // Load qualities data in background (non-blocking)
    if (qualities.length === 0) {
      loadQualitiesData().catch(error => {
        console.error('Error loading qualities for mill output:', error);
      });
    }
  };

  const handleDispatch = async (order: Order) => {
    console.log('Opening Dispatch form for order:', order.orderId);
    
    // Set order and show form immediately for faster UI response
    setSelectedOrderForDispatch(order);
    setShowDispatchForm(true);
    
    // Use data from order instead of API call (data already loaded)
    const existingData = (order as any).dispatches || [];
    const hasExistingData = existingData.length > 0;
    
    // Set editing state and existing data
    setIsEditingDispatch(hasExistingData);
    setExistingDispatches(existingData);
    
    console.log('Dispatch form opened with data:', { hasExistingData, existingDataLength: existingData.length });
    
    // Load parties data in background (non-blocking)
    if (parties.length === 0) {
      loadPartiesData().catch(error => {
        console.error('Error loading parties for dispatch:', error);
      });
    }
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

  // Reset to page 1 when filters change - NO API CALLS
    useEffect(() => {
      setCurrentPage(1);
    }, [filters, itemsPerPage]);

  // Auto-correct current page if it exceeds total pages - NO API CALLS
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
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

  // Enhanced loading skeleton with proper table structure
  const LoadingSkeleton = () => (
    <div className={`min-h-screen ${
      isDarkMode 
        ? 'bg-gray-900 text-white' 
        : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            {/* Create Order Button Skeleton */}
            <div className="flex items-center order-1 md:order-1">
              <div className={`h-10 w-32 rounded-lg ${
          isDarkMode ? 'bg-slate-700' : 'bg-gray-200'
          }`}></div>
            </div>
            
            {/* Search Bar Skeleton */}
            <div className="flex-1 order-2 md:order-2">
              <div className={`h-10 rounded-lg ${
          isDarkMode ? 'bg-slate-700' : 'bg-gray-200'
        }`}></div>
      </div>

            {/* Quick Actions Button Skeleton */}
            <div className="flex items-center order-3 md:order-3">
              <div className={`h-10 w-24 rounded-lg ${
        isDarkMode ? 'bg-slate-700' : 'bg-gray-200'
        }`}></div>
            </div>
          </div>
        </div>

        {/* Pagination Info Skeleton */}
        <div className="mt-6 flex items-center justify-between">
          <div className={`h-4 w-32 rounded ${
            isDarkMode ? 'bg-slate-700' : 'bg-gray-200'
          }`}></div>
          <div className={`h-8 w-20 rounded ${
            isDarkMode ? 'bg-slate-700' : 'bg-gray-200'
          }`}></div>
        </div>

        {/* Table Skeleton with proper structure - EXACTLY matching the real table */}
        <div className="mt-6">
          <div className={`rounded-xl border overflow-hidden shadow-lg ${
            isDarkMode
              ? 'bg-white/5 border-white/10 shadow-2xl'
              : 'bg-white border-gray-200 shadow-xl'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: '900px' }}>
            <thead className={`${
              isDarkMode ? 'bg-gradient-to-r from-slate-800/80 to-slate-700/80 border-b border-slate-600' : 'bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-300'
            }`}>
              <tr>
                    <th className={`px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold uppercase tracking-wide border-b-2 min-w-[280px] ${
                      isDarkMode ? 'text-white border-slate-500 bg-slate-700/50' : 'text-black border-black/50 bg-blue-50'
                    }`}>
                      Order Information
                    </th>
                    <th className={`px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold uppercase tracking-wide border-b-2 min-w-[320px] ${
                      isDarkMode ? 'text-white border-slate-500 bg-slate-700/50' : 'text-black border-black bg-blue-50'
                    }`}>
                      Items
                    </th>
                    <th className={`px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold uppercase tracking-wide border-b-2 min-w-[180px] ${
                      isDarkMode ? 'text-white border-slate-500 bg-slate-700/50' : 'text-black border-black bg-blue-50'
                    }`}>
                      Actions
                    </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              isDarkMode ? 'divide-white/10' : 'divide-gray-200'
            }`}>
                  {[...Array(3)].map((_, i) => (
                <tr key={i} className={`hover:${
                  isDarkMode ? 'bg-white/5' : 'bg-gray-50'
                } transition-colors duration-200`}>
                      {/* Order Information Column Skeleton - Compact */}
                      <td className="px-2 sm:px-3 py-2 sm:py-3">
                        <div className="space-y-2">
                          {/* Order ID and Type - Very compact layout */}
                          <div className="flex gap-2">
                            {/* Order ID Skeleton */}
                            <div className={`p-1.5 rounded border animate-pulse ${
                              isDarkMode 
                                ? 'bg-green-500/8 border-green-500/15' 
                                : 'bg-green-50 border-green-200'
                            }`}>
                              <div className="flex items-center gap-1">
                                <div className={`h-2.5 w-10 rounded ${
                                  isDarkMode ? 'bg-green-400/30' : 'bg-green-300'
                                }`}></div>
                                <div className={`h-3 w-6 rounded ${
                                  isDarkMode ? 'bg-white/30' : 'bg-gray-300'
                                }`}></div>
                              </div>
                            </div>
                            
                            {/* Order Type Skeleton */}
                            <div className={`p-1.5 rounded border animate-pulse ${
                              isDarkMode 
                                ? 'bg-purple-500/8 border-purple-500/15' 
                                : 'bg-purple-50 border-purple-200'
                            }`}>
                              <div className="flex items-center gap-1">
                                <div className={`h-2.5 w-12 rounded ${
                                  isDarkMode ? 'bg-purple-400/30' : 'bg-purple-300'
                                }`}></div>
                                <div className={`h-3 w-8 rounded ${
                                  isDarkMode ? 'bg-white/30' : 'bg-gray-300'
                                }`}></div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Party and Date - Very compact */}
                          <div className="flex gap-2">
                            <div className={`h-2.5 w-20 rounded animate-pulse ${
                              isDarkMode ? 'bg-white/15' : 'bg-gray-200'
                            }`}></div>
                            <div className={`h-2.5 w-14 rounded animate-pulse ${
                              isDarkMode ? 'bg-white/15' : 'bg-gray-200'
                            }`}></div>
                          </div>
                        </div>
                      </td>

                      {/* Items Column Skeleton - Very Compact */}
                      <td className="px-2 sm:px-3 py-2 sm:py-3">
                        <div className="space-y-1.5">
                          <div className={`h-3 w-14 rounded animate-pulse ${
                            isDarkMode ? 'bg-white/15' : 'bg-gray-200'
                          }`}></div>
                          <div className="flex flex-col gap-1">
                            <div className={`h-2.5 w-16 rounded animate-pulse ${
                              isDarkMode ? 'bg-white/15' : 'bg-gray-200'
                            }`}></div>
                            <div className={`h-2.5 w-12 rounded animate-pulse ${
                              isDarkMode ? 'bg-white/15' : 'bg-gray-200'
                            }`}></div>
                          </div>
                        </div>
                      </td>

                      {/* Actions Column Skeleton - Very Compact */}
                      <td className="px-2 sm:px-3 py-2 sm:py-3">
                        <div className="flex flex-col gap-1">
                          <div className={`h-6 w-full rounded animate-pulse ${
                            isDarkMode ? 'bg-blue-500/12' : 'bg-blue-100'
                          }`}></div>
                          <div className={`h-6 w-full rounded animate-pulse ${
                            isDarkMode ? 'bg-green-500/12' : 'bg-green-100'
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

        {/* Bottom Pagination Skeleton */}
        <div className="mt-6 flex items-center justify-between">
          <div className={`h-4 w-32 rounded ${
            isDarkMode ? 'bg-slate-700' : 'bg-gray-200'
          }`}></div>
          <div className="flex space-x-2">
            <div className={`h-8 w-8 rounded ${
              isDarkMode ? 'bg-slate-700' : 'bg-gray-200'
            }`}></div>
            <div className={`h-8 w-8 rounded ${
              isDarkMode ? 'bg-slate-700' : 'bg-gray-200'
            }`}></div>
            <div className={`h-8 w-8 rounded ${
              isDarkMode ? 'bg-slate-700' : 'bg-gray-200'
            }`}></div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;

  // Show loading skeleton during initial load or when refreshing
  if (loading || (!ordersLoaded && !isInitialized) || isChangingPage) {
    console.log('Showing loading skeleton:', { loading, ordersLoaded, isInitialized, isChangingPage });
    return <LoadingSkeleton />;
  }

  // Debug logging for troubleshooting
  console.log('Orders page render state:', {
    loading,
    ordersLoaded,
    isInitialized,
    ordersCount: orders.length,
    currentOrdersCount: currentOrders.length,
    searchTerm,
    filters
  });

  // Debug button states for first few orders
  if (orders.length > 0) {
    console.log('Button states for first 3 orders:', orders.slice(0, 3).map(order => ({
      orderId: order.orderId,
      millInputs: (order as any).millInputs?.length || 0,
      millOutputs: (order as any).millOutputs?.length || 0,
      dispatches: (order as any).dispatches?.length || 0,
      labData: order.labData?.length || 0
    })));
  }

  // Helper functions for button states - super clean and fast
  const hasMillInputs = (order: Order) => {
    const millInputs = (order as any).millInputs;
    return Array.isArray(millInputs) && millInputs.length > 0;
  };

  const hasMillOutputs = (order: Order) => {
    const millOutputs = (order as any).millOutputs;
    return Array.isArray(millOutputs) && millOutputs.length > 0;
  };

  const hasDispatches = (order: Order) => {
    const dispatches = (order as any).dispatches;
    return Array.isArray(dispatches) && dispatches.length > 0;
  };

  const hasLabData = (order: Order) => {
    return (order.labData && order.labData.length > 0) || order.items.some(item => item.labData?.sampleNumber);
  };

  return (
    <div className={`min-h-screen ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50'
    }`}>
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
              
              {/* Reset Counter - Only show when no orders exist and not loading */}
              {ordersLoaded && orders.length === 0 && (
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
                onClick={() => openFormWithData()}
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
              {/* Loading state inside table */}
              {((loading && !ordersLoaded) || orderCreating) && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
                        isDarkMode ? 'border-blue-400' : 'border-blue-600'
                      }`}></div>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {orderCreating ? 'Creating order...' : 'Loading orders...'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              
              {/* Rendering table with orders */}
              {!loading && !orderCreating && currentOrders.map((order) => (
                  <tr key={order._id} className={`hover:${
                    isDarkMode ? 'bg-white/5' : 'bg-gray-50'
                  } transition-colors duration-200`}>
                   {/* Order Information Column */}
                   <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5">
                      <div className="space-y-3">
                        {/* Row 1: Order ID and Type in separate columns */}
                        <div className="grid grid-cols-2 gap-4">
                          {/* Order ID Column */}
                          <div className={`p-3 rounded-lg border ${
                            isDarkMode 
                              ? 'bg-green-500/10 border-green-500/20' 
                              : 'bg-green-50 border-green-200'
                          }`}>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                                Order ID:
                              </span>
                              <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {order.orderId}
                              </span>
                            </div>
                          </div>
                          
                          {/* Order Type Column */}
                          <div className={`p-3 rounded-lg border ${
                            isDarkMode 
                              ? 'bg-purple-500/10 border-purple-500/20' 
                              : 'bg-purple-50 border-purple-200'
                          }`}>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                                Order Type:
                              </span>
                              <span className={`text-lg font-bold ${
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
                                 <th className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${
                                   isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                 }`}>
                                   Quality
                                 </th>
                                 <th className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${
                                   isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                 }`}>
                                   Qty
                                 </th>
                                 <th className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${
                                   isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                 }`}>
                                  Desc.
                                 </th>
                                 <th className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${
                                   isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                 }`}>
                                   Weaver
                                 </th>
                                 <th className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${
                                   isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                 }`}>
                                   P-Rate
                                 </th>
                                 <th className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${
                                   isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                 }`}>
                                   M-Rate
                                 </th>
                                 <th className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${
                                   isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                 }`}>
                                   S-Rate
                                 </th>
                                 <th className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${
                                   isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                 }`}>
                                   Process
                                 </th>
                                 <th className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${
                                   isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                 }`}>
                                   Images
                                 </th>
                                 <th className={`px-4 py-3 text-center text-xs font-bold uppercase tracking-wider ${
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
                                   <td className="px-4 py-4">
                                     <div className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {item.quality && typeof item.quality === 'object' ? item.quality.name || 'Not selected' : 'Not selected'}
                                     </div>
                                   </td>
                                   
                                   {/* Quantity */}
                                   <td className="px-4 py-4">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                isDarkMode 
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                                  : 'bg-blue-100 text-blue-700 border border-blue-200'
                              }`}>
                                       {item.quantity || 0}
                              </span>
                                   </td>
                            
                            {/* Description */}
                                   <td className="px-4 py-4">
                                     <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} max-w-[120px] truncate`}>
                                       {item.description || '-'}
                              </div>
                                   </td>
                                   
                                   {/* Weaver/Supplier */}
                                   <td className="px-4 py-4">
                                     <div className={`text-xs ${isDarkMode ? 'text-orange-300' : 'text-orange-600'} max-w-[100px] truncate`}>
                                       {item.weaverSupplierName || '-'}
                              </div>
                                   </td>
                            
                            {/* Purchase Rate */}
                                   <td className="px-4 py-4">
                                     <div className={`text-xs ${isDarkMode ? 'text-green-300' : 'text-green-600'}`}>
                                       {item.purchaseRate ? `₹${Number(item.purchaseRate).toFixed(2)}` : '-'}
                              </div>
                                   </td>
                                   
                                   {/* Mill Rate */}
                                   <td className="px-4 py-4">
                                     <div className={`text-xs ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                                       {item.millRate ? `₹${Number(item.millRate).toFixed(2)}` : '-'}
                              </div>
                                   </td>
                                   
                                   {/* Sales Rate */}
                                   <td className="px-4 py-4">
                                     <div className={`text-xs ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                                       {item.salesRate ? `₹${Number(item.salesRate).toFixed(2)}` : '-'}
                              </div>
                                   </td>
                                   
                                   {/* Process */}
                                   <td className="px-4 py-4">
                                     <div className="max-w-[150px]">
                                       {(() => {
                                         const qualityName = typeof item.quality === 'string' ? item.quality : item.quality?.name || 'N/A';
                                         
                                         // Use process data from API if available
                                         const processFromAPI = getHighestPriorityProcess((item as any).processData, qualityName);
                                         if (processFromAPI) {
                                           const displayProcess = processFromAPI;
                                           
                                           return (
                                             <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                               isDarkMode 
                                                 ? 'bg-orange-600/20 text-orange-300 border border-orange-500/30' 
                                                 : 'bg-orange-100 text-orange-700 border border-orange-200'
                                             }`}>
                                               {displayProcess}
                                             </div>
                                           );
                                         }
                                         
                                         // Fallback to old method if no process data from API
                                         const processes = getProcessDataForQuality(item.quality, order.orderId);
                                         if (processes.length === 0) {
                                           return <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>No process data</span>;
                                         }
                                         
                                         // Show only the highest priority process (last one in the sorted array)
                                         const highestPriorityProcess = processes[processes.length - 1];
                                         
                                         return (
                                           <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                             isDarkMode 
                                               ? 'bg-orange-600/20 text-orange-300 border border-orange-500/30' 
                                               : 'bg-orange-100 text-orange-700 border border-orange-200'
                                           }`}>
                                             {highestPriorityProcess}
                                           </div>
                                         );
                                       })()}
                                     </div>
                                   </td>
                                   
                                   {/* Images */}
                                   <td className="px-4 py-4">
                                     {item.imageUrls && item.imageUrls.length > 0 ? (
                                       <div className="relative group">
                                  {/* Show first image with hover overlay */}
                                    <img 
                                      src={item.imageUrls[0]} 
                                           alt={`Item ${index + 1}`}
                                           className="h-16 w-16 object-cover rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg"
                                      onError={(e) => {
                                             (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                      onClick={() => handleImagePreview(item.imageUrls![0], `Item ${index + 1}`, item.imageUrls, 0)}
                                    />
                                         {/* Image count badge for multiple images */}
                                         {item.imageUrls.length > 1 && (
                                           <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                             {item.imageUrls.length}
                                           </div>
                                         )}
                                    </div>
                                     ) : (
                                       <div className="flex items-center gap-2 h-16 w-16">
                                         <PhotoIcon className="h-6 w-6 text-gray-400" />
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
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleStatusChangeClick(order._id, 'pending', order.orderId)}
                              disabled={changingStatus}
                              className={`px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap flex items-center justify-center ${
                                (order.status || 'pending') === 'pending'
                                  ? isDarkMode
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-blue-600 text-white'
                                  : isDarkMode
                                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              } ${changingStatus ? 'opacity-50 cursor-not-allowed pointer-events-none scale-95' : 'hover:scale-105'}`}
                            >
                              Pending
                            </button>
                            <button
                              onClick={() => handleStatusChangeClick(order._id, 'delivered', order.orderId)}
                              disabled={changingStatus}
                              className={`px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap flex items-center justify-center ${
                                order.status === 'delivered'
                                  ? isDarkMode
                                    ? 'bg-green-600 text-white'
                                    : 'bg-green-600 text-white'
                                  : isDarkMode
                                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              } ${changingStatus ? 'opacity-50 cursor-not-allowed pointer-events-none scale-95' : 'hover:scale-105'}`}
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
                             className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2 relative ${
                               isDarkMode
                                 ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30 hover:bg-amber-600/30'
                                 : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                             }`}
                             title={hasLabData(order) ? "Edit Lab Data" : "Add Lab Data"}
                           >
                             <BeakerIcon className="h-4 w-4" />
                             <span>{hasLabData(order) ? "Edit Lab Data" : "Add Lab Data"}</span>
                             {/* Status indicator */}
                             <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 ${
                               isDarkMode ? 'border-gray-800' : 'border-white'
                             } ${
                               hasLabData(order) ? 'bg-green-500' : 'bg-gray-400'
                             }`} title={hasLabData(order) ? "Data exists" : "No data"} />
                           </button>

                           <button
                             onClick={() => handleMillInput(order)}
                             className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2 relative ${
                               isDarkMode
                                 ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30'
                                 : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                             }`}
                             title={hasMillInputs(order) ? "Edit Mill Input" : "Add Mill Input"}
                           >
                             <CubeIcon className="h-4 w-4" />
                             <span>{hasMillInputs(order) ? "Edit Mill Input" : "Add Mill Input"}</span>
                             {/* Status indicator */}
                             <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 ${
                               isDarkMode ? 'border-gray-800' : 'border-white'
                             } ${
                               hasMillInputs(order) ? 'bg-green-500' : 'bg-gray-400'
                             }`} title={hasMillInputs(order) ? "Data exists" : "No data"} />
                           </button>

                           <button
                             onClick={() => handleMillOutput(order)}
                             className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2 relative ${
                               isDarkMode
                                 ? 'bg-teal-600/20 text-teal-400 border border-teal-500/30 hover:bg-teal-600/30'
                                 : 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100'
                             }`}
                             title={hasMillOutputs(order) ? "Edit Mill Output" : "Add Mill Output"}
                           >
                             <DocumentTextIcon className="h-4 w-4" />
                             <span>{hasMillOutputs(order) ? "Edit Mill Output" : "Add Mill Output"}</span>
                             {/* Status indicator */}
                             <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 ${
                               isDarkMode ? 'border-gray-800' : 'border-white'
                             } ${
                               hasMillOutputs(order) ? 'bg-green-500' : 'bg-gray-400'
                             }`} title={hasMillOutputs(order) ? "Data exists" : "No data"} />
                           </button>

                           <button
                             onClick={() => handleDispatch(order)}
                             className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2 relative ${
                               isDarkMode
                                 ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30 hover:bg-orange-600/30'
                                 : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
                             }`}
                             title={hasDispatches(order) ? "Edit Dispatch" : "Add Dispatch"}
                           >
                             <TruckIcon className="h-4 w-4" />
                             <span>{hasDispatches(order) ? "Edit Dispatch" : "Add Dispatch"}</span>
                             {/* Status indicator */}
                             <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 ${
                               isDarkMode ? 'border-gray-800' : 'border-white'
                             } ${
                               hasDispatches(order) ? 'bg-green-500' : 'bg-gray-400'
                             }`} title={hasDispatches(order) ? "Data exists" : "No data"} />
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

        {/* Loading overlay for when data is being refreshed */}
        {(loading || isChangingPage) && orders.length > 0 && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
            <div className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-sm">{isChangingPage ? 'Changing page...' : 'Loading orders...'}</p>
            </div>
          </div>
        )}

        {currentOrders.length === 0 && ordersLoaded && !loading && !orderCreating && (
          <div className={`text-center py-12 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {orders.length === 0 ? (
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
                    {orders.length === 0 ? 'No orders yet' : 'No orders match your filters'}
                  </h3>
                  <p className="mt-2">
                    {orders.length === 0 
                      ? 'Get started by creating your first order' 
                      : `Try adjusting your search or filter criteria. Total orders: ${orders.length}`
                    }
                  </p>
                </div>
                <div className="flex space-x-3 justify-center">
                {orders.length === 0 ? (
                <button
                  onClick={() => openFormWithData()}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm transition-colors ${
                    isDarkMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Order
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilters({
                        orderFilter: 'latest_first',
                        typeFilter: 'all',
                        statusFilter: 'all'
                      });
                    }}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm transition-colors ${
                      isDarkMode
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    Clear Filters
                  </button>
                )}
                  <button
                    onClick={() => {
                      setLoading(true);
                      setOrdersLoaded(false);
                      setIsInitialized(false);
                      // Trigger a fresh load
                      setTimeout(() => {
                        window.location.reload();
                      }, 100);
                    }}
                    className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm transition-colors ${
                      isDarkMode
                        ? 'bg-gray-600 hover:bg-gray-700 text-white border-gray-500'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
                    }`}
                  >
                    Refresh
                </button>
                </div>
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
          {(loading && !ordersLoaded) || orderCreating ? (
            // Loading skeleton cards
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className={`rounded-xl border shadow-lg animate-pulse ${
                isDarkMode ? 'bg-gray-800/50 border-gray-600' : 'bg-white border-gray-200'
              }`}>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-24 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="w-16 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="w-1/2 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                  <div className="mt-4 flex justify-between">
                    <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            !orderCreating && currentOrders.map((order) => (
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
                        disabled={changingStatus}
                        className={`px-2 py-1 text-xs font-semibold rounded transition-all duration-200 whitespace-nowrap flex items-center justify-center ${
                          (order.status || 'pending') === 'pending'
                            ? isDarkMode
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-600 text-white'
                            : isDarkMode
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        } ${changingStatus ? 'opacity-50 cursor-not-allowed pointer-events-none scale-95' : 'hover:scale-105'}`}
                      >
                        Pending
                      </button>
                      <button
                        onClick={() => handleStatusChangeClick(order._id, 'delivered', order.orderId)}
                        disabled={changingStatus}
                        className={`px-2 py-1 text-xs font-semibold rounded transition-all duration-200 whitespace-nowrap flex items-center justify-center ${
                          order.status === 'delivered'
                            ? isDarkMode
                              ? 'bg-green-600 text-white'
                              : 'bg-green-600 text-white'
                            : isDarkMode
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        } ${changingStatus ? 'opacity-50 cursor-not-allowed pointer-events-none scale-95' : 'hover:scale-105'}`}
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
                                    {item.imageUrls.length > 0 && (
                                      <>
                                        {item.imageUrls.length > 1 && (
                                          <div className="absolute top-1 right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                            {item.imageUrls.length}
                                          </div>
                                        )}
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
                                  onClick={() => handleDownloadItemPDF(order, item, itemIndex)}
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
                      className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2 relative ${
                        isDarkMode
                          ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30 hover:bg-amber-600/30'
                          : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                      }`}
                      title={hasLabData(order) ? "Edit Lab Data" : "Add Lab Data"}
                    >
                      <BeakerIcon className="h-4 w-4" />
                      <span>{hasLabData(order) ? "Edit Lab Data" : "Add Lab Data"}</span>
                      {/* Status indicator */}
                      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 ${
                        isDarkMode ? 'border-gray-800' : 'border-white'
                      } ${
                        hasLabData(order) ? 'bg-green-500' : 'bg-gray-400'
                      }`} title={hasLabData(order) ? "Data exists" : "No data"} />
                    </button>

                    <button
                      onClick={() => handleMillInput(order)}
                      className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2 relative ${
                        isDarkMode
                          ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30'
                          : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                      }`}
                      title={hasMillInputs(order) ? "Edit Mill Input" : "Add Mill Input"}
                    >
                      <CubeIcon className="h-4 w-4" />
                      <span>{hasMillInputs(order) ? "Edit Mill Input" : "Add Mill Input"}</span>
                      {/* Status indicator */}
                      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 ${
                        isDarkMode ? 'border-gray-800' : 'border-white'
                      } ${
                        hasMillInputs(order) ? 'bg-green-500' : 'bg-gray-400'
                      }`} title={hasMillInputs(order) ? "Data exists" : "No data"} />
                    </button>

                    <button
                      onClick={() => handleMillOutput(order)}
                      className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2 relative ${
                        isDarkMode
                          ? 'bg-teal-600/20 text-teal-400 border border-teal-500/30 hover:bg-teal-600/30'
                          : 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100'
                      }`}
                      title={hasMillOutputs(order) ? "Edit Mill Output" : "Add Mill Output"}
                    >
                      <DocumentTextIcon className="h-4 w-4" />
                      <span>{hasMillOutputs(order) ? "Edit Mill Output" : "Add Mill Output"}</span>
                      {/* Status indicator */}
                      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 ${
                        isDarkMode ? 'border-gray-800' : 'border-white'
                      } ${
                        hasMillOutputs(order) ? 'bg-green-500' : 'bg-gray-400'
                      }`} title={hasMillOutputs(order) ? "Data exists" : "No data"} />
                    </button>

                    <button
                      onClick={() => handleDispatch(order)}
                      className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2 relative ${
                        isDarkMode
                          ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30 hover:bg-orange-600/30'
                          : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
                      }`}
                      title={hasDispatches(order) ? "Edit Dispatch" : "Add Dispatch"}
                    >
                      <TruckIcon className="h-4 w-4" />
                      <span>{hasDispatches(order) ? "Edit Dispatch" : "Add Dispatch"}</span>
                      {/* Status indicator */}
                      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 ${
                        isDarkMode ? 'border-gray-800' : 'border-white'
                      } ${
                        hasDispatches(order) ? 'bg-green-500' : 'bg-gray-400'
                      }`} title={hasDispatches(order) ? "Data exists" : "No data"} />
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
          ))
          )}
          
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
          parties={formParties}
          qualities={formQualities}
          onFormOpen={() => {
            // Data is already loaded by openFormWithData
            // But refresh if needed
            if (formParties.length === 0 || formQualities.length === 0) {
              loadPartiesData().then(data => setFormParties(data || []));
              loadQualitiesData().then(data => setFormQualities(data || []));
            }
          }}
          onClose={() => {
            setShowForm(false);
            setEditingOrder(null);
          }}
          onSuccess={async () => {
            setShowForm(false);
            setEditingOrder(null);
            setOrderCreating(false);
            
            // Immediate refresh with retry mechanism
            await refreshOrdersWithRetry();
            showMessage('success', editingOrder ? 'Order updated successfully' : 'Order created successfully');
          }}
          onError={async () => {
            setOrderCreating(false);
            // Refresh data in case of partial updates
            await refreshOrdersWithRetry();
            // Don't close form on error, let user retry
          }}
          onStart={() => {
            setOrderCreating(true);
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
           onLabDataUpdate={async () => {
            const orderId = selectedOrderForLab?.orderId;
            
            try {
              // Update the order's labData property directly in local state
              if (orderId) {
                setOrders(prevOrders => 
                  prevOrders.map(order => 
                    order.orderId === orderId 
                      ? { ...order, labData: [{ _id: 'temp', order: orderId, createdAt: new Date() }] } // Mark as having data
                      : order
                  )
                );
              }
              
             setShowLabAddModal(false);
             setSelectedOrderForLab(null);
             showMessage('success', 'Lab data added successfully');
              
              console.log('Lab data button state updated for order:', orderId);
            } catch (error) {
              console.error('Error updating lab data state:', error);
              setShowLabAddModal(false);
              setSelectedOrderForLab(null);
              showMessage('success', 'Lab data added successfully');
            }
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
          onLabDataUpdate={async () => {
            const orderId = selectedOrderForLabData?.orderId;
            
            try {
              // Update the order's labData property directly in local state
              if (orderId) {
                setOrders(prevOrders => 
                  prevOrders.map(order => 
                    order.orderId === orderId 
                      ? { ...order, labData: [{ _id: 'temp', order: orderId, createdAt: new Date() }] } // Mark as having data
                      : order
                  )
                );
              }
              
            showMessage('success', 'Lab data updated successfully!');
              
              console.log('Lab data button state updated for order:', orderId);
            } catch (error) {
              console.error('Error updating lab data state:', error);
              showMessage('success', 'Lab data updated successfully!');
            }
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
          isOpen={showMillInputForm}
          isEditing={isEditingMillInput}
          existingMillInputs={existingMillInputs}
          onRefreshQualities={fetchQualities}
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
              
              try {
                // Update the order's millInputs property directly in local state
                if (orderId) {
                  setOrders(prevOrders => 
                    prevOrders.map(order => 
                      order.orderId === orderId 
                        ? { ...order, millInputs: [{ _id: 'temp', order: orderId, createdAt: new Date() }] } // Mark as having data
                        : order
                    )
                  );
                }
                
                // Show success message
                const message = isEditingMillInput ? 'Mill input updated successfully!' : 'Mill input added successfully!';
                showMessage('success', message);
                
                console.log('Mill input button state updated for order:', orderId);
              } catch (error) {
                console.error('Error updating mill input state:', error);
                const message = isEditingMillInput ? 'Mill input updated successfully!' : 'Mill input added successfully!';
                showMessage('success', message);
              }
            }}
          onAddMill={() => {
            // Refresh mills when a new mill is added
            fetchMills();
          }}
          onRefreshMills={fetchMills}
        />
        );
      })()}

      {/* Mill Output Form */}
      {showMillOutputForm && selectedOrderForMillOutput && (
        <MillOutputForm
          order={selectedOrderForMillOutput}
          qualities={qualities}
          isOpen={showMillOutputForm}
          isEditing={isEditingMillOutput}
          existingMillOutputs={existingMillOutputs}
          onClose={() => {
            setShowMillOutputForm(false);
            setSelectedOrderForMillOutput(null);
            setIsEditingMillOutput(false);
            setExistingMillOutputs([]);
          }}
          onSuccess={async () => {
            const orderId = selectedOrderForMillOutput?.orderId;
            
            try {
              // Update the order's millOutputs property directly in local state
              if (orderId) {
                setOrders(prevOrders => 
                  prevOrders.map(order => 
                    order.orderId === orderId 
                      ? { ...order, millOutputs: [{ _id: 'temp', order: orderId, createdAt: new Date() }] } // Mark as having data
                      : order
                  )
                );
              }
              
              // Show success message
              const message = isEditingMillOutput ? 'Mill output updated successfully!' : 'Mill output added successfully!';
              showMessage('success', message);
              
              console.log('Mill output button state updated for order:', orderId);
            } catch (error) {
              console.error('Error updating mill output state:', error);
              const message = isEditingMillOutput ? 'Mill output updated successfully!' : 'Mill output added successfully!';
              showMessage('success', message);
            }
          }}
        />
      )}

      {/* Dispatch Form */}
      {showDispatchForm && selectedOrderForDispatch && (
        <DispatchForm
          order={selectedOrderForDispatch}
          qualities={qualities}
          isOpen={showDispatchForm}
          isEditing={isEditingDispatch}
          existingDispatches={existingDispatches}
          onClose={() => {
            setShowDispatchForm(false);
            setSelectedOrderForDispatch(null);
            setIsEditingDispatch(false);
            setExistingDispatches([]);
          }}
          onSuccess={async () => {
            const orderId = selectedOrderForDispatch?.orderId;
            
            try {
              // Update the order's dispatches property directly in local state
              if (orderId) {
                setOrders(prevOrders => 
                  prevOrders.map(order => 
                    order.orderId === orderId 
                      ? { ...order, dispatches: [{ _id: 'temp', order: orderId, createdAt: new Date() }] } // Mark as having data
                      : order
                  )
                );
              }
              
              // Show success message
              const message = isEditingDispatch ? 'Dispatch updated successfully!' : 'Dispatch added successfully!';
              showMessage('success', message);
              
              console.log('Dispatch button state updated for order:', orderId);
            } catch (error) {
              console.error('Error updating dispatch state:', error);
              const message = isEditingDispatch ? 'Dispatch updated successfully!' : 'Dispatch added successfully!';
              showMessage('success', message);
            }
          }}
        />
      )}
    </div>
  );
}