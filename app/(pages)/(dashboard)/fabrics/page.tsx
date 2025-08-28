'use client';

import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentTextIcon,
  CubeIcon,
  ArrowPathIcon
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
  const [bulkDeleteGroup, setBulkDeleteGroup] = useState<{ qualityCode: string; items: Fabric[] } | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [filters, setFilters] = useState<FabricFilters>({
    qualityName: '',
    weaver: '',
    weaverQualityName: '',
    search: ''
  });
  const [qualityNames, setQualityNames] = useState<string[]>([]);
  const [weavers, setWeavers] = useState<string[]>([]);
  const [weaverQualityNames, setWeaverQualityNames] = useState<string[]>([]);
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  // Fetch fabrics
  const fetchFabrics = async (forceRefresh = false) => {
    setLoading(true);
    setFiltersLoading(true);
    
    // Add a small delay to show skeleton for better UX
    await new Promise(resolve => setTimeout(resolve, 200));
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
      
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.qualityName) params.append('qualityName', filters.qualityName);
      if (filters.weaver) params.append('weaver', filters.weaver);
      if (filters.weaverQualityName) params.append('weaverQualityName', filters.weaverQualityName);
      if (forceRefresh) params.append('refresh', Date.now().toString());

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
    // For now, just show details. Edit functionality can be added later
    setSelectedFabric(fabric);
    setShowDetails(true);
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
        fetchFabrics();
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

  const handleBulkDelete = (group: { qualityCode: string; items: Fabric[] }) => {
    setBulkDeleteGroup(group);
    setShowBulkDeleteConfirmation(true);
  };

  const confirmBulkDelete = async () => {
    if (!bulkDeleteGroup) return;
    
    setIsBulkDeleting(true);
    try {
      const response = await fetch(`/api/fabrics?qualityCode=${encodeURIComponent(bulkDeleteGroup.qualityCode)}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        fetchFabrics();
        setShowBulkDeleteConfirmation(false);
        setBulkDeleteGroup(null);
      } else {
        console.error('Failed to delete fabrics:', data.message);
      }
    } catch (error) {
      console.error('Error deleting fabrics:', error);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const cancelBulkDelete = () => {
    setShowBulkDeleteConfirmation(false);
    setBulkDeleteGroup(null);
    setIsBulkDeleting(false);
  };



  // Group fabrics by Quality Code only
  const groupedFabrics = fabrics.reduce((groups, fabric) => {
    const key = fabric.qualityCode;
    if (!groups[key]) {
      groups[key] = {
        qualityCode: fabric.qualityCode,
        items: []
      };
    }
    groups[key].items.push(fabric);
    return groups;
  }, {} as Record<string, { qualityCode: string; items: Fabric[] }>);

  const clearFilters = () => {
    setFilters({
      qualityName: '',
      weaver: '',
      weaverQualityName: '',
      search: ''
    });
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
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${
              isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
            }`}>
              <CubeIcon className={`h-8 w-8 ${
                isDarkMode ? 'text-blue-400' : 'text-blue-600'
              }`} />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Fabric Management
              </h1>
              <p className={`text-lg ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Manage fabric inventory and specifications
              </p>
            </div>
          </div>
                     <div className="flex items-center space-x-3">
             <button
               onClick={() => fetchFabrics(true)}
               disabled={loading}
               className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 ${
                 loading ? 'opacity-50 cursor-not-allowed' : ''
               } ${
                 isDarkMode 
                   ? 'bg-gray-600 hover:bg-gray-700 text-white shadow-lg' 
                   : 'bg-gray-500 hover:bg-gray-600 text-white shadow-lg'
               }`}
               title="Refresh Data"
             >
               <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
             </button>
             <button
               onClick={handleCreate}
               className={`px-6 py-3 rounded-lg text-white font-medium transition-all duration-200 hover:scale-105 ${
                 isDarkMode 
                   ? 'bg-blue-600 hover:bg-blue-700 shadow-lg' 
                   : 'bg-blue-500 hover:bg-blue-600 shadow-lg'
               }`}
             >
               <PlusIcon className="h-5 w-5 inline mr-2" />
               Add Fabric
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

       {/* Filters */}
      <div className={`mb-6 p-6 rounded-xl border ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } shadow-lg`}>
        <div className="flex items-center justify-between mb-4">
          {filtersLoading ? (
            <>
              <div className="flex items-center space-x-2">
                <div className={`w-5 h-5 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded animate-pulse`}></div>
                <div className={`w-20 h-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded animate-pulse`}></div>
              </div>
              <div className={`w-20 h-8 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg animate-pulse`}></div>
            </>
          ) : (
            <>
          <div className="flex items-center space-x-2">
            <FunnelIcon className={`h-5 w-5 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`} />
            <h3 className={`text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Filters
            </h3>
          </div>
          <button
            onClick={clearFilters}
            className={`px-3 py-1 text-sm rounded-lg transition-all duration-200 ${
              isDarkMode 
                ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            Clear All
          </button>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            {filtersLoading ? (
              <div className={`w-full h-10 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg animate-pulse`}></div>
            ) : (
              <>
            <MagnifyingGlassIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder="Search fabrics..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-all duration-200 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
              </>
            )}
          </div>

          {/* Quality Name Filter */}
          {filtersLoading ? (
            <div className={`w-full h-10 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg animate-pulse`}></div>
          ) : (
          <select
            value={filters.qualityName}
            onChange={(e) => setFilters({ ...filters, qualityName: e.target.value, weaver: '', weaverQualityName: '' })}
            className={`w-full px-4 py-2 rounded-lg border transition-all duration-200 ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">All Quality Names</option>
            {qualityNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          )}

          {/* Weaver Filter */}
          {filtersLoading ? (
            <div className={`w-full h-10 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg animate-pulse`}></div>
          ) : (
          <select
            value={filters.weaver}
            onChange={(e) => setFilters({ ...filters, weaver: e.target.value, weaverQualityName: '' })}
            className={`w-full px-4 py-2 rounded-lg border transition-all duration-200 ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            disabled={!filters.qualityName}
          >
            <option value="">All Weavers</option>
            {weavers.map((weaver) => (
              <option key={weaver} value={weaver}>{weaver}</option>
            ))}
          </select>
          )}

          {/* Weaver Quality Name Filter */}
          {filtersLoading ? (
            <div className={`w-full h-10 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg animate-pulse`}></div>
          ) : (
          <select
            value={filters.weaverQualityName}
            onChange={(e) => setFilters({ ...filters, weaverQualityName: e.target.value })}
            className={`w-full px-4 py-2 rounded-lg border transition-all duration-200 ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            disabled={!filters.weaver}
          >
            <option value="">All Weaver Qualities</option>
            {weaverQualityNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          )}

          {/* Apply Filters Button */}
          {filtersLoading ? (
            <div className={`w-full h-10 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg animate-pulse`}></div>
          ) : (
          <button
            onClick={() => fetchFabrics(false)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              isDarkMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            Apply Filters
          </button>
          )}
        </div>
      </div>

      {/* Fabrics Table */}
      <div className={`rounded-xl border overflow-hidden ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } shadow-lg`}>
        {loading ? (
          <div className="p-8">
            {/* Header Skeleton */}
            <div className="mb-6">
              <div className={`w-48 h-8 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg animate-pulse mb-2`}></div>
              <div className={`w-64 h-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded animate-pulse`}></div>
            </div>
            
            {/* Table Skeleton */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${
                  isDarkMode ? 'bg-gray-900 border-b border-gray-700' : 'bg-gray-50 border-b border-gray-200'
                }`}>
                  <tr>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
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
                      {[1, 2, 3, 4, 5, 6].map((cell) => (
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
        ) : fabrics.length === 0 ? (
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
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${
                isDarkMode ? 'bg-gray-900 border-b border-gray-700' : 'bg-gray-50 border-b border-gray-200'
              }`}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Quality Code
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Quality Name
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Weaver
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Weaver Quality
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Specifications
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${
                isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
              }`}>
                                  {Object.values(groupedFabrics).map((group, groupIndex) => (
                    <React.Fragment key={group.qualityCode}>
                                         {/* Group Header Row */}
                     <tr className={`${
                       isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100'
                     } border-b-2 border-gray-300`}>
                       <td className="px-6 py-4" colSpan={6}>
                         <div className="flex items-center justify-between">
                           <div className="flex items-center space-x-4">
                             <span className={`font-mono font-bold text-lg ${
                               isDarkMode ? 'text-blue-400' : 'text-blue-600'
                             }`}>
                               Quality Code: {group.qualityCode}
                             </span>
                             <span className={`text-sm ${
                               isDarkMode ? 'text-gray-400' : 'text-gray-600'
                             }`}>
                               ({group.items.length} item{group.items.length > 1 ? 's' : ''})
                             </span>
                           </div>
                           {group.items.length > 1 && (
                             <button
                               onClick={() => handleBulkDelete(group)}
                               className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-1 ${
                                 isDarkMode 
                                   ? 'bg-red-600 hover:bg-red-700 text-white' 
                                   : 'bg-red-500 hover:bg-red-600 text-white'
                               }`}
                               title={`Delete all ${group.items.length} fabrics with quality code ${group.qualityCode}`}
                             >
                               <TrashIcon className="h-3 w-3" />
                               <span>Delete All</span>
                             </button>
                           )}
                         </div>
                       </td>
                     </tr>
                    
                    {/* Individual Items */}
                    {group.items.map((fabric, itemIndex) => (
                      <tr key={fabric._id} className={`hover:${
                        isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                      } transition-colors duration-200 ${
                        isDarkMode ? 'bg-gray-800/30' : 'bg-gray-50/50'
                      }`}>
                        <td className="px-6 py-4 pl-12">
                          <span className={`text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Item {itemIndex + 1}
                          </span>
                        </td>
                                                 <td className="px-6 py-4">
                           <span className={`${
                             isDarkMode ? 'text-gray-300' : 'text-gray-700'
                           }`}>
                             {fabric.qualityName}
                           </span>
                         </td>
                        <td className="px-6 py-4">
                          <span className={`${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {fabric.weaver}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {fabric.weaverQualityName}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm space-y-1">
                            <div className={`${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              Width: {fabric.finishWidth}" | Weight: {fabric.weight} KG
                            </div>
                            <div className={`${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              GSM: {fabric.gsm} | Rate: ₹{fabric.greighRate}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleView(fabric)}
                              className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                                isDarkMode 
                                  ? 'text-blue-400 hover:bg-blue-500/20' 
                                  : 'text-blue-600 hover:bg-blue-100'
                              }`}
                              title="View Details"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(fabric)}
                              className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                                isDarkMode 
                                  ? 'text-green-400 hover:bg-green-500/20' 
                                  : 'text-green-600 hover:bg-green-100'
                              }`}
                              title="Edit Fabric"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(fabric)}
                              className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                                isDarkMode 
                                  ? 'text-red-400 hover:bg-red-500/20' 
                                  : 'text-red-600 hover:bg-red-100'
                              }`}
                              title="Delete Fabric"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      

      {/* Fabric Details Modal */}
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

      {/* Delete Confirmation Modal */}
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

             {/* Bulk Delete Confirmation Modal */}
       {showBulkDeleteConfirmation && bulkDeleteGroup && (
         <BulkDeleteConfirmation
           fabrics={bulkDeleteGroup.items}
           qualityCode={bulkDeleteGroup.qualityCode}
           onConfirm={confirmBulkDelete}
           onCancel={cancelBulkDelete}
           isDeleting={isBulkDeleting}
         />
       )}
    </div>
  );
}
