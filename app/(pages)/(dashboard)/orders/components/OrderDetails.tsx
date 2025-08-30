'use client';

import { 
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  PhoneIcon,
  MapPinIcon,
  CubeIcon,
  DocumentTextIcon,
  UserIcon,
  BuildingOfficeIcon,
  PhotoIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  BeakerIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import { Order } from '@/types';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useState, useEffect } from 'react';
import OrderLogsModal from './OrderLogsModal';
import LabAddModal from './LabDataModal';  
import DispatchForm from './DispatchForm';

interface OrderDetailsProps {
  order: Order;
  onClose: () => void;
  onEdit: () => void;
}

export default function OrderDetails({ order, onClose, onEdit }: OrderDetailsProps) {
  const { isDarkMode, mounted } = useDarkMode();
  const [labs, setLabs] = useState<any[]>([]);
  const [loadingLabs, setLoadingLabs] = useState(false);
  const [millInputs, setMillInputs] = useState<any[]>([]);
  const [loadingMillInputs, setLoadingMillInputs] = useState(false);
  const [millOutputs, setMillOutputs] = useState<any[]>([]);
  const [loadingMillOutputs, setLoadingMillOutputs] = useState(false);
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [loadingDispatches, setLoadingDispatches] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; alt: string } | null>(null);
  const [showOrderLogs, setShowOrderLogs] = useState(false);
  const [showLabModal, setShowLabModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);

  // Pre-fetch logs and labs when order details open
  useEffect(() => {
    if (order._id) {
      // Pre-fetch logs in background
      const preloadLogs = async () => {
        try {
          const token = localStorage.getItem('token');
          await fetch(`/api/orders/${order._id}/logs`, {
            headers: {
              ...(token && { 'Authorization': `Bearer ${token}` }),
              'Cache-Control': 'max-age=30' // Cache for 30 seconds
            }
          });
        } catch (error) {
          // Silent fail for preloading
          console.log('Preload logs failed:', error);
        }
      };
      
      // Fetch labs data with optimized caching
      const fetchLabs = async () => {
        try {
          setLoadingLabs(true);
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/labs/by-order/${order._id}`, {
            headers: {
              'Cache-Control': 'max-age=30', // Reduced cache time for more frequent updates
              'Authorization': `Bearer ${token}`,
            }
          });
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            setLabs(data.data);
          }
        } catch (error) {
          console.error('Error fetching labs:', error);
        } finally {
          setLoadingLabs(false);
        }
      };

      // Fetch mill inputs data
      const fetchMillInputs = async () => {
        try {
          setLoadingMillInputs(true);
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/mill-inputs?orderId=${order.orderId}`, {
            headers: {
              'Cache-Control': 'max-age=30',
              'Authorization': `Bearer ${token}`,
            }
          });
          const data = await response.json();
          if (data.success && Array.isArray(data.data.millInputs)) {
            setMillInputs(data.data.millInputs);
          }
        } catch (error) {
          console.error('Error fetching mill inputs:', error);
        } finally {
          setLoadingMillInputs(false);
        }
      };

      // Fetch mill outputs data
      const fetchMillOutputs = async () => {
        try {
          setLoadingMillOutputs(true);
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/mill-outputs?orderId=${order.orderId}`, {
            headers: {
              'Cache-Control': 'max-age=30',
              'Authorization': `Bearer ${token}`,
            }
          });
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            setMillOutputs(data.data);
          }
        } catch (error) {
          console.error('Error fetching mill outputs:', error);
        } finally {
          setLoadingMillOutputs(false);
        }
      };

      // Fetch dispatch data
      const fetchDispatches = async () => {
        try {
          setLoadingDispatches(true);
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/dispatch?orderId=${order.orderId}`, {
            headers: {
              'Cache-Control': 'max-age=30',
              'Authorization': `Bearer ${token}`,
            }
          });
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            setDispatches(data.data);
          }
        } catch (error) {
          console.error('Error fetching dispatches:', error);
        } finally {
          setLoadingDispatches(false);
        }
      };
      
      preloadLogs();
      fetchLabs();
      fetchMillInputs();
      fetchMillOutputs();
      fetchDispatches();
    }
  }, [order._id]);

  // Listen for lab updates and refresh labs data
  useEffect(() => {
    const handleLabUpdate = (event: CustomEvent) => {
      if (event.detail?.orderId === order._id && event.detail?.action === 'lab_add') {
        // Refresh labs data after a short delay to ensure server has updated
        setTimeout(() => {
          const fetchLabs = async () => {
            try {
              setLoadingLabs(true);
              const token = localStorage.getItem('token');
              const response = await fetch(`/api/labs/by-order/${order._id}`, {
                headers: {
                  'Cache-Control': 'no-cache', // Force fresh data
                  'Authorization': `Bearer ${token}`,
                }
              });
              const data = await response.json();
              if (data.success && Array.isArray(data.data)) {
                setLabs(data.data);
              }
            } catch (error) {
              console.error('Error refreshing labs:', error);
            } finally {
              setLoadingLabs(false);
            }
          };
          fetchLabs();
        }, 500); // 500ms delay to ensure server has processed the lab creation
      }
    };

    window.addEventListener('orderUpdated', handleLabUpdate as EventListener);
    
    return () => {
      window.removeEventListener('orderUpdated', handleLabUpdate as EventListener);
    };
  }, [order._id]);

  const handleViewLogs = async () => {
    setLogsLoading(true);
    setShowOrderLogs(true);
    // Loading state will be managed by OrderLogsModal
    setLogsLoading(false);
  };

  // Function to refresh logs when order is updated
  const refreshLogs = () => {
    if (showOrderLogs) {
      // Trigger a refresh in the OrderLogsModal
      const event = new CustomEvent('refreshOrderLogs', { detail: { orderId: order._id } });
      window.dispatchEvent(event);
    }
  };

  const getOrderStatus = (order: Order) => {
    const now = new Date();
    if (order.deliveryDate && now > new Date(order.deliveryDate)) return 'Delivered';
    if (order.arrivalDate && now > new Date(order.arrivalDate)) return 'Arrived';
    return 'Pending';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': 
        return isDarkMode 
          ? 'bg-green-900/20 text-green-400 border-green-500/30' 
          : 'bg-green-100 text-green-800 border-green-200';
      case 'Arrived': 
        return isDarkMode 
          ? 'bg-blue-900/20 text-blue-400 border-blue-500/30' 
          : 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Pending': 
        return isDarkMode 
          ? 'bg-yellow-900/20 text-yellow-400 border-yellow-500/30' 
          : 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: 
        return isDarkMode 
          ? 'bg-gray-900/20 text-gray-400 border-gray-500/30' 
          : 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Delivered': return <CheckCircleIcon className="h-4 w-4" />;
      case 'Arrived': return <InformationCircleIcon className="h-4 w-4" />;
      case 'Pending': return <ClockIcon className="h-4 w-4" />;
      default: return <InformationCircleIcon className="h-4 w-4" />;
    }
  };

  const party = typeof order.party === 'string' ? null : order.party;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalQuantity = (order: Order) => {
    return order.items.reduce((total: number, item: any) => total + (item.quantity || 0), 0);
  };

  const handleImageClick = (imageUrl: string, alt: string) => {
    setPreviewImage({ url: imageUrl, alt });
    setShowImagePreview(true);
  };

  // Handle edit mill input
  const handleEditMillInput = (millInput: any) => {
    // TODO: Implement edit functionality
    console.log('Edit mill input:', millInput);
    // You can open a modal or navigate to edit page
  };

  // Handle delete mill input
  const handleDeleteMillInput = async (millInputId: string) => {
    if (!confirm('Are you sure you want to delete this mill input?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/mill-inputs/${millInputId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        // Refresh mill inputs
        const updatedMillInputs = millInputs.filter(input => input._id !== millInputId);
        setMillInputs(updatedMillInputs);
      } else {
        alert('Failed to delete mill input: ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting mill input:', error);
      alert('Failed to delete mill input');
    }
  };

  // Handle ESC key to close image preview
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showImagePreview) {
        setShowImagePreview(false);
      }
    };

    if (showImagePreview) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset'; // Restore scrolling
    };
  }, [showImagePreview]);

  // Fetch labs for this order
  useEffect(() => {
    const fetchLabs = async () => {
      setLoadingLabs(true);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // Reduced timeout to 2 seconds
        
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/labs/by-order/${order._id}`, {
          signal: controller.signal,
          headers: {
            'Cache-Control': 'max-age=60', // Increased cache to 60 seconds
            'Authorization': `Bearer ${token}`,
          }
        });
        
        clearTimeout(timeoutId);
        
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setLabs(data.data);
        } else {
          console.warn('Labs data is not an array:', data);
          setLabs([]);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.warn('Lab fetch timeout - using empty labs');
          setLabs([]);
        } else {
          console.error('Error fetching labs:', error);
          setLabs([]);
        }
      } finally {
        setLoadingLabs(false);
      }
    };

    fetchLabs();
  }, [order._id]);

  const getLabForItem = (itemId: string) => {
    if (!Array.isArray(labs)) return null;
    const lab = labs.find(lab => lab.orderItemId === itemId);
    return lab;
  };

  // Calculate lab statistics
  const labStats = {
    total: labs.length,
    withLabs: labs.length,
    withoutLabs: Math.max(0, order.items.length - labs.length),
    sent: labs.filter(lab => lab.status === 'sent').length,
    received: labs.filter(lab => lab.status === 'received').length,
    cancelled: labs.filter(lab => lab.status === 'cancelled').length
  };





  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className={`w-full max-w-7xl rounded-2xl shadow-2xl ${
        isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
      } max-h-[98vh] overflow-hidden`}>
        {/* Enhanced Header */}
        <div className={`relative p-8 border-b ${
          isDarkMode ? 'border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800' : 'border-gray-200 bg-gradient-to-r from-white to-gray-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-700' 
                  : 'bg-gradient-to-br from-blue-500 to-indigo-600'
              }`}>
                <CubeIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Order Details
                </h1>
                <div className="flex items-center space-x-4 mt-2">
                  <p className={`text-lg font-mono ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    #{order.orderId}
                  </p>
                                     <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full ${
                     order.status === 'delivered'
                       ? isDarkMode ? 'bg-green-900/30 text-green-400 border border-green-500/50' : 'bg-green-100 text-green-800 border border-green-200'
                       : order.status === 'pending'
                       ? isDarkMode ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/50' : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                       : isDarkMode ? 'bg-blue-900/30 text-blue-400 border border-blue-500/50' : 'bg-blue-100 text-blue-800 border border-blue-200'
                   }`}>
                     {order.status === 'delivered' ? <CheckCircleIcon className="h-4 w-4" /> : <ClockIcon className="h-4 w-4" />}
                     <span className="ml-1">{order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending'}</span>
                   </span>
                </div>
              </div>
            </div>
                                                   <div className="flex items-center space-x-0.5 xs:space-x-1 sm:space-x-2 lg:space-x-3">
                                               <button
                  onClick={handleViewLogs}
                  disabled={logsLoading}
                  className={`inline-flex items-center px-1.5 py-1.5 xs:px-2 sm:px-3 lg:px-4 xs:py-2 sm:py-2.5 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg text-xs ${
                    logsLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : isDarkMode
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600'
                  }`}
                >
                   {logsLoading ? (
                     <div className="animate-spin rounded-full h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 mr-0.5 xs:mr-1 sm:mr-1.5 lg:mr-2 border-2 border-white border-t-transparent" />
                   ) : (
                     <DocumentTextIcon className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 mr-0.5 xs:mr-1 sm:mr-1.5 lg:mr-2" />
                   )}
                   <span className="hidden lg:inline">{logsLoading ? 'Loading...' : 'View Activity Log'}</span>
                   <span className="hidden sm:inline lg:hidden">{logsLoading ? 'Loading...' : 'Activity Log'}</span>
                   <span className="hidden xs:inline sm:hidden">{logsLoading ? 'Loading...' : 'Logs'}</span>
                   <span className="xs:hidden">{logsLoading ? 'Loading...' : 'Log'}</span>
                </button>
               <button
                 onClick={onEdit}
                  className={`inline-flex items-center px-1.5 py-1.5 xs:px-2 sm:px-3 lg:px-4 xs:py-2 sm:py-2.5 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg text-xs ${
                   isDarkMode
                     ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                     : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600'
                 }`}
               >
                  <PencilIcon className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 mr-0.5 xs:mr-1 sm:mr-1.5 lg:mr-2" />
                  <span className="hidden lg:inline">Edit Order</span>
                  <span className="hidden sm:inline lg:hidden">Edit</span>
                  <span className="hidden xs:inline sm:hidden">Edit</span>
                  <span className="xs:hidden">Edit</span>
                </button>
                                <button
                  onClick={() => setShowLabModal(true)}
                  className={`inline-flex items-center px-1.5 py-1.5 xs:px-2 sm:px-3 lg:px-4 xs:py-2 sm:py-2.5 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg text-xs ${
                    labs.length > 0
                      ? isDarkMode
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
                        : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                      : isDarkMode
                        ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700'
                        : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                  }`}
                >
                  <BeakerIcon className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 mr-0.5 xs:mr-1 sm:mr-1.5 lg:mr-2" />
                  <span className="hidden lg:inline">{labs.length > 0 ? 'Edit Lab' : 'Add Lab'}</span>
                  <span className="hidden sm:inline lg:hidden">{labs.length > 0 ? 'Edit Lab' : 'Add Lab'}</span>
                  <span className="hidden xs:inline sm:hidden">{labs.length > 0 ? 'Edit' : 'Add'}</span>
                  {/* <span className="xs:hidden">{labs.length > 0 ? 'E' : 'A'}</span> */}
                </button>
                <button
                  onClick={() => setShowDispatchModal(true)}
                  className={`inline-flex items-center px-1.5 py-1.5 xs:px-2 sm:px-3 lg:px-4 xs:py-2 sm:py-2.5 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg text-xs ${
                    dispatches.length > 0
                      ? isDarkMode
                        ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700'
                        : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                      : isDarkMode
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                  }`}
                >
                  <TruckIcon className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 mr-0.5 xs:mr-1 sm:mr-1.5 lg:mr-2" />
                  <span className="hidden lg:inline">{dispatches.length > 0 ? 'Edit Dispatch' : 'Add Dispatch'}</span>
                  <span className="hidden sm:inline lg:hidden">{dispatches.length > 0 ? 'Edit Dispatch' : 'Add Dispatch'}</span>
                  <span className="hidden xs:inline sm:hidden">{dispatches.length > 0 ? 'Edit' : 'Add'}</span>
                  <span className="xs:hidden">{dispatches.length > 0 ? 'E' : 'A'}</span>
                </button>
               <button
                 onClick={onClose}
                  className={`p-1 xs:p-1.5 sm:p-2 lg:p-3 rounded-lg transition-all duration-300 ${
                   isDarkMode
                     ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
                     : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                 }`}
               >
                  <XMarkIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
               </button>
             </div>
          </div>
        </div>

                 {/* Enhanced Content */}
         <div className="overflow-y-auto max-h-[calc(98vh-200px)]" style={{
           scrollbarWidth: 'thin',
           scrollbarColor: isDarkMode ? '#4B5563 #1F2937' : '#D1D5DB #F9FAFB'
         }}>
           <style jsx>{`
             div::-webkit-scrollbar {
               width: 8px;
             }
             div::-webkit-scrollbar-track {
               background: ${isDarkMode ? '#1F2937' : '#F9FAFB'};
               border-radius: 4px;
             }
             div::-webkit-scrollbar-thumb {
               background: ${isDarkMode ? '#4B5563' : '#D1D5DB'};
               border-radius: 4px;
             }
             div::-webkit-scrollbar-thumb:hover {
               background: ${isDarkMode ? '#6B7280' : '#9CA3AF'};
             }
           `}</style>
          <div className="p-8">
                                      {/* Quick Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {/* Order Type */}
                <div className={`p-6 rounded-2xl border ${
                  isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
                } shadow-lg`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Order Type
                      </p>
                      <p className={`text-xl font-bold ${
                        order.orderType === 'Dying'
                          ? isDarkMode ? 'text-red-400' : 'text-red-600'
                          : isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      }`}>
                        {order.orderType}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl ${
                      order.orderType === 'Dying'
                        ? isDarkMode ? 'bg-red-500/20' : 'bg-red-100'
                        : isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                    }`}>
                      <svg className={`h-6 w-6 ${
                        order.orderType === 'Dying'
                          ? isDarkMode ? 'text-red-400' : 'text-red-600'
                          : isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Order Status */}
                <div className={`p-6 rounded-2xl border ${
                  isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
                } shadow-lg`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Order Status
                      </p>
                      <p className={`text-xl font-bold ${
                        order.status === 'delivered'
                          ? isDarkMode ? 'text-green-400' : 'text-green-600'
                          : order.status === 'pending'
                          ? isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                          : isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      }`}>
                        {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending'}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl ${
                      order.status === 'delivered'
                        ? isDarkMode ? 'bg-green-500/20' : 'bg-green-100'
                        : order.status === 'pending'
                        ? isDarkMode ? 'bg-yellow-500/20' : 'bg-yellow-100'
                        : isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                    }`}>
                      {order.status === 'delivered' ? <CheckCircleIcon className="h-6 w-6" /> :
                       <ClockIcon className="h-6 w-6" />}
                    </div>
                  </div>
                </div>

                {/* Total Items */}
                <div className={`p-6 rounded-2xl border ${
                  isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
                } shadow-lg`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Total Items
                      </p>
                      <p className={`text-3xl font-bold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {order.items?.length || 0}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl ${
                      isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                    }`}>
                      <CubeIcon className={`h-6 w-6 ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      }`} />
                    </div>
                  </div>
                </div>

                {/* Lab Records */}
                <div className={`p-6 rounded-2xl border ${
                  isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
                } shadow-lg`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Lab Records
                      </p>
                      <p className={`text-3xl font-bold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {labStats.withLabs}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl ${
                      isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'
                    }`}>
                      <BeakerIcon className={`h-6 w-6 ${
                        isDarkMode ? 'text-purple-400' : 'text-purple-600'
                      }`} />
                    </div>
                  </div>
                </div>
              </div>

                         <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                              {/* Left Column - Order & Party Info */}
                <div className="space-y-6">
                 {/* Order Information Card */}
                 <div className={`p-6 rounded-2xl border ${
                   isDarkMode 
                     ? 'bg-gray-800/50 border-gray-700' 
                     : 'bg-white border-gray-200'
                 } shadow-lg`}>
                   <div className="flex items-center mb-6">
                     <div className={`p-3 rounded-xl ${
                       isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                     }`}>
                       <CubeIcon className={`h-6 w-6 ${
                         isDarkMode ? 'text-blue-400' : 'text-blue-600'
                       }`} />
                     </div>
                     <div className="ml-4">
                       <h3 className={`text-xl font-bold ${
                         isDarkMode ? 'text-white' : 'text-gray-900'
                       }`}>
                         Order Information
                       </h3>
                       <p className={`text-sm ${
                         isDarkMode ? 'text-gray-400' : 'text-gray-600'
                       }`}>
                         Basic order details and specifications
                       </p>
                     </div>
                   </div>
                   <div className="space-y-4">
                                           {order.orderNo && (
                        <div className={`flex justify-between items-center p-3 rounded-lg ${
                          isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                        }`}>
                          <span className={`text-sm font-medium ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            Order No
                          </span>
                          <span className={`text-sm font-semibold ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {order.orderNo}
                          </span>
                        </div>
                      )}
                      {(order.poNumber || order.styleNo) && ( // Removed weaverSupplierName and purchaseRate checks
                        <div className="space-y-3">
                          {order.poNumber && (
                            <div className={`flex justify-between items-center p-3 rounded-lg ${
                              isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                            }`}>
                              <span className={`text-sm font-medium ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-600'
                              }`}>
                                PO Number
                              </span>
                              <span className={`text-sm font-mono font-semibold ${
                                isDarkMode ? 'text-blue-400' : 'text-blue-600'
                              }`}>
                                {order.poNumber}
                              </span>
                            </div>
                          )}
                          {order.styleNo && (
                            <div className={`flex justify-between items-center p-3 rounded-lg ${
                              isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                            }`}>
                             <span className={`text-sm font-medium ${
                               isDarkMode ? 'text-gray-300' : 'text-gray-600'
                             }`}>
                               Style Number
                             </span>
                             <span className={`text-sm font-mono font-semibold ${
                               isDarkMode ? 'text-purple-400' : 'text-purple-600'
                             }`}>
                               {order.styleNo}
                             </span>
                           </div>
                         )}
                          
                       </div>
                     )}
                   </div>
                 </div>

                                 {/* Dates Card */}
                 <div className={`p-6 rounded-2xl border ${
                   isDarkMode 
                     ? 'bg-gray-800/50 border-gray-700' 
                     : 'bg-white border-gray-200'
                 } shadow-lg`}>
                   <div className="flex items-center mb-6">
                     <div className={`p-3 rounded-xl ${
                       isDarkMode ? 'bg-green-500/20' : 'bg-green-100'
                     }`}>
                       <CalendarIcon className={`h-6 w-6 ${
                         isDarkMode ? 'text-green-400' : 'text-green-600'
                       }`} />
                     </div>
                     <div className="ml-4">
                       <h3 className={`text-xl font-bold ${
                         isDarkMode ? 'text-white' : 'text-gray-900'
                       }`}>
                         Important Dates
                       </h3>
                       <p className={`text-sm ${
                         isDarkMode ? 'text-gray-400' : 'text-gray-600'
                       }`}>
                         Key milestones and deadlines
                       </p>
                     </div>
                   </div>
                   <div className="space-y-4">
                                           <div className={`flex justify-between items-center p-3 rounded-lg ${
                        isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                      }`}>
                        <span className={`text-sm font-medium ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          Arrival Date
                        </span>
                        <span className={`text-sm font-semibold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {order.arrivalDate ? formatDate(order.arrivalDate) : 'Not specified'}
                        </span>
                      </div>
                      {order.poDate && (
                        <div className={`flex justify-between items-center p-3 rounded-lg ${
                          isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                        }`}>
                          <span className={`text-sm font-medium ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            PO Date
                          </span>
                          <span className={`text-sm font-semibold ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {order.poDate ? formatDate(order.poDate) : 'Not specified'}
                          </span>
                        </div>
                      )}
                      {order.deliveryDate && (
                        <div className={`flex justify-between items-center p-3 rounded-lg ${
                          isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                        }`}>
                         <span className={`text-sm font-medium ${
                           isDarkMode ? 'text-gray-300' : 'text-gray-600'
                         }`}>
                           Delivery Date
                         </span>
                         <span className={`text-sm font-semibold ${
                           isDarkMode ? 'text-white' : 'text-gray-900'
                         }`}>
                           {order.deliveryDate ? formatDate(order.deliveryDate) : 'Not specified'}
                         </span>
                       </div>
                     )}
                   </div>
                 </div>

                                 {/* Party Information Card */}
                 {party && (
                   <div className={`p-6 rounded-2xl border ${
                     isDarkMode 
                       ? 'bg-gray-800/50 border-gray-700' 
                       : 'bg-white border-gray-200'
                   } shadow-lg`}>
                     <div className="flex items-center mb-6">
                       <div className={`p-3 rounded-xl ${
                         isDarkMode ? 'bg-indigo-500/20' : 'bg-indigo-100'
                       }`}>
                         <BuildingOfficeIcon className={`h-6 w-6 ${
                           isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
                         }`} />
                       </div>
                       <div className="ml-4">
                         <h3 className={`text-xl font-bold ${
                           isDarkMode ? 'text-white' : 'text-gray-900'
                         }`}>
                           Party Information
                         </h3>
                         <p className={`text-sm ${
                           isDarkMode ? 'text-gray-400' : 'text-gray-600'
                         }`}>
                           Customer and contact details
                         </p>
                       </div>
                     </div>
                     <div className="space-y-4">
                                               <div className={`p-3 rounded-lg ${
                          isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                        }`}>
                         <span className={`text-sm font-medium ${
                           isDarkMode ? 'text-gray-300' : 'text-gray-600'
                         }`}>
                           Company Name
                         </span>
                         <p className={`text-lg font-semibold mt-1 ${
                           isDarkMode ? 'text-white' : 'text-gray-900'
                         }`}>
                           {party.name}
                         </p>
                       </div>
                       {party.contactName && (
                         <div className={`p-3 rounded-lg ${
                           isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                         }`}>
                           <span className={`text-sm font-medium ${
                             isDarkMode ? 'text-gray-300' : 'text-gray-600'
                           }`}>
                             Contact Person
                           </span>
                           <p className={`text-sm font-semibold mt-1 ${
                             isDarkMode ? 'text-white' : 'text-gray-900'
                           }`}>
                             {party.contactName}
                           </p>
                         </div>
                       )}
                       {party.contactPhone && (
                         <div className={`flex items-center p-3 rounded-lg ${
                           isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                         }`}>
                           <PhoneIcon className={`h-5 w-5 mr-3 ${
                             isDarkMode ? 'text-gray-400' : 'text-gray-500'
                           }`} />
                           <div>
                             <span className={`text-sm font-medium ${
                               isDarkMode ? 'text-gray-300' : 'text-gray-600'
                             }`}>
                               Phone Number
                             </span>
                             <p className={`text-sm font-semibold ${
                               isDarkMode ? 'text-white' : 'text-gray-900'
                             }`}>
                               {party.contactPhone}
                             </p>
                           </div>
                         </div>
                       )}
                       {party.address && (
                         <div className={`flex items-start p-3 rounded-lg ${
                           isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                         }`}>
                           <MapPinIcon className={`h-5 w-5 mr-3 mt-0.5 ${
                             isDarkMode ? 'text-gray-400' : 'text-gray-500'
                           }`} />
                           <div>
                             <span className={`text-sm font-medium ${
                               isDarkMode ? 'text-gray-300' : 'text-gray-600'
                             }`}>
                               Address
                             </span>
                             <p className={`text-sm font-semibold ${
                               isDarkMode ? 'text-white' : 'text-gray-900'
                             }`}>
                               {party.address}
                             </p>
                           </div>
                         </div>
                       )}
                     </div>
                   </div>
                 )}

                 {/* Contact Information Card */}
                 {(order.contactName || order.contactPhone) && (
                   <div className={`p-6 rounded-2xl border ${
                     isDarkMode 
                       ? 'bg-gray-800/50 border-gray-700' 
                       : 'bg-white border-gray-200'
                   } shadow-lg`}>
                     <div className="flex items-center mb-6">
                       <div className={`p-3 rounded-xl ${
                         isDarkMode ? 'bg-orange-500/20' : 'bg-orange-100'
                       }`}>
                         <UserIcon className={`h-6 w-6 ${
                           isDarkMode ? 'text-orange-400' : 'text-orange-600'
                         }`} />
                       </div>
                       <div className="ml-4">
                         <h3 className={`text-xl font-bold ${
                           isDarkMode ? 'text-white' : 'text-gray-900'
                         }`}>
                           Contact Information
                         </h3>
                         <p className={`text-sm ${
                           isDarkMode ? 'text-gray-400' : 'text-gray-600'
                         }`}>
                           Order-specific contact details
                         </p>
                       </div>
                     </div>
                     <div className="space-y-4">
                       {order.contactName && (
                         <div className={`p-3 rounded-lg ${
                           isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                         }`}>
                           <span className={`text-sm font-medium ${
                             isDarkMode ? 'text-gray-300' : 'text-gray-600'
                           }`}>
                             Contact Name
                           </span>
                           <p className={`text-sm font-semibold mt-1 ${
                             isDarkMode ? 'text-white' : 'text-gray-900'
                           }`}>
                             {order.contactName}
                           </p>
                         </div>
                       )}
                       {order.contactPhone && (
                         <div className={`flex items-center p-3 rounded-lg ${
                           isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                         }`}>
                           <PhoneIcon className={`h-5 w-5 mr-3 ${
                             isDarkMode ? 'text-gray-400' : 'text-gray-500'
                           }`} />
                           <div>
                             <span className={`text-sm font-medium ${
                               isDarkMode ? 'text-gray-300' : 'text-gray-600'
                             }`}>
                               Contact Phone
                             </span>
                             <p className={`text-sm font-semibold ${
                               isDarkMode ? 'text-white' : 'text-gray-900'
                             }`}>
                               {order.contactPhone}
                             </p>
                           </div>
                         </div>
                       )}
                     </div>
                   </div>
                 )}
               </div>

                                                           {/* Right Column - Order Items */}
                <div className="space-y-6">

                 {/* Order Items Card */}
                 {order.items && order.items.length > 0 && (
                  <div className={`p-6 rounded-xl border ${
                    isDarkMode 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-white border-gray-200 shadow-sm'
                  }`}>
                    <div className="flex items-center mb-4">
                      <CubeIcon className={`h-5 w-5 mr-2 ${
                        isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                      }`} />
                      <h3 className={`text-lg font-semibold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Order Items ({order.items.length})
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {order.items.map((item, index) => (
                        <div key={index} className={`p-4 rounded-lg border-l-4 ${
                          isDarkMode 
                            ? 'bg-white/5 border-blue-500/50' 
                            : 'bg-gray-50 border-blue-500'
                        }`}>
                          <div className="flex justify-between items-start mb-3">
                            <h4 className={`font-semibold ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              Item {index + 1}
                            </h4>
                            {item.quantity && (
                              <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                                isDarkMode 
                                  ? 'bg-blue-900/20 text-blue-400' 
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                Qty: {item.quantity.toLocaleString()}
                              </span>
                            )}
                          </div>
                          
                          {item.quality && (
                            <p className={`text-sm mb-2 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              <span className="font-medium">Quality:</span> {
                                typeof item.quality === 'string' 
                                  ? item.quality 
                                  : item.quality.name || 'Unknown'
                              }
                            </p>
                          )}
                          
                          {item.description && (
                            <p className={`text-sm mb-3 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              <span className="font-medium">Description:</span> {item.description}
                            </p>
                          )}
                          
                          {item.weaverSupplierName && (
                            <p className={`text-sm mb-2 ${
                              isDarkMode ? 'text-orange-300' : 'text-orange-600'
                            }`}>
                              <span className="font-medium">Weaver/Supplier:</span> {item.weaverSupplierName}
                            </p>
                          )}
                          
                          {item.purchaseRate && (
                            <p className={`text-sm mb-3 ${
                              isDarkMode ? 'text-green-300' : 'text-green-600'
                            }`}>
                              <span className="font-medium">Purchase Rate:</span> ₹{Number(item.purchaseRate).toFixed(2)}
                            </p>
                          )}
                          
                          {/* Item Images */}
                          {item.imageUrls && item.imageUrls.length > 0 && (
                            <div className="mt-4">
                              <div className="flex items-center mb-3">
                                <PhotoIcon className={`h-4 w-4 mr-2 ${
                                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                }`} />
                                <span className={`text-sm font-semibold ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  Item Images ({item.imageUrls.length})
                                </span>
                              </div>
                                                             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                 {item.imageUrls.map((imageUrl, imageIndex) => (
                                   <div key={imageIndex} className="relative group">
                                     <img
                                       src={imageUrl}
                                       alt={`Item ${index + 1} image ${imageIndex + 1}`}
                                       className="w-full h-32 md:h-28 object-cover rounded-xl border-2 border-gray-200 shadow-lg hover:border-blue-400 transition-all duration-300 hover:scale-110 hover:shadow-xl cursor-pointer"
                                       onClick={() => handleImageClick(imageUrl, `Item ${index + 1} image ${imageIndex + 1}`)}
                                       onError={(e) => {
                                         e.currentTarget.style.display = 'none';
                                       }}
                                     />
                                     <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                       <div className="bg-white/95 backdrop-blur-sm rounded-full p-2 shadow-xl border border-gray-200">
                                         <PhotoIcon className="h-4 w-4 text-gray-700" />
                                       </div>
                                     </div>
                                     <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                       <div className="bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
                                         <span className="text-white text-xs font-medium">#{imageIndex + 1}</span>
                                       </div>
                                     </div>
                                   </div>
                                 ))}
                               </div>
                            </div>
                          )}
                          


                                                                                                           {/* Enhanced Lab Information */}
                            {(() => {
                              const lab = getLabForItem((item as any)._id);
                              return lab ? (
                                <div className={`mt-4 p-6 rounded-2xl border-2 ${
                                  isDarkMode 
                                    ? 'bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border-purple-500/30' 
                                    : 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200'
                                } shadow-lg`}>
                                  <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center">
                                      <div className={`p-3 rounded-xl ${
                                        isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'
                                      }`}>
                                        <BeakerIcon className={`h-6 w-6 ${
                                          isDarkMode ? 'text-purple-400' : 'text-purple-600'
                                        }`} />
                                      </div>
                                      <div className="ml-4">
                                        <h4 className={`text-lg font-bold ${
                                          isDarkMode ? 'text-purple-400' : 'text-purple-700'
                                        }`}>
                                          Lab Record
                                        </h4>
                                        <p className={`text-sm ${
                                          isDarkMode ? 'text-purple-300' : 'text-purple-600'
                                        }`}>
                                          Sample Number: {lab.labSendNumber || 'Not specified'}
                                        </p>
                                      </div>
                                    </div>
                                    <span className={`inline-flex items-center px-4 py-2 text-sm font-bold rounded-full border-2 ${
                                      lab.status === 'sent' 
                                        ? isDarkMode ? 'bg-blue-900/30 text-blue-400 border-blue-500/50' : 'bg-blue-100 text-blue-800 border-blue-300'
                                        : lab.status === 'received'
                                        ? isDarkMode ? 'bg-green-900/30 text-green-400 border-green-500/50' : 'bg-green-100 text-green-800 border-green-300'
                                        : isDarkMode ? 'bg-red-900/30 text-red-400 border-red-500/50' : 'bg-red-100 text-red-800 border-red-300'
                                    }`}>
                                      {lab.status === 'sent' && <ClockIcon className="h-4 w-4 mr-2" />}
                                      {lab.status === 'received' && <CheckCircleIcon className="h-4 w-4 mr-2" />}
                                      {lab.status === 'cancelled' && <ExclamationTriangleIcon className="h-4 w-4 mr-2" />}
                                      {lab.status.toUpperCase()}
                                    </span>
                                  </div>
                                  
                                                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                     <div className={`p-4 rounded-xl ${
                                       isDarkMode ? 'bg-white/5' : 'bg-white'
                                     } shadow-sm`}>
                                       <div className="flex items-center mb-3">
                                         <CalendarIcon className={`h-5 w-5 mr-3 ${
                                           isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                         }`} />
                                         <span className={`text-sm font-semibold uppercase tracking-wide ${
                                           isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                         }`}>
                                           Lab Send Date
                                         </span>
                                       </div>
                                       <p className={`text-lg font-semibold ${
                                         isDarkMode ? 'text-white' : 'text-gray-900'
                                       }`}>
                                         {lab.labSendDate ? new Date(lab.labSendDate).toLocaleDateString('en-US', {
                                           year: 'numeric',
                                           month: 'long',
                                           day: 'numeric'
                                         }) : 'Not specified'}
                                       </p>
                                     </div>
                                     
                                     <div className={`p-4 rounded-xl ${
                                       isDarkMode ? 'bg-white/5' : 'bg-white'
                                     } shadow-sm`}>
                                       <div className="flex items-center mb-3">
                                         <CheckCircleIcon className={`h-5 w-5 mr-3 ${
                                           isDarkMode ? 'text-green-400' : 'text-green-600'
                                         }`} />
                                         <span className={`text-sm font-semibold uppercase tracking-wide ${
                                           isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                         }`}>
                                           Approval Date
                                         </span>
                                       </div>
                                       <p className={`text-lg font-semibold ${
                                         isDarkMode ? 'text-white' : 'text-gray-900'
                                       }`}>
                                         {lab.labSendData?.approvalDate ? new Date(lab.labSendData.approvalDate).toLocaleDateString('en-US', {
                                           year: 'numeric',
                                           month: 'long',
                                           day: 'numeric'
                                         }) : 'Not specified'}
                                       </p>
                                     </div>
                                   </div>
                                  
                                  {lab.remarks && (
                                    <div className={`mt-6 p-4 rounded-xl ${
                                      isDarkMode ? 'bg-white/5' : 'bg-white'
                                    } shadow-sm`}>
                                      <div className="flex items-center mb-3">
                                        <DocumentTextIcon className={`h-5 w-5 mr-3 ${
                                          isDarkMode ? 'text-orange-400' : 'text-orange-600'
                                        }`} />
                                        <span className={`text-sm font-semibold uppercase tracking-wide ${
                                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                        }`}>
                                          Remarks
                                        </span>
                                      </div>
                                      <p className={`text-base ${
                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                      }`}>
                                        {lab.remarks}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                                         ) : (
                               <div className={`mt-4 p-6 rounded-2xl border-2 border-dashed ${
                                 isDarkMode 
                                   ? 'bg-gray-900/10 border-gray-500/30' 
                                   : 'bg-gray-50 border-gray-300'
                               } shadow-sm`}>
                                 <div className="flex items-center justify-center">
                                   <div className={`p-3 rounded-xl ${
                                     isDarkMode ? 'bg-gray-500/20' : 'bg-gray-100'
                                   }`}>
                                     <BeakerIcon className={`h-6 w-6 ${
                                       isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                     }`} />
                                   </div>
                                   <div className="ml-4 text-center">
                                     <h4 className={`text-lg font-semibold ${
                                       isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                     }`}>
                                       No Lab Record
                                     </h4>
                                     <p className={`text-sm ${
                                       isDarkMode ? 'text-gray-500' : 'text-gray-400'
                                     }`}>
                                       Lab data can be added after order is saved
                                     </p>
                                   </div>
                                 </div>
                               </div>
                             );
                          })()}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mill Inputs Card - Simplified */}
                <div className={`mt-8 p-6 rounded-xl border ${
                  isDarkMode 
                    ? 'bg-white/5 border-white/10' 
                    : 'bg-white border-gray-200 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <BuildingOfficeIcon className={`h-5 w-5 mr-2 ${
                        isDarkMode ? 'text-cyan-400' : 'text-cyan-600'
                      }`} />
                      <h3 className={`text-lg font-semibold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Mill Inputs ({millInputs.length})
                      </h3>
                    </div>
                    {loadingMillInputs && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-500"></div>
                    )}
                  </div>
                  
                  {loadingMillInputs ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Loading mill inputs...
                      </p>
                    </div>
                  ) : millInputs.length > 0 ? (
                    <div className="space-y-6">
                      {/* Summary Stats */}
                      <div className={`p-4 rounded-xl border-2 ${
                        isDarkMode 
                          ? 'bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border-cyan-500/30' 
                          : 'bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-300'
                      }`}>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <span className={`text-xs font-medium ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                              Total Entries
                            </span>
                            <p className={`text-xl font-bold ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {millInputs.length}
                            </p>
                          </div>
                          <div className="text-center">
                            <span className={`text-xs font-medium ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                              Total Meters
                            </span>
                            <p className={`text-xl font-bold ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {millInputs.reduce((total: number, input: any) => total + (input.greighMtr || 0), 0).toLocaleString()} mtr
                            </p>
                          </div>
                          <div className="text-center">
                            <span className={`text-xs font-medium ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                              Total Pieces
                            </span>
                            <p className={`text-xl font-bold ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {millInputs.reduce((total: number, input: any) => total + (input.pcs || 0), 0).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-center">
                            <span className={`text-xs font-medium ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                              Order ID
                            </span>
                            <p className={`text-xl font-bold ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {order.orderId}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Consolidated Mill Inputs Table */}
                      <div className={`rounded-xl border-2 ${
                        isDarkMode 
                          ? 'bg-white/5 border-cyan-500/30' 
                          : 'bg-gray-50 border-cyan-200'
                      } overflow-hidden`}>
                        <div className={`p-4 border-b ${
                          isDarkMode ? 'border-gray-700' : 'border-gray-200'
                        }`}>
                          <h4 className={`text-lg font-semibold ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            All Mill Input Entries
                          </h4>
                        </div>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className={`${
                              isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100'
                            }`}>
                              <tr>
                                <th className={`px-4 py-3 text-left text-xs font-medium ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                }`}>
                                  #
                                </th>
                                <th className={`px-4 py-3 text-left text-xs font-medium ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                }`}>
                                  Mill Name
                                </th>
                                <th className={`px-4 py-3 text-left text-xs font-medium ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                }`}>
                                  Date
                                </th>
                                <th className={`px-4 py-3 text-left text-xs font-medium ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                }`}>
                                  Chalan No
                                </th>
                                <th className={`px-4 py-3 text-left text-xs font-medium ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                }`}>
                                  Meters
                                </th>
                                <th className={`px-4 py-3 text-left text-xs font-medium ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                }`}>
                                  Pieces
                                </th>
                                <th className={`px-4 py-3 text-left text-xs font-medium ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                }`}>
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                              {millInputs.map((millInput: any, index: number) => (
                                <tr key={millInput._id || index} className={`hover:${
                                  isDarkMode ? 'bg-white/5' : 'bg-gray-50'
                                } transition-colors`}>
                                  <td className={`px-4 py-3 text-sm font-medium ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    {index + 1}
                                  </td>
                                  <td className={`px-4 py-3 text-sm ${
                                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                  }`}>
                                    {millInput.mill?.name || 'Unknown Mill'}
                                  </td>
                                  <td className={`px-4 py-3 text-sm ${
                                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                  }`}>
                                    {millInput.millDate ? new Date(millInput.millDate).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    }) : 'No Date'}
                                  </td>
                                  <td className={`px-4 py-3 text-sm font-medium ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    {millInput.chalanNo || '-'}
                                  </td>
                                  <td className={`px-4 py-3 text-sm font-medium ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    {millInput.greighMtr ? `${millInput.greighMtr.toLocaleString()} mtr` : '-'}
                                  </td>
                                  <td className={`px-4 py-3 text-sm font-medium ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    {millInput.pcs ? millInput.pcs.toLocaleString() : '-'}
                                  </td>
                                  <td className={`px-4 py-3 text-sm`}>
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => handleEditMillInput(millInput)}
                                        className={`p-1.5 rounded-lg transition-all duration-200 ${
                                          isDarkMode 
                                            ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-900/20' 
                                            : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                                        }`}
                                        title="Edit"
                                      >
                                        <PencilIcon className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteMillInput(millInput._id)}
                                        className={`p-1.5 rounded-lg transition-all duration-200 ${
                                          isDarkMode 
                                            ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20' 
                                            : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                        }`}
                                        title="Delete"
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
                      </div>
                    </div>
                  ) : (
                    <div className={`p-6 rounded-2xl border-2 border-dashed ${
                      isDarkMode 
                        ? 'bg-gray-900/10 border-gray-500/30' 
                        : 'bg-gray-50 border-gray-300'
                    } shadow-sm`}>
                      <div className="flex items-center justify-center">
                        <div className={`p-3 rounded-xl ${
                          isDarkMode ? 'bg-gray-500/20' : 'bg-gray-100'
                        }`}>
                          <BuildingOfficeIcon className={`h-6 w-6 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`} />
                        </div>
                        <div className="ml-4 text-center">
                          <h4 className={`text-lg font-semibold ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            No Mill Inputs
                          </h4>
                          <p className={`text-sm ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            Mill inputs can be added from the orders page
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mill Outputs Card */}
                <div className={`mt-8 p-6 rounded-xl border ${
                  isDarkMode 
                    ? 'bg-white/5 border-white/10' 
                    : 'bg-white border-gray-200 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <BuildingOfficeIcon className={`h-5 w-5 mr-2 ${
                        isDarkMode ? 'text-green-400' : 'text-green-600'
                      }`} />
                      <h3 className={`text-lg font-semibold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Mill Outputs ({millOutputs.length})
                      </h3>
                    </div>
                    {loadingMillOutputs && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
                    )}
                  </div>
                  
                  {loadingMillOutputs ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Loading mill outputs...
                      </p>
                    </div>
                  ) : millOutputs.length > 0 ? (
                    <div className="space-y-4">
                      {millOutputs.map((millOutput, index) => (
                        <div key={millOutput._id || index} className={`p-4 rounded-lg border-l-4 ${
                          isDarkMode 
                            ? 'bg-white/5 border-green-500/50' 
                            : 'bg-gray-50 border-green-500'
                        }`}>
                          <div className="flex justify-between items-start mb-3">
                            <h4 className={`font-semibold ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              Mill Output #{index + 1}
                            </h4>
                            <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                              isDarkMode 
                                ? 'bg-green-900/20 text-green-400' 
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {millOutput.millBillNo}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                              <span className={`text-sm font-medium ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-600'
                              }`}>
                                Bill Number
                              </span>
                              <p className={`text-sm font-semibold ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {millOutput.millBillNo || 'Not specified'}
                              </p>
                            </div>
                            
                            <div>
                              <span className={`text-sm font-medium ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-600'
                              }`}>
                                Received Date
                              </span>
                              <p className={`text-sm font-semibold ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {millOutput.recdDate ? new Date(millOutput.recdDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                }) : 'Not specified'}
                              </p>
                            </div>
                            
                            <div>
                              <span className={`text-sm font-medium ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-600'
                              }`}>
                                Finished Meters
                              </span>
                              <p className={`text-sm font-semibold ${
                                isDarkMode ? 'text-green-400' : 'text-green-600'
                              }`}>
                                {millOutput.finishedMtr ? `${millOutput.finishedMtr.toLocaleString()} mtr` : 'Not specified'}
                              </p>
                            </div>
                            
                            <div>
                              <span className={`text-sm font-medium ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-600'
                              }`}>
                                Mill Rate
                              </span>
                              <p className={`text-sm font-semibold ${
                                isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                              }`}>
                                {millOutput.millRate ? `₹${millOutput.millRate.toLocaleString()}` : 'Not specified'}
                              </p>
                            </div>
                            
                            <div className="md:col-span-2 lg:col-span-4">
                              <span className={`text-sm font-medium ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-600'
                              }`}>
                                Total Value
                              </span>
                              <p className={`text-lg font-bold ${
                                isDarkMode ? 'text-purple-400' : 'text-purple-600'
                              }`}>
                                ₹{(millOutput.finishedMtr * millOutput.millRate).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`p-6 rounded-2xl border-2 border-dashed ${
                      isDarkMode 
                        ? 'bg-gray-900/10 border-gray-500/30' 
                        : 'bg-gray-50 border-gray-300'
                    } shadow-sm`}>
                      <div className="flex items-center justify-center">
                        <div className={`p-3 rounded-xl ${
                          isDarkMode ? 'bg-gray-500/20' : 'bg-gray-100'
                        }`}>
                          <BuildingOfficeIcon className={`h-6 w-6 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`} />
                        </div>
                        <div className="ml-4 text-center">
                          <h4 className={`text-lg font-semibold ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            No Mill Outputs
                          </h4>
                          <p className={`text-sm ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            Mill outputs can be added from the orders page
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                                 </div>

                 {/* Dispatch Card */}
                 <div className={`mt-8 p-6 rounded-xl border ${
                   isDarkMode 
                     ? 'bg-white/5 border-white/10' 
                     : 'bg-white border-gray-200 shadow-sm'
                 }`}>
                   <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center">
                       <TruckIcon className={`h-5 w-5 mr-2 ${
                         isDarkMode ? 'text-orange-400' : 'text-orange-600'
                       }`} />
                       <h3 className={`text-lg font-semibold ${
                         isDarkMode ? 'text-white' : 'text-gray-900'
                       }`}>
                         Dispatch Records ({dispatches.length})
                       </h3>
                     </div>
                     {loadingDispatches && (
                       <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
                     )}
                   </div>
                   
                   {loadingDispatches ? (
                     <div className="text-center py-8">
                       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                       <p className={`text-sm ${
                         isDarkMode ? 'text-gray-400' : 'text-gray-500'
                       }`}>
                         Loading dispatch records...
                       </p>
                     </div>
                   ) : dispatches.length > 0 ? (
                     <div className="space-y-4">
                       {dispatches.map((dispatch, index) => (
                         <div key={dispatch._id || index} className={`p-4 rounded-lg border-l-4 ${
                           isDarkMode 
                             ? 'bg-white/5 border-orange-500/50' 
                             : 'bg-gray-50 border-orange-500'
                         }`}>
                           <div className="flex justify-between items-start mb-3">
                             <h4 className={`font-semibold ${
                               isDarkMode ? 'text-white' : 'text-gray-900'
                             }`}>
                               Dispatch #{index + 1}
                             </h4>
                             <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                               isDarkMode 
                                 ? 'bg-orange-900/20 text-orange-400' 
                                 : 'bg-orange-100 text-orange-700'
                             }`}>
                               {dispatch.billNo}
                             </span>
                           </div>
                           
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                             <div>
                               <span className={`text-sm font-medium ${
                                 isDarkMode ? 'text-gray-300' : 'text-gray-600'
                               }`}>
                                 Bill Number
                               </span>
                               <p className={`text-sm font-semibold ${
                                 isDarkMode ? 'text-white' : 'text-gray-900'
                               }`}>
                                 {dispatch.billNo || 'Not specified'}
                               </p>
                             </div>
                             
                             <div>
                               <span className={`text-sm font-medium ${
                                 isDarkMode ? 'text-gray-300' : 'text-gray-600'
                               }`}>
                                 Dispatch Date
                               </span>
                               <p className={`text-sm font-semibold ${
                                 isDarkMode ? 'text-white' : 'text-gray-900'
                               }`}>
                                 {dispatch.dispatchDate ? new Date(dispatch.dispatchDate).toLocaleDateString('en-US', {
                                   year: 'numeric',
                                   month: 'short',
                                   day: 'numeric'
                                 }) : 'Not specified'}
                               </p>
                             </div>
                             
                             <div>
                               <span className={`text-sm font-medium ${
                                 isDarkMode ? 'text-gray-300' : 'text-gray-600'
                               }`}>
                                 Finish Meters
                               </span>
                               <p className={`text-sm font-semibold ${
                                 isDarkMode ? 'text-green-400' : 'text-green-600'
                               }`}>
                                 {dispatch.finishMtr ? `${dispatch.finishMtr.toLocaleString()} mtr` : 'Not specified'}
                               </p>
                             </div>
                             
                             <div>
                               <span className={`text-sm font-medium ${
                                 isDarkMode ? 'text-gray-300' : 'text-gray-600'
                               }`}>
                                 Sale Rate
                               </span>
                               <p className={`text-sm font-semibold ${
                                 isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                               }`}>
                                 {dispatch.saleRate ? `₹${dispatch.saleRate.toLocaleString()}` : 'Not specified'}
                               </p>
                             </div>
                             
                             <div className="md:col-span-2 lg:col-span-4">
                               <span className={`text-sm font-medium ${
                                 isDarkMode ? 'text-gray-300' : 'text-gray-600'
                               }`}>
                                 Total Value
                               </span>
                               <p className={`text-lg font-bold ${
                                 isDarkMode ? 'text-orange-400' : 'text-orange-600'
                               }`}>
                                 ₹{(dispatch.finishMtr * dispatch.saleRate).toLocaleString()}
                               </p>
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <div className={`p-6 rounded-2xl border-2 border-dashed ${
                       isDarkMode 
                         ? 'bg-gray-900/10 border-gray-500/30' 
                         : 'bg-gray-50 border-gray-300'
                     } shadow-sm`}>
                       <div className="flex items-center justify-center">
                         <div className={`p-3 rounded-xl ${
                           isDarkMode ? 'bg-gray-500/20' : 'bg-gray-100'
                         }`}>
                           <TruckIcon className={`h-6 w-6 ${
                             isDarkMode ? 'text-gray-400' : 'text-gray-500'
                           }`} />
                         </div>
                         <div className="ml-4 text-center">
                           <h4 className={`text-lg font-semibold ${
                             isDarkMode ? 'text-gray-400' : 'text-gray-600'
                           }`}>
                             No Dispatch Records
                           </h4>
                           <p className={`text-sm ${
                             isDarkMode ? 'text-gray-500' : 'text-gray-400'
                           }`}>
                             Dispatch records can be added from the orders page
                           </p>
                         </div>
                       </div>
                     </div>
                   )}
                 </div>

               </div>
             </div>

             {/* Timestamps */}
            <div className={`mt-8 pt-6 border-t ${
              isDarkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <span className="font-medium">Created:</span> {formatDateTime(order.createdAt)}
                </div>
                <div className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <span className="font-medium">Last Updated:</span> {formatDateTime(order.updatedAt)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Image Preview Modal */}
      {showImagePreview && previewImage && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/90 flex items-center justify-center z-[60] p-4">
          <div className="relative w-full max-w-6xl max-h-[95vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="ml-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                  Order Image Preview
                </span>
              </div>
              <button
                onClick={() => setShowImagePreview(false)}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <XMarkIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            {/* Image Container */}
            <div className="relative flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
              <div className="relative group">
                <img
                  src={previewImage?.url || ''}
                  alt={previewImage?.alt || ''}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-xl border border-gray-200 dark:border-gray-600"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                
                {/* Fallback for failed images */}
                <div className="hidden max-w-full max-h-[70vh] w-96 h-64 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center border border-gray-300 dark:border-gray-600">
                  <div className="text-center">
                    <PhotoIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Image not available</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Failed to load image</p>
                  </div>
                </div>

                {/* Image Info Overlay */}
                <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-4 text-white opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">{previewImage?.alt || 'Order Image'}</h3>
                      <p className="text-xs text-gray-300 mt-1">Click to download</p>
                    </div>
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = previewImage?.url || '';
                        link.download = previewImage?.alt || 'order-image.jpg';
                        link.click();
                      }}
                      className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all duration-200"
                      title="Download image"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>Preview Mode</span>
                  </span>
                  <span>•</span>
                  <span>Press ESC to close</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                    Professional View
                  </span>
                </div>
              </div>
            </div>
          </div>
                 </div>
       )}

       {/* Order Activity Log Modal */}
       {showOrderLogs && (
         <OrderLogsModal
           orderId={order._id}
           onClose={() => setShowOrderLogs(false)}
         />
       )}

               {/* Lab Add/Edit Modal */}
        {showLabModal && (
          <LabAddModal
            isOpen={showLabModal}
            order={order}
            onClose={() => setShowLabModal(false)}
            onLabDataUpdate={() => {
              // Refresh labs data after successful lab operation
              const fetchLabs = async () => {
                try {
                  // Force refresh by adding timestamp to avoid cache
                  const token = localStorage.getItem('token');
                  const response = await fetch(`/api/labs/by-order/${order._id}?t=${Date.now()}`, {
                    headers: {
                      'Cache-Control': 'no-cache',
                      'Pragma': 'no-cache',
                      'Authorization': `Bearer ${token}`,
                    }
                  });
                  const data = await response.json();
                  if (data.success && Array.isArray(data.data)) {
                    setLabs(data.data);
                    console.log('Labs refreshed successfully:', data.data.length, 'labs');
                  } else {
                    console.log('Failed to refresh labs:', data);
                  }
                } catch (error) {
                  console.error('Error refreshing labs:', error);
                }
              };
              
              // Add a small delay to ensure the API has processed the changes
              setTimeout(fetchLabs, 500);
            }}
          />
        )}

        {/* Dispatch Add/Edit Modal */}
        {showDispatchModal && (
          <DispatchForm
            orderId={order.orderId}
            onClose={() => setShowDispatchModal(false)}
            onSuccess={() => {
              // Refresh dispatch data after successful dispatch operation
              const fetchDispatches = async () => {
                try {
                  // Force refresh by adding timestamp to avoid cache
                  const token = localStorage.getItem('token');
                  const response = await fetch(`/api/dispatch?orderId=${order.orderId}&t=${Date.now()}`, {
                    headers: {
                      'Cache-Control': 'no-cache',
                      'Pragma': 'no-cache',
                      'Authorization': `Bearer ${token}`,
                    }
                  });
                  const data = await response.json();
                  if (data.success && Array.isArray(data.data)) {
                    setDispatches(data.data);
                    console.log('Dispatches refreshed successfully:', data.data.length, 'dispatches');
                  } else {
                    console.log('Failed to refresh dispatches:', data);
                  }
                } catch (error) {
                  console.error('Error refreshing dispatches:', error);
                }
              };
              
              // Add a small delay to ensure the API has processed the changes
              setTimeout(fetchDispatches, 500);
            }}
          />
        )}
      </div>
    );
  }
