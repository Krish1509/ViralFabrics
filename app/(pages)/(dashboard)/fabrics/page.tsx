'use client';

import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentTextIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import { useDarkMode } from '../hooks/useDarkMode';
import { Fabric, FabricFilters } from '@/types/fabric';
import FabricForm from './components/FabricForm';
import FabricDetails from './components/FabricDetails';
import DeleteConfirmation from './components/DeleteConfirmation';

export default function FabricsPage() {
  const { isDarkMode, mounted } = useDarkMode();
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedFabric, setSelectedFabric] = useState<Fabric | null>(null);
  const [deletingFabric, setDeletingFabric] = useState<Fabric | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDependencies, setDeleteDependencies] = useState<string[]>([]);
  const [isLoadingDependencies, setIsLoadingDependencies] = useState(false);
  const [filters, setFilters] = useState<FabricFilters>({
    qualityName: '',
    weaver: '',
    weaverQualityName: '',
    search: ''
  });
  const [qualityNames, setQualityNames] = useState<string[]>([]);
  const [weavers, setWeavers] = useState<string[]>([]);
  const [weaverQualityNames, setWeaverQualityNames] = useState<string[]>([]);

  // Fetch fabrics
  const fetchFabrics = async () => {
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
      
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.qualityName) params.append('qualityName', filters.qualityName);
      if (filters.weaver) params.append('weaver', filters.weaver);
      if (filters.weaverQualityName) params.append('weaverQualityName', filters.weaverQualityName);

      const response = await fetch(`/api/fabrics?${params}&limit=50`, { // Limit for faster loading
        headers: {
          'Cache-Control': 'max-age=30' // Cache for 30 seconds
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
    fetchFabrics();
    fetchQualityNames();
  }, []);

  useEffect(() => {
    fetchWeavers();
  }, [filters.qualityName]);

  useEffect(() => {
    fetchWeaverQualityNames();
  }, [filters.weaver]);

  const handleCreate = () => {
    setSelectedFabric(null);
    setShowForm(true);
  };

  const handleEdit = (fabric: Fabric) => {
    setSelectedFabric(fabric);
    setShowForm(true);
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

  const handleFormSuccess = () => {
    setShowForm(false);
    fetchFabrics();
  };

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

      {/* Filters */}
      <div className={`mb-6 p-6 rounded-xl border ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } shadow-lg`}>
        <div className="flex items-center justify-between mb-4">
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
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
          </div>

          {/* Quality Name Filter */}
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

          {/* Weaver Filter */}
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

          {/* Weaver Quality Name Filter */}
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

          {/* Apply Filters Button */}
          <button
            onClick={fetchFabrics}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              isDarkMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Fabrics Table */}
      <div className={`rounded-xl border overflow-hidden ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } shadow-lg`}>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className={`mt-4 text-lg ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Loading fabrics...
            </p>
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
                {fabrics.map((fabric) => (
                  <tr key={fabric._id} className={`hover:${
                    isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                  } transition-colors duration-200`}>
                    <td className="px-6 py-4">
                      <span className={`font-mono font-semibold ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      }`}>
                        {fabric.qualityCode}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
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
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fabric Form Modal */}
      {showForm && (
        <FabricForm
          fabric={selectedFabric}
          onClose={() => setShowForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}

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
    </div>
  );
}
