'use client';

import React, { useState, useEffect, useMemo } from 'react';
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

export default function FabricsPage() {
  const { isDarkMode, mounted } = useDarkMode();
  const router = useRouter();
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [loading, setLoading] = useState(true);

  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedFabric, setSelectedFabric] = useState<Fabric | null>(null);
  const [deletingFabric, setDeletingFabric] = useState<Fabric | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDependencies, setDeleteDependencies] = useState<string[]>([]);
  const [isLoadingDependencies, setIsLoadingDependencies] = useState(false);
  const [showBulkDeleteConfirmation, setShowBulkDeleteConfirmation] = useState(false);
  const [bulkDeleteGroup, setBulkDeleteGroup] = useState<{ qualityCode: string; qualityName: string; items: Fabric[] } | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
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
  const [itemsPerPage, setItemsPerPage] = useState<number | 'All'>(5);
  const itemsPerPageOptions = [5, 10, 50, 100, 'All'] as const;
  
  // Enhanced UI states
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [selectedFabrics, setSelectedFabrics] = useState<Set<string>>(new Set());
  const [bulkActions, setBulkActions] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'popular' | 'trending'>('all');
  const [showIndividualFabrics, setShowIndividualFabrics] = useState(false);
  

  
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

  // Fetch fabrics with caching
  const fetchFabrics = async (forceRefresh = false) => {
    // Cache for 30 seconds to prevent excessive API calls
    const now = Date.now();
    if (!forceRefresh && (now - lastFetchTime) < 30000 && fabrics.length > 0) {
      return; // Use cached data
    }
    
    setLoading(true);
    setFiltersLoading(true);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout - increased to prevent timeout errors
      
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.qualityName) params.append('qualityName', filters.qualityName);
      if (filters.weaver) params.append('weaver', filters.weaver);
      if (filters.weaverQualityName) params.append('weaverQualityName', filters.weaverQualityName);
      // Remove the refresh parameter to keep URL clean and prevent issues
      // if (forceRefresh) params.append('refresh', Date.now().toString());

      const response = await fetch(`/api/fabrics?${params}&limit=50`, { // Limit for faster loading
        headers: {
          'Cache-Control': forceRefresh ? 'no-cache' : 'max-age=30' // Force refresh if needed
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
         setLastFetchTime(now); // Update cache timestamp
         // Only show refresh message when user manually clicks refresh button (not on initial load)
         if (forceRefresh && fabrics.length > 0) {
           setRefreshMessage('Data refreshed successfully!');
           setTimeout(() => setRefreshMessage(null), 3000);
         }
       } else {
         throw new Error(data.message || 'Failed to fetch fabrics');
       }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('Request timeout');
      } else {
        console.error('Error fetching fabrics:', error);
      }
    } finally {
      setLoading(false);
      setFiltersLoading(false);
    }
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
        console.warn('Quality names fetch timeout - continuing without quality names');
      } else {
        console.error('Error fetching quality names:', error);
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
        console.warn('Weavers fetch timeout - continuing without weavers');
      } else {
        console.error('Error fetching weavers:', error);
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
        console.warn('Weaver quality names fetch timeout - continuing without weaver quality names');
      } else {
        console.error('Error fetching weaver quality names:', error);
      }
    }
  };

  useEffect(() => {
    setFiltersLoading(true);
    // Load data without any refresh message
    fetchFabrics(false);
    fetchQualityNames();
  }, []);

  // Removed auto-refresh on visibility change - was causing unnecessary refreshes

  // Only keyboard shortcuts for manual refresh
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F5 or Ctrl+R to refresh
      if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
        e.preventDefault();
        fetchFabrics(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    fetchWeavers();
  }, [filters.qualityName]);

  useEffect(() => {
    fetchWeaverQualityNames();
  }, [filters.weaver]);

  const handleCreate = () => {
    router.push('/fabrics/create');
  };

  const handleEdit = (fabric: Fabric) => {
    // Navigate to create page with fabric ID for editing
    console.log('Edit button clicked for fabric:', fabric);
    console.log('Navigating to:', `/fabrics/create?edit=${fabric._id}`);
    router.push(`/fabrics/create?edit=${fabric._id}`);
  };

  const handleView = (fabric: Fabric) => {
    setSelectedFabric(fabric);
    setShowDetails(true);
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
        console.error('Failed to check dependencies:', dependencyData.message);
        setDeleteDependencies([]);
      }
    } catch (error) {
      console.error('Error checking dependencies:', error);
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
        // Optimistic update: remove deleted fabric from state immediately
        if (deletingFabric) {
          setFabrics(prev => prev.filter(f => f._id !== deletingFabric._id));
        }
        setShowDeleteConfirmation(false);
        setDeletingFabric(null);
        setDeleteDependencies([]);
      } else {
        console.error('Failed to delete fabric:', data.message);
      }
    } catch (error) {
      console.error('Error deleting fabric:', error);
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
        
        // Optimistic update: remove deleted items from current state
        const deletedIds = new Set(bulkDeleteGroup.items.map(item => item._id));
        setFabrics(prev => prev.filter(fabric => !deletedIds.has(fabric._id)));
        
        // Clear states immediately
        setBulkDeleteGroup(null);
        setSelectedFabrics(new Set());
        setBulkActions(false);
        setShowSelectionToolbar(false);
        
        // Show success message
        setRefreshMessage(`✅ Successfully deleted ${deletedCount} fabric(s)!`);
        setTimeout(() => setRefreshMessage(null), 2000);
      } else {
        console.error('Failed to delete fabrics:', data.message);
        setRefreshMessage(`❌ Error: ${data.message}`);
        setTimeout(() => setRefreshMessage(null), 4000);
      }
    } catch (error) {
      console.error('Error deleting fabrics:', error);
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
      console.error('Export error:', error);
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
        `   Width: ${f.finishWidth || 'N/A'}"`,
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



  // Enhanced filtering and sorting
  const filteredAndSortedFabrics = useMemo(() => {
    let filtered = [...fabrics];
    
    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(fabric => 
        fabric.qualityCode.toLowerCase().includes(searchLower) ||
        fabric.qualityName.toLowerCase().includes(searchLower) ||
        fabric.weaver.toLowerCase().includes(searchLower) ||
        fabric.weaverQualityName.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.qualityName) {
      filtered = filtered.filter(fabric => fabric.qualityName === filters.qualityName);
    }
    
    if (filters.weaver) {
      filtered = filtered.filter(fabric => fabric.weaver === filters.weaver);
    }
    
    if (filters.weaverQualityName) {
      filtered = filtered.filter(fabric => fabric.weaverQualityName === filters.weaverQualityName);
    }
    
    if (filters.minGsm) {
      filtered = filtered.filter(fabric => fabric.gsm >= parseFloat(filters.minGsm));
    }
    
    if (filters.maxGsm) {
      filtered = filtered.filter(fabric => fabric.gsm <= parseFloat(filters.maxGsm));
    }
    
    if (filters.minWeight) {
      filtered = filtered.filter(fabric => fabric.weight >= parseFloat(filters.minWeight));
    }
    
    if (filters.maxWeight) {
      filtered = filtered.filter(fabric => fabric.weight <= parseFloat(filters.maxWeight));
    }
    
    if (filters.minRate) {
      filtered = filtered.filter(fabric => fabric.greighRate >= parseFloat(filters.minRate));
    }
    
    if (filters.maxRate) {
      filtered = filtered.filter(fabric => fabric.greighRate <= parseFloat(filters.maxRate));
    }
    
    if (filters.minWidth) {
      filtered = filtered.filter(fabric => fabric.finishWidth >= parseFloat(filters.minWidth));
    }
    
    if (filters.maxWidth) {
      filtered = filtered.filter(fabric => fabric.finishWidth <= parseFloat(filters.maxWidth));
    }
    
    if (filters.hasImages) {
      filtered = filtered.filter(fabric => fabric.images && fabric.images.length > 0);
    }
    
    // Group by quality code and quality name first
    const qualityGroups = filtered.reduce((groups, fabric) => {
      const key = `${fabric.qualityCode}-${fabric.qualityName}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(fabric);
      return groups;
    }, {} as Record<string, Fabric[]>);

    // Find the earliest creation date for each quality group (quality creation date)
    const qualityCreationDates = new Map<string, number>();
    Object.entries(qualityGroups).forEach(([key, group]) => {
      const earliestTime = Math.min(...group.map(item => new Date(item.createdAt || 0).getTime()));
      qualityCreationDates.set(key, earliestTime);
    });

    // Sort qualities by their creation date (earliest item date)
    const sortedQualityEntries = Object.entries(qualityGroups).sort(([keyA], [keyB]) => {
      const aEarliestTime = qualityCreationDates.get(keyA) || 0;
      const bEarliestTime = qualityCreationDates.get(keyB) || 0;
      
      if (filters.sortOrder === 'asc') {
        return aEarliestTime - bEarliestTime; // Oldest quality first
      } else {
        return bEarliestTime - aEarliestTime; // Latest quality first (DEFAULT)
      }
    });

    // Sort each group internally by createdAt (oldest first within quality)
    sortedQualityEntries.forEach(([, group]) => {
      group.sort((a, b) => {
        const aDate = new Date(a.createdAt || 0);
        const bDate = new Date(b.createdAt || 0);
        return aDate.getTime() - bDate.getTime(); // Always oldest first within group
      });
    });

    // Flatten back to single array while preserving quality-based order
    const result: Fabric[] = [];
    sortedQualityEntries.forEach(([, group]) => {
      result.push(...group);
    });
    
    return result;
  }, [fabrics, filters]);

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
    return Math.ceil(totalQualityGroups / (itemsPerPage as number));
  }, [totalQualityGroups, itemsPerPage]);

  // Get paginated quality groups
  const paginatedFabrics = useMemo(() => {
    if (itemsPerPage === 'All') return filteredAndSortedFabrics;
    
    // Group fabrics to get quality groups first
    const groups = filteredAndSortedFabrics.reduce((groups, fabric) => {
      const key = `${fabric.qualityCode}-${fabric.qualityName}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(fabric);
      return groups;
    }, {} as Record<string, Fabric[]>);

    const groupKeys = Object.keys(groups);
    const startIndex = (currentPage - 1) * (itemsPerPage as number);
    const endIndex = startIndex + (itemsPerPage as number);
    const paginatedGroupKeys = groupKeys.slice(startIndex, endIndex);
    
    // Return all fabrics from the selected quality groups
    const result: Fabric[] = [];
    paginatedGroupKeys.forEach(key => {
      result.push(...groups[key]);
    });
    
    return result;
  }, [filteredAndSortedFabrics, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

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

  if (!mounted) return null;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        {filtersLoading ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-14 h-14 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-xl animate-pulse`}></div>
              <div>
                <div className={`w-48 h-8 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg animate-pulse mb-2`}></div>
                <div className={`w-64 h-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded animate-pulse`}></div>
              </div>
            </div>
            <div className={`w-32 h-12 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg animate-pulse`}></div>
          </div>
        ) : (
        <div className="flex items-center justify-between">
            <div>
            <h1 className={`text-3xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
                Fabric Management
              </h1>
            <p className={`text-lg mt-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Manage fabric inventory and specifications with advanced filtering
              </p>
          </div>
                     <div className="flex items-center space-x-3">
             <button
               onClick={() => fetchFabrics(true)}
               disabled={loading}
               className={`p-3 rounded-xl font-medium transition-all duration-200 hover:scale-110 ${
                 loading ? 'opacity-50 cursor-not-allowed' : ''
               } ${
                 isDarkMode 
                   ? 'bg-gray-700 hover:bg-gray-600 text-white shadow-lg' 
                   : 'bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-lg'
               }`}
               title="Refresh Data"
             >
               <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
             </button>

             <button
               onClick={handleCreate}
               className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                 isDarkMode 
                   ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                   : 'bg-blue-500 hover:bg-blue-600 text-white'
               }`}
             >
               <PlusIcon className="h-5 w-5 inline mr-2" />
               Add Fabrics
             </button>

           </div>
        </div>
        )}
             </div>

       {/* Refresh Message */}
       {refreshMessage && (
         <div className={`mb-4 p-3 rounded-lg border ${
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



              {/* Search and View Controls */}
       <div className={`mb-6 p-4 rounded-xl border ${
         isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
       } shadow-lg`}>
         <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <MagnifyingGlassIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <input
                type="text"
                placeholder="Search fabrics by code, name, or weaver..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border transition-colors ${
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
          <div className="flex items-center space-x-6">
            {/* Sort Controls */}
            <div className="flex items-center space-x-3">
             <span className={`text-sm font-medium ${
               isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Sort:</span>
             <div className="flex rounded-lg border overflow-hidden">
               <button
                  onClick={() => setFilters(prev => ({ ...prev, sortBy: 'createdAt', sortOrder: 'desc' }))}
                 className={`px-3 py-2 text-sm transition-colors ${
                    filters.sortBy === 'createdAt' && filters.sortOrder === 'desc'
                     ? isDarkMode
                        ? 'bg-green-600 text-white'
                        : 'bg-green-500 text-white'
                     : isDarkMode
                       ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                       : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                 }`}
                  title="Latest First"
               >
                  Latest
               </button>
               <button
                  onClick={() => setFilters(prev => ({ ...prev, sortBy: 'createdAt', sortOrder: 'asc' }))}
                 className={`px-3 py-2 text-sm transition-colors ${
                    filters.sortBy === 'createdAt' && filters.sortOrder === 'asc'
                      ? isDarkMode
                        ? 'bg-green-600 text-white'
                        : 'bg-green-500 text-white'
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title="Oldest First"
                >
                  Oldest
                </button>
              </div>
            </div>

           {/* View Mode Toggle */}
            <div className="flex items-center space-x-3">
             <span className={`text-sm font-medium ${
               isDarkMode ? 'text-gray-300' : 'text-gray-700'
             }`}>View:</span>
             <div className="flex rounded-lg border overflow-hidden">
               <button
                 onClick={() => setViewMode('table')}
                 className={`px-3 py-2 text-sm transition-colors ${
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
                 <ListBulletIcon className="h-4 w-4" />
               </button>
               <button
                 onClick={() => setViewMode('cards')}
                 className={`px-3 py-2 text-sm transition-colors ${
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
                <Squares2X2Icon className="h-4 w-4" />
               </button>
             </div>
           </div>

            {/* Results Count */}

           </div>



           {/* Bulk Actions */}
           {bulkActions && (
             <div className="flex items-center space-x-2">
               <span className={`text-sm ${
                 isDarkMode ? 'text-gray-300' : 'text-gray-700'
               }`}>
                 {selectedFabrics.size} selected
               </span>
               <button
                 onClick={clearSelection}
                 className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                   isDarkMode 
                     ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                     : 'bg-gray-500 hover:bg-gray-600 text-white'
                 }`}
               >
                 Clear
               </button>
             </div>
           )}

           {/* Toggle Stats */}
           {/* Removed as per edit hint */}
         </div>
       </div>

       {/* Selection Toolbar */}
       {showSelectionToolbar && (
         <div className={`mb-4 p-4 rounded-xl border ${
           isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'
         } shadow-lg`}>
           <div className="flex items-center justify-between">
             <div className="flex items-center space-x-4">
               <div className="flex items-center space-x-2">
                 <CheckCircleIcon className={`h-5 w-5 ${
                   isDarkMode ? 'text-blue-400' : 'text-blue-600'
                 }`} />
                 <span className={`font-medium ${
                   isDarkMode ? 'text-blue-300' : 'text-blue-700'
                 }`}>
                   {selectedFabrics.size} fabric{selectedFabrics.size !== 1 ? 's' : ''} selected
                 </span>
               </div>
               <div className="flex items-center space-x-2">
                 <button
                   onClick={selectAllVisible}
                   className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                     isDarkMode 
                       ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                       : 'bg-blue-500 hover:bg-blue-600 text-white'
                   }`}
                 >
                   Select All
                 </button>
                 <button
                   onClick={invertSelection}
                   className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                     isDarkMode 
                       ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                       : 'bg-gray-500 hover:bg-gray-600 text-white'
                   }`}
                 >
                   Invert
                 </button>
                 <button
                   onClick={clearAllSelection}
                   className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                     isDarkMode 
                       ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                       : 'bg-gray-500 hover:bg-gray-600 text-white'
                   }`}
                 >
                   Clear
                 </button>
               </div>
             </div>
             
             <div className="flex items-center space-x-2">
               <button
                 onClick={() => setShowExportModal(true)}
                 className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                   isDarkMode 
                     ? 'bg-green-600 hover:bg-green-700 text-white' 
                     : 'bg-green-500 hover:bg-green-600 text-white'
                 }`}
               >
                 Export
               </button>
               <button
                 onClick={handleBulkEdit}
                 className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                   isDarkMode 
                     ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                     : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                 }`}
               >
                 Edit
               </button>
               <button
                 onClick={handleBulkDeleteSelected}
                 className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                   isDarkMode 
                     ? 'bg-red-600 hover:bg-red-700 text-white' 
                     : 'bg-red-500 hover:bg-red-600 text-white'
                 }`}
               >
                 Delete
               </button>
             </div>
           </div>
         </div>
       )}





      {/* Enhanced Fabrics Display */}
      <div className={`rounded-xl border overflow-hidden ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } shadow-lg`}>
        {loading ? (
          <div className="p-8">
            {viewMode === 'cards' ? (
              // Card View Skeleton
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className={`p-6 rounded-xl border ${
                    isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                  } animate-pulse`}>
                    <div className={`w-full h-48 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-lg mb-4`}></div>
                    <div className={`w-3/4 h-6 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded mb-2`}></div>
                    <div className={`w-1/2 h-4 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded mb-4`}></div>
                    <div className="space-y-2">
                      <div className={`w-full h-4 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded`}></div>
                      <div className={`w-2/3 h-4 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded`}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Table View Skeleton
              <div>
            <div className="mb-6">
              <div className={`w-48 h-8 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg animate-pulse mb-2`}></div>
              <div className={`w-64 h-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded animate-pulse`}></div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${
                  isDarkMode ? 'bg-gray-900 border-b border-gray-700' : 'bg-gray-50 border-b border-gray-200'
                }`}>
                  <tr>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                      <th key={i} className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        <div className={`w-20 h-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded animate-pulse`}></div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${
                  isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
                }`}>
                  {[1, 2, 3, 4, 5].map((row) => (
                    <tr key={row} className={`hover:${
                      isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                    } transition-colors duration-200`}>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((cell) => (
                        <td key={cell} className="px-6 py-4">
                          <div className={`w-24 h-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded animate-pulse`}></div>
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
            <div className={`px-4 py-3 border-b flex justify-between items-center ${
              isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center space-x-4">
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Showing {totalQualityGroups > 0 ? (currentPage - 1) * (itemsPerPage === 'All' ? totalQualityGroups : itemsPerPage) + 1 : 0} to{' '}
                  {Math.min(currentPage * (itemsPerPage === 'All' ? totalQualityGroups : itemsPerPage), totalQualityGroups)} of{' '}
                  {totalQualityGroups} quality groups
                </span>
                
                {/* Items per page dropdown */}
                <div className="flex items-center space-x-2">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Show:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      const value = e.target.value === 'All' ? 'All' : parseInt(e.target.value);
                      setItemsPerPage(value);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {itemsPerPageOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Top Page Navigation */}
              {itemsPerPage !== 'All' && totalPages > 1 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      currentPage === 1
                        ? isDarkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    Previous
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
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                            currentPage === pageNum
                              ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                              : isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      currentPage === totalPages
                        ? isDarkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                      <div key={qualityCode} className={`rounded-xl border ${
                        isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
                      }`}>
                        {/* Image Section - Responsive */}
                        <div className="relative h-36 sm:h-40 md:h-44 lg:h-48 overflow-hidden rounded-t-xl">
                          {mainFabric.images && mainFabric.images.length > 0 ? (
                            <div className="relative w-full h-full">
                              <img 
                                src={mainFabric.images[0]} 
                                alt="Fabric"
                                className="w-full h-full object-cover cursor-pointer transition-transform duration-200 hover:scale-105"
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
                              <div className={`hidden fallback-icon w-full h-full items-center justify-center ${
                                isDarkMode ? 'bg-gray-600' : 'bg-gray-100'
                              }`} style={{ display: 'none' }}>
                                <PhotoIcon className={`h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`} />
                              </div>
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
                              <span className="hidden sm:inline">{fabrics.length} item{fabrics.length !== 1 ? 's' : ''}</span>
                              <span className="sm:hidden">{fabrics.length}</span>
                            </span>
                          </div>
                        </div>
                        
                        {/* Content Section - Responsive */}
                        <div className="p-2 sm:p-3 md:p-4">
                          {/* Quality Information */}
                          <div className="mb-2">
                            <div className={`text-sm mb-1 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              <span className="font-medium">Quality Code:</span>
                              <span className={`ml-1 font-bold ${
                                isDarkMode ? 'text-blue-400' : 'text-blue-600'
                              }`}>
                                {mainFabric.qualityCode}
                              </span>
                            </div>
                            <div className={`text-sm ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              <span className="font-medium">Quality Name:</span>
                              <span className="ml-1">{mainFabric.qualityName}</span>
                            </div>
                          </div>
                          
                          {/* All Items in One Compact Section */}
                          <div className="mb-2">
                            <div className={`p-2.5 rounded-lg border ${
                              isDarkMode 
                                ? 'bg-gray-700/30 border-gray-500' 
                                : 'bg-gray-50 border-gray-300'
                            }`}>
                              <h4 className={`text-sm font-semibold mb-1.5 flex items-center justify-between ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                <span>Items ({fabrics.length})</span>
                              </h4>
                              
                              {/* Show items based on expansion state */}
                              <div className="space-y-2">
                                {itemsToShow.map((fabric, index) => (
                                  <div key={fabric._id} className={`p-3 rounded-lg border ${
                                    isDarkMode 
                                      ? 'bg-gray-800/40 border-gray-600/40 hover:bg-gray-800/60' 
                                      : 'bg-white border-gray-200 hover:bg-gray-50'
                                  } transition-colors duration-200`}>
                                    {/* Item Header */}
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-3">
                                        <span className={`text-sm font-bold px-2 py-1 rounded-md ${
                                          isDarkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                          #{index + 1}
                                        </span>
                                        <span className={`text-lg font-bold ${
                                          isDarkMode ? 'text-green-400' : 'text-green-600'
                                        }`}>
                                          {fabric.greighRate > 0 ? `₹${fabric.greighRate}` : '-'}
                                        </span>
                                      </div>
                                      <button
                                        onClick={() => handleDelete(fabric)}
                                        className={`p-1.5 rounded-md transition-all duration-200 hover:scale-110 ${
                                          isDarkMode 
                                            ? 'text-red-400 hover:bg-red-900/20' 
                                            : 'text-red-600 hover:bg-red-50'
                                        }`}
                                        title={`Delete Item ${index + 1}`}
                                      >
                                        <TrashIcon className="h-4 w-4" />
                                      </button>
                                    </div>
                                    
                                    {/* Item Details Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                                      <div className="space-y-1">
                                        <span className={`text-xs font-medium uppercase tracking-wide ${
                                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                        }`}>Weaver</span>
                                        <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                          {fabric.weaver}
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-1">
                                        <span className={`text-xs font-medium uppercase tracking-wide ${
                                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                        }`}>Weight</span>
                                        <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                          {fabric.weight > 0 ? `${fabric.weight}kg` : '-'}
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-1">
                                        <span className={`text-xs font-medium uppercase tracking-wide ${
                                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                        }`}>GSM</span>
                                        <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                          {fabric.gsm > 0 ? fabric.gsm : '-'}
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-1">
                                        <span className={`text-xs font-medium uppercase tracking-wide ${
                                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                        }`}>Reed</span>
                                        <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                          {fabric.reed > 0 ? fabric.reed : '-'}
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-1">
                                        <span className={`text-xs font-medium uppercase tracking-wide ${
                                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                        }`}>Pick</span>
                                        <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                          {fabric.pick > 0 ? fabric.pick : '-'}
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-1">
                                        <span className={`text-xs font-medium uppercase tracking-wide ${
                                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                        }`}>Finish</span>
                                        <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                          {fabric.finishWidth > 0 ? `${fabric.finishWidth}"` : '-'}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                
                                {/* View More/Less button or placeholder for consistent spacing */}
                                {fabrics.length > 1 ? (
                                  <button
                                    onClick={() => toggleCardExpansion(qualityCode)}
                                    className={`w-full py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded border-2 border-dashed transition-colors ${
                                      isDarkMode 
                                        ? 'border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-400' 
                                        : 'border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600'
                                    }`}
                                  >
                                    <span className="hidden sm:inline">
                                      {isExpanded 
                                        ? 'Show Less' 
                                        : fabrics.length === 2 
                                          ? 'View 1 more item'
                                          : `View ${fabrics.length - 1} more items`
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
                                  <div className={`w-full py-1.5 sm:py-2 text-xs sm:text-sm text-center rounded border border-dashed ${
                                    isDarkMode 
                                      ? 'border-gray-700 text-gray-500' 
                                      : 'border-gray-200 text-gray-400'
                                  }`}>
                                    <span className="hidden sm:inline">Only 1 item</span>
                                    <span className="sm:hidden">1</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions at Bottom - Responsive */}
                        <div className={`p-2 sm:p-3 border-t ${
                          isDarkMode ? 'border-gray-600' : 'border-gray-300'
                        }`}>
                          <div className="flex space-x-1 sm:space-x-2">
                            <button
                              onClick={() => handleView(mainFabric)}
                              className={`flex-1 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-all duration-200 hover:scale-105 text-xs sm:text-sm font-medium shadow-sm hover:shadow-md flex items-center justify-center space-x-1 sm:space-x-2 bg-transparent ${
                                isDarkMode 
                                  ? 'text-blue-400 border border-blue-400 hover:bg-blue-400/10' 
                                  : 'text-blue-600 border border-blue-600 hover:bg-blue-600/10'
                              }`}
                              title="View Quality Details"
                            >
                              <EyeIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden sm:inline">View</span>
                            </button>
                            
                            <button
                              onClick={() => handleEdit(mainFabric)}
                              className={`flex-1 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-all duration-200 hover:scale-105 text-xs sm:text-sm font-medium shadow-sm hover:shadow-md flex items-center justify-center space-x-1 sm:space-x-2 bg-transparent ${
                                isDarkMode 
                                  ? 'text-emerald-400 border border-emerald-400 hover:bg-emerald-400/10' 
                                  : 'text-emerald-600 border border-emerald-600 hover:bg-emerald-600/10'
                              }`}
                              title="Edit Quality"
                            >
                              <PencilIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                            
                            <button
                              onClick={() => handleDeleteQualityGroup(mainFabric, fabrics)}
                              className={`flex-1 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-all duration-200 hover:scale-105 text-xs sm:text-sm font-medium shadow-sm hover:shadow-md flex items-center justify-center space-x-1 sm:space-x-2 bg-transparent ${
                                isDarkMode 
                                  ? 'text-red-400 border border-red-400 hover:bg-red-400/10' 
                                  : 'text-red-600 border border-red-600 hover:bg-red-600/10'
                              }`}
                              title={`Delete Quality Group (${fabrics.length} items)`}
                            >
                              <TrashIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden sm:inline">Delete</span>
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
              <table className="w-full">
                <thead className={`${
                  isDarkMode ? 'bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700' : 'bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200'
                }`}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      Quality Information
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      Images
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      Items
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      Weaver Information
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      Dimensions
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      Specifications
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      Technical Details
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      Pricing
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
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
                          isDarkMode ? 'bg-gray-700/30' : 'bg-gray-50'
                        } transition-all duration-200 border-b ${
                          isDarkMode ? 'border-gray-700' : 'border-gray-100'
                        }`}>
                          {/* Quality Information */}
                          <td className={`px-4 py-4 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-900'
                          }`}>
                            <div className="space-y-1">
                              <div className="text-sm">
                                <span className={`font-medium ${
                                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                }`}>Quality Code:</span>
                                <span className={`ml-1 font-bold ${
                                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                }`}>
                                  {mainFabric.qualityCode}
                                </span>
                              </div>
                              <div className="text-sm">
                                <span className={`font-medium ${
                                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                }`}>Quality Name:</span>
                                <span className="ml-1">
                                  {mainFabric.qualityName}
                                </span>
                              </div>
                              <div className="text-sm">
                                <span className={`font-medium ${
                                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                }`}>Created:</span>
                                <span className="ml-1">
                                  {new Date(mainFabric.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <div className="text-sm">
                                <span className={`font-medium ${
                                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                }`}>Total Items:</span>
                                <span className={`ml-1 font-bold ${
                                  isDarkMode ? 'text-green-400' : 'text-green-600'
                                }`}>
                                  {fabrics.length}
                                </span>
                              </div>
                            </div>
                          </td>
                          
                          {/* Images - Show only once per quality group */}
                          <td className="px-4 py-4">
                            {mainFabric.images && mainFabric.images.length > 0 ? (
                              <div className="flex items-center space-x-2">
                                   <div className="relative">
                                <img 
                                  src={mainFabric.images[0]} 
                                  alt="Fabric"
                                       className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg hover:scale-105"
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
                                     <div className={`hidden fallback-icon w-16 h-16 rounded-lg items-center justify-center ${
                                       isDarkMode ? 'bg-gray-600 border-2 border-gray-500' : 'bg-gray-100 border-2 border-gray-200'
                                     }`} style={{ display: 'none' }}>
                                       <PhotoIcon className={`h-8 w-8 ${
                                         isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                       }`} />
                                     </div>
                                   </div>
                                {mainFabric.images.length > 1 && (
                                     <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                    isDarkMode 
                                      ? 'bg-blue-600 text-white' 
                                      : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    +{mainFabric.images.length - 1}
                                  </span>
                                )}
                              </div>
                            ) : (
                                 <div className={`w-16 h-16 rounded-lg flex flex-col items-center justify-center border-2 ${
                                   isDarkMode 
                                     ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
                                     : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                 } transition-colors duration-200`}>
                                   <PhotoIcon className={`h-6 w-6 mb-1 ${
                                     isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                   }`} />
                                   <span className={`text-xs font-medium ${
                                     isDarkMode ? 'text-gray-500' : 'text-gray-400'
                                   }`}>
                                     No image
                                   </span>
                              </div>
                            )}
                          </td>
                          
                          {/* Items Column - Show Item 1, Item 2 labels */}
                          <td className={`px-4 py-4 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-900'
                          }`}>
                               <div>
                              {fabrics.map((fabric, index) => (
                                   <div key={fabric._id} className="py-3">
                                  <div className={`text-sm font-bold ${
                                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                  }`}>
                                    Item {index + 1}
                                  </div>
                                     {index < fabrics.length - 1 && (
                                       <div className={`mt-3 border-b ${
                                         isDarkMode ? 'border-gray-600/30' : 'border-gray-200/50'
                                       }`}></div>
                                     )}
                                </div>
                              ))}
                            </div>
                          </td>
                          
                          {/* Weaver Information - Show all weavers */}
                          <td className={`px-4 py-4 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-900'
                          }`}>
                               <div>
                              {fabrics.map((fabric, index) => (
                                   <div key={fabric._id} className="py-3">
                                     <div className="text-sm space-y-1">
                                    <div>
                                      <span className="font-medium">Weaver:</span>
                                      <span className="ml-1">{fabric.weaver}</span>
                                    </div>
                                    <div>
                                      <span className="font-medium">Quality:</span>
                                      <span className="ml-1">{fabric.weaverQualityName}</span>
                                    </div>
                                  </div>
                                     {index < fabrics.length - 1 && (
                                       <div className={`mt-3 border-b ${
                                         isDarkMode ? 'border-gray-600/30' : 'border-gray-200/50'
                                       }`}></div>
                                     )}
                                </div>
                              ))}
                            </div>
                          </td>
                          
                          {/* Dimensions - Show all dimensions */}
                          <td className={`px-4 py-4 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-900'
                          }`}>
                               <div>
                              {fabrics.map((fabric, index) => (
                                   <div key={fabric._id} className="py-3">
                                     <div className="text-sm space-y-1">
                                    <div>
                                      <span className="font-medium">Greigh:</span>
                                      <span className="ml-1">
                                        {fabric.greighWidth > 0 ? `${fabric.greighWidth}"` : '-'}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="font-medium">Finish:</span>
                                      <span className="ml-1">
                                        {fabric.finishWidth > 0 ? `${fabric.finishWidth}"` : '-'}
                                      </span>
                                    </div>
                                  </div>
                                     {index < fabrics.length - 1 && (
                                       <div className={`mt-3 border-b ${
                                         isDarkMode ? 'border-gray-600/30' : 'border-gray-200/50'
                                       }`}></div>
                                     )}
                                </div>
                              ))}
                            </div>
                          </td>
                          
                          {/* Specifications - Show all specifications */}
                          <td className={`px-4 py-4 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-900'
                          }`}>
                               <div>
                              {fabrics.map((fabric, index) => (
                                   <div key={fabric._id} className="py-3">
                                     <div className="text-sm space-y-1">
                                    <div>
                                      <span className="font-medium">Weight:</span>
                                      <span className="ml-1">
                                        {fabric.weight > 0 ? `${fabric.weight} KG` : '-'}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="font-medium">GSM:</span>
                                      <span className="ml-1">
                                        {fabric.gsm > 0 ? fabric.gsm : '-'}
                                      </span>
                                    </div>
                                  </div>
                                     {index < fabrics.length - 1 && (
                                       <div className={`mt-3 border-b ${
                                         isDarkMode ? 'border-gray-600/30' : 'border-gray-200/50'
                                       }`}></div>
                                     )}
                                </div>
                              ))}
                            </div>
                          </td>
                          
                          {/* Technical Details - Show all technical details */}
                          <td className={`px-4 py-4 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-900'
                          }`}>
                               <div>
                              {fabrics.map((fabric, index) => (
                                   <div key={fabric._id} className="py-3">
                                     <div className="text-sm space-y-1">
                                    <div>
                                      <span className="font-medium">Danier:</span>
                                      <span className="ml-1">
                                        {fabric.danier || '-'}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="font-medium">Reed:</span>
                                      <span className="ml-1">
                                        {fabric.reed > 0 ? fabric.reed : '-'}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="font-medium">Pick:</span>
                                      <span className="ml-1">
                                        {fabric.pick > 0 ? fabric.pick : '-'}
                                      </span>
                                    </div>
                                  </div>
                                     {index < fabrics.length - 1 && (
                                       <div className={`mt-3 border-b ${
                                         isDarkMode ? 'border-gray-600/30' : 'border-gray-200/50'
                                       }`}></div>
                                     )}
                                </div>
                              ))}
                            </div>
                          </td>
                          
                          {/* Pricing - Show all rates with delete buttons */}
                          <td className={`px-4 py-4 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-900'
                          }`}>
                               <div>
                              {fabrics.map((fabric, index) => (
                                   <div key={fabric._id} className="py-3">
                                  <div className="flex items-center justify-between">
                                    <div className={`text-lg font-bold ${
                                      isDarkMode ? 'text-green-400' : 'text-green-600'
                                    }`}>
                                      {fabric.greighRate > 0 ? `₹${fabric.greighRate}` : '-'}
                                    </div>
                                    <button
                                      onClick={() => handleDelete(fabric)}
                                      className={`p-1.5 rounded-md transition-all duration-200 hover:scale-110 ${
                                        isDarkMode 
                                          ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20' 
                                          : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                      }`}
                                      title={`Delete Item ${index + 1}`}
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                     {index < fabrics.length - 1 && (
                                       <div className={`mt-3 border-b ${
                                         isDarkMode ? 'border-gray-600/30' : 'border-gray-200/50'
                                       }`}></div>
                                     )}
                                </div>
                              ))}
                            </div>
                          </td>
                          
                                                         {/* Actions - Vertical button layout with subtle colors */}
                          <td className="px-4 py-4">
                               <div className="space-y-2">
                              <button
                                onClick={() => handleView(mainFabric)}
                                   className={`w-full px-4 py-2.5 rounded-lg transition-all duration-200 hover:scale-105 text-sm font-medium shadow-sm hover:shadow-md flex items-center justify-center space-x-2 bg-transparent ${
                                  isDarkMode 
                                       ? 'text-blue-400 border border-blue-400 hover:bg-blue-400/10' 
                                       : 'text-blue-600 border border-blue-600 hover:bg-blue-600/10'
                                }`}
                                                              title="View Details"
                              >
                              <EyeIcon className="h-4 w-4" />
                              <span>View</span>
                              </button>
                              
                              <button
                                onClick={() => handleEdit(mainFabric)}
                              className={`w-full px-4 py-2.5 rounded-lg transition-all duration-200 hover:scale-105 text-sm font-medium shadow-sm hover:shadow-md flex items-center justify-center space-x-2 bg-transparent ${
                                  isDarkMode 
                                  ? 'text-emerald-400 border border-emerald-400 hover:bg-emerald-400/10' 
                                  : 'text-emerald-600 border border-emerald-600 hover:bg-emerald-600/10'
                                }`}
                              title="Edit"
                              >
                              <PencilIcon className="h-4 w-4" />
                              <span>Edit</span>
                              </button>
                              
                              <button
                                onClick={() => handleDeleteQualityGroup(mainFabric, fabrics)}
                              className={`w-full px-4 py-2.5 rounded-lg transition-all duration-200 hover:scale-105 text-sm font-medium shadow-sm hover:shadow-md flex items-center justify-center space-x-2 bg-transparent ${
                                  isDarkMode 
                                  ? 'text-red-400 border border-red-400 hover:bg-red-400/10' 
                                  : 'text-red-600 border border-red-600 hover:bg-red-600/10'
                                }`}
                              title={`Delete Quality Group (${fabrics.length} items)`}
                              >
                              <TrashIcon className="h-4 w-4" />
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
            <div className={`px-4 py-4 border-t flex justify-center items-center ${
              isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
            }`}>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === 1
                      ? isDarkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                Previous
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
                      onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
        </div>
      )}
      </div>

      {/* Modals */}
      {showDetails && selectedFabric && (
        <FabricDetails
          fabric={selectedFabric}
          onClose={() => setShowDetails(false)}
          onEdit={() => {
            setShowDetails(false);
            handleEdit(selectedFabric);
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
                src={showImageModal.fabric.images?.[selectedImageIndex]} 
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
              <div className={`p-4 border-t ${
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