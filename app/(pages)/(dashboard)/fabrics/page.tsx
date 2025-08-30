'use client';

import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useDarkMode } from '../hooks/useDarkMode';
import { Fabric } from '@/types/fabric';

export default function FabricsPage() {
  const { isDarkMode } = useDarkMode();
  const router = useRouter();
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFabric, setSelectedFabric] = useState<Fabric | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fetch fabrics
  const fetchFabrics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      
      const response = await fetch(`/api/fabrics?${params}&limit=50`);
      const data = await response.json();
      
      if (data.success) {
        setFabrics(data.data);
      }
    } catch (error) {
      console.error('Error fetching fabrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFabrics();
  }, [search]);

  // Check for refresh parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refresh = urlParams.get('refresh');
    if (refresh) {
      fetchFabrics();
      // Clean up URL
      window.history.replaceState({}, '', '/fabrics');
    }
  }, []);

  const handleImageClick = (fabric: Fabric, imageIndex: number = 0) => {
    setSelectedFabric(fabric);
    setCurrentImageIndex(imageIndex);
    setShowImageModal(true);
  };

  const nextImage = () => {
    if (selectedFabric && selectedFabric.images) {
      setCurrentImageIndex((prev) => 
        prev === selectedFabric.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (selectedFabric && selectedFabric.images) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? selectedFabric.images.length - 1 : prev - 1
      );
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold">Fabrics</h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Manage your fabric inventory
              </p>
            </div>
            <button
              onClick={() => router.push('/fabrics/create')}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-2 shadow-lg ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
              }`}
            >
              <PlusIcon className="h-5 w-5" />
              <span>Add Fabric</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <input
                type="text"
                placeholder="Search fabrics by quality code, name, or weaver..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-12 pr-4 py-4 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 shadow-sm'
                }`}
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                className={`px-4 py-4 rounded-xl border transition-all duration-200 hover:scale-105 ${
                  isDarkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FunnelIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className={`p-6 rounded-xl border transition-all duration-200 hover:scale-105 ${
            isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Fabrics
                </p>
                <p className="text-3xl font-bold text-blue-600">{fabrics.length}</p>
              </div>
              <div className={`p-3 rounded-full ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                <PhotoIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className={`p-6 rounded-xl border transition-all duration-200 hover:scale-105 ${
            isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  With Images
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {fabrics.filter(f => f.images && f.images.length > 0).length}
                </p>
              </div>
              <div className={`p-3 rounded-full ${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                <PhotoIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className={`p-6 rounded-xl border transition-all duration-200 hover:scale-105 ${
            isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Unique Weavers
                </p>
                <p className="text-3xl font-bold text-purple-600">
                  {new Set(fabrics.map(f => f.weaver)).size}
                </p>
              </div>
              <div className={`p-3 rounded-full ${isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
                <FunnelIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className={`p-6 rounded-xl border transition-all duration-200 hover:scale-105 ${
            isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Avg Rate
                </p>
                <p className="text-3xl font-bold text-orange-600">
                  ₹{fabrics.length > 0 ? Math.round(fabrics.reduce((sum, f) => sum + f.greighRate, 0) / fabrics.length) : 0}
                </p>
              </div>
              <div className={`p-3 rounded-full ${isDarkMode ? 'bg-orange-900/30' : 'bg-orange-100'}`}>
                <span className="text-2xl">₹</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fabrics Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
            <p className={`mt-4 text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading fabrics...</p>
          </div>
        ) : fabrics.length === 0 ? (
          <div className="text-center py-12">
            <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <PhotoIcon className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              No fabrics found
            </h3>
            <p className={`text-lg mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {search ? 'Try adjusting your search terms' : 'Get started by adding your first fabric'}
            </p>
            <button
              onClick={() => router.push('/fabrics/create')}
              className={`px-8 py-4 rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-lg ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
              }`}
            >
              <PlusIcon className="h-5 w-5 inline mr-2" />
              Add Your First Fabric
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {fabrics.map((fabric, index) => (
              <div 
                key={fabric._id || index}
                className={`group relative rounded-xl border transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                  isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white shadow-sm'
                }`}
              >
                {/* Image Section */}
                <div className="relative h-48 rounded-t-xl overflow-hidden">
                  {fabric.images && fabric.images.length > 0 ? (
                    <div className="relative h-full">
                      <img
                        src={fabric.images[0]}
                        alt={fabric.qualityName}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        onClick={() => handleImageClick(fabric, 0)}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                        <button
                          onClick={() => handleImageClick(fabric, 0)}
                          className="opacity-0 group-hover:opacity-100 transition-all duration-300 p-3 rounded-full bg-white bg-opacity-90 hover:bg-opacity-100"
                        >
                          <EyeIcon className="h-6 w-6 text-gray-700" />
                        </button>
                      </div>
                      {fabric.images.length > 1 && (
                        <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs">
                          +{fabric.images.length - 1}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={`h-full flex items-center justify-center ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <div className="text-center">
                        <PhotoIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-400">No image</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1 truncate">{fabric.qualityName}</h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                        {fabric.qualityCode}
                      </p>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        className={`p-2 rounded-lg transition-colors ${
                          isDarkMode 
                            ? 'text-gray-400 hover:bg-gray-700 hover:text-blue-400' 
                            : 'text-gray-500 hover:bg-gray-100 hover:text-blue-600'
                        }`}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        className={`p-2 rounded-lg transition-colors ${
                          isDarkMode 
                            ? 'text-gray-400 hover:bg-gray-700 hover:text-red-400' 
                            : 'text-gray-500 hover:bg-gray-100 hover:text-red-600'
                        }`}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Weaver:</span>
                      <span className="text-sm font-medium truncate ml-2">{fabric.weaver}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Quality:</span>
                      <span className="text-sm font-medium truncate ml-2">{fabric.weaverQualityName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Rate:</span>
                      <span className="text-sm font-bold text-green-600">₹{fabric.greighRate}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Width:</span>
                        <span className="ml-1 font-medium">{fabric.finishWidth}"</span>
                      </div>
                      <div>
                        <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>GSM:</span>
                        <span className="ml-1 font-medium">{fabric.gsm}</span>
                      </div>
                      <div>
                        <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Weight:</span>
                        <span className="ml-1 font-medium">{fabric.weight}kg</span>
                      </div>
                      <div>
                        <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Reed:</span>
                        <span className="ml-1 font-medium">{fabric.reed}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {showImageModal && selectedFabric && selectedFabric.images && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-xl overflow-hidden">
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => setShowImageModal(false)}
                className="p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-75 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="relative">
              <img
                src={selectedFabric.images[currentImageIndex]}
                alt={`${selectedFabric.qualityName} - Image ${currentImageIndex + 1}`}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              
              {selectedFabric.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-75 transition-colors"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-75 transition-colors"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>
            
            <div className="p-6 bg-gray-50">
              <h3 className="text-xl font-semibold mb-2">{selectedFabric.qualityName}</h3>
              <p className="text-gray-600 mb-2">{selectedFabric.qualityCode}</p>
              <p className="text-sm text-gray-500">
                Image {currentImageIndex + 1} of {selectedFabric.images.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
