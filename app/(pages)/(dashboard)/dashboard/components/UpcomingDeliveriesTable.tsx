'use client';

import React, { useState, useMemo } from 'react';
import { Order } from '@/types';
import { 
  CalendarIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  TruckIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { useDarkMode } from '../../hooks/useDarkMode';

interface UpcomingDeliveriesTableProps {
  orders: Order[];
  title: string;
  loading?: boolean;
}

type DeliveryFilter = 'all' | 'tomorrow' | 'next7days' | 'next30days' | 'custom';

export default function UpcomingDeliveriesTable({ 
  orders, 
  title, 
  loading = false
}: UpcomingDeliveriesTableProps) {
  const { isDarkMode } = useDarkMode();
  const [deliveryFilter, setDeliveryFilter] = useState<DeliveryFilter>('next7days');
  const [customDate, setCustomDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter orders based on selected filter
  const filteredOrders = useMemo(() => {
    if (!orders.length) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (deliveryFilter) {
      case 'tomorrow':
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        return orders.filter(order => {
          if (!order.deliveryDate) return false;
          const deliveryDate = new Date(order.deliveryDate);
          deliveryDate.setHours(0, 0, 0, 0);
          return deliveryDate.getTime() === tomorrow.getTime();
        });

      case 'next7days':
        const next7Days = new Date(today);
        next7Days.setDate(today.getDate() + 7);
        next7Days.setHours(23, 59, 59, 999);
        return orders.filter(order => {
          if (!order.deliveryDate) return false;
          const deliveryDate = new Date(order.deliveryDate);
          return deliveryDate >= today && deliveryDate <= next7Days;
        });

      case 'next30days':
        const next30Days = new Date(today);
        next30Days.setDate(today.getDate() + 30);
        next30Days.setHours(23, 59, 59, 999);
        return orders.filter(order => {
          if (!order.deliveryDate) return false;
          const deliveryDate = new Date(order.deliveryDate);
          return deliveryDate >= today && deliveryDate <= next30Days;
        });

      case 'custom':
        if (!customDate) return orders;
        const selectedDate = new Date(customDate);
        selectedDate.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);
        return orders.filter(order => {
          if (!order.deliveryDate) return false;
          const deliveryDate = new Date(order.deliveryDate);
          return deliveryDate >= selectedDate && deliveryDate <= endOfDay;
        });

      case 'all':
      default:
        return orders;
    }
  }, [orders, deliveryFilter, customDate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return isDarkMode ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-700/50' : 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return isDarkMode ? 'bg-blue-900/30 text-blue-300 border border-blue-700/50' : 'bg-blue-100 text-blue-800';
      case 'completed': return isDarkMode ? 'bg-green-900/30 text-green-300 border border-green-700/50' : 'bg-green-100 text-green-800';
      case 'delivered': return isDarkMode ? 'bg-green-900/30 text-green-300 border border-green-700/50' : 'bg-green-100 text-green-800';
      case 'cancelled': return isDarkMode ? 'bg-red-900/30 text-red-300 border border-red-700/50' : 'bg-red-100 text-red-800';
      case 'Not set':
      case 'Not selected':
      default: return isDarkMode ? 'bg-gray-700/50 text-gray-300 border border-gray-600/50' : 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderTypeColor = (orderType: string) => {
    switch (orderType) {
      case 'Dying': return isDarkMode ? 'bg-red-900/30 text-red-300 border border-red-700/50' : 'bg-red-100 text-red-800';
      case 'Printing': return isDarkMode ? 'bg-blue-900/30 text-blue-300 border border-blue-700/50' : 'bg-blue-100 text-blue-800';
      default: return isDarkMode ? 'bg-gray-700/50 text-gray-300 border border-gray-600/50' : 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysUntilDelivery = (deliveryDate: string) => {
    if (!deliveryDate) return null;
    
    const today = new Date();
    const delivery = new Date(deliveryDate);
    const diffTime = delivery.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    return `In ${diffDays} days`;
  };

  const getUrgencyColor = (deliveryDate: string) => {
    if (!deliveryDate) return isDarkMode ? 'text-gray-400' : 'text-gray-500';
    
    const today = new Date();
    const delivery = new Date(deliveryDate);
    const diffTime = delivery.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return isDarkMode ? 'text-red-400' : 'text-red-600';
    if (diffDays <= 1) return isDarkMode ? 'text-red-400' : 'text-red-600';
    if (diffDays <= 3) return isDarkMode ? 'text-yellow-400' : 'text-yellow-600';
    return isDarkMode ? 'text-green-400' : 'text-green-600';
  };

  if (loading) {
    return (
      <div className={`rounded-lg border shadow-sm p-6 transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-slate-800 border-slate-700 shadow-slate-900/20' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="animate-pulse">
          <div className={`h-6 rounded w-1/4 mb-4 transition-colors duration-300 ${
            isDarkMode ? 'bg-slate-700' : 'bg-gray-200'
          }`}></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`h-4 rounded transition-colors duration-300 ${
                isDarkMode ? 'bg-slate-700' : 'bg-gray-200'
              }`}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border shadow-lg transition-all duration-500 ${
      isDarkMode 
        ? 'bg-gray-800/90 border-gray-600 shadow-gray-900/40 backdrop-blur-sm' 
        : 'bg-white/80 border-gray-200 shadow-gray-200/50 backdrop-blur-sm'
    }`}>
      {/* Header with Filters */}
      <div className={`p-4 sm:p-6 border-b transition-colors duration-300 ${
        isDarkMode ? 'border-slate-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TruckIcon className={`w-5 h-5 transition-colors duration-300 ${
              isDarkMode ? 'text-purple-400' : 'text-purple-600'
            }`} />
            <h3 className={`text-base sm:text-lg font-semibold transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1 px-3 py-1 text-sm border rounded-md transition-colors duration-300 ${
                isDarkMode 
                  ? 'text-purple-400 hover:text-purple-300 border-purple-600 hover:bg-purple-900/20' 
                  : 'text-purple-600 hover:text-purple-800 border-purple-300 hover:bg-purple-50'
              }`}
            >
              <FunnelIcon className="w-4 h-4" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Delivery Period Filter */}
            <div className="space-y-2">
              <label className={`block text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Delivery Period
              </label>
              <select
                value={deliveryFilter}
                onChange={(e) => setDeliveryFilter(e.target.value as DeliveryFilter)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="all">All Upcoming</option>
                <option value="tomorrow">Tomorrow Only</option>
                <option value="next7days">Next 7 Days</option>
                <option value="next30days">Next 30 Days</option>
                <option value="custom">Specific Date</option>
              </select>
            </div>

            {/* Custom Date Picker */}
            {deliveryFilter === 'custom' && (
              <div className="space-y-2">
                <label className={`block text-sm font-medium transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Select Date
                </label>
                <div className="relative">
                  <CalendarIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Results Count */}
            <div className="space-y-2">
              <label className={`block text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Results
              </label>
              <div className={`px-3 py-2 border rounded-md transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}>
                {filteredOrders.length} orders
              </div>
            </div>
          </div>
        )}

        <p className={`text-sm transition-colors duration-300 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} found
        </p>
      </div>

      {/* Table Content */}
      {filteredOrders.length === 0 ? (
        <div className={`p-12 text-center transition-colors duration-300 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <TruckIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No upcoming deliveries found</p>
          {deliveryFilter !== 'all' && (
            <p className="text-sm mt-2">Try adjusting your filter settings</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`transition-colors duration-300 ${
              isDarkMode ? 'bg-slate-700' : 'bg-gray-50'
            }`}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Order ID
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Type
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Party
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Delivery Date
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-slate-800 divide-slate-700' 
                : 'bg-white divide-gray-200'
            }`}>
              {filteredOrders.map((order) => (
                <tr key={order._id} className={`transition-colors duration-300 ${
                  isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-50'
                }`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <DocumentTextIcon className={`w-4 h-4 mr-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                      <span className={`text-sm font-medium transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {order.orderId}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.orderType ? (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOrderTypeColor(order.orderType)}`}>
                        {order.orderType}
                      </span>
                    ) : (
                      <span className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <BuildingOfficeIcon className={`w-4 h-4 mr-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                      <div>
                        <div className={`text-sm font-medium transition-colors duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {typeof order.party === 'object' ? order.party?.name : 'N/A'}
                        </div>
                        {order.contactName && (
                          <div className={`text-sm transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>{order.contactName}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <CalendarIcon className={`w-4 h-4 mr-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                      <div>
                        <span className={`text-sm transition-colors duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {order.deliveryDate ? formatDate(order.deliveryDate) : 'No date set'}
                        </span>
                        {order.deliveryDate && (
                          <div className={`text-xs mt-1 transition-colors duration-300 ${getUrgencyColor(order.deliveryDate)}`}>
                            {getDaysUntilDelivery(order.deliveryDate)}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status || 'Not set')}`}>
                      {order.status || 'Not set'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
