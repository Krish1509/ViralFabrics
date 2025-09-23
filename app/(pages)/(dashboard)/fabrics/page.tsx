'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  Squares2X2Icon,
  ListBulletIcon,
  XMarkIcon,
  CheckCircleIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useDarkMode } from '../hooks/useDarkMode';
import { Fabric, FabricFilters } from '@/types/fabric';

import FabricDetails from './components/FabricDetails';
import DeleteConfirmation from './components/DeleteConfirmation';
import BulkDeleteConfirmation from './components/BulkDeleteConfirmation';
import DeleteSuccessPopup from './components/DeleteSuccessPopup';

export default function FabricsPage() {
  const { isDarkMode, mounted } = useDarkMode();
  const router = useRouter();
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [loading, setLoading] = useState(true);

  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedFabric, setSelectedFabric] = useState<Fabric | null>(null);
  const [selectedFabricGroup, setSelectedFabricGroup] = useState<Fabric[]>([]);
  const [deletingFabric, setDeletingFabric] = useState<Fabric | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDependencies, setDeleteDependencies] = useState<string[]>([]);
  const [isLoadingDependencies, setIsLoadingDependencies] = useState(false);
  const [showBulkDeleteConfirmation, setShowBulkDeleteConfirmation] = useState(false);
  const [bulkDeleteGroup, setBulkDeleteGroup] = useState<{ qualityCode: string; qualityName: string; items: Fabric[] } | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deletedFabricInfo, setDeletedFabricInfo] = useState<{ code: string; name: string } | null>(null);
  const [fadeOutRows, setFadeOutRows] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FabricFilters>({
    qualityName: '',
    weaver: '',
    weaverQualityName: '',
    search: '',
    minGsm: '',
    maxGsm: '',
    minWeight: '',
    maxWeight: '',
    minRate: '',
    maxRate: '',
    minWidth: '',
    maxWidth: '',
    hasImages: false,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [qualityNames, setQualityNames] = useState<string[]>([]);
  const [weavers, setWeavers] = useState<string[]>([]);
  const [weaverQualityNames, setWeaverQualityNames] = useState<string[]>([]);
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'All'>(10);
  const itemsPerPageOptions = [10, 20, 50, 100, 'All'] as const;
  const [paginationInfo, setPaginationInfo] = useState({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
    hasNextPage: false,
    hasPrevPage: false
  });
  
  // Enhanced UI states
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(() => {
    // Load view mode from localStorage on component mount
    if (typeof window !== 'undefined') {
      const savedViewMode = localStorage.getItem('fabricsViewMode');
      return savedViewMode === 'table' ? 'table' : 'cards';
    }
    return 'cards';
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [selectedFabrics, setSelectedFabrics] = useState<Set<string>>(new Set());
  const [bulkActions, setBulkActions] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'popular' | 'trending'>('all');
  const [showIndividualFabrics, setShowIndividualFabrics] = useState(false);
  
  // Track current image index for each card
  const [cardImageIndices, setCardImageIndices] = useState<Record<string, number>>({});
  
  // Load view mode from localStorage on mount
  useEffect(() => {
    const savedViewMode = localStorage.getItem('fabricsViewMode');
    if (savedViewMode === 'table' || savedViewMode === 'cards') {
      setViewMode(savedViewMode);
    }
  }, []);
  
  // Auto-switch view mode based on screen size (only on mount and resize, not on manual changes)
  useEffect(() => {
    const handleResize = () => {
      // Only auto-switch if user hasn't manually changed the view mode recently
      const now = Date.now();
      const lastManualChange = localStorage.getItem('lastViewModeChange') || '0';
      const timeSinceLastChange = now - parseInt(lastManualChange);
      
      // Allow manual override for 5 minutes after user changes view mode
      if (timeSinceLastChange < 300000) return;
      
      if (window.innerWidth < 800 && viewMode === 'table') {
        setViewMode('cards');
      } else if (window.innerWidth >= 800 && viewMode === 'cards') {
        setViewMode('table');
      }
    };
    
    handleResize(); // Check on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  // Handle manual view mode changes
  const handleViewModeChange = (newMode: 'table' | 'cards') => {
    setViewMode(newMode);
    // Save view mode to localStorage for persistence
    localStorage.setItem('fabricsViewMode', newMode);
    // Store timestamp of manual change
    localStorage.setItem('lastViewModeChange', Date.now().toString());
  };

  // Handle image navigation in cards
  const handleCardImageNavigation = (qualityCode: string, direction: 'prev' | 'next') => {
    setCardImageIndices(prev => {
      const currentIndex = prev[qualityCode] || 0;
      const fabric = fabrics.find(f => f.qualityCode === qualityCode);
      if (!fabric || !fabric.images || fabric.images.length === 0) return prev;
      
      let newIndex;
      if (direction === 'prev') {
        newIndex = currentIndex === 0 ? fabric.images.length - 1 : currentIndex - 1;
      } else {
        newIndex = currentIndex === fabric.images.length - 1 ? 0 : currentIndex + 1;
      }
      
      return { ...prev, [qualityCode]: newIndex };
    });
  };

  const getCurrentCardImage = (fabric: Fabric, qualityCode: string) => {
    const currentIndex = cardImageIndices[qualityCode] || 0;
    return fabric.images && fabric.images.length > 0 ? fabric.images[currentIndex] : null;
  };

  // Enhanced image and selection states
  const [showImageModal, setShowImageModal] = useState<{ fabric: Fabric; imageIndex: number } | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [isImageLoading, setIsImageLoading] = useState<{ [key: string]: boolean }>({});
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});
  const [bulkSelectionMode, setBulkSelectionMode] = useState(false);
  const [lastSelectedFabric, setLastSelectedFabric] = useState<string | null>(null);
  const [showSelectionToolbar, setShowSelectionToolbar] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf'>('csv');
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Optimized fetch fabrics with better caching and faster loading
  const fetchFabrics = async (forceRefresh = false, page = currentPage, limit = itemsPerPage, retryCount = 0, showLoading = true) => {
    // Disable caching for now to ensure pagination works correctly
    // const now = Date.now();
    // if (!forceRefresh && (now - lastFetchTime) < 300000 && fabrics.length > 0) {
    //   return; // Use cached data
    // }
    
    // Only show loading for initial load or manual refresh, not for pagination
    if (showLoading) {
    setLoading(true);
    }
    
    try {
      const controller = new AbortController();
      // Increased timeout for file uploads and slow server responses
      const timeoutDuration = retryCount > 0 ? 30000 : 20000; // 20s first try, 30s for retries
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
      
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.qualityName) params.append('qualityName', filters.qualityName);
      if (filters.weaver) params.append('weaver', filters.weaver);
      if (filters.weaverQualityName) params.append('weaverQualityName', filters.weaverQualityName);

      // Add sorting parameters
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      // Add pagination parameters
      const limitValue = limit === 'All' ? 1000 : limit;
      params.append('limit', limitValue.toString());
      params.append('page', page.toString());
      
      const response = await fetch(`/api/fabrics?${params}`, {
        headers: {
          'Cache-Control': forceRefresh ? 'no-cache' : 'max-age=120', // Cache for 2 minutes
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setFabrics(data.data);
        setLastFetchTime(Date.now());
        setRetryCount(0); // Reset retry count on success
        
        // Update pagination info if available
        if (data.pagination) {
          setPaginationInfo({
            totalCount: data.pagination.totalCount,
            totalPages: data.pagination.totalPages,
            currentPage: data.pagination.currentPage,
            hasNextPage: data.pagination.hasNextPage,
            hasPrevPage: data.pagination.hasPrevPage
          });
        }
        
        // Only show refresh message when user manually clicks refresh button
        if (forceRefresh && fabrics.length > 0) {
          setRefreshMessage('Data refreshed successfully!');
          setTimeout(() => setRefreshMessage(null), 3000);
        }
      } else {
        throw new Error(data.message || 'Failed to fetch fabrics');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Retry with exponential backoff (max 3 retries)
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s - longer delays for better success
          setRetryCount(retryCount + 1);
          setError(`Server is slow, retrying in ${delay/1000}s... (${retryCount + 1}/3)`);
          setTimeout(() => {
            setError(null);
            fetchFabrics(true, page, limit, retryCount + 1);
          }, delay);
          return;
        } else {
          setRetryCount(0);
          setError('Server is too slow after multiple attempts. Please check your connection and try again.');
        }
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError(`Failed to load fabrics: ${error.message || 'Unknown error'}. Please try again.`);
      }
    } finally {
      // Only hide loading if we showed it
      if (showLoading) {
      setLoading(false);
      }
    }
  };

  // Pagination handlers - Instant page change without loading
  const handlePageChange = async (newPage: number) => {
    if (newPage === currentPage) return;
    
    // Validate page number
    if (newPage < 1 || newPage > totalPages) {
      return;
    }
    
    // Instant page change - no loading states
    setCurrentPage(newPage);
    
    // Fetch data in background without showing loading
    fetchFabrics(false, newPage, itemsPerPage, 0, false);
  };

  const handleItemsPerPageChange = async (newItemsPerPage: number | 'All') => {
    if (newItemsPerPage === itemsPerPage) return;
    
    // Update state first
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Always reset to first page when changing items per page
    
    // Then fetch new data without loading
    await fetchFabrics(false, 1, newItemsPerPage, 0, false);
  };

  // Fetch quality names for filter
  const fetchQualityNames = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
      
      const response = await fetch('/api/fabrics/quality-names?limit=100', { // Limit for faster loading
        headers: {
          'Cache-Control': 'max-age=60' // Cache for 60 seconds
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setQualityNames(data.data);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        } else {
        }
    }
  };

  // Fetch weavers for filter
  const fetchWeavers = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
      
      const params = new URLSearchParams();
      if (filters.qualityName) params.append('qualityName', filters.qualityName);
      
      const response = await fetch(`/api/fabrics/weavers?${params}&limit=100`, { // Limit for faster loading
        headers: {
          'Cache-Control': 'max-age=60' // Cache for 60 seconds
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setWeavers(data.data);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        } else {
        }
    }
  };

  // Fetch weaver quality names for filter
  const fetchWeaverQualityNames = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
      
      const params = new URLSearchParams();
      if (filters.weaver) params.append('weaver', filters.weaver);
      
      const response = await fetch(`/api/fabrics/weaver-quality-names?${params}&limit=100`, { // Limit for faster loading
        headers: {
          'Cache-Control': 'max-age=60' // Cache for 60 seconds
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setWeaverQualityNames(data.data);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        } else {
        }
    }
  };

  useEffect(() => {
    // Super fast initial load - only 5 items
    fetchFabrics(false, 1, 10);
    
    // Load filter data much later (lazy loading for speed)
    setTimeout(() => {
      fetchQualityNames();
    }, 1000);
  }, []);

  // Removed auto-refresh on visibility change - was causing unnecessary refreshes

  // Only keyboard shortcuts for manual refresh
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F5 or Ctrl+R to refresh
      if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
        e.preventDefault();
        fetchFabrics(true, currentPage, itemsPerPage, 0, true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentPage, itemsPerPage]);

  // Lazy load weavers only when needed
  useEffect(() => {
    if (filters.qualityName) {
      // Add small delay to prevent rapid API calls
      const timeoutId = setTimeout(() => {
        fetchWeavers();
      }, 800);
      return () => clearTimeout(timeoutId);
    }
  }, [filters.qualityName]);

  // Lazy load weaver quality names only when needed
  useEffect(() => {
    if (filters.weaver) {
      // Add small delay to prevent rapid API calls
      const timeoutId = setTimeout(() => {
        fetchWeaverQualityNames();
      }, 800);
      return () => clearTimeout(timeoutId);
    }
  }, [filters.weaver]);

  const handleCreate = () => {
    router.push('/fabrics/create');
  };

  const handleEdit = (fabric: Fabric) => {
    // Navigate to create page with fabric ID for editing
    router.push(`/fabrics/create?edit=${fabric._id}`);
  };

  const handleView = (fabric: Fabric) => {
    // Find all fabrics with the same quality code
    const allFabricsInGroup = fabrics.filter(f => f.qualityCode === fabric.qualityCode);
    
    // Set the selected fabric and show details
    setSelectedFabric(fabric);
    setShowDetails(true);
    
    // Store the group for FabricDetails component
    setSelectedFabricGroup(allFabricsInGroup);
  };

  const handleDelete = async (fabric: Fabric) => {
    // Show modal immediately for better UX
    setDeletingFabric(fabric);
    setShowDeleteConfirmation(true);
    setIsLoadingDependencies(true);
    setDeleteDependencies([]);
    
    // Check dependencies in background (non-blocking)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
      
      const dependencyResponse = await fetch(`/api/fabrics/${fabric._id}/dependencies`, {
        signal: controller.signal
      });
      const dependencyData = await dependencyResponse.json();
      
      clearTimeout(timeoutId);
      
      if (dependencyData.success) {
        setDeleteDependencies(dependencyData.data.dependencies);
      } else {
        setDeleteDependencies([]);
      }
    } catch (error) {
      setDeleteDependencies([]);
    } finally {
      setIsLoadingDependencies(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingFabric) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/fabrics/${deletingFabric._id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        // Start fade out animation
        setFadeOutRows(prev => new Set([...prev, deletingFabric._id]));
        
        // Show success popup
        setDeletedFabricInfo({
          code: deletingFabric.qualityCode,
          name: deletingFabric.qualityName
        });
        setShowDeleteSuccess(true);
        
        // Remove from state after animation
        setTimeout(() => {
          setFabrics(prev => prev.filter(f => f._id !== deletingFabric._id));
          setFadeOutRows(prev => {
            const newSet = new Set(prev);
            newSet.delete(deletingFabric._id);
            return newSet;
          });
        }, 1000);
        
        setShowDeleteConfirmation(false);
        setDeletingFabric(null);
        setDeleteDependencies([]);
      } else {
        }
    } catch (error) {
      } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirmation(false);
    setDeletingFabric(null);
    setDeleteDependencies([]);
    setIsDeleting(false);
    setIsLoadingDependencies(false);
  };

  const handleBulkDeleteGroup = (group: { qualityCode: string; qualityName: string; items: Fabric[] }) => {
    setBulkDeleteGroup(group);
    setShowBulkDeleteConfirmation(true);
  };

  // Fast delete entire quality group
  const handleDeleteQualityGroup = (mainFabric: Fabric, allFabricsInGroup: Fabric[]) => {
    const group = {
      qualityCode: mainFabric.qualityCode,
      qualityName: mainFabric.qualityName,
      items: allFabricsInGroup
    };
    setBulkDeleteGroup(group);
    setShowBulkDeleteConfirmation(true);
  };

  const confirmBulkDelete = async () => {
    if (!bulkDeleteGroup) return;
    
    setIsBulkDeleting(true);
    
    // Close modal immediately for faster UX
    setShowBulkDeleteConfirmation(false);
    
    // Show immediate feedback
    setRefreshMessage(`Deleting ${bulkDeleteGroup.items.length} fabric(s)...`);
    
    try {
      let response;
      
      // If it's selected fabrics (qualityCode is 'Multiple'), delete by IDs
      if (bulkDeleteGroup.qualityCode === 'Multiple') {
        const fabricIds = bulkDeleteGroup.items.map(fabric => fabric._id);
        response = await fetch('/api/fabrics', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fabricIds })
        });
      } else {
        // If it's a group delete, use the quality-based delete (faster)
        response = await fetch(`/api/fabrics?qualityCode=${encodeURIComponent(bulkDeleteGroup.qualityCode)}&qualityName=${encodeURIComponent(bulkDeleteGroup.qualityName)}`, {
          method: 'DELETE'
        });
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update UI immediately without full fetch
        const deletedCount = data.deletedCount || bulkDeleteGroup.items.length;
        
        // Start fade out animation for all deleted items
        const deletedIds = new Set(bulkDeleteGroup.items.map(item => item._id));
        setFadeOutRows(prev => new Set([...prev, ...deletedIds]));
        
        // Show success popup
        setDeletedFabricInfo({
          code: bulkDeleteGroup.qualityCode === 'Multiple' ? 'Multiple' : bulkDeleteGroup.qualityCode,
          name: bulkDeleteGroup.qualityCode === 'Multiple' ? `${deletedCount} fabrics` : bulkDeleteGroup.qualityName
        });
        setShowDeleteSuccess(true);
        
        // Remove from state after animation
        setTimeout(() => {
          setFabrics(prev => prev.filter(fabric => !deletedIds.has(fabric._id)));
          setFadeOutRows(prev => {
            const newSet = new Set(prev);
            deletedIds.forEach(id => newSet.delete(id));
            return newSet;
          });
        }, 1000);
        
        // Clear states immediately
        setBulkDeleteGroup(null);
        setSelectedFabrics(new Set());
        setBulkActions(false);
        setShowSelectionToolbar(false);
        
        // Show success message
        setRefreshMessage(`✅ Successfully deleted ${deletedCount} fabric(s)!`);
        setTimeout(() => setRefreshMessage(null), 2000);
      } else {
        setRefreshMessage(`❌ Error: ${data.message}`);
        setTimeout(() => setRefreshMessage(null), 4000);
      }
    } catch (error) {
      setRefreshMessage('❌ Error: Failed to delete fabrics. Please try again.');
      setTimeout(() => setRefreshMessage(null), 4000);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const cancelBulkDelete = () => {
    setShowBulkDeleteConfirmation(false);
    setBulkDeleteGroup(null);
    setIsBulkDeleting(false);
  };

  // Enhanced image handling functions
  const handleImageClick = (fabric: Fabric, imageIndex: number) => {
    setShowImageModal({ fabric, imageIndex });
    setSelectedImageIndex(imageIndex);
  };

  const toggleCardExpansion = (qualityCode: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(qualityCode)) {
        newSet.delete(qualityCode);
      } else {
        newSet.add(qualityCode);
      }
      return newSet;
    });
  };

  const handleImageLoad = (fabricId: string) => {
    setIsImageLoading(prev => ({ ...prev, [fabricId]: false }));
  };

  const handleImageError = (fabricId: string) => {
    setIsImageLoading(prev => ({ ...prev, [fabricId]: false }));
    setImageErrors(prev => ({ ...prev, [fabricId]: true }));
  };

  // Initialize image loading state for all fabrics
  useEffect(() => {
    const newImageLoading: { [key: string]: boolean } = {};
    const newImageErrors: { [key: string]: boolean } = {};
    
    fabrics.forEach(fabric => {
      if (fabric.images && fabric.images.length > 0) {
        fabric.images.forEach((_, imgIndex) => {
          const key = `${fabric._id}-${imgIndex}`;
          newImageLoading[key] = true;
          newImageErrors[key] = false;
        });
      }
    });
    
    setIsImageLoading(newImageLoading);
    setImageErrors(newImageErrors);
  }, [fabrics]);

  const nextImage = () => {
    if (showImageModal && showImageModal.fabric.images) {
      const nextIndex = (selectedImageIndex + 1) % showImageModal.fabric.images.length;
      setSelectedImageIndex(nextIndex);
    }
  };

  const prevImage = () => {
    if (showImageModal && showImageModal.fabric.images) {
      const prevIndex = selectedImageIndex === 0 
        ? showImageModal.fabric.images.length - 1 
        : selectedImageIndex - 1;
      setSelectedImageIndex(prevIndex);
    }
  };

  // Enhanced selection functions
  const handleFabricSelection = (fabricId: string, event: React.MouseEvent) => {
    if (event.shiftKey && lastSelectedFabric) {
      // Range selection
      const fabricIds = filteredAndSortedFabrics.map(f => f._id);
      const startIndex = fabricIds.indexOf(lastSelectedFabric);
      const endIndex = fabricIds.indexOf(fabricId);
      const start = Math.min(startIndex, endIndex);
      const end = Math.max(startIndex, endIndex);
      
      const newSelected = new Set(selectedFabrics);
      for (let i = start; i <= end; i++) {
        newSelected.add(fabricIds[i]);
      }
      setSelectedFabrics(newSelected);
    } else if (event.ctrlKey || event.metaKey) {
      // Multi-selection
      const newSelected = new Set(selectedFabrics);
      if (newSelected.has(fabricId)) {
        newSelected.delete(fabricId);
      } else {
        newSelected.add(fabricId);
      }
      setSelectedFabrics(newSelected);
    } else {
      // Single selection
      setSelectedFabrics(new Set([fabricId]));
    }
    
    setLastSelectedFabric(fabricId);
    setBulkActions(selectedFabrics.size > 0);
    setShowSelectionToolbar(selectedFabrics.size > 0);
  };

  const selectAllVisible = () => {
    const allVisibleIds = new Set(filteredAndSortedFabrics.map(f => f._id));
    setSelectedFabrics(allVisibleIds);
    setBulkActions(true);
    setShowSelectionToolbar(true);
  };

  const clearAllSelection = () => {
    setSelectedFabrics(new Set());
    setBulkActions(false);
    setShowSelectionToolbar(false);
    setLastSelectedFabric(null);
  };

  const invertSelection = () => {
    const allVisibleIds = new Set(filteredAndSortedFabrics.map(f => f._id));
    const newSelected = new Set<string>();
    
    allVisibleIds.forEach(id => {
      if (!selectedFabrics.has(id)) {
        newSelected.add(id);
      }
    });
    
    setSelectedFabrics(newSelected);
    setBulkActions(newSelected.size > 0);
    setShowSelectionToolbar(newSelected.size > 0);
  };

  // Export functions
  const exportSelectedFabrics = async () => {
    if (selectedFabrics.size === 0) return;
    
    setIsExporting(true);
    try {
      const selectedFabricData = filteredAndSortedFabrics.filter(f => selectedFabrics.has(f._id));
      
      if (exportFormat === 'csv') {
        exportToCSV(selectedFabricData);
      } else if (exportFormat === 'excel') {
        exportToExcel(selectedFabricData);
      } else if (exportFormat === 'pdf') {
        exportToPDF(selectedFabricData);
      }
      
      setShowExportModal(false);
    } catch (error) {
      } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = (fabrics: Fabric[]) => {
    const headers = ['Quality Code', 'Quality Name', 'Weaver', 'Weaver Quality', 'GSM', 'Weight', 'Rate', 'Width'];
    const csvContent = [
      headers.join(','),
      ...fabrics.map(f => [
        f.qualityCode,
        f.qualityName,
        f.weaver,
        f.weaverQualityName,
        f.gsm,
        f.weight,
        f.greighRate,
        f.finishWidth
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fabrics-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToExcel = (fabrics: Fabric[]) => {
    // Simple Excel-like export using CSV with .xlsx extension
    const headers = ['Quality Code', 'Quality Name', 'Weaver', 'Weaver Quality', 'GSM', 'Weight', 'Rate', 'Width'];
    const csvContent = [
      headers.join('\t'),
      ...fabrics.map(f => [
        f.qualityCode,
        f.qualityName,
        f.weaver,
        f.weaverQualityName,
        f.gsm,
        f.weight,
        f.greighRate,
        f.finishWidth
      ].join('\t'))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fabrics-export-${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = (fabrics: Fabric[]) => {
    // Enhanced PDF-like export with better formatting
    const content = [
      'FABRIC INVENTORY REPORT',
      `Generated on: ${new Date().toLocaleDateString()}`,
      `Total Fabrics: ${fabrics.length}`,
      '',
      'DETAILED LISTING:',
      '================',
      '',
      ...fabrics.map((f, index) => [
        `${index + 1}. Quality Code: ${f.qualityCode}`,
        `   Quality Name: ${f.qualityName}`,
        `   Weaver: ${f.weaver}`,
        `   Weaver Quality: ${f.weaverQualityName}`,
        `   GSM: ${f.gsm || 'N/A'}`,
        `   Weight: ${f.weight || 'N/A'} KG`,
        `   Width: ${f.finishWidth || 'N/A'}`,
        `   Rate: ₹${f.greighRate || 'N/A'}`,
        `   Danier: ${f.danier || 'N/A'}`,
        `   Reed: ${f.reed || 'N/A'}`,
        `   Pick: ${f.pick || 'N/A'}`,
        ''
      ].join('\n'))
    ].join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fabric-inventory-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Bulk operations
  const handleBulkDeleteSelected = async () => {
    if (selectedFabrics.size === 0) return;
    
    const selectedFabricData = filteredAndSortedFabrics.filter(f => selectedFabrics.has(f._id));
    setBulkDeleteGroup({
      qualityCode: 'Multiple',
      qualityName: 'Selected Fabrics',
      items: selectedFabricData
    });
    setShowBulkDeleteConfirmation(true);
  };

  const handleBulkEdit = () => {
    if (selectedFabrics.size === 0) return;
    
    const selectedFabricData = filteredAndSortedFabrics.filter(f => selectedFabrics.has(f._id));
    
    // For now, show an alert with the selected fabrics
    // In a real implementation, you would navigate to a bulk edit page or show a modal
    alert(`Bulk edit for ${selectedFabrics.size} fabric(s):\n${selectedFabricData.map(f => `${f.qualityCode} - ${f.qualityName}`).join('\n')}`);
    
    // TODO: Implement actual bulk edit functionality
    // router.push('/fabrics/bulk-edit?ids=' + Array.from(selectedFabrics).join(','));
  };

  // Use server-side filtered data directly (no client-side filtering)
  const filteredAndSortedFabrics = useMemo(() => {
    return [...fabrics]; // Server already sends filtered and sorted data
  }, [fabrics]);

  // Pagination calculations
  const totalQualityGroups = useMemo(() => {
    // Count unique quality groups from filtered fabrics
    const groups = filteredAndSortedFabrics.reduce((groups, fabric) => {
      const key = `${fabric.qualityCode}-${fabric.qualityName}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(fabric);
      return groups;
    }, {} as Record<string, Fabric[]>);
    return Object.keys(groups).length;
  }, [filteredAndSortedFabrics]);

  const totalPages = useMemo(() => {
    if (itemsPerPage === 'All') return 1;
    const pages = paginationInfo.totalPages || 1;
    return pages;
  }, [paginationInfo.totalPages, itemsPerPage, paginationInfo.totalCount]);

  // Use server-side paginated data directly (no client-side pagination)
  const paginatedFabrics = useMemo(() => {
    return filteredAndSortedFabrics; // Server already sends paginated data
  }, [filteredAndSortedFabrics, currentPage, itemsPerPage]);

  // Reset to page 1 and fetch new data when filters change
  useEffect(() => {
    setCurrentPage(1);
    fetchFabrics(false, 1, itemsPerPage, 0, false);
  }, [filters, itemsPerPage]);

  // Auto-correct current page if it exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
      fetchFabrics(false, totalPages, itemsPerPage, 0, false);
    }
  }, [totalPages, currentPage, itemsPerPage]);

  // Group fabrics by Quality Code and Quality Name (using paginated data)
  const groupedFabrics = paginatedFabrics.reduce((groups, fabric) => {
    const key = `${fabric.qualityCode}-${fabric.qualityName}`;
    if (!groups[key]) {
      groups[key] = {
        qualityCode: fabric.qualityCode,
        qualityName: fabric.qualityName,
        items: []
      };
    }
    groups[key].items.push(fabric);
    return groups;
  }, {} as Record<string, { qualityCode: string; qualityName: string; items: Fabric[] }>);

  const clearFilters = () => {
    setFilters({
      qualityName: '',
      weaver: '',
      weaverQualityName: '',
      search: '',
      minGsm: '',
      maxGsm: '',
      minWeight: '',
      maxWeight: '',
      minRate: '',
      maxRate: '',
      minWidth: '',
      maxWidth: '',
      hasImages: false,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setSelectedFabrics(new Set());
    setBulkActions(false);
  };

  const toggleFabricSelection = (fabricId: string) => {
    const newSelected = new Set(selectedFabrics);
    if (newSelected.has(fabricId)) {
      newSelected.delete(fabricId);
    } else {
      newSelected.add(fabricId);
    }
    setSelectedFabrics(newSelected);
    setBulkActions(newSelected.size > 0);
  };

  const selectAllFabrics = () => {
    const allIds = new Set(filteredAndSortedFabrics.map(f => f._id));
    setSelectedFabrics(allIds);
    setBulkActions(true);
  };

  const clearSelection = () => {
    setSelectedFabrics(new Set());
    setBulkActions(false);
  };

  // Skeleton loading component
  const SkeletonCard = () => (
    <div className={` rounded-lg border animate-pulse ${
      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center space-x-4">
        <div className={`w-16 h-16 rounded-lg ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
        }`}></div>
        <div className="flex-1 space-y-2">
          <div className={`h-4 rounded ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
          }`} style={{ width: '60%' }}></div>
          <div className={`h-3 rounded ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
          }`} style={{ width: '40%' }}></div>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;

  return (
    <div className="min-h-screen">

       {/* Refresh Message */}
       {refreshMessage && (
         <div className={`mb-4  rounded-lg border ${
           isDarkMode 
             ? 'border-green-500/40 bg-green-900/30 text-green-300' 
             : 'border-green-200 bg-green-50 text-green-800'
         }`}>
           <div className="flex items-center space-x-2">
             <ArrowPathIcon className="h-4 w-4" />
             <span>{refreshMessage}</span>
           </div>
         </div>
       )}

      {/* Search and Controls Bar */}
      <div className={`mb-4 p-2 sm:p-3 rounded-lg border ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } shadow-sm`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left Side - Search Bar + Sort + View */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlassIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="text"
                  placeholder="Search fabrics..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-lg border transition-colors text-sm ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                />
                {filters.search && (
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                      isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Sort and View Controls */}
            <div className="flex items-center gap-4">
              {/* Sort Controls */}
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Sort:</span>
                <div className="flex rounded-lg border overflow-hidden shadow-sm">
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, sortBy: 'createdAt', sortOrder: 'desc' }))}
                    className={`px-3 py-2 text-sm font-medium transition-all duration-200 ${
                      filters.sortBy === 'createdAt' && filters.sortOrder === 'desc'
                        ? isDarkMode
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-blue-500 text-white shadow-md'
                        : isDarkMode
                          ? 'bg-slate-700 text-slate-300 hover:bg-slate-600 border-r border-slate-600'
                          : 'bg-white text-slate-700 hover:bg-blue-50 border-r border-slate-200'
                    }`}
                    title="Latest First"
                  >
                    Latest
                  </button>
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, sortBy: 'createdAt', sortOrder: 'asc' }))}
                    className={`px-3 py-2 text-sm font-medium transition-all duration-200 ${
                      filters.sortBy === 'createdAt' && filters.sortOrder === 'asc'
                        ? isDarkMode
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-blue-500 text-white shadow-md'
                        : isDarkMode
                          ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          : 'bg-white text-slate-700 hover:bg-blue-50'
                    }`}
                    title="Oldest First"
                  >
                    Oldest
                  </button>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>View:</span>
                <div className="flex rounded-lg border overflow-hidden shadow-sm">
                  <button
                    onClick={() => handleViewModeChange('table')}
                    className={`px-3 py-2 text-sm font-medium transition-all duration-200 ${
                      viewMode === 'table'
                        ? isDarkMode
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-emerald-500 text-white shadow-md'
                        : isDarkMode
                          ? 'bg-slate-700 text-slate-300 hover:bg-slate-600 border-r border-slate-600'
                          : 'bg-white text-slate-700 hover:bg-emerald-50 border-r border-slate-200'
                    }`}
                    title="Table View"
                  >
                    <ListBulletIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleViewModeChange('cards')}
                    className={`px-3 py-2 text-sm font-medium transition-all duration-200 ${
                      viewMode === 'cards'
                        ? isDarkMode
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-emerald-500 text-white shadow-md'
                        : isDarkMode
                          ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          : 'bg-white text-slate-700 hover:bg-emerald-50'
                    }`}
                    title="Card View"
                  >
                    <Squares2X2Icon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Add Fabric Button */}
            <button
              onClick={handleCreate}
              className={`px-4 py-2.5 rounded-lg font-semibold transition-all duration-200 text-sm shadow-md hover:shadow-lg ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border border-blue-500' 
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-400'
              }`}
            >
              <PlusIcon className="h-4 w-4 inline mr-2" />
              Add Fabric
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => fetchFabrics(true, currentPage, itemsPerPage, 0, true)}
              disabled={loading}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                isDarkMode 
                  ? 'bg-slate-600 hover:bg-slate-700 text-white border border-slate-500' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
              }`}
              title="Refresh Data"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {bulkActions && (
          <div className="mt- border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircleIcon className={`h-5 w-5 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
                <span className={`text-sm font-medium ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-700'
                }`}>
                  {selectedFabrics.size} fabric{selectedFabrics.size !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={selectAllVisible}
                  className={`px-3 py-1.5 rounded text-sm transition-colors ${
                    isDarkMode 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  Select All
                </button>
                <button
                  onClick={invertSelection}
                  className={`px-3 py-1.5 rounded text-sm transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                      : 'bg-gray-500 hover:bg-gray-600 text-white'
                  }`}
                >
                  Invert
                </button>
                <button
                  onClick={clearSelection}
                  className={`px-3 py-1.5 rounded text-sm transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                      : 'bg-gray-500 hover:bg-gray-600 text-white'
                  }`}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Fabrics Display */}
      <div className={`rounded-xl border overflow-hidden ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } shadow-lg`}>
        {loading ? (
          <div>
            {viewMode === 'cards' ? (
              // Card View Skeleton - Improved
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className={`p-4 sm:p-5 rounded-xl border ${
                    isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-white border-gray-200'
                  } animate-pulse shadow-sm`}>
                    {/* Image skeleton */}
                    <div className={`w-full h-36 sm:h-40 lg:h-44 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'} rounded-lg mb-4`}></div>
                    
                    {/* Quality info skeleton */}
                    <div className="mb-3">
                      <div className={`w-2/3 h-4 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'} rounded mb-2`}></div>
                      <div className={`w-1/2 h-3 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'} rounded`}></div>
                    </div>
                    
                    {/* Weavers section skeleton */}
                    <div className={`p-3 rounded-lg border ${
                      isDarkMode ? 'bg-slate-700/30 border-slate-600' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className={`w-1/3 h-3 ${isDarkMode ? 'bg-slate-600' : 'bg-gray-200'} rounded mb-2`}></div>
                      <div className="space-y-2">
                        <div className={`w-full h-8 ${isDarkMode ? 'bg-slate-600' : 'bg-gray-200'} rounded`}></div>
                        <div className={`w-3/4 h-8 ${isDarkMode ? 'bg-slate-600' : 'bg-gray-200'} rounded`}></div>
                      </div>
                    </div>
                    
                    {/* Actions skeleton */}
                    <div className="mt-4 flex space-x-2">
                      <div className={`flex-1 h-8 ${isDarkMode ? 'bg-slate-600' : 'bg-gray-200'} rounded`}></div>
                      <div className={`flex-1 h-8 ${isDarkMode ? 'bg-slate-600' : 'bg-gray-200'} rounded`}></div>
                      <div className={`flex-1 h-8 ${isDarkMode ? 'bg-slate-600' : 'bg-gray-200'} rounded`}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Table View Skeleton - Improved
              <div className="p-4">
            <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                <thead className={`${
                      isDarkMode ? 'bg-slate-800/50 border-b border-slate-600' : 'bg-gray-50 border-b border-gray-200'
                }`}>
                  <tr>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                          <th key={i} className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            isDarkMode ? 'text-slate-300' : 'text-gray-500'
                      }`}>
                            <div className={`w-16 h-3 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'} rounded animate-pulse`}></div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${
                      isDarkMode ? 'divide-slate-700' : 'divide-gray-200'
                }`}>
                  {[1, 2, 3, 4, 5].map((row) => (
                        <tr key={row} className={`${
                          isDarkMode ? 'bg-slate-800/30 hover:bg-slate-700/40' : 'bg-white hover:bg-gray-50'
                    } transition-all duration-300 ease-in-out`}>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((cell) => (
                            <td key={cell} className="px-4 py-4">
                              <div className="space-y-2">
                                <div className={`w-20 h-3 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'} rounded animate-pulse`}></div>
                                <div className={`w-16 h-3 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'} rounded animate-pulse`}></div>
                              </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
              </div>
            )}
          </div>
        ) : filteredAndSortedFabrics.length === 0 ? (
          <div className="p-8 text-center">
            <DocumentTextIcon className={`h-16 w-16 mx-auto mb-4 ${
              isDarkMode ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <h3 className={`text-xl font-semibold mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              No fabrics found
            </h3>
            <p className={`text-lg ${
              isDarkMode ? 'text-gray-500' : 'text-gray-500'
            }`}>
              {filters.search || filters.qualityName || filters.weaver || filters.weaverQualityName
                ? 'Try adjusting your filters'
                : 'Get started by adding your first fabric'
              }
            </p>
            <div className="mt-6">
              {filters.search || filters.qualityName || filters.weaver || filters.weaverQualityName ? (
              <button
                onClick={clearFilters}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                Clear Filters
              </button>
              ) : (
                <button
                  onClick={handleCreate}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 mx-auto ${
                    isDarkMode 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>Add Fabrics</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div>
            {/* Top Pagination and Results Info */}
            <div className={`px-3 sm:px-4 py-2 sm:py-3 border-b flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between ${
              isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:items-center sm:space-x-3 lg:space-x-4">
                <span className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <span className="hidden sm:inline">Showing {paginationInfo.totalCount > 0 ? (currentPage - 1) * (itemsPerPage === 'All' ? paginationInfo.totalCount : itemsPerPage) + 1 : 0} to{' '}
                  {Math.min(currentPage * (itemsPerPage === 'All' ? paginationInfo.totalCount : itemsPerPage), paginationInfo.totalCount)} of{' '}
                  {paginationInfo.totalCount} fabrics</span>
                  <span className="sm:hidden">{paginationInfo.totalCount > 0 ? (currentPage - 1) * (itemsPerPage === 'All' ? paginationInfo.totalCount : itemsPerPage) + 1 : 0}-{Math.min(currentPage * (itemsPerPage === 'All' ? paginationInfo.totalCount : itemsPerPage), paginationInfo.totalCount)} of {paginationInfo.totalCount}</span>
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
                    disabled={loading}
                    className={`px-2 sm:px-3 py-1 rounded-lg border text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {itemsPerPageOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Top Page Navigation */}
              {itemsPerPage !== 'All' && totalPages > 1 && (
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm transition-all duration-200 shadow-sm hover:shadow-md ${
                      currentPage === 1
                        ? isDarkMode ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : isDarkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600 border border-slate-600' : 'bg-white text-slate-700 hover:bg-blue-50 border border-slate-200'
                    }`}
                  >
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </button>
                  
                  {/* Top Page numbers */}
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
                          className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm transition-all duration-200 shadow-sm hover:shadow-md ${
                            currentPage === pageNum
                              ? isDarkMode ? 'bg-blue-600 text-white shadow-md' : 'bg-blue-500 text-white shadow-md'
                              : isDarkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600 border border-slate-600' : 'bg-white text-slate-700 hover:bg-blue-50 border border-slate-200'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm transition-all duration-200 shadow-sm hover:shadow-md ${
                      currentPage === totalPages
                        ? isDarkMode ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : isDarkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600 border border-slate-600' : 'bg-white text-slate-700 hover:bg-blue-50 border border-slate-200'
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

          <div className="p-4">
            {viewMode === 'cards' ? (
              // Card View
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {(() => {
                  // Group fabrics by qualityCode for card view while preserving sort order
                  const groupedFabrics = new Map<string, Fabric[]>();
                  const groupOrder: string[] = [];
                  
                  paginatedFabrics.forEach(fabric => {
                    const key = fabric.qualityCode;
                    if (!groupedFabrics.has(key)) {
                      groupedFabrics.set(key, []);
                      groupOrder.push(key);
                    }
                    groupedFabrics.get(key)!.push(fabric);
                  });

                  return groupOrder.map(qualityCode => {
                    const fabrics = groupedFabrics.get(qualityCode)!;
                    // Sort items by creation date (oldest first within quality)
                    // This ensures items show in creation order: 33 → 333 → 3333  
                    fabrics.sort((a, b) => {
                      const aDate = new Date(a.createdAt || 0);
                      const bDate = new Date(b.createdAt || 0);
                      return aDate.getTime() - bDate.getTime(); // Oldest first (ascending)
                    });
                    const mainFabric = fabrics[0];
                    const isExpanded = expandedCards.has(qualityCode);
                    const itemsToShow = isExpanded ? fabrics : fabrics.slice(0, 1);
                    
                    return (
                      <div key={qualityCode} className={`rounded-lg sm:rounded-xl border ${
                        isDarkMode ? 'bg-gray-800/50 border-gray-600' : 'bg-blue-50 border-blue-300'
                      }`}>
                        {/* Image Section - Responsive with Touch Support */}
                        <div className="relative h-28 sm:h-32 md:h-36 lg:h-40 xl:h-48 overflow-hidden rounded-t-lg sm:rounded-t-xl group">
                          {mainFabric.images && mainFabric.images.length > 0 ? (
                            <div 
                              className="relative w-full h-full"
                              onTouchStart={(e) => {
                                const touch = e.touches[0];
                                const target = e.currentTarget as HTMLElement;
                                target.dataset.touchStartX = touch.clientX.toString();
                              }}
                              onTouchEnd={(e) => {
                                const target = e.currentTarget as HTMLElement;
                                const startX = parseInt(target.dataset.touchStartX || '0');
                                const endX = e.changedTouches[0].clientX;
                                const distance = startX - endX;
                                
                                if (Math.abs(distance) > 50) { // Minimum swipe distance
                                  if (distance > 0 && mainFabric.images.length > 1) {
                                    // Swipe left - next image
                                    handleCardImageNavigation(qualityCode, 'next');
                                  } else if (distance < 0 && mainFabric.images.length > 1) {
                                    // Swipe right - previous image
                                    handleCardImageNavigation(qualityCode, 'prev');
                                  }
                                }
                              }}
                            >
                              <img 
                                src={getCurrentCardImage(mainFabric, qualityCode) || mainFabric.images[0]} 
                                alt="Fabric"
                                className="w-full h-full object-cover cursor-pointer transition-transform duration-200 hover:scale-105 select-none"
                                onClick={() => handleImageClick(mainFabric, cardImageIndices[qualityCode] || 0)}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const fallback = target.parentElement?.querySelector('.fallback-icon') as HTMLElement;
                                  if (fallback) {
                                    fallback.style.display = 'flex';
                                  }
                                }}
                              />
                              <div className={`hidden fallback-icon w-full h-full items-center justify-center ${
                                isDarkMode ? 'bg-gray-600' : 'bg-gray-100'
                              }`} style={{ display: 'none' }}>
                                <PhotoIcon className={`h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`} />
                              </div>
                              
                              {/* Touch hint for mobile */}
                              {mainFabric.images.length > 1 && (
                                <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded-full text-xs font-medium ${
                                  isDarkMode 
                                    ? 'bg-gray-800/80 text-gray-300 border border-gray-600' 
                                    : 'bg-white/90 text-gray-600 border border-gray-200'
                                } shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                                  ← Swipe →
                                </div>
                              )}
                              
                              {/* Navigation buttons for multiple images */}
                              {mainFabric.images.length > 1 && (
                                <>
                                  {/* Left arrow */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCardImageNavigation(qualityCode, 'prev');
                                    }}
                                    className={`absolute left-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-full transition-all duration-200 ${
                                      isDarkMode
                                        ? 'bg-gray-800/80 hover:bg-gray-700/90 text-white'
                                        : 'bg-white/90 hover:bg-white text-gray-700'
                                    } shadow-lg opacity-0 group-hover:opacity-100 hover:scale-110`}
                                  >
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                  </button>
                                  
                                  {/* Right arrow */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCardImageNavigation(qualityCode, 'next');
                                    }}
                                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-full transition-all duration-200 ${
                                      isDarkMode
                                        ? 'bg-gray-800/80 hover:bg-gray-700/90 text-white'
                                        : 'bg-white/90 hover:bg-white text-gray-700'
                                    } shadow-lg opacity-0 group-hover:opacity-100 hover:scale-110`}
                                  >
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </button>
                                </>
                              )}
                            </div>
                                                     ) : (
                             <div className={`w-full h-full flex flex-col items-center justify-center ${
                               isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                             }`}>
                               <PhotoIcon className={`h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 mb-2 ${
                                 isDarkMode ? 'text-gray-500' : 'text-gray-400'
                               }`} />
                               <span className={`text-xs sm:text-sm font-medium ${
                                 isDarkMode ? 'text-gray-400' : 'text-gray-500'
                               }`}>
                                 No image added
                               </span>
                             </div>
                           )}
                          
                          {/* Image count badge - Responsive */}
                          {mainFabric.images && mainFabric.images.length > 1 && (
                            <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                              <span className={`text-xs sm:text-sm px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full font-medium shadow-lg ${
                                isDarkMode 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}>
                                <span className="hidden sm:inline">{mainFabric.images.length} photos</span>
                                <span className="sm:hidden">+{mainFabric.images.length - 1}</span>
                              </span>
                            </div>
                          )}
                          
                          {/* Items count badge - Responsive */}
                          <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                            <span className={`text-xs sm:text-sm px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full font-medium shadow-lg ${
                              isDarkMode 
                                ? 'bg-green-600 text-white' 
                                : 'bg-green-100 text-green-800 border border-green-200'
                            }`}>
                              <span className="hidden sm:inline">{fabrics.length} weaver{fabrics.length !== 1 ? 's' : ''}</span>
                              <span className="sm:hidden">{fabrics.length}</span>
                            </span>
                          </div>
                        </div>
                        
                        {/* Content Section - Responsive */}
                        <div className="p-1.5 sm:p-2 lg:p-3 xl:p-4">
                          {/* Quality Information */}
                          <div className="mb-1.5 sm:mb-2">
                            <div className={`text-xs sm:text-sm mb-1 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              <span className="font-medium">Quality Code:</span>
                              <span className={`ml-1 font-bold ${
                                isDarkMode ? 'text-blue-400' : 'text-blue-600'
                              }`}>
                                {mainFabric.qualityCode}
                              </span>
                            </div>
                            <div className={`text-xs sm:text-sm ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              <span className="font-medium">Quality Name:</span>
                              <span className="ml-1">{mainFabric.qualityName}</span>
                            </div>
                          </div>
                          
                          {/* All Items in One Compact Section */}
                          <div className="mb-1.5 sm:mb-2">
                            <div className={`p-2 sm:p-2.5 rounded-lg border ${
                              isDarkMode 
                                ? 'bg-gray-700/30 border-gray-500' 
                                : 'bg-gray-50 border-gray-300'
                            }`}>
                              <h4 className={`text-xs sm:text-sm font-semibold mb-1 sm:mb-1.5 flex items-center justify-between ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                <span>Weavers ({fabrics.length})</span>
                              </h4>
                              
                              {/* Show items based on expansion state */}
                              <div className="space-y-2">
                                {itemsToShow.map((fabric, index) => (
                                  <div key={fabric._id} className={`p-2 sm:p-2.5 lg:p-3 rounded-lg border transition-all duration-1000 ease-in-out relative overflow-hidden ${
                                    fadeOutRows.has(fabric._id) 
                                      ? 'opacity-0 scale-75 -translate-y-4 rotate-1 blur-sm' 
                                      : 'opacity-100 scale-100 translate-y-0 rotate-0 blur-0'
                                  } ${
                                    fadeOutRows.has(fabric._id)
                                      ? isDarkMode 
                                        ? 'bg-red-900/20 border-red-700/50' 
                                        : 'bg-red-50 border-red-200'
                                      : isDarkMode 
                                        ? 'bg-gray-800/40 border-gray-600/40 hover:bg-gray-700/70' 
                                        : 'bg-white border-gray-200 hover:bg-gray-50'
                                  }`}>
                                    {/* Delete Animation Overlay */}
                                    {fadeOutRows.has(fabric._id) && (
                                      <>
                                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-red-600/10 animate-pulse"></div>
                                        <div className="absolute top-2 right-2 z-10">
                                          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
                                            <TrashIcon className="h-4 w-4 text-white" />
                                          </div>
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center z-10">
                                          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                                            Deleting...
                                          </div>
                                        </div>
                                      </>
                                    )}
                                    {/* Item Header */}
                                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                                      <div className="flex items-center gap-2 sm:gap-3">
                                        <span className={`text-xs sm:text-sm font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md ${
                                          isDarkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                          #{index + 1}
                                        </span>
                                        <div className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                          <span className="text-sm sm:text-base">Rate:</span>
                                          <span className={`ml-1 font-bold text-sm sm:text-base ${
                                            fabric.greighRate > 0 
                                              ? isDarkMode 
                                                ? 'text-green-400' 
                                                : 'text-green-600'
                                              : isDarkMode 
                                                ? 'text-red-400' 
                                                : 'text-red-600'
                                        }`}>
                                          {fabric.greighRate > 0 ? `₹${fabric.greighRate}` : '-'}
                                        </span>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => handleDelete(fabric)}
                                        className={`p-1 sm:p-1.5 rounded-md transition-all duration-200 hover:scale-110 ${
                                          isDarkMode 
                                            ? 'text-red-400 hover:bg-red-900/20' 
                                            : 'text-red-600 hover:bg-red-50'
                                        }`}
                                        title={`Delete Weaver ${index + 1}`}
                                      >
                                        <TrashIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                      </button>
                                    </div>
                                    
                                    {/* Item Details Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 text-sm sm:text-base">
                                      <div className="space-y-1">
                                        <div className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                          Weaver Name:
                                        </div>
                                        <div className={`font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                                          {fabric.weaver}
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-1">
                                        <div className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                          Weaver Quality Name:
                                        </div>
                                        <div className={`font-bold ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                                          {fabric.weaverQualityName || '-'}
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-1">
                                        <div className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                          Greigh Width:
                                        </div>
                                        <div className={`font-bold ${isDarkMode ? 'text-green-300' : 'text-green-600'}`}>
                                          {fabric.greighWidth > 0 ? fabric.greighWidth : '-'}
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-1">
                                        <div className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                          Finish:
                                        </div>
                                        <div className={`font-bold ${isDarkMode ? 'text-teal-300' : 'text-teal-600'}`}>
                                          {fabric.finishWidth > 0 ? fabric.finishWidth : '-'}
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-1">
                                        <div className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                          Weight:
                                        </div>
                                        <div className={`font-bold ${isDarkMode ? 'text-orange-300' : 'text-orange-600'}`}>
                                          {fabric.weight > 0 ? `${fabric.weight} KG` : '-'}
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-1">
                                        <div className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                          GSM:
                                        </div>
                                        <div className={`font-bold ${isDarkMode ? 'text-pink-300' : 'text-pink-600'}`}>
                                          {fabric.gsm > 0 ? fabric.gsm : '-'}
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-1">
                                        <div className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                          Danier:
                                        </div>
                                        <div className={`font-bold ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>
                                          {fabric.danier || '-'}
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-1">
                                        <div className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                          Reed:
                                        </div>
                                        <div className={`font-bold ${isDarkMode ? 'text-cyan-300' : 'text-cyan-600'}`}>
                                          {fabric.reed > 0 ? fabric.reed : '-'}
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-1">
                                        <div className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                          Pick:
                                        </div>
                                        <div className={`font-bold ${isDarkMode ? 'text-rose-300' : 'text-rose-600'}`}>
                                          {fabric.pick > 0 ? fabric.pick : '-'}
                                      </div>
                                      </div>

                                    </div>
                                  </div>
                                ))}
                                
                                {/* View More/Less button or placeholder for consistent spacing */}
                                {fabrics.length > 1 ? (
                                  <button
                                    onClick={() => toggleCardExpansion(qualityCode)}
                                    className={`w-full py-1 sm:py-1.5 lg:py-2 text-xs sm:text-sm font-medium rounded border-2 border-dashed transition-colors ${
                                      isDarkMode 
                                        ? 'border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-400' 
                                        : 'border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600'
                                    }`}
                                  >
                                    <span className="hidden lg:inline">
                                      {isExpanded 
                                        ? 'Show Less' 
                                        : fabrics.length === 2 
                                                                                  ? 'View 1 more weaver'
                                        : `View ${fabrics.length - 1} more weavers`
                                      }
                                    </span>
                                    <span className="hidden sm:inline lg:hidden">
                                      {isExpanded 
                                        ? 'Show Less' 
                                        : fabrics.length === 2 
                                          ? 'View 1 more'
                                          : `View ${fabrics.length - 1} more`
                                      }
                                    </span>
                                    <span className="sm:hidden">
                                      {isExpanded 
                                        ? 'Less' 
                                        : `+${fabrics.length - 1}`
                                      }
                                    </span>
                                  </button>
                                ) : (
                                  <div className={`w-full py-1 sm:py-1.5 lg:py-2 text-xs sm:text-sm text-center rounded border border-dashed ${
                                    isDarkMode 
                                      ? 'border-gray-700 text-gray-500' 
                                      : 'border-gray-200 text-gray-400'
                                  }`}>
                                    <span className="hidden lg:inline">Only 1 weaver</span>
                                    <span className="hidden sm:inline lg:hidden">Only 1 weaver</span>
                                    <span className="sm:hidden">1</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions at Bottom - Responsive */}
                        <div className={`p-1.5 sm:p-2 lg:p-3 border-t ${
                          isDarkMode ? 'border-gray-600' : 'border-gray-300'
                        }`}>
                          <div className="flex flex-col space-y-1.5 sm:flex-row sm:space-y-0 sm:space-x-1 lg:space-x-1.5 xl:space-x-2">
                            <button
                              onClick={() => handleView(mainFabric)}
                              className={`flex-1 px-1.5 sm:px-2 lg:px-3 py-1 sm:py-1.5 lg:py-2 rounded-lg transition-all duration-200 hover:scale-105 text-xs sm:text-sm font-medium shadow-sm hover:shadow-md flex items-center justify-center space-x-1 bg-transparent ${
                                isDarkMode 
                                  ? 'text-blue-400 border border-blue-400 hover:bg-blue-400/10' 
                                  : 'text-blue-600 border border-blue-600 hover:bg-blue-600/10'
                              }`}
                              title="View Quality Details"
                            >
                              <EyeIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
                              <span className="hidden lg:inline">View</span>
                              <span className="hidden sm:inline lg:hidden">View</span>
                              <span className="sm:hidden">View</span>
                            </button>
                            
                            <button
                              onClick={() => handleEdit(mainFabric)}
                              className={`flex-1 px-1.5 sm:px-2 lg:px-3 py-1 sm:py-1.5 lg:py-2 rounded-lg transition-all duration-200 hover:scale-105 text-xs sm:text-sm font-medium shadow-sm hover:shadow-md flex items-center justify-center space-x-1 bg-transparent ${
                                isDarkMode 
                                  ? 'text-emerald-400 border border-emerald-400 hover:bg-emerald-400/10' 
                                  : 'text-emerald-600 border border-emerald-600 hover:bg-emerald-600/10'
                              }`}
                              title="Edit Quality"
                            >
                              <PencilIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
                              <span className="hidden lg:inline">Edit</span>
                              <span className="hidden sm:inline lg:hidden">Edit</span>
                              <span className="sm:hidden">Edit</span>
                            </button>
                            
                            <button
                              onClick={() => handleDeleteQualityGroup(mainFabric, fabrics)}
                              className={`flex-1 px-1.5 sm:px-2 lg:px-3 py-1 sm:py-1.5 lg:py-2 rounded-lg transition-all duration-200 hover:scale-105 text-xs sm:text-sm font-medium shadow-sm hover:shadow-md flex items-center justify-center space-x-1 bg-transparent ${
                                isDarkMode 
                                  ? 'text-red-400 border border-red-400 hover:bg-red-400/10' 
                                  : 'text-red-600 border border-red-600 hover:bg-red-600/10'
                              }`}
                              title={`Delete Quality Group (${fabrics.length} items)`}
                            >
                              <TrashIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
                              <span className="hidden lg:inline">Delete</span>
                              <span className="hidden sm:inline lg:hidden">Delete</span>
                              <span className="sm:hidden">Del</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            ) : (
              // Table View
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] sm:min-w-[800px]">
                <thead className={`${
                  isDarkMode ? 'bg-gradient-to-r from-slate-800/80 to-slate-700/80 border-b border-slate-600' : 'bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-300'
                }`}>
                  <tr>
                    <th className={`px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold uppercase tracking-wide border-b-2 ${
                      isDarkMode ? 'text-white border-slate-500 bg-slate-700/50' : 'text-black border-black/50 bg-blue-50'
                    }`}>
                      <span className="hidden sm:inline">Quality Information</span>
                      <span className="sm:hidden">Quality</span>
                    </th>
                    <th className={`px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold uppercase tracking-wide border-b-2 ${
                      isDarkMode ? 'text-white border-slate-500 bg-slate-700/50' : 'text-black border-black bg-blue-50'
                    }`}>
                      Images
                    </th>
                    <th className={`px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold uppercase tracking-wide border-b-2 ${
                      isDarkMode ? 'text-white border-slate-500 bg-slate-700/50' : 'text-black border-black bg-blue-50'
                    }`}>
                      Weavers
                    </th>
                    <th className={`px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold uppercase tracking-wide border-b-2 ${
                      isDarkMode ? 'text-white border-slate-500 bg-slate-700/50' : 'text-black border-black bg-blue-50'
                    }`}>
                      <span className="hidden sm:inline">Weaver Information</span>
                      <span className="sm:hidden">Weaver</span>
                    </th>
                    <th className={`px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold uppercase tracking-wide border-b-2 ${
                      isDarkMode ? 'text-white border-slate-500 bg-slate-700/50' : 'text-black border-black bg-blue-50'
                    }`}>
                      <span className="hidden sm:inline">Dimensions</span>
                      <span className="sm:hidden">Size</span>
                    </th>
                    <th className={`px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold uppercase tracking-wide border-b-2 ${
                      isDarkMode ? 'text-white border-slate-500 bg-slate-700/50' : 'text-black border-black bg-blue-50'
                    }`}>
                      <span className="hidden sm:inline">Specifications</span>
                      <span className="sm:hidden">Specs</span>
                    </th>
                    <th className={`px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold uppercase tracking-wide border-b-2 ${
                      isDarkMode ? 'text-white border-slate-500 bg-slate-700/50' : 'text-black border-black  bg-blue-50'
                    }`}>
                      <span className="hidden sm:inline">Technical Details</span>
                      <span className="sm:hidden">Tech</span>
                    </th>
                    <th className={`px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold uppercase tracking-wide border-b-2 ${
                      isDarkMode ? 'text-white border-slate-500 bg-slate-700/50' : 'text-black border-black bg-blue-50'
                    }`}>
                      Pricing
                    </th>
                    <th className={`px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold uppercase tracking-wide border-b-2 ${
                      isDarkMode ? 'text-white border-slate-500 bg-slate-700/50' : 'text-black border-black bg-blue-50'
                    }`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${
                  isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
                }`}>
                  {(() => {
                    // Group fabrics by qualityCode while preserving sort order (same as card view)
                    const groupedFabrics = new Map<string, Fabric[]>();
                    const groupOrder: string[] = [];
                    
                    paginatedFabrics.forEach(fabric => {
                      const key = fabric.qualityCode;
                      if (!groupedFabrics.has(key)) {
                        groupedFabrics.set(key, []);
                        groupOrder.push(key);
                      }
                      groupedFabrics.get(key)!.push(fabric);
                    });

                    return groupOrder.map(qualityCode => {
                      const fabrics = groupedFabrics.get(qualityCode)!;
                      // Sort items by creation date (oldest first within quality) 
                      // This ensures items show in creation order: 33 → 333 → 3333
                      fabrics.sort((a, b) => {
                        const aDate = new Date(a.createdAt || 0);
                        const bDate = new Date(b.createdAt || 0);
                        return aDate.getTime() - bDate.getTime(); // Oldest first (ascending)
                      });
                      const mainFabric = fabrics[0]; // Use first fabric for quality info
                      
                      return (
                        <tr key={qualityCode} className={`hover:${
                          isDarkMode ? 'bg-gray-700/40' : 'bg-gray-100/90'
                        } transition-all duration-300 ease-in-out border-b ${
                          isDarkMode ? 'border-gray-600' : 'border-gray-300'
                        }`}>
                          {/* Quality Information */}
                          <td className={`px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-900'
                          }`}>
                            <div className="space-y-2 sm:space-y-3">
                              <div className="text-sm sm:text-base">
                                <span className={`font-semibold ${
                                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                }`}>Quality Code:</span>
                                <span className={`ml-1 sm:ml-2 font-bold text-base sm:text-lg ${
                                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                }`}>
                                  {mainFabric.qualityCode}
                                </span>
                              </div>
                              <div className="text-sm sm:text-base">
                                <span className={`font-semibold ${
                                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                }`}>Quality Name:</span>
                                <span className={`ml-1 sm:ml-2 font-bold ${
                                  isDarkMode ? 'text-purple-300' : 'text-purple-600'
                                }`}>
                                  {mainFabric.qualityName}
                                </span>
                              </div>
                              <div className="pt-2 sm:pt-3 border-t border-gray-400/15">
                              <div className="text-xs sm:text-sm">
                                <span className={`font-medium ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>Created:</span>
                                  <span className={`ml-1 sm:ml-2 font-semibold ${
                                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                  }`}>
                                  <span className="hidden sm:inline">{new Date(mainFabric.createdAt).toLocaleString()}</span>
                                  <span className="sm:hidden">{new Date(mainFabric.createdAt).toLocaleDateString()}</span>
                                </span>
                                </div>
                              </div>
                              <div className="text-xs sm:text-sm">
                                <span className={`font-medium ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>Weavers:</span>
                                <span className={`ml-1 sm:ml-2 font-bold text-base sm:text-lg ${
                                  isDarkMode ? 'text-green-400' : 'text-green-600'
                                }`}>
                                  {fabrics.length}
                                </span>
                              </div>
                            </div>
                          </td>
                          
                          {/* Images - Show only once per quality group */}
                          <td className="px-1.5 sm:px-2 lg:px-4 py-1.5 sm:py-2 lg:py-3">
                            {mainFabric.images && mainFabric.images.length > 0 ? (
                              <div className="flex items-center space-x-1 sm:space-x-2">
                                   <div className="relative">
                                <img 
                                  src={mainFabric.images[0]} 
                                  alt="Fabric"
                                       className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg hover:scale-105"
                                  onClick={() => handleImageClick(mainFabric, 0)}
                                       onError={(e) => {
                                         const target = e.target as HTMLImageElement;
                                         target.style.display = 'none';
                                         const fallback = target.parentElement?.querySelector('.fallback-icon') as HTMLElement;
                                         if (fallback) {
                                           fallback.style.display = 'flex';
                                         }
                                       }}
                                     />
                                     <div className={`hidden fallback-icon w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-lg items-center justify-center ${
                                       isDarkMode ? 'bg-gray-600 border-2 border-gray-500' : 'bg-gray-100 border-2 border-gray-200'
                                     }`} style={{ display: 'none' }}>
                                       <PhotoIcon className={`h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 ${
                                         isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                       }`} />
                                     </div>
                                   </div>
                                {mainFabric.images.length > 1 && (
                                     <span className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium ${
                                    isDarkMode 
                                      ? 'bg-blue-600 text-white' 
                                      : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    +{mainFabric.images.length - 1}
                                  </span>
                                )}
                              </div>
                            ) : (
                                 <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg flex flex-col items-center justify-center border-2 ${
                                   isDarkMode 
                                     ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
                                     : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                 } transition-colors duration-200`}>
                                   <PhotoIcon className={`h-5 w-5 sm:h-6 sm:w-6 mb-1 ${
                                     isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                   }`} />
                                   <span className={`text-xs font-medium ${
                                     isDarkMode ? 'text-gray-500' : 'text-gray-400'
                                   }`}>
                                     <span className="hidden sm:inline">No image</span>
                                     <span className="sm:hidden">No img</span>
                                   </span>
                              </div>
                            )}
                          </td>
                          
                          {/* Weavers Column - Show Weaver 1, Weaver 2 labels */}
                          <td className={`px-2 sm:px-3 lg:px-4 py-2 sm:py-3 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-900'
                          }`}>
                                                          <div className="space-y-1">
                              {fabrics.map((fabric, index) => (
                                  <div key={fabric._id} className={`text-xs sm:text-sm min-h-[3rem] sm:min-h-[4rem] flex items-center ${
                                    index > 0 ? `mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-dashed ${isDarkMode ? 'border-gray-500/60' : 'border-gray-400/60'}` : ''
                                  }`}>
                                                                  <div className={`text-sm sm:text-base font-bold ${
                                   isDarkMode ? 'text-blue-300' : 'text-blue-600'
                                  }`}>
                                    Weaver {index + 1}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                          
                          {/* Weaver Information - Show all weavers */}
                          <td className={`px-2 sm:px-3 lg:px-4 py-2 sm:py-3 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-900'
                          }`}>
                              <div className="space-y-1">
                              {fabrics.map((fabric, index) => (
                                                                    <div key={fabric._id} className={`text-sm sm:text-base ${
                                    index > 0 ? `mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-dashed ${isDarkMode ? 'border-gray-500/60' : 'border-gray-400/60'}` : ''
                                  }`}>
                                   <div className={`mb-1.5 sm:mb-2 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                     <span className="hidden sm:inline">Weaver Name:</span>
                                     <span className="sm:hidden">WN:</span>
                                     <span className={`font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>{fabric.weaver}</span>
                                    </div>
                                   <div className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                     <span className="hidden sm:inline">Weaver Quality Name:</span>
                                     <span className="sm:hidden">WQ:</span>
                                     <span className={`font-bold ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>{fabric.weaverQualityName || '-'}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                          
                          {/* Dimensions - Show all dimensions */}
                          <td className={`px-2 sm:px-3 lg:px-4 py-2 sm:py-3 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-900'
                          }`}>
                                                            <div className="space-y-1">
                              {fabrics.map((fabric, index) => (
                                  <div key={fabric._id} className={`text-sm sm:text-base ${
                                    index > 0 ? `mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-dashed ${isDarkMode ? 'border-gray-500/60' : 'border-gray-400/60'}` : ''
                                  }`}>
                                   <div className={`mb-1.5 sm:mb-2 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                     <span className="hidden sm:inline">Greigh:</span>
                                     <span className="sm:hidden">G:</span>
                                     <span className={`font-bold ${isDarkMode ? 'text-green-300' : 'text-green-600'}`}>{fabric.greighWidth > 0 ? fabric.greighWidth : '-'}</span>
                                    </div>
                                   <div className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                     <span className="hidden sm:inline">Finish:</span>
                                     <span className="sm:hidden">F:</span>
                                     <span className={`font-bold ${isDarkMode ? 'text-teal-300' : 'text-teal-600'}`}>{fabric.finishWidth > 0 ? fabric.finishWidth : '-'}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                          
                          {/* Specifications - Show all specifications */}
                          <td className={`px-2 sm:px-3 lg:px-4 py-2 sm:py-3 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-900'
                          }`}>
                                                            <div className="space-y-1">
                              {fabrics.map((fabric, index) => (
                                  <div key={fabric._id} className={`text-sm sm:text-base ${
                                    index > 0 ? `mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-dashed ${isDarkMode ? 'border-gray-500/60' : 'border-gray-400/60'}` : ''
                                  }`}>
                                   <div className={`mb-1.5 sm:mb-2 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                     <span className="hidden sm:inline">Weight:</span>
                                     <span className="sm:hidden">W:</span>
                                     <span className={`font-bold ${isDarkMode ? 'text-orange-300' : 'text-orange-600'}`}>{fabric.weight > 0 ? `${fabric.weight} KG` : '-'}</span>
                                    </div>
                                   <div className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                     <span className="hidden sm:inline">GSM:</span>
                                     <span className="sm:hidden">G:</span>
                                     <span className={`font-bold ${isDarkMode ? 'text-pink-300' : 'text-pink-600'}`}>{fabric.gsm > 0 ? fabric.gsm : '-'}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                          
                          {/* Technical Details - Show all technical details */}
                          <td className={`px-2 sm:px-3 lg:px-4 py-2 sm:py-3 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-900'
                          }`}>
                                                            <div className="space-y-1">
                              {fabrics.map((fabric, index) => (
                                  <div key={fabric._id} className={`text-sm sm:text-base ${
                                    index > 0 ? `mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-dashed ${isDarkMode ? 'border-gray-500/60' : 'border-gray-400/60'}` : ''
                                  }`}>
                                   <div className={`mb-1.5 sm:mb-2 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                     <span className="hidden sm:inline">Danier:</span>
                                     <span className="sm:hidden">D:</span>
                                     <span className={`font-bold ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>{fabric.danier || '-'}</span>
                                    </div>
                                   <div className={`mb-1.5 sm:mb-2 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                     <span className="hidden sm:inline">Reed:</span>
                                     <span className="sm:hidden">R:</span>
                                     <span className={`font-bold ${isDarkMode ? 'text-cyan-300' : 'text-cyan-600'}`}>{fabric.reed > 0 ? fabric.reed : '-'}</span>
                                    </div>
                                   <div className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                     <span className="hidden sm:inline">Pick:</span>
                                     <span className="sm:hidden">P:</span>
                                     <span className={`font-bold ${isDarkMode ? 'text-rose-300' : 'text-rose-600'}`}>{fabric.pick > 0 ? fabric.pick : '-'}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                          
                          {/* Pricing - Show all rates with delete buttons */}
                          <td className={`px-2 sm:px-3 lg:px-4 py-2 sm:py-3 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-900'
                          }`}>
                                                              <div className="space-y-1">
                              {fabrics.map((fabric, index) => (
                                   <div key={fabric._id} className={`text-sm sm:text-base flex items-center justify-between ${
                                    index > 0 ? `mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-dashed ${isDarkMode ? 'border-gray-500/60' : 'border-gray-400/60'}` : ''
                                   }`}>
                                  <div className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                    <span className="hidden sm:inline">Rate:</span>
                                    <span className="sm:hidden">R:</span>
                                    <span className={`font-bold text-lg sm:text-xl ${
                                      fabric.greighRate > 0 
                                        ? isDarkMode 
                                          ? 'text-green-400' 
                                          : 'text-green-600'
                                        : isDarkMode 
                                          ? 'text-red-400' 
                                          : 'text-red-600'
                                    }`}>
                                      {fabric.greighRate > 0 ? `₹${fabric.greighRate}` : '-'}
                                    </span>
                                    </div>
                                    <button
                                      onClick={() => handleDelete(fabric)}
                                    className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                                        isDarkMode 
                                        ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20 border border-red-500/30' 
                                        : 'text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-300'
                                      }`}
                                      title={`Delete Weaver ${index + 1}`}
                                    >
                                      <TrashIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    </button>
                                </div>
                              ))}
                            </div>
                          </td>
                          
                                                         {/* Actions - Vertical button layout with subtle colors */}
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                               <div className="space-y-1.5 sm:space-y-2">
                              <button
                                onClick={() => handleView(mainFabric)}
                                   className={`w-full px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 rounded-lg transition-all duration-200 hover:scale-105 text-xs sm:text-sm font-medium shadow-sm hover:shadow-md flex items-center justify-center space-x-1 sm:space-x-2 bg-transparent ${
                                  isDarkMode 
                                       ? 'text-blue-400 border border-blue-400 hover:bg-blue-400/10' 
                                       : 'text-blue-600 border border-blue-600 hover:bg-blue-600/10'
                                }`}
                                                              title="View Details"
                              >
                              <EyeIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span>View</span>
                              </button>
                              
                              <button
                                onClick={() => handleEdit(mainFabric)}
                              className={`w-full px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 rounded-lg transition-all duration-200 hover:scale-105 text-xs sm:text-sm font-medium shadow-sm hover:shadow-md flex items-center justify-center space-x-1 sm:space-x-2 bg-transparent ${
                                  isDarkMode 
                                  ? 'text-emerald-400 border border-emerald-400 hover:bg-emerald-400/10' 
                                  : 'text-emerald-600 border border-emerald-600 hover:bg-emerald-600/10'
                                }`}
                              title="Edit"
                              >
                              <PencilIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span>Edit</span>
                              </button>
                              
                              <button
                                onClick={() => handleDeleteQualityGroup(mainFabric, fabrics)}
                              className={`w-full px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 rounded-lg transition-all duration-200 hover:scale-105 text-xs sm:text-sm font-medium shadow-sm hover:shadow-md flex items-center justify-center space-x-1 sm:space-x-2 bg-transparent ${
                                  isDarkMode 
                                  ? 'text-red-400 border border-red-400 hover:bg-red-400/10' 
                                  : 'text-red-600 border border-red-600 hover:bg-red-600/10'
                                }`}
                              title={`Delete Quality Group (${fabrics.length} items)`}
                              >
                              <TrashIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
          </div>
        )}
      </div>

          {/* Bottom Pagination Controls */}
          {itemsPerPage !== 'All' && totalPages > 1 && (
            <div className={`px-3 sm:px-4 py-2 sm:py-3 border-t flex justify-center items-center ${
              isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
            }`}>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md ${
                  currentPage === 1
                      ? isDarkMode ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : isDarkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600 border border-slate-600' : 'bg-white text-slate-700 hover:bg-blue-50 border border-slate-200'
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
                        className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-all duration-200 shadow-sm hover:shadow-md ${
                        currentPage === pageNum
                            ? isDarkMode ? 'bg-blue-600 text-white shadow-md' : 'bg-blue-500 text-white shadow-md'
                            : isDarkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600 border border-slate-600' : 'bg-white text-slate-700 hover:bg-blue-50 border border-slate-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md ${
                  currentPage === totalPages
                      ? isDarkMode ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : isDarkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600 border border-slate-600' : 'bg-white text-slate-700 hover:bg-blue-50 border border-slate-200'
                }`}
              >
                Next
              </button>
            </div>
          </div>
          )}
        </div>
      )}
      </div>

      {/* Modals */}
      {showDetails && selectedFabric && (
        <FabricDetails
          fabric={selectedFabric}
          allFabricsInGroup={selectedFabricGroup}
          onClose={() => setShowDetails(false)}
          onEdit={() => {
            setShowDetails(false);
            handleEdit(selectedFabric);
          }}
          onDelete={(fabric) => {
            setShowDetails(false);
            handleDelete(fabric);
          }}
          onBulkDelete={(fabrics) => {
            setShowDetails(false);
            const group = {
              qualityCode: selectedFabric?.qualityCode || '',
              qualityName: selectedFabric?.qualityName || '',
              items: fabrics
            };
            setBulkDeleteGroup(group);
            setShowBulkDeleteConfirmation(true);
          }}
        />
      )}

      {showDeleteConfirmation && deletingFabric && (
        <DeleteConfirmation
          fabric={deletingFabric}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          isDeleting={isDeleting}
          dependencies={deleteDependencies}
          isLoadingDependencies={isLoadingDependencies}
        />
      )}

      {/* Delete Success Popup */}
      {showDeleteSuccess && deletedFabricInfo && (
        <DeleteSuccessPopup
          fabricCode={deletedFabricInfo.code}
          fabricName={deletedFabricInfo.name}
          onClose={() => {
            setShowDeleteSuccess(false);
            setDeletedFabricInfo(null);
          }}
          show={showDeleteSuccess}
        />
      )}

      {showBulkDeleteConfirmation && bulkDeleteGroup && (
        <BulkDeleteConfirmation
          fabrics={bulkDeleteGroup.items}
          qualityCode={bulkDeleteGroup.qualityCode}
          qualityName={bulkDeleteGroup.qualityName}
          onConfirm={confirmBulkDelete}
          onCancel={cancelBulkDelete}
          isDeleting={isBulkDeleting}
        />
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-4xl max-h-full rounded-xl overflow-hidden ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          } shadow-2xl`}>
            {/* Modal Header */}
            <div className={`p-4 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-lg font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {showImageModal.fabric.qualityCode} - {showImageModal.fabric.qualityName}
                  </h3>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Image {selectedImageIndex + 1} of {showImageModal.fabric.images?.length || 0}
                  </p>
                </div>
                <button
                  onClick={() => setShowImageModal(null)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode 
                      ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                      : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="relative">
              <img 
                src={showImageModal.fabric.images?.[selectedImageIndex]}  aria-hidden={true}
                alt="Fabric"
                className="max-w-full max-h-[70vh] object-contain mx-auto"
              />
              
              {/* Navigation buttons */}
              {showImageModal.fabric.images && showImageModal.fabric.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className={`absolute left-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full ${
                      isDarkMode 
                        ? 'bg-gray-800/80 hover:bg-gray-700 text-white' 
                        : 'bg-white/80 hover:bg-gray-100 text-gray-900'
                    } shadow-lg transition-colors`}
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={nextImage}
                    className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full ${
                      isDarkMode 
                        ? 'bg-gray-800/80 hover:bg-gray-700 text-white' 
                        : 'bg-white/80 hover:bg-gray-100 text-gray-900'
                    } shadow-lg transition-colors`}
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>
            
            {/* Modal Footer */}
            {showImageModal.fabric.images && showImageModal.fabric.images.length > 1 && (
              <div className={`border-t ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>                  
                <div className="flex justify-center space-x-2">
                  {showImageModal.fabric.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index === selectedImageIndex
                          ? isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
                          : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}