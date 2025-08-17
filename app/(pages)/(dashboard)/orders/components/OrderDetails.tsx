'use client';

import { 
  XMarkIcon,
  PencilIcon,
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
  BeakerIcon
} from '@heroicons/react/24/outline';
import { Order } from '@/types';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useState, useEffect } from 'react';

interface OrderDetailsProps {
  order: Order;
  onClose: () => void;
  onEdit: () => void;
}

export default function OrderDetails({ order, onClose, onEdit }: OrderDetailsProps) {
  const { isDarkMode, mounted } = useDarkMode();
  const [labs, setLabs] = useState<any[]>([]);
  const [loadingLabs, setLoadingLabs] = useState(false);

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
    return order.items.reduce((total, item) => total + (item.quantity || 0), 0);
  };

  // Fetch labs for this order
  useEffect(() => {
    const fetchLabs = async () => {
      setLoadingLabs(true);
      try {
        const response = await fetch(`/api/labs/by-order/${order._id}`);
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setLabs(data.data);
        } else {
          console.warn('Labs data is not an array:', data);
          setLabs([]);
        }
      } catch (error) {
        console.error('Error fetching labs:', error);
        setLabs([]);
      } finally {
        setLoadingLabs(false);
      }
    };

    fetchLabs();
  }, [order._id]);

  const getLabForItem = (itemId: string) => {
    if (!Array.isArray(labs)) return null;
    return labs.find(lab => lab.orderItemId === itemId);
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

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl rounded-xl shadow-2xl bg-white border border-gray-200 max-h-[95vh] overflow-hidden flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="text-lg font-medium text-gray-900">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`w-full max-w-6xl rounded-xl shadow-2xl ${
        isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
      } max-h-[95vh] overflow-hidden`}>
        {/* Header */}
        <div className={`flex justify-between items-center p-6 border-b ${
          isDarkMode ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-4">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
              isDarkMode 
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                : 'bg-gradient-to-br from-blue-600 to-indigo-700'
            }`}>
              <CubeIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Order Details
              </h2>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>
                Order ID: {order.orderId}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onEdit}
              className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                isDarkMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
              }`}
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit Order
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-all duration-300 ${
                isDarkMode
                  ? 'text-gray-400 hover:bg-white/10 hover:text-gray-300'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
          <div className="p-6">
            {/* Status Banner */}
            <div className={`mb-6 p-4 rounded-lg border ${
              getStatusColor(getOrderStatus(order))
            }`}>
              <div className="flex items-center">
                {getStatusIcon(getOrderStatus(order))}
                <span className="ml-2 font-medium">
                  Status: {getOrderStatus(order)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Order Information Card */}
                <div className={`p-6 rounded-xl border ${
                  isDarkMode 
                    ? 'bg-white/5 border-white/10' 
                    : 'bg-white border-gray-200 shadow-sm'
                }`}>
                  <div className="flex items-center mb-4">
                    <CubeIcon className={`h-5 w-5 mr-2 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                    <h3 className={`text-lg font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Order Information
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Order ID:
                      </span>
                      <span className={`text-sm font-mono ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {order.orderId}
                      </span>
                    </div>
                    {order.orderNo && (
                      <div className="flex justify-between items-center">
                        <span className={`text-sm font-medium ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          Order No:
                        </span>
                        <span className={`text-sm ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {order.orderNo}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Type:
                      </span>
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        order.orderType === 'Dying'
                          ? isDarkMode
                            ? 'bg-red-900/20 text-red-400 border border-red-500/30'
                            : 'bg-red-100 text-red-800 border border-red-200'
                          : isDarkMode
                            ? 'bg-blue-900/20 text-blue-400 border border-blue-500/30'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {order.orderType}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Total Items:
                      </span>
                      <span className={`text-sm font-semibold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {order.items?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Total Quantity:
                      </span>
                      <span className={`text-sm font-semibold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {getTotalQuantity(order).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dates Card */}
                <div className={`p-6 rounded-xl border ${
                  isDarkMode 
                    ? 'bg-white/5 border-white/10' 
                    : 'bg-white border-gray-200 shadow-sm'
                }`}>
                  <div className="flex items-center mb-4">
                    <CalendarIcon className={`h-5 w-5 mr-2 ${
                      isDarkMode ? 'text-green-400' : 'text-green-600'
                    }`} />
                    <h3 className={`text-lg font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Important Dates
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Arrival Date:
                      </span>
                      <span className={`text-sm ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {order.arrivalDate ? formatDate(order.arrivalDate) : 'Not specified'}
                      </span>
                    </div>
                    {order.poDate && (
                      <div className="flex justify-between items-center">
                        <span className={`text-sm font-medium ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          PO Date:
                        </span>
                        <span className={`text-sm ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {order.poDate ? formatDate(order.poDate) : 'Not specified'}
                        </span>
                      </div>
                    )}
                    {order.deliveryDate && (
                      <div className="flex justify-between items-center">
                        <span className={`text-sm font-medium ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          Delivery Date:
                        </span>
                        <span className={`text-sm ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {order.deliveryDate ? formatDate(order.deliveryDate) : 'Not specified'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reference Numbers Card */}
                {(order.poNumber || order.styleNo) && (
                  <div className={`p-6 rounded-xl border ${
                    isDarkMode 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-white border-gray-200 shadow-sm'
                  }`}>
                    <div className="flex items-center mb-4">
                      <DocumentTextIcon className={`h-5 w-5 mr-2 ${
                        isDarkMode ? 'text-purple-400' : 'text-purple-600'
                      }`} />
                      <h3 className={`text-lg font-semibold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Reference Numbers
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {order.poNumber && (
                        <div className="flex justify-between items-center">
                          <span className={`text-sm font-medium ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                            PO Number:
                          </span>
                          <span className={`text-sm font-mono ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {order.poNumber}
                          </span>
                        </div>
                      )}
                      {order.styleNo && (
                        <div className="flex justify-between items-center">
                          <span className={`text-sm font-medium ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                            Style Number:
                          </span>
                          <span className={`text-sm font-mono ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {order.styleNo}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Party Information Card */}
                {party && (
                  <div className={`p-6 rounded-xl border ${
                    isDarkMode 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-white border-gray-200 shadow-sm'
                  }`}>
                    <div className="flex items-center mb-4">
                      <BuildingOfficeIcon className={`h-5 w-5 mr-2 ${
                        isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
                      }`} />
                      <h3 className={`text-lg font-semibold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Party Information
                      </h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <span className={`text-sm font-medium ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          Name:
                        </span>
                        <p className={`text-sm font-medium mt-1 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {party.name}
                        </p>
                      </div>
                      {party.contactName && (
                        <div>
                          <span className={`text-sm font-medium ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                            Contact Person:
                          </span>
                          <p className={`text-sm mt-1 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {party.contactName}
                          </p>
                        </div>
                      )}
                      {party.contactPhone && (
                        <div className="flex items-center">
                          <PhoneIcon className={`h-4 w-4 mr-2 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`} />
                          <span className={`text-sm ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {party.contactPhone}
                          </span>
                        </div>
                      )}
                      {party.address && (
                        <div className="flex items-start">
                          <MapPinIcon className={`h-4 w-4 mr-2 mt-0.5 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`} />
                          <span className={`text-sm ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {party.address}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact Information Card */}
                {(order.contactName || order.contactPhone) && (
                  <div className={`p-6 rounded-xl border ${
                    isDarkMode 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-white border-gray-200 shadow-sm'
                  }`}>
                    <div className="flex items-center mb-4">
                      <UserIcon className={`h-5 w-5 mr-2 ${
                        isDarkMode ? 'text-orange-400' : 'text-orange-600'
                      }`} />
                      <h3 className={`text-lg font-semibold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Contact Information
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {order.contactName && (
                        <div>
                          <span className={`text-sm font-medium ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                            Contact Name:
                          </span>
                          <p className={`text-sm mt-1 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {order.contactName}
                          </p>
                        </div>
                      )}
                      {order.contactPhone && (
                        <div className="flex items-center">
                          <PhoneIcon className={`h-4 w-4 mr-2 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`} />
                          <span className={`text-sm ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {order.contactPhone}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                                 {/* Lab Summary Card */}
                 <div className={`p-6 rounded-xl border-2 ${
                   isDarkMode 
                     ? 'bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border-purple-500/30' 
                     : 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200'
                 }`}>
                   <div className="flex items-center mb-6">
                     <div className={`p-2 rounded-lg ${
                       isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'
                     }`}>
                       <BeakerIcon className={`h-5 w-5 ${
                         isDarkMode ? 'text-purple-400' : 'text-purple-600'
                       }`} />
                     </div>
                     <div className="ml-3">
                       <h3 className={`text-lg font-semibold ${
                         isDarkMode ? 'text-white' : 'text-gray-900'
                       }`}>
                         Lab Summary
                       </h3>
                       <p className={`text-sm ${
                         isDarkMode ? 'text-gray-300' : 'text-gray-600'
                       }`}>
                         Overview of lab data status
                       </p>
                     </div>
                     {loadingLabs && (
                       <div className="ml-auto">
                         <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
                       </div>
                     )}
                   </div>
                   
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <div className={`text-center p-4 rounded-lg ${
                       isDarkMode ? 'bg-white/5' : 'bg-white'
                     }`}>
                       <div className={`text-3xl font-bold ${
                         isDarkMode ? 'text-purple-400' : 'text-purple-600'
                       }`}>
                         {labStats.withLabs}
                       </div>
                       <div className={`text-xs font-semibold uppercase tracking-wide ${
                         isDarkMode ? 'text-gray-300' : 'text-gray-600'
                       }`}>
                         With Labs
                       </div>
                     </div>
                     <div className={`text-center p-4 rounded-lg ${
                       isDarkMode ? 'bg-white/5' : 'bg-white'
                     }`}>
                       <div className={`text-3xl font-bold ${
                         isDarkMode ? 'text-blue-400' : 'text-blue-600'
                       }`}>
                         {labStats.sent}
                       </div>
                       <div className={`text-xs font-semibold uppercase tracking-wide ${
                         isDarkMode ? 'text-gray-300' : 'text-gray-600'
                       }`}>
                         Sent
                       </div>
                     </div>
                     <div className={`text-center p-4 rounded-lg ${
                       isDarkMode ? 'bg-white/5' : 'bg-white'
                     }`}>
                       <div className={`text-3xl font-bold ${
                         isDarkMode ? 'text-green-400' : 'text-green-600'
                       }`}>
                         {labStats.received}
                       </div>
                       <div className={`text-xs font-semibold uppercase tracking-wide ${
                         isDarkMode ? 'text-gray-300' : 'text-gray-600'
                       }`}>
                         Received
                       </div>
                     </div>
                     <div className={`text-center p-4 rounded-lg ${
                       isDarkMode ? 'bg-white/5' : 'bg-white'
                     }`}>
                       <div className={`text-3xl font-bold ${
                         isDarkMode ? 'text-gray-400' : 'text-gray-600'
                       }`}>
                         {labStats.withoutLabs}
                       </div>
                       <div className={`text-xs font-semibold uppercase tracking-wide ${
                         isDarkMode ? 'text-gray-300' : 'text-gray-600'
                       }`}>
                         No Labs
                       </div>
                     </div>
                   </div>
                   
                   {/* Progress Bar */}
                   {order.items && order.items.length > 0 && (
                     <div className="mt-6">
                                               <div className="flex justify-between items-center mb-2">
                          <span className={`text-sm font-medium ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            Lab Completion
                          </span>
                          <span className={`text-sm font-bold ${
                            isDarkMode ? 'text-purple-400' : 'text-purple-600'
                          }`}>
                            {Math.min(100, Math.round((labStats.withLabs / order.items.length) * 100))}%
                          </span>
                        </div>
                        <div className={`w-full h-2 rounded-full ${
                          isDarkMode ? 'bg-white/10' : 'bg-gray-200'
                        }`}>
                          <div 
                            className={`h-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500`}
                            style={{ width: `${Math.min(100, (labStats.withLabs / order.items.length) * 100)}%` }}
                          ></div>
                        </div>
                     </div>
                   )}
                 </div>

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
                                       className="w-full h-32 md:h-28 object-cover rounded-xl border-2 border-gray-200 shadow-lg hover:border-blue-400 transition-all duration-300 hover:scale-110 hover:shadow-xl"
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
                          


                                                     {/* Lab Information */}
                           {(() => {
                             const lab = getLabForItem((item as any)._id);
                             return lab ? (
                               <div className={`mt-4 p-5 rounded-xl border-2 ${
                                 isDarkMode 
                                   ? 'bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border-purple-500/30' 
                                   : 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200'
                               }`}>
                                 <div className="flex items-center justify-between mb-4">
                                   <div className="flex items-center">
                                     <div className={`p-2 rounded-lg ${
                                       isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'
                                     }`}>
                                       <BeakerIcon className={`h-5 w-5 ${
                                         isDarkMode ? 'text-purple-400' : 'text-purple-600'
                                       }`} />
                                     </div>
                                     <div className="ml-3">
                                       <span className={`text-sm font-bold ${
                                         isDarkMode ? 'text-purple-400' : 'text-purple-700'
                                       }`}>
                                         Lab Data
                                       </span>
                                       <p className={`text-xs ${
                                         isDarkMode ? 'text-purple-300' : 'text-purple-600'
                                       }`}>
                                         Sample: {lab.labSendNumber}
                                       </p>
                                     </div>
                                   </div>
                                   <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full border-2 ${
                                     lab.status === 'sent' 
                                       ? isDarkMode ? 'bg-blue-900/20 text-blue-400 border-blue-500/30' : 'bg-blue-100 text-blue-800 border-blue-300'
                                       : lab.status === 'received'
                                       ? isDarkMode ? 'bg-green-900/20 text-green-400 border-green-500/30' : 'bg-green-100 text-green-800 border-green-300'
                                       : isDarkMode ? 'bg-red-900/20 text-red-400 border-red-500/30' : 'bg-red-100 text-red-800 border-red-300'
                                   }`}>
                                     {lab.status === 'sent' && <ClockIcon className="h-3 w-3 mr-1" />}
                                     {lab.status === 'received' && <CheckCircleIcon className="h-3 w-3 mr-1" />}
                                     {lab.status === 'cancelled' && <ExclamationTriangleIcon className="h-3 w-3 mr-1" />}
                                     {lab.status.toUpperCase()}
                                   </span>
                                 </div>
                                 
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <div className={`p-3 rounded-lg ${
                                     isDarkMode ? 'bg-white/5' : 'bg-white'
                                   }`}>
                                     <div className="flex items-center mb-2">
                                       <CalendarIcon className={`h-4 w-4 mr-2 ${
                                         isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                       }`} />
                                       <span className={`text-xs font-semibold uppercase tracking-wide ${
                                         isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                       }`}>
                                         Send Date
                                       </span>
                                     </div>
                                     <p className={`font-medium ${
                                       isDarkMode ? 'text-white' : 'text-gray-900'
                                     }`}>
                                       {new Date(lab.labSendDate).toLocaleDateString('en-US', {
                                         year: 'numeric',
                                         month: 'long',
                                         day: 'numeric'
                                       })}
                                     </p>
                                   </div>
                                   
                                   {lab.labSendData?.approvalDate && (
                                     <div className={`p-3 rounded-lg ${
                                       isDarkMode ? 'bg-white/5' : 'bg-white'
                                     }`}>
                                       <div className="flex items-center mb-2">
                                         <CheckCircleIcon className={`h-4 w-4 mr-2 ${
                                           isDarkMode ? 'text-green-400' : 'text-green-600'
                                         }`} />
                                         <span className={`text-xs font-semibold uppercase tracking-wide ${
                                           isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                         }`}>
                                           Approval Date
                                         </span>
                                       </div>
                                       <p className={`font-medium ${
                                         isDarkMode ? 'text-white' : 'text-gray-900'
                                       }`}>
                                         {new Date(lab.labSendData.approvalDate).toLocaleDateString('en-US', {
                                           year: 'numeric',
                                           month: 'long',
                                           day: 'numeric'
                                         })}
                                       </p>
                                     </div>
                                   )}
                                 </div>
                                 
                                 {lab.remarks && (
                                   <div className={`mt-4 p-3 rounded-lg ${
                                     isDarkMode ? 'bg-white/5' : 'bg-white'
                                   }`}>
                                     <div className="flex items-center mb-2">
                                       <DocumentTextIcon className={`h-4 w-4 mr-2 ${
                                         isDarkMode ? 'text-orange-400' : 'text-orange-600'
                                       }`} />
                                       <span className={`text-xs font-semibold uppercase tracking-wide ${
                                         isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                       }`}>
                                         Remarks
                                       </span>
                                     </div>
                                     <p className={`text-sm ${
                                       isDarkMode ? 'text-white' : 'text-gray-900'
                                     }`}>
                                       {lab.remarks}
                                     </p>
                                   </div>
                                 )}
                               </div>
                            ) : (
                              <div className={`mt-4 p-4 rounded-xl border-2 border-dashed ${
                                isDarkMode 
                                  ? 'bg-gray-900/10 border-gray-500/30' 
                                  : 'bg-gray-50 border-gray-300'
                              }`}>
                                <div className="flex items-center justify-center">
                                  <div className={`p-2 rounded-lg ${
                                    isDarkMode ? 'bg-gray-500/20' : 'bg-gray-100'
                                  }`}>
                                    <BeakerIcon className={`h-5 w-5 ${
                                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                    }`} />
                                  </div>
                                  <div className="ml-3 text-center">
                                    <span className={`text-sm font-medium ${
                                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                      No lab data available
                                    </span>
                                    <p className={`text-xs ${
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

                {/* Order Images Card */}
                {order.items && order.items.some(item => item.imageUrls && item.imageUrls.length > 0) && (
                  <div className={`p-6 rounded-xl border ${
                    isDarkMode 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-white border-gray-200 shadow-sm'
                  }`}>
                    <div className="flex items-center mb-6">
                      <div className={`p-2 rounded-lg ${
                        isDarkMode ? 'bg-pink-500/20' : 'bg-pink-100'
                      }`}>
                        <PhotoIcon className={`h-5 w-5 ${
                          isDarkMode ? 'text-pink-400' : 'text-pink-600'
                        }`} />
                      </div>
                      <div className="ml-3">
                        <h3 className={`text-lg font-semibold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          Order Images
                        </h3>
                        <p className={`text-sm ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          All item images in this order
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      {order.items.map((item, index) => {
                        const hasImages = item.imageUrls && item.imageUrls.length > 0;
                        if (!hasImages) return null;
                        
                        return (
                          <div key={index} className={`p-4 rounded-lg border ${
                            isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
                          }`}>
                            <div className="flex items-center mb-3">
                              <span className={`text-sm font-semibold ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                Item {index + 1}
                              </span>
                              {item.imageUrls && item.imageUrls.length > 0 && (
                                <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                                  isDarkMode ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {item.imageUrls.length} image{item.imageUrls.length !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            
                                                         {/* Multiple Images */}
                             {item.imageUrls && item.imageUrls.length > 0 && (
                               <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                 {item.imageUrls.map((imageUrl, imageIndex) => (
                                   <div key={imageIndex} className="relative group">
                                     <img
                                       src={imageUrl}
                                       alt={`Item ${index + 1} image ${imageIndex + 1}`}
                                       className="w-full h-36 md:h-32 object-cover rounded-xl border-2 border-gray-200 shadow-lg hover:border-blue-400 transition-all duration-300 hover:scale-110 hover:shadow-xl"
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
                             )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
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
    </div>
  );
}
