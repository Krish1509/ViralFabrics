'use client';

import { 
  XMarkIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BeakerIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon as ClockIconSolid,
  TruckIcon,
  CogIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { Order, Mill, Quality } from '@/types';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MillInputForm from '../components/MillInputForm';

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

export default function OrderDetailsPage() {
  const { isDarkMode, mounted } = useDarkMode();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderMongoId = searchParams?.get('id');
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [millInputs, setMillInputs] = useState<any[]>([]);
  const [millOutputs, setMillOutputs] = useState<any[]>([]);
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [processDataByQuality, setProcessDataByQuality] = useState<{[key: string]: string[]}>({});
  const [showMillInputModal, setShowMillInputModal] = useState(false);
  const [isEditingMillInput, setIsEditingMillInput] = useState(false);
  const [mills, setMills] = useState<Mill[]>([]);
  const [qualities, setQualities] = useState<Quality[]>([]);
  const [loadingSections, setLoadingSections] = useState({
    millInputs: true,
    millOutputs: true,
    dispatches: true,
    mills: true,
    qualities: true
  });

  // Ultra-fast progressive loading - show data as it arrives
  useEffect(() => {
    if (orderMongoId) {
      const fetchAllOrderData = async () => {
        const token = localStorage.getItem('token');
        
        // Fetch critical order data first for instant display
        try {
          const orderResponse = await fetch(`/api/orders/${orderMongoId}`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            cache: 'no-cache', // Ensure fresh data
            method: 'GET'
          });
          
          if (!orderResponse.ok) {
            setLoading(false);
            return;
          }
          
          const orderData = await orderResponse.json();
          
          if (orderData.success) {
            setOrder(orderData.data);
            // Set loading to false after order is set
            setLoading(false);
          } else {
            // If order not found, keep loading true (show loading indefinitely)
            // Don't set loading to false - just keep showing loading
          }
        } catch (error) {
          console.error('Error fetching order:', error);
          // Keep loading true on error - just show loading indefinitely
        }

        // Fetch all other data in parallel in background with progress tracking
        const backgroundPromises = [
          // Fetch mills and qualities with optimized headers
          fetch('/api/mills', { 
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'default' // Allow caching for static data
          })
            .then(res => res.json())
            .then(data => {
              if (data.success) setMills(data.data || []);
              setLoadingSections(prev => ({ ...prev, mills: false }));
            }),
          
          fetch('/api/qualities', { 
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'default' // Allow caching for static data
          })
            .then(res => res.json())
            .then(data => {
              if (data.success) setQualities(data.data || []);
              setLoadingSections(prev => ({ ...prev, qualities: false }));
            }),
          
          // Fetch order-specific data if order is available
          order && Promise.all([
            fetch(`/api/mill-inputs?orderId=${order.orderId}`, { 
              headers: { 'Authorization': `Bearer ${token}` },
              cache: 'no-cache' // Fresh data for order-specific info
            })
              .then(res => res.json())
              .then(data => {
                if (data.success) {
                  const millInputsData = data.data?.millInputs || [];
                  setMillInputs(millInputsData);
                  // Process mill input data by quality
                  const processedData = processMillInputDataByQuality(millInputsData);
                  setProcessDataByQuality(processedData);
                }
                setLoadingSections(prev => ({ ...prev, millInputs: false }));
              }),
            
            fetch(`/api/mill-outputs?orderId=${order.orderId}`, { 
              headers: { 'Authorization': `Bearer ${token}` },
              cache: 'no-cache' // Fresh data for order-specific info
            })
              .then(res => res.json())
              .then(data => {
                if (data.success) setMillOutputs(data.data?.millOutputs || []);
                setLoadingSections(prev => ({ ...prev, millOutputs: false }));
              }),
            
            fetch(`/api/dispatch?orderId=${order.orderId}`, { 
              headers: { 'Authorization': `Bearer ${token}` },
              cache: 'no-cache' // Fresh data for order-specific info
            })
              .then(res => res.json())
              .then(data => {
                if (data.success) setDispatches(data.data?.dispatches || []);
                setLoadingSections(prev => ({ ...prev, dispatches: false }));
              })
          ])
        ];

        // Process background data as it loads
        Promise.allSettled(backgroundPromises).catch(error => {
          console.error('Error in background data loading:', error);
        });
      };
      
      fetchAllOrderData();
    }
  }, [orderMongoId, order?.orderId, loading]);


  const party = typeof order?.party === 'string' ? null : order?.party;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Function to process mill input data and group by order and quality
  const processMillInputDataByQuality = (millInputs: any[]) => {
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
  };

  // Function to get process data for a specific quality and order
  const getProcessDataForQuality = (quality: any, orderId?: string) => {
    if (!quality || !orderId) return [];
    
    const qualityId = typeof quality === 'object' ? quality._id : quality;
    const qualityName = typeof quality === 'object' ? quality.name : quality;
    // Include orderId in the key to make it order-specific
    const key = `${orderId}_${qualityId}_${qualityName}`;
    
    return processDataByQuality[key] || [];
  };

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Image preview functions
  const handleImageClick = (images: string[], startIndex: number = 0) => {
    setPreviewImages(images);
    setCurrentImageIndex(startIndex);
    setShowImagePreview(true);
  };


  const navigateImage = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentImageIndex(prev => prev > 0 ? prev - 1 : previewImages.length - 1);
    } else {
      setCurrentImageIndex(prev => prev < previewImages.length - 1 ? prev + 1 : 0);
    }
  };

  // Mill Input handlers
  const handleAddMillInput = () => {
    setIsEditingMillInput(false);
    setShowMillInputModal(true);
  };

  const handleEditMillInput = () => {
    setIsEditingMillInput(true);
    setShowMillInputModal(true);
  };

  const handleMillInputSuccess = () => {
    // Refresh mill inputs data using Promise.all for better performance
    if (orderMongoId && order) {
      const refreshMillInputs = async () => {
        try {
          const token = localStorage.getItem('token');
          
          // Fetch mill inputs and mills in parallel
          const [millInputsResponse, millsResponse] = await Promise.all([
            fetch(`/api/mill-inputs?orderId=${order.orderId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch('/api/mills', {
              headers: { 'Authorization': `Bearer ${token}` }
            })
          ]);

          const [millInputsData, millsData] = await Promise.all([
            millInputsResponse.json(),
            millsResponse.json()
          ]);

          if (millInputsData.success) {
            const millInputsArray = millInputsData.data?.millInputs || [];
            setMillInputs(millInputsArray);
            // Process mill input data by quality
            const processedData = processMillInputDataByQuality(millInputsArray);
            setProcessDataByQuality(processedData);
          }
          if (millsData.success) {
            setMills(millsData.data || []);
          }
        } catch (error) {
          console.error('Error refreshing mill inputs:', error);
        }
      };
      refreshMillInputs();
    }
    setShowMillInputModal(false);
    setIsEditingMillInput(false);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showImagePreview) {
        if (e.key === 'ArrowLeft') {
          navigateImage('prev');
        } else if (e.key === 'ArrowRight') {
          navigateImage('next');
        } else if (e.key === 'Escape') {
        setShowImagePreview(false);
        }
      }
    };

      document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showImagePreview]);

  // Handle touch/swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStartX(touch.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchEndX(touch.clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      navigateImage('next');
    } else if (isRightSwipe) {
      navigateImage('prev');
    }
  };

  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  // Loading logic moved below to prevent "Order not found" flash

  // If still loading, show loading skeleton
  if (loading) {
    return (
      <div className={`min-h-screen ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800' 
          : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'
      }`}>
        {/* Simple Header */}
        <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-600 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="w-32 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Simple Content */}
        <div className="p-4 space-y-4">
          {/* Top Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                <div className="w-12 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
              <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3"></div>
              <div className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
              <div className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="bg-white dark:bg-slate-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
              <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3"></div>
              <div className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
              <div className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Bottom Sections */}
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3"></div>
                <div className="w-full h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // If no order and not loading, just show loading (no error message)
  if (!loading && !order) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800' 
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'
    }`}>
      <div className={`w-full ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800' 
          : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'
      }`}>
        {/* Clean Header */}
        <div className={`border-b ${isDarkMode ? 'border-gray-600 bg-slate-800' : 'border-gray-200 bg-white'}`}>
           {/* Success Message */}
           {successMessage && (
            <div className={`px-2 py-2 text-center ${isDarkMode ? 'bg-green-600 text-white' : 'bg-green-500 text-white'}`}>
              <div className="flex items-center justify-center space-x-2">
                <CheckCircleIcon className="h-4 w-4" />
                <span className="text-sm font-medium">{successMessage}</span>
               </div>
             </div>
           )}
          
          <div className="px-1 py-4 ">
          <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/orders')}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                  <div className="flex items-center space-x-4">
                    <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Order #{order?.orderId}
                    </h1>
                    <span className={`inline-flex items-center px-4 py-2 text-sm font-bold rounded-full ${
                     order?.status === 'delivered'
                        ? isDarkMode ? 'bg-green-900/30 text-green-400 border border-green-500/30' : 'bg-green-100 text-green-800 border border-green-200'
                        : isDarkMode ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30' : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    }`}>
                      {order?.status === 'delivered' ? <CheckCircleIcon className="h-4 w-4 mr-2" /> : <ClockIcon className="h-4 w-4 mr-2" />}
                      {order?.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending'}
                   </span>
                  </div>
              </div>
            </div>
              
               <div className="flex items-center space-x-2">
                <button
                  onClick={() => router.push('/orders')}
                   className={`p-2 rounded-lg transition-colors ${
                     isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'
                   }`}
                 >
                   <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
             </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={`px-2 py-3 min-h-screen ${
          isDarkMode 
            ? 'bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800' 
            : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'
        }`}>
          {/* Header Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
            {/* Order Information */}
            <div className={`p-6 rounded-xl shadow-lg border-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:shadow-xl hover:border-gray-500' : 'bg-white border-gray-200 hover:shadow-xl hover:border-gray-300'} transition-all duration-300`}>
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
                  <DocumentTextIcon className={`h-8 w-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Order Information
                </h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className={`text-base font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Order ID</span>
                  <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{order?.orderId}</p>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className={`text-base font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Order Type</span>
                  <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{order?.orderType || 'Not selected'}</p>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className={`text-base font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>PO Number</span>
                  <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{order?.poNumber || 'Not selected'}</p>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className={`text-base font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Style No</span>
                  <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{order?.styleNo || 'Not selected'}</p>
                </div>
              </div>
                 </div>

            {/* Party Information */}
            <div className={`p-6 rounded-xl shadow-lg border-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:shadow-xl hover:border-gray-500' : 'bg-white border-gray-200 hover:shadow-xl hover:border-gray-300'} transition-all duration-300`}>
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-green-600/20' : 'bg-green-100'}`}>
                  <UserIcon className={`h-8 w-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                </div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Party Information
                </h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className={`text-base font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Name</span>
                  <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {party?.name || 'Not available'}
                  </p>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className={`text-base font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Contact</span>
                  <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {party?.contactName || 'Not available'}
                  </p>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className={`text-base font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Phone</span>
                  <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {party?.contactPhone || 'Not available'}
                  </p>
                </div>
              </div>
            </div>

            {/* Important Dates */}
            <div className={`p-6 rounded-xl shadow-lg border-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:shadow-xl hover:border-gray-500' : 'bg-white border-gray-200 hover:shadow-xl hover:border-gray-300'} transition-all duration-300`}>
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-purple-600/20' : 'bg-purple-100'}`}>
                  <CalendarIcon className={`h-8 w-8 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Important Dates
                </h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className={`text-base font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Arrival Date</span>
                  <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {order?.arrivalDate ? formatDate(order.arrivalDate) : 'Not selected'}
                  </p>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className={`text-base font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>PO Date</span>
                  <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {order?.poDate ? formatDate(order.poDate) : 'Not selected'}
                  </p>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className={`text-base font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Delivery Date</span>
                  <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {order?.deliveryDate ? formatDate(order.deliveryDate) : 'Not selected'}
                  </p>
                </div>
              </div>
            </div>

            {/* System Timestamps */}
            <div className={`p-6 rounded-xl shadow-lg border-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:shadow-xl hover:border-gray-500' : 'bg-white border-gray-200 hover:shadow-xl hover:border-gray-300'} transition-all duration-300`}>
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-orange-600/20' : 'bg-orange-100'}`}>
                  <ClockIconSolid className={`h-8 w-8 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                </div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  System Timestamps
                </h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className={`text-base font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Created</span>
                  <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {order?.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Not available'}
                  </p>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className={`text-base font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Updated</span>
                  <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {order?.updatedAt ? new Date(order.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Not available'}
                  </p>
                </div>
              </div>
            </div>
               </div>

          {/* Order Items and Lab Data Section */}
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Order Items Cards */}
            {order?.items && order.items.length > 0 && (
              <div className={`p-6 rounded-xl shadow-lg border-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:shadow-xl hover:border-gray-500' : 'bg-white border-gray-200 hover:shadow-xl hover:border-gray-300'} transition-all duration-300`}>
                <div className="flex items-center space-x-3 mb-6">
                  <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-indigo-600/20' : 'bg-indigo-100'}`}>
                    <DocumentTextIcon className={`h-8 w-8 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  </div>
                  <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Order Items ({order?.items?.length || 0})
                  </h2>
                </div>
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={index} className={`p-6 rounded-xl border-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:shadow-xl hover:border-gray-500' : 'bg-white border-gray-200 hover:bg-gray-50 hover:shadow-lg hover:border-gray-300'} transition-all duration-300 shadow-md`}>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Item {index + 1}
                          </h3>
                          <span className={`px-4 py-2 rounded-full text-lg font-bold ${
                            isDarkMode ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-blue-100 text-blue-700 border border-blue-200'
                          }`}>
                            #{index + 1}
                          </span>
                        </div>
                          
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <label className={`text-base font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Quality
                            </label>
                            <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {typeof item.quality === 'string' ? item.quality : item.quality?.name || '--'}
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <label className={`text-base font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Quantity
                            </label>
                            <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {item.quantity || '--'}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              Process
                            </label>
                            <div className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {(() => {
                                const qualityName = typeof item.quality === 'string' ? item.quality : item.quality?.name || 'N/A';
                                
                                // Debug logging
                                console.log('🔍 Order Details - Process data debug:', {
                                  qualityName,
                                  processData: (item as any).processData,
                                  millInputs: millInputs.length,
                                  orderId: order?.orderId
                                });
                                
                                // Use process data from API if available
                                const processFromAPI = getHighestPriorityProcess((item as any).processData, qualityName);
                                console.log('🔍 Order Details - Process from API:', processFromAPI);
                                
                                // TEST: Show test data for order 234
                                if (order?.orderId === '234' && !processFromAPI) {
                                  console.log('🧪 TEST: Showing test process data for order 234');
                                  return (
                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                      isDarkMode 
                                        ? 'bg-orange-600/20 text-orange-300 border border-orange-500/30' 
                                        : 'bg-orange-100 text-orange-700 border border-orange-200'
                                    }`}>
                                      Lot No Greigh (TEST)
                                    </span>
                                  );
                                }
                                
                                if (processFromAPI) {
                                  const displayProcess = processFromAPI;
                                  
                                  return (
                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                      isDarkMode 
                                        ? 'bg-orange-600/20 text-orange-300 border border-orange-500/30' 
                                        : 'bg-orange-100 text-orange-700 border border-orange-200'
                                    }`}>
                                      {displayProcess}
                                    </span>
                                  );
                                }
                                
                                // Fallback to old method if no process data from API
                                const processes = getProcessDataForQuality(item.quality, order.orderId);
                                console.log('🔍 Order Details - Processes from fallback:', processes);
                                
                                // If still no processes, try to extract directly from mill inputs
                                if (processes.length === 0 && millInputs.length > 0) {
                                  console.log('🔍 Order Details - Extracting from mill inputs directly');
                                  const itemQualityId = typeof item.quality === 'object' ? item.quality._id : item.quality;
                                  const itemQualityName = typeof item.quality === 'object' ? item.quality.name : item.quality;
                                  
                                  const relevantProcesses: string[] = [];
                                  
                                  millInputs.forEach((millInput: any) => {
                                    // Check main quality
                                    if (millInput.quality?._id?.toString() === itemQualityId?.toString() || 
                                        millInput.quality?.name === itemQualityName) {
                                      if (millInput.processName && millInput.processName.trim() !== '') {
                                        relevantProcesses.push(millInput.processName.trim());
                                      }
                                    }
                                    
                                    // Check additional meters
                                    if (millInput.additionalMeters) {
                                      millInput.additionalMeters.forEach((additional: any) => {
                                        if ((additional.quality?._id?.toString() === itemQualityId?.toString() || 
                                             additional.quality?.name === itemQualityName) &&
                                            additional.processName && additional.processName.trim() !== '') {
                                          relevantProcesses.push(additional.processName.trim());
                                        }
                                      });
                                    }
                                  });
                                  
                                  const uniqueProcesses = [...new Set(relevantProcesses)];
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
                                  
                                  const sortedProcesses = uniqueProcesses.sort((a, b) => {
                                    const aIndex = processPriority.indexOf(a);
                                    const bIndex = processPriority.indexOf(b);
                                    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
                                    if (aIndex === -1) return 1;
                                    if (bIndex === -1) return -1;
                                    return aIndex - bIndex;
                                  });
                                  
                                  if (sortedProcesses.length > 0) {
                                    console.log('🔍 Order Details - Found process from mill inputs:', sortedProcesses[0]);
                                    return (
                                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                        isDarkMode 
                                          ? 'bg-orange-600/20 text-orange-300 border border-orange-500/30' 
                                          : 'bg-orange-100 text-orange-700 border border-orange-200'
                                      }`}>
                                        {sortedProcesses[0]}
                                      </span>
                                    );
                                  }
                                }
                                
                                if (processes.length === 0) {
                                  return <span className="text-gray-500">No process data</span>;
                                }
                                
                                // Show only the highest priority process (first one in the sorted array)
                                const highestPriorityProcess = processes[0];
                                
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
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <label className={`text-base font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Description
                            </label>
                            <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {item.description || '--'}
                            </p>
                          </div>
                                     
                          <div className="space-y-2">
                            <label className={`text-base font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Weaver
                            </label>
                            <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {item.weaverSupplierName || '--'}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <label className={`text-base font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Purchase Rate
                            </label>
                            <p className={`text-xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                              {item.purchaseRate ? `₹${Number(item.purchaseRate).toFixed(2)}` : '--'}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <label className={`text-base font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Mill Rate
                            </label>
                            <p className={`text-xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                              {item.millRate ? `₹${Number(item.millRate).toFixed(2)}` : '--'}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <label className={`text-base font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Sales Rate
                            </label>
                            <p className={`text-xl font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                              {item.salesRate ? `₹${Number(item.salesRate).toFixed(2)}` : '--'}
                            </p>
                          </div>
                                  
                          
                          <div className="md:col-span-2">
                            <label className={`text-base font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Images
                            </label>
                            <div className="mt-4">
                              {item.imageUrls && item.imageUrls.length > 0 ? (
                                <div className="flex flex-wrap gap-6">
                                  {item.imageUrls.slice(0, 2).map((imageUrl, imgIndex) => (
                                    <div key={imgIndex} className="relative group">
                                      <img
                                        src={imageUrl}
                                        alt={`Item ${index + 1} - Image ${imgIndex + 1}`}
                                        className="w-48 h-48 rounded-2xl border-3 border-gray-200 dark:border-gray-600 object-cover cursor-pointer hover:scale-110 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:border-blue-400 dark:hover:border-blue-500"
                                        onClick={() => handleImageClick(item.imageUrls!, imgIndex)}
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                          // Show fallback icon if image fails to load
                                          const fallback = target.nextElementSibling as HTMLElement;
                                          if (fallback) fallback.style.display = 'block';
                                        }}
                                        loading="lazy"
                                      />
                                      <PhotoIcon className="h-16 w-16 text-gray-400 absolute inset-0 m-auto hidden" />
                                      {/* Enhanced hover tooltip */}
                                      <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-base px-4 py-3 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-20 shadow-lg">
                                        <div className="flex items-center space-x-2">
                                          <PhotoIcon className="h-5 w-5" />
                                          <span>Click to view all images</span>
                                        </div>
                                        {/* Tooltip arrow */}
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
                                      </div>
                                    </div>
                                  ))}
                                  {item.imageUrls.length > 2 && (
                                    <button
                                      onClick={() => handleImageClick(item.imageUrls!, 0)}
                                      className={`w-48 h-48 flex items-center justify-center rounded-2xl border-3 border-dashed transition-all duration-300 hover:scale-105 ${
                                        isDarkMode 
                                          ? 'border-gray-500 text-gray-400 hover:text-gray-300 hover:bg-gray-700/50 hover:border-blue-400' 
                                          : 'border-gray-300 text-gray-500 hover:text-gray-600 hover:bg-gray-50 hover:border-blue-500'
                                      }`}
                                      title={`View all ${item.imageUrls.length} images`}
                                    >
                                      <div className="text-center">
                                        <PhotoIcon className="h-12 w-12 mx-auto mb-3" />
                                        <span className="text-lg font-bold">
                                          +{item.imageUrls.length - 2}
                                        </span>
                                        <p className="text-sm mt-1">More Images</p>
                                      </div>
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <PhotoIcon className="h-6 w-6 text-gray-400" />
                                  <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                    No images
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                                       </div>
                                     </div>
                                   </div>
                                 ))}
                               </div>
                            </div>
                          )}
                          
            {/* Lab Data Section */}
            <div className={`p-6 rounded-xl shadow-lg border-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:shadow-xl hover:border-gray-500' : 'bg-white border-gray-200 hover:shadow-xl hover:border-gray-300'} transition-all duration-300`}>
              <div className="flex items-center space-x-3 mb-6">
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-yellow-600/20' : 'bg-yellow-100'}`}>
                  <BeakerIcon className={`h-8 w-8 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                </div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Lab Data ({order?.items?.length || 0})
                </h2>
              </div>
              <div className="space-y-4">
                {order?.items?.map((item, index) => (
                  <div key={index} className={`p-6 rounded-xl border-2 ${isDarkMode ? 'bg-gray-600 border-gray-500 hover:bg-gray-500 hover:shadow-lg' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:shadow-md'} transition-all duration-300`}>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Sample {index + 1}
                        </h3>
                        <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                          isDarkMode ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}>
                          Item {index + 1}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className={`text-base font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Lab Send Date *
                          </label>
                          <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {item.labData?.labSendDate ? formatDate(item.labData.labSendDate) : '--'}
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <label className={`text-base font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Approval Date
                          </label>
                          <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {item.labData?.approvalDate ? formatDate(item.labData.approvalDate) : '--'}
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <label className={`text-base font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Sample Number
                          </label>
                          <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {item.labData?.sampleNumber || '--'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
                  </div>
                </div>

          {/* Mill Input Data Section */}
          <div className="mt-6">
            <div className={`p-6 rounded-xl shadow-lg border-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:shadow-xl hover:border-gray-500' : 'bg-white border-gray-200 hover:shadow-xl hover:border-gray-300'} transition-all duration-300`}>
              <div className="flex items-center space-x-3 mb-6">
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-teal-600/20' : 'bg-teal-100'}`}>
                  <CogIcon className={`h-8 w-8 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`} />
                </div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Mill Input Data {millInputs.length > 0 && `(${millInputs.length})`}
                  {loadingSections.millInputs && (
                    <div className="ml-3 inline-flex items-center">
                      <div className={`animate-spin rounded-full h-5 w-5 border-2 ${
                        isDarkMode 
                          ? 'border-gray-600 border-t-blue-400' 
                          : 'border-gray-300 border-t-blue-600'
                      }`}></div>
                    </div>
                  )}
                </h2>
              </div>
                       {(() => {
                return millInputs && millInputs.length > 0;
              })() ? (
                      <div className="space-y-4">
                        {(() => {
                    // Group mill inputs by mill name
                    const groupedByMill = millInputs.reduce((groups: any, millInput: any) => {
                      const millName = typeof millInput.mill === 'object' ? millInput.mill.name : 'Unknown Mill';
                      if (!groups[millName]) {
                        groups[millName] = [];
                      }
                      groups[millName].push(millInput);
                            return groups;
                          }, {});

                    return Object.entries(groupedByMill).map(([millName, millInputsForMill]: [string, any]) => (
                      <div key={millName} className={`rounded-xl border-2 ${isDarkMode ? 'bg-gray-600 border-gray-500' : 'bg-gray-50 border-gray-200'}`}>
                        {/* Mill Name Header */}
                        <div className={`px-6 py-4 border-b-2 ${isDarkMode ? 'border-gray-500 bg-gray-700' : 'border-gray-200 bg-gray-100'}`}>
                          <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {millName}
                          </h3>
                          <p className={`text-base font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {millInputsForMill.length} {millInputsForMill.length === 1 ? 'entry' : 'entries'}
                          </p>
                       </div>

                        {/* Mill Input Entries */}
                        <div className="p-6">
              <div className="space-y-6">
                            {millInputsForMill.map((millInput: any, index: number) => (
                              <div key={millInput._id || index} className={`p-6 rounded-xl border-2 ${isDarkMode ? 'bg-gray-500 border-gray-400 hover:bg-gray-400 hover:shadow-lg' : 'bg-white border-gray-200 hover:bg-gray-50 hover:shadow-md'} transition-all duration-300`}>
                                <div className="mb-4">
                                  <h4 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Entry {index + 1}
                           </h4>
                         </div>
                         
                                {/* All Data Fields - Main + Additional */}
                                <div className="space-y-4">
                                  {/* Row 1: Mill Date and Chalan Number */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                      <label className={`text-base font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Mill Date
                                      </label>
                                      <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {millInput.millDate ? formatDate(millInput.millDate) : '--'}
                                      </p>
                 </div>

                                    <div className="space-y-2">
                                      <label className={`text-base font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Chalan Number
                                      </label>
                                      <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {millInput.chalanNo || '--'}
                                      </p>
                    </div>
                  </div>
                  
                                  {/* Row 2: Greigh Meters, Number of Pieces, and Quality */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="space-y-2">
                                      <label className={`text-base font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Greigh Meters
                                      </label>
                                      <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {millInput.greighMtr || '--'}
                      </p>
                    </div>
                             
                                    <div className="space-y-2">
                                      <label className={`text-base font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Number of Pieces
                                      </label>
                                      <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {millInput.pcs || '--'}
                            </p>
                          </div>

                            <div className="space-y-2">
                                      <label className={`text-base font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Quality
                                      </label>
                                      <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {typeof millInput.quality === 'object' ? millInput.quality.name : millInput.quality || '--'}
                            </p>
                          </div>
                          </div>

                                  {/* Additional Meters - Same UI Style */}
                                  {millInput.additionalMeters && millInput.additionalMeters.length > 0 && (
                  <div className="space-y-2">
                                      {millInput.additionalMeters.map((additional: any, addIndex: number) => (
                                        <div key={addIndex} className="space-y-3">
                                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              <div>
                                              <label className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                Greigh Meters
                                              </label>
                                              <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {additional.greighMtr || '--'}
                                              </p>
                      </div>

                        <div>
                                              <label className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                Number of Pieces
                                              </label>
                                              <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {additional.pcs || '--'}
                                              </p>
                        </div>
                        
                                    <div>
                                              <label className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                Quality
                                              </label>
                                              <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {typeof additional.quality === 'object' ? additional.quality.name : additional.quality || '--'}
                          </p>
                                        </div>
                                    </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    </div>
                              ))}
                        </div>
                      </div>
                  </div>
                    ));
                  })()}
                    </div>
                  ) : (
                <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <BeakerIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">No mill input data yet</p>
                  <p className="text-sm">Click "Add Mill Input" to get started</p>
                    </div>
                  )}
                </div>
                  </div>
                  
          {/* Mill Output Data Section */}
          <div className="mt-6">
            <div className={`p-6 rounded-xl shadow-lg border-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:shadow-xl hover:border-gray-500' : 'bg-white border-gray-200 hover:shadow-xl hover:border-gray-300'} transition-all duration-300`}>
              <div className="flex items-center space-x-3 mb-6">
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-emerald-600/20' : 'bg-emerald-100'}`}>
                  <BuildingOfficeIcon className={`h-8 w-8 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                </div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Mill Output Data {millOutputs.length > 0 && `(${millOutputs.length})`}
                  {loadingSections.millOutputs && (
                    <div className="ml-3 inline-flex items-center">
                      <div className={`animate-spin rounded-full h-5 w-5 border-2 ${
                        isDarkMode 
                          ? 'border-gray-600 border-t-blue-400' 
                          : 'border-gray-300 border-t-blue-600'
                      }`}></div>
                    </div>
                  )}
                </h2>
              </div>
              {(() => {
                return millOutputs && millOutputs.length > 0;
              })() ? (
                      <div className="space-y-4">
                        {(() => {
                          // Group mill outputs by bill number and date
                    const groupedByBillAndDate = millOutputs.reduce((groups: any, millOutput: any) => {
                      const key = `${millOutput.millBillNo}_${millOutput.recdDate}`;
                            if (!groups[key]) {
                        groups[key] = [];
                      }
                      groups[key].push(millOutput);
                            return groups;
                          }, {});

                    return Object.entries(groupedByBillAndDate).map(([key, millOutputsForGroup]: [string, any]) => (
                      <div key={key} className={`rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                              {/* Group Header */}
                        <div className={`px-2 py-2 border-b ${isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-gray-100'}`}>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                RECD DATE *
                              </label>
                              <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {millOutputsForGroup[0].recdDate ? formatDate(millOutputsForGroup[0].recdDate) : '--'}
                                  </p>
                                </div>
                            <div>
                              <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                Mill Bill No *
                              </label>
                              <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {millOutputsForGroup[0].millBillNo || '--'}
                          </p>
                        </div>
                      </div>
                                 </div>

                        {/* Mill Output Entries */}
                        <div className="p-1">
                          <div className="grid grid-cols-3 gap-4">
                            {millOutputsForGroup.map((millOutput: any, index: number) => (
                              <div key={millOutput._id || index} className={`p-1 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
                                <div className="mb-3">
                                  <h4 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Entry {index + 1}
                                  </h4>
                   </div>
                   
                                {/* Mill Output Data Fields - All in one row */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                      Finished Meters
                                    </label>
                                    <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                      {millOutput.finishedMtr || '--'}
                       </p>
                     </div>
                             
                                  <div>
                                    <label className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                       Quality
                                    </label>
                                    <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                      {typeof millOutput.quality === 'object' ? millOutput.quality.name : millOutput.quality || '--'}
                                    </p>
                             </div>
                                </div>
                              </div>
                            ))}
                             </div>
                           </div>
                         </div>
                         ));
                       })()}
                     </div>
                   ) : (
                <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <BeakerIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">No mill output data yet</p>
                  <p className="text-sm">Mill output data will appear here when available</p>
                     </div>
                   )}
               </div>
             </div>

          {/* Dispatch Data Section */}
          <div className="mt-6">
            <div className={`p-6 rounded-xl shadow-lg border-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:shadow-xl hover:border-gray-500' : 'bg-white border-gray-200 hover:shadow-xl hover:border-gray-300'} transition-all duration-300`}>
              <div className="flex items-center space-x-3 mb-6">
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-orange-600/20' : 'bg-orange-100'}`}>
                  <TruckIcon className={`h-8 w-8 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                </div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Dispatch Data {dispatches.length > 0 && `(${dispatches.length})`}
                  {loadingSections.dispatches && (
                    <div className="ml-3 inline-flex items-center">
                      <div className={`animate-spin rounded-full h-5 w-5 border-2 ${
                        isDarkMode 
                          ? 'border-gray-600 border-t-blue-400' 
                          : 'border-gray-300 border-t-blue-600'
                      }`}></div>
                    </div>
                  )}
                </h2>
              </div>
              {(() => {
                return dispatches && dispatches.length > 0;
              })() ? (
              <div className="space-y-4">
                  {(() => {
                    // Group dispatches by dispatchDate and billNo
                    const groupedByDateAndBill = dispatches.reduce((groups: any, dispatch: any) => {
                      const key = `${dispatch.dispatchDate}_${dispatch.billNo}`;
                      if (!groups[key]) {
                        groups[key] = [];
                      }
                      groups[key].push(dispatch);
                      return groups;
                    }, {});

                    return Object.entries(groupedByDateAndBill).map(([key, dispatchesForGroup]: [string, any]) => (
                      <div key={key} className={`rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                        {/* Group Header */}
                        <div className={`px-2 py-2 border-b ${isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-gray-100'}`}>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                Dispatch Date *
                              </label>
                              <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {dispatchesForGroup[0].dispatchDate ? formatDate(dispatchesForGroup[0].dispatchDate) : '--'}
                              </p>
                            </div>
                            <div>
                              <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                Bill Number *
                              </label>
                              <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {dispatchesForGroup[0].billNo || '--'}
                              </p>
                </div>
              </div>
            </div>

                        {/* Dispatch Entries */}
                        <div className="p-1">
                          <div className="grid grid-cols-3 gap-4">
                            {dispatchesForGroup.map((dispatch: any, index: number) => (
                              <div key={dispatch._id || index} className={`p-1 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
                                <div className="mb-3">
                                  <h4 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Entry {index + 1}
                                  </h4>
                  </div>
                  
                                {/* Dispatch Data Fields - All in one row */}
                                <div className="grid grid-cols-2 gap-4">
                              <div>
                                    <label className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                      Finish Meters
                                    </label>
                                    <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                      {dispatch.finishMtr || '--'}
                                    </p>
              </div>
                    
                        <div>
                                    <label className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                      Quality
                                    </label>
                                    <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                      {typeof dispatch.quality === 'object' ? dispatch.quality.name : dispatch.quality || '--'}
                          </p>
                        </div>
                        </div>
                      </div>
                            ))}
                    </div>
                  </div>
                </div>
                    ));
                  })()}
              </div>
              ) : (
                <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <BeakerIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">No dispatch data yet</p>
                  <p className="text-sm">Dispatch data will appear here when available</p>
                  </div>
                )}
              </div>
            </div>

                  </div>
                </div>

      {/* Image Preview Modal */}
      {showImagePreview && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-2">
          <div className="relative max-w-7xl max-h-[98vh] w-full">
            {/* Close Button */}
            <button
              onClick={() => setShowImagePreview(false)}
              className="absolute top-4 right-4 z-20 p-3 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all duration-200 backdrop-blur-sm"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>

            {/* Navigation Buttons */}
            {previewImages.length > 1 && (
              <>
                <button
                  onClick={() => navigateImage('prev')}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 p-3 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all duration-200 backdrop-blur-sm"
                >
                  <ChevronLeftIcon className="h-6 w-6" />
                </button>
                <button
                  onClick={() => navigateImage('next')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 p-3 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all duration-200 backdrop-blur-sm"
                >
                  <ChevronRightIcon className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Main Image Container */}
            <div
              className="w-full h-full flex items-center justify-center p-4"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={previewImages[currentImageIndex]}
                  alt={`Preview ${currentImageIndex + 1}`}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    // Show error message
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'flex items-center justify-center h-64 bg-gray-800 rounded-lg text-white';
                    errorDiv.innerHTML = '<div class="text-center"><PhotoIcon class="h-12 w-12 mx-auto mb-2 opacity-50"/><p>Failed to load image</p></div>';
                    target.parentNode?.appendChild(errorDiv);
                  }}
                />
              </div>
            </div>

            {/* Image Counter */}
            {previewImages.length > 1 && (
              <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
                {currentImageIndex + 1} / {previewImages.length}
              </div>
            )}

            {/* Thumbnail Strip */}
            {previewImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-3 max-w-full overflow-x-auto pb-2">
                {previewImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 flex-shrink-0 ${
                      index === currentImageIndex
                        ? 'border-white shadow-lg scale-110'
                        : 'border-transparent opacity-60 hover:opacity-80 hover:scale-105'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="w-full h-full bg-gray-600 flex items-center justify-center"><PhotoIcon class="h-6 w-6 text-white opacity-50"/></div>';
                        }
                      }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Keyboard Instructions */}
            {previewImages.length > 1 && (
              <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-xs backdrop-blur-sm">
                Use ← → keys or swipe to navigate
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mill Input Modal */}
      {showMillInputModal && (
        <MillInputForm
          order={order}
          mills={mills}
          qualities={qualities}
          onClose={() => {
            setShowMillInputModal(false);
            setIsEditingMillInput(false);
          }}
          onSuccess={handleMillInputSuccess}
          onAddMill={() => {}}
          onRefreshMills={() => {
            // Refresh mills and qualities in parallel for better performance
            const refreshMillsAndQualities = async () => {
              try {
                const token = localStorage.getItem('token');
                
                const [millsResponse, qualitiesResponse] = await Promise.all([
                  fetch('/api/mills', {
                    headers: { 'Authorization': `Bearer ${token}` }
                  }),
                  fetch('/api/qualities', {
                    headers: { 'Authorization': `Bearer ${token}` }
                  })
                ]);

                const [millsData, qualitiesData] = await Promise.all([
                  millsResponse.json(),
                  qualitiesResponse.json()
                ]);

                if (millsData.success) {
                  setMills(millsData.data || []);
                }
                if (qualitiesData.success) {
                  setQualities(qualitiesData.data || []);
                }
              } catch (error) {
                console.error('Error refreshing mills and qualities:', error);
              }
            };
            refreshMillsAndQualities();
          }}
          isEditing={isEditingMillInput}
          existingMillInputs={millInputs}
        />
      )}

    </div>
  );
}